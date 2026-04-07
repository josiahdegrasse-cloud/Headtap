import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MusicProfile } from './MusicProfile';
import { ConcertList } from './ConcertList';
import { ConcertFilters, FilterOptions } from './ConcertFilters';
import { LoadingProgress } from './LoadingProgress';
import { LogOut, Search, Music, MapPin } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { mockTopArtists, mockTopTracks, mockSavedTracks, mockConcerts } from '../utils/mockData';

interface DashboardProps {
  sessionId: string | null;
  onLogout: () => void;
  demoMode?: boolean;
}

export function Dashboard({ sessionId, onLogout, demoMode = false }: DashboardProps) {
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [savedTracks, setSavedTracks] = useState<any[]>([]);
  const [concerts, setConcerts] = useState<any[]>([]);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [concertsLoading, setConcertsLoading] = useState(false);
  const [locationPromptShown, setLocationPromptShown] = useState(false);
  
  // Progress tracking for accurate loading indicators
  const [musicLoadingProgress, setMusicLoadingProgress] = useState(0);
  const [musicLoadingStep, setMusicLoadingStep] = useState(0);
  const [concertsLoadingProgress, setConcertsLoadingProgress] = useState(0);
  const [concertsLoadingStep, setConcertsLoadingStep] = useState(0);
  
  // Concert filtering state
  const [filters, setFilters] = useState({
    selectedGenres: [] as string[],
    minCost: 0,
    maxCost: 1000,
    ticketCount: 1,
    jointBudget: 0,
    sortBy: 'date' as 'vibe' | 'cost_low' | 'cost_high' | 'date',
    dateRange: 'all', // all, week, month, 3months
    distance: 25 // Default to 25 miles
  });

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5`;

  useEffect(() => {
    fetchMusicData();
  }, []);

  // Re-fetch concerts when distance filter changes (if we already have a location)
  useEffect(() => {
    if (location && sessionId) {
      console.log('Distance changed, re-fetching concerts...');
      fetchConcerts(location);
    }
  }, [filters.distance]);

  const fetchMusicData = async () => {
    // Use mock data in demo mode
    if (demoMode) {
      setLoading(true);
      toast.info('Loading demo data...');
      
      // Simulate loading delay - match the progress bar duration
      setTimeout(() => {
        setTopArtists(mockTopArtists);
        setTopTracks(mockTopTracks);
        setSavedTracks(mockSavedTracks);
        setLoading(false);
        toast.success('Demo data loaded!');
      }, 5000); // Match the LoadingProgress duration
      return;
    }
    
    if (!sessionId) return;
    
    setLoading(true);
    setMusicLoadingProgress(0);
    setMusicLoadingStep(0);
    toast.info('Loading your music profile...');
    
    try {
      // Step 1: Connecting to Spotify (progress: 0-20%)
      setMusicLoadingStep(0);
      setMusicLoadingProgress(5);
      
      // Start all requests (we'll process them sequentially for progress tracking)
      setMusicLoadingProgress(20);
      
      // Step 2: Fetch top artists (progress: 20-50%)
      setMusicLoadingStep(1);
      const artistsRes = await fetch(`${baseUrl}/spotify/top-artists?session=${sessionId}&time_range=medium_term`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      
      if (artistsRes.ok) {
        const artistsData = await artistsRes.json();
        const artists = artistsData.items || [];
        setTopArtists(artists);
        console.log(`Loaded ${artists.length} top artists from last 6 months`);
        setMusicLoadingProgress(50);
      } else {
        console.error('Failed to fetch artists:', await artistsRes.text());
        setMusicLoadingProgress(50);
      }
      
      // Step 3: Fetch top tracks (progress: 50-80%)
      setMusicLoadingStep(2);
      const tracksRes = await fetch(`${baseUrl}/spotify/top-tracks?session=${sessionId}&time_range=medium_term`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        setTopTracks(tracksData.items || []);
        setMusicLoadingProgress(65);
      } else {
        console.error('Failed to fetch top tracks:', await tracksRes.text());
        setMusicLoadingProgress(65);
      }
      
      // Fetch saved tracks
      const savedTracksRes = await fetch(`${baseUrl}/spotify/saved-tracks?session=${sessionId}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      
      if (savedTracksRes.ok) {
        const savedTracksData = await savedTracksRes.json();
        const savedItems = savedTracksData.items || [];
        setSavedTracks(savedItems);
        console.log(`Loaded ${savedItems.length} saved tracks`);
        setMusicLoadingProgress(80);
      } else {
        console.error('Failed to fetch saved tracks:', await savedTracksRes.text());
        setMusicLoadingProgress(80);
      }
      
      // Step 4: Building profile (progress: 80-100%)
      setMusicLoadingStep(3);
      setMusicLoadingProgress(100);
      
      toast.success('Music profile loaded!');
    } catch (error) {
      console.error('Error fetching music data:', error);
      toast.error('Failed to load music data');
    } finally {
      setLoading(false);
      setMusicLoadingProgress(0);
      setMusicLoadingStep(0);
    }
  };

  const fetchConcerts = async (loc: string) => {
    if (!loc.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setConcertsLoading(true);
    setConcertsLoadingProgress(0);
    setConcertsLoadingStep(0);
    toast.info('Finding concerts near you...');

    try {
      // Use mock data in demo mode
      if (demoMode) {
        // Simulate loading delay - match the progress bar duration
        setTimeout(() => {
          setConcerts(mockConcerts);
          setLocation(loc);
          toast.success(`Found ${mockConcerts.length} concerts in ${loc}!`);
          setConcertsLoading(false);
        }, 4000); // Match the LoadingProgress duration for concerts
        return;
      }
      
      // Step 1: Locating concerts (progress: 0-25%)
      setConcertsLoadingStep(0);
      setConcertsLoadingProgress(10);
      
      // Convert miles to kilometers for the API
      // If distance is 0 (All Distances), use 160 km (100 miles) as default
      const distanceKm = filters.distance > 0 ? Math.round(filters.distance * 1.60934) : 160;
      
      console.log(`Searching concerts: location="${loc}", distance=${filters.distance} miles (${distanceKm} km)`)
      console.log(`Session ID: ${sessionId ? 'Present' : 'MISSING'}`);
      console.log(`Base URL: ${baseUrl}`);
      
      const url = `${baseUrl}/concerts?session=${sessionId}&location=${encodeURIComponent(loc)}&distance=${distanceKm}`;
      console.log(`Full URL: ${url}`);
      
      setConcertsLoadingProgress(25);
      
      // Step 2: Extracting artist information (progress: 25-50%)
      setConcertsLoadingStep(1);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      console.log('Concert search response status:', response.status);
      setConcertsLoadingProgress(50);

      if (response.ok) {
        // Step 3: Matching concerts (progress: 50-80%)
        setConcertsLoadingStep(2);
        const data = await response.json();
        console.log('Full concert response:', data);
        console.log('Number of concerts:', data.concerts?.length || 0);
        
        setConcertsLoadingProgress(80);
        
        // Step 4: Calculating vibe scores (progress: 80-100%)
        setConcertsLoadingStep(3);
        setConcerts(data.concerts || []);
        setLocation(loc);
        
        setConcertsLoadingProgress(100);
        
        if (data.concerts && data.concerts.length > 0) {
          toast.success(`Found ${data.concerts.length} concerts in ${data.location}!`);
        } else {
          toast.info('No concerts found in this area. Try a different location.');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch concerts:', response.status, errorText);
        
        // Try to parse error as JSON for better error message
        try {
          const errorJson = JSON.parse(errorText);
          toast.error(`Error: ${errorJson.error || 'Failed to fetch concerts'}`);
        } catch {
          toast.error(`Failed to fetch concerts (${response.status}). Please try again.`);
        }
      }
    } catch (error) {
      console.error('Error fetching concerts:', error);
      toast.error(`Network error: ${error instanceof Error ? error.message : 'Failed to fetch concerts'}`);
    } finally {
      setConcertsLoading(false);
      setConcertsLoadingProgress(0);
      setConcertsLoadingStep(0);
    }
  };

  const handleLocationSearch = () => {
    console.log('Search button clicked!');
    console.log('Location:', locationInput);
    console.log('Session ID:', sessionId ? 'Valid' : 'Missing');
    
    setLocation(locationInput);
    fetchConcerts(locationInput);
  };

  const handleLocateMe = async () => {
    // In demo mode, use a default demo location
    if (demoMode) {
      const demoLocation = 'Los Angeles, CA';
      setLocationInput(demoLocation);
      setLocation(demoLocation);
      toast.success(`Location set to: ${demoLocation}`);
      fetchConcerts(demoLocation);
      return;
    }
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Getting your location...');

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              {
                headers: {
                  'User-Agent': 'HeadTap Concert App'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
              const state = data.address?.state;
              const locationString = state ? `${city}, ${state}` : city;
              
              setLocationInput(locationString);
              setLocation(locationString);
              toast.success(`Location found: ${locationString}`);
              fetchConcerts(locationString);
            } else {
              // Fallback to coordinates if reverse geocoding fails
              const locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              setLocationInput(locationString);
              setLocation(locationString);
              toast.success('Location found');
              fetchConcerts(locationString);
            }
          } catch (error) {
            const { latitude, longitude } = position.coords;
            // Fallback to coordinates
            const locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocationInput(locationString);
            setLocation(locationString);
            toast.success('Location found');
            fetchConcerts(locationString);
          }
        },
        (error) => {
          // Don't log permissions policy errors as they're expected in iframe environments
          if (!(error.code === 1 && error.message.includes('permissions policy'))) {
            console.warn('Geolocation unavailable:', error.message);
          }
          
          toast.error('Location access is not available in this environment. Please enter your location manually.');
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } catch (error) {
      console.error('Error calling geolocation:', error);
      toast.error('An error occurred while getting your location. Please enter it manually.');
    }
  };

  // Filter and sort concerts based on user preferences
  const getFilteredConcerts = () => {
    let filtered = [...concerts];

    // Create artist genre map for filtering
    const artistGenreMap = topArtists.reduce((acc, artist) => {
      acc[artist.name.toLowerCase()] = artist.genres || [];
      return acc;
    }, {} as Record<string, string[]>);

    // Filter by date range
    const now = new Date();
    if (filters.dateRange !== 'all') {
      let maxDate: Date;
      
      if (filters.dateRange === 'week') {
        maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === 'month') {
        maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else { // 3months
        maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      }
      
      filtered = filtered.filter(concert => {
        const concertDate = new Date(concert.date);
        return concertDate >= now && concertDate <= maxDate;
      });
    }

    // Filter by genre
    if (filters.selectedGenres.length > 0) {
      filtered = filtered.filter(concert => {
        const artistGenres = artistGenreMap[concert.artist.toLowerCase()] || concert.genres || [];
        return filters.selectedGenres.some(genre => 
          artistGenres.some(ag => ag.toLowerCase().includes(genre.toLowerCase()))
        );
      });
    }

    // Filter by price range
    const minC = filters.minCost || 0;
    const maxC = filters.maxCost || Infinity;
    filtered = filtered.filter(c => {
      const price = c.price_min || c.price || 0;
      return price >= minC && price <= maxC;
    });

    // Filter by joint budget
    if (filters.jointBudget > 0 && filters.ticketCount > 0) {
      filtered = filtered.filter(c => {
        const price = c.price_min || c.price || 0;
        return price * filters.ticketCount <= filters.jointBudget;
      });
    }

    // Sort
    if (filters.sortBy === 'vibe') {
      filtered.sort((a, b) => (b.vibe_score || b.matchScore || 0) - (a.vibe_score || a.matchScore || 0));
    } else if (filters.sortBy === 'cost_low') {
      filtered.sort((a, b) => (a.price_min || a.price || 0) - (b.price_min || b.price || 0));
    } else if (filters.sortBy === 'cost_high') {
      filtered.sort((a, b) => (b.price_min || b.price || 0) - (a.price_min || a.price || 0));
    } else if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return filtered;
  };

  const filteredConcerts = getFilteredConcerts();

  // Get all unique genres from concerts and top artists
  const getAllGenres = () => {
    const genreSet = new Set<string>();
    
    // Add genres from top artists
    topArtists.forEach(artist => {
      artist.genres?.forEach((genre: string) => genreSet.add(genre));
    });

    // Add genres from concerts
    concerts.forEach(concert => {
      concert.genres?.forEach((genre: string) => genreSet.add(genre));
    });

    return Array.from(genreSet).sort();
  };

  const availableGenres = getAllGenres();

  const handleTabChange = (value: string) => {
    if (value === 'concerts' && !location && !locationPromptShown) {
      toast.info('Enter your location to discover concerts near you!', { duration: 5000 });
      setLocationPromptShown(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F0] via-orange-50 to-orange-100 relative">
      {/* Subtle Background Pattern */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Header */}
      <header className="bg-[#FFFBF5]/90 backdrop-blur-sm shadow-md shadow-orange-100 sticky top-0 z-10 border-b border-orange-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-orange-600">HeadTap</span>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <Tabs defaultValue="profile" className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/80 backdrop-blur-sm border border-orange-200 shadow-lg">
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              My Music
            </TabsTrigger>
            <TabsTrigger 
              value="concerts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Concerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">Your Music Profile</h2>
              <p className="text-gray-600 mb-6">
                Discover your musical taste with insights from your listening history
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-orange-100 shadow-lg">
                  <LoadingProgress 
                    type="music" 
                    actualProgress={demoMode ? undefined : musicLoadingProgress}
                    currentStepIndex={demoMode ? undefined : musicLoadingStep}
                  />
                </div>
              ) : (
                <MusicProfile
                  topArtists={topArtists}
                  topTracks={topTracks}
                  savedTracks={savedTracks}
                  loading={loading}
                  sessionId={sessionId}
                  projectId={projectId}
                  publicAnonKey={publicAnonKey}
                  demoMode={demoMode}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="concerts" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">Concerts For You</h2>
              <p className="text-gray-600 mb-6">
                Based on your top {topArtists.length} artists and music taste
              </p>

              {/* Location Search */}
              <div className="flex gap-2 max-w-md mb-6">
                <Input
                  type="text"
                  placeholder="Enter city or location"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                  className="flex-1"
                  disabled={concertsLoading}
                />
                <Button onClick={handleLocationSearch} disabled={concertsLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  {concertsLoading ? 'Searching...' : 'Search'}
                </Button>
                <Button onClick={handleLocateMe} disabled={concertsLoading}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Locate Me
                </Button>
              </div>

              {/* Sort Tabs */}
              {concerts.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap border-b border-gray-200">
                    <button
                      onClick={() => setFilters({ ...filters, sortBy: 'date' })}
                      className={`px-4 py-2 font-medium transition-all ${
                        filters.sortBy === 'date'
                          ? 'text-orange-600 border-b-2 border-orange-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Date: Soonest First
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, sortBy: 'vibe' })}
                      className={`px-4 py-2 font-medium transition-all ${
                        filters.sortBy === 'vibe'
                          ? 'text-orange-600 border-b-2 border-orange-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Best Match
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, sortBy: 'cost_low' })}
                      className={`px-4 py-2 font-medium transition-all ${
                        filters.sortBy === 'cost_low'
                          ? 'text-orange-600 border-b-2 border-orange-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Price: Low to High
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, sortBy: 'cost_high' })}
                      className={`px-4 py-2 font-medium transition-all ${
                        filters.sortBy === 'cost_high'
                          ? 'text-orange-600 border-b-2 border-orange-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Price: High to Low
                    </button>
                  </div>
                </div>
              )}

              {/* Filters */}
              <ConcertFilters
                availableGenres={availableGenres}
                filters={filters}
                onFilterChange={setFilters}
                concertCount={concerts.length}
                filteredCount={filteredConcerts.length}
              />

              {concertsLoading ? (
                <div className="flex items-center justify-center py-16 bg-white/80 backdrop-blur-sm rounded-lg border border-orange-100 shadow-lg">
                  <LoadingProgress 
                    type="concerts" 
                    actualProgress={demoMode ? undefined : concertsLoadingProgress}
                    currentStepIndex={demoMode ? undefined : concertsLoadingStep}
                  />
                </div>
              ) : (
                <ConcertList concerts={filteredConcerts} loading={false} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}