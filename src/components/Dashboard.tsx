import { ShowAlerts } from './ShowAlerts';
import {stopListening} from './ArtistListening';
import {nightOutPicks,weekendRange} from '../utils/nightOut';
import {ShowShortlist} from './ShowShortlist';
import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useDiscovery } from '../hooks/useDiscovery';
import { rankConcerts, artistKey, eventKey, type Feedback } from '../utils/discovery';
import { localRead, localWrite, localScope } from '../utils/localStore';
import { loadSavedLibrary } from '../utils/libraryLoader';
import { libraryArtists } from '../utils/musicSummary';
import { filterConcerts } from '../utils/concerts';
import { MusicProfile } from './MusicProfile';
import { ConcertList } from './ConcertList';
import { ConcertFilters, FilterOptions } from './ConcertFilters';
import { LoadingProgress } from './LoadingProgress';
import { LogOut, Search, Music, MapPin } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { mockTopArtists, mockTopTracks, mockSavedTracks, mockConcerts } from '../utils/mockData';

interface DashboardProps {
  sessionId: string | null;
  onLogout: () => void;
  demoMode?: boolean;
}

export function Dashboard({ sessionId, onLogout, demoMode = false }: DashboardProps) {
  const {preferences,setPreferences,ready:preferencesReady,error:preferencesError} = useDiscovery(demoMode ? 'demo' : sessionId || 'anonymous');
  const [activeTab,setActiveTabState] = useState(new URLSearchParams(window.location.search).get('view')==='alerts'?'concerts':'profile');
  const savedOnly=activeTab==='saved';
  const scrollPositions=useRef<Record<string,number>>({});
  const setActiveTab=(next:string)=>{
    if(next===activeTab)return;
    scrollPositions.current[activeTab]=window.scrollY;
    stopListening();
    setActiveTabState(next);
    requestAnimationFrame(()=>{document.querySelector<HTMLElement>('[role=tab][data-state=active]')?.focus({preventScroll:true});window.scrollTo({top:scrollPositions.current[next] || 0,behavior:'instant'});});
  };
  const [syncTime,setSyncTime] = useState<number|null>(null);
  const [storageError,setStorageError] = useState('');
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [artistDetails, setArtistDetails] = useState<any[]>([]);
  const [libraryProgress, setLibraryProgress] = useState('');
  const libraryRun = useRef(0);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [profileUpdatedAt, setProfileUpdatedAt] = useState<Date | null>(null);
  const [savedTracks, setSavedTracks] = useState<any[]>([]);
  const [concerts, setConcerts] = useState<any[]>([]);
  const concertRequest = useRef(0);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [concertError, setConcertError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [sampleConcerts, setSampleConcerts] = useState(false);
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
  const [filters, setFilters] = useState<FilterOptions>({
    selectedGenres: [] as string[],
    minCost: 0,
    maxCost: Infinity,
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

  const fetchLibrary = async (force = false) => {
    if (!sessionId || demoMode) return;
    const run = ++libraryRun.current;
    setLibraryLoading(true);
    setLibraryError(null);
    setStorageError('');
    const tracks: any[] = [];
    const details: any[] = [];
    type Checkpoint = {tracks:any[];details:any[];nextOffset:number|null;total:number;updatedAt:number;complete:boolean};
    let checkpoint:Checkpoint = {tracks:[],details:[],nextOffset:0,total:0,updatedAt:Date.now(),complete:false};
    let key = '';

    const persist = async () => {
      if (run !== libraryRun.current || !key) return;
      try {await localWrite(key,checkpoint);} catch {setStorageError('Browser storage is unavailable. Library syncing works, but cannot resume after closing the page.');}
    };
    const get = async (route: string) => {
      const response = await fetch(`${baseUrl}/spotify/${route}&session=${encodeURIComponent(sessionId)}`, {headers:{Authorization:`Bearer ${publicAnonKey}`}, signal:AbortSignal.timeout(30000)});
      if (response.status === 401) { onLogout(); throw new Error('Please reconnect Spotify.'); }
      if (!response.ok) throw new Error(response.status === 429 ? 'Spotify is limiting requests. Retry shortly to finish your library.' : 'Library loading stopped before completion. Retry to finish.');
      return response.json();
    };
    try {
      key = `library:${await localScope(sessionId)}`;
      if (!force) {
        try {
          const cached = await localRead<Checkpoint>(key);
          if (cached && Date.now()-cached.updatedAt < 24*60*60*1000) checkpoint=cached;
        } catch {setStorageError('Saved library cache is unavailable. Loading from Spotify.');}
      }
      if (run !== libraryRun.current) return;
      setSavedTracks(checkpoint.tracks);
      setArtistDetails(checkpoint.details);
      if (checkpoint.complete && !force) {
        setSyncTime(checkpoint.updatedAt);
        setLibraryProgress(`${checkpoint.tracks.length} saved songs · Loaded from this browser’s cache`);
        return;
      }
      // Before resuming offsets, check that the beginning and size of the library
      // still match. If they changed, rebuild rather than mixing shifted pages.
      if (checkpoint.tracks.length && checkpoint.nextOffset !== null) {
        const first = await get('saved-tracks?offset=0');
        if (first.total !== checkpoint.total || JSON.stringify((first.items || []).map((t:any)=>t.id)) !== JSON.stringify(checkpoint.tracks.slice(0,(first.items || []).length).map((t:any)=>t.id))) checkpoint={tracks:[],details:[],nextOffset:0,total:0,updatedAt:Date.now(),complete:false};
      }
      setSavedTracks(checkpoint.tracks);
      setArtistDetails(checkpoint.details);
      details.push(...checkpoint.details);
      tracks.push(...await loadSavedLibrary(async offset => {
        if (run !== libraryRun.current) throw new Error('Library request replaced');
        return get(`saved-tracks?offset=${offset}`);
      }, async (items,total,nextOffset) => {
        if (run !== libraryRun.current) return;
        setSavedTracks(items);
        setLibraryProgress(`${items.length} of ${total ?? '?'} saved songs loaded`);
        checkpoint={...checkpoint,tracks:items,total,nextOffset,updatedAt:Date.now()};
        await persist();
      },checkpoint));
      if (run !== libraryRun.current) return;
      const ids = libraryArtists(tracks).map(a => a.id).filter(id => /^[a-zA-Z0-9]{22}$/.test(id || '') && !details.some(a=>a.id===id));
      for (let index = 0; index < ids.length; index += 50) {
        setLibraryProgress(`${tracks.length} saved songs loaded · Artist details ${index} of ${ids.length}`);
        const data = await get(`library-artists?ids=${ids.slice(index,index+50).join(',')}`);
        if (run !== libraryRun.current) return;
        details.push(...data.items);
        setArtistDetails([...details]);
        checkpoint={...checkpoint,details:[...details],updatedAt:Date.now()};
        await persist();
      }
      checkpoint={...checkpoint,complete:true,updatedAt:Date.now()};
      await persist();
      setSyncTime(checkpoint.updatedAt);
      setLibraryProgress(`${tracks.length} saved songs loaded · ${details.length} artist details returned`);
    } catch (error) {
      if (run === libraryRun.current) setLibraryError(error instanceof Error ? error.message : 'Library unavailable');
    } finally { if (run === libraryRun.current) setLibraryLoading(false); }
  };

  const fetchMusicData = async (force = false) => {
    // Use mock data in demo mode
    if (demoMode) {
      setTopArtists(mockTopArtists);
      setTopTracks(mockTopTracks);
      setSavedTracks(mockSavedTracks);
      setArtistDetails(mockTopArtists);
      setProfileUpdatedAt(new Date());
      setLoading(false);
      return;
    }
    
    if (!sessionId) return;
    
    setLoading(true);
    setMusicError(null);
    void fetchLibrary(force);
    setMusicLoadingProgress(0);
    setMusicLoadingStep(0);
    toast.info('Loading your music profile...');
    
    try {
      setMusicLoadingProgress(10);
      const routes = ['top-artists?time_range=medium_term&', 'top-tracks?time_range=medium_term&'];
      let completed = 0;
      const data = await Promise.all(routes.map(async route => {
        const response = await fetch(`${baseUrl}/spotify/${route}session=${encodeURIComponent(sessionId)}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal: AbortSignal.timeout(60000),
        });
        if (response.status === 401) throw new Error('SESSION_EXPIRED');
        if (!response.ok) throw new Error('Could not load your music. Please retry.');
        const body = await response.json();
        setMusicLoadingProgress(10 + (++completed / routes.length) * 85);
        return body;
      }));
      setTopArtists(data[0].items || []);
      setTopTracks(data[1].items || []);
      setProfileUpdatedAt(new Date());

      // Step 4: Building profile (progress: 80-100%)
      setMusicLoadingStep(3);
      setMusicLoadingProgress(100);
      
      toast.success('Music profile loaded!');
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') { onLogout(); toast.error('Your Spotify session expired. Please reconnect.'); return; }
      console.error('Error fetching music data:', error);
      setMusicError(error instanceof Error ? error.message : 'Failed to load music data');
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


    const requestId = ++concertRequest.current;
    setConcertError(null);
    setHasSearched(true);
    setConcerts([]);
    setSampleConcerts(false);
    setConcertsLoading(true);
    setConcertsLoadingProgress(0);
    setConcertsLoadingStep(0);
    if (!demoMode) toast.info('Finding concerts near you...');

    try {
      // Use mock data in demo mode
      if (demoMode) {
        setConcerts([...mockConcerts,
          {...mockConcerts[0],id:'sample-discovery-1',artist:'Amber Hours',event_name:'Fictional discovery example',genres:['pop','indie pop'],imageUrl:'',matchReasons:[],vibe_score:undefined},
          {...mockConcerts[1],id:'sample-discovery-2',artist:'Neon Current',event_name:'Fictional discovery example',genres:['r&b','pop'],imageUrl:'',matchReasons:[],vibe_score:undefined}
        ]);
        setLocation(loc);
        toast.info('Showing sample shows. These are not live listings for your location.');
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

      
      setConcertsLoadingProgress(25);
      
      // Step 2: Extracting artist information (progress: 25-50%)
      setConcertsLoadingStep(1);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        signal: AbortSignal.timeout(60000),
      });

      if (requestId !== concertRequest.current) return;
      if (response.status === 401) { onLogout(); toast.error('Your Spotify session expired. Please reconnect.'); return; }
      setConcertsLoadingProgress(50);

      if (response.ok) {
        // Step 3: Matching concerts (progress: 50-80%)
        setConcertsLoadingStep(2);
        const data = await response.json();
        if (requestId !== concertRequest.current) return;
        console.log('Full concert response:', data);
        console.log('Number of concerts:', data.concerts?.length || 0);
        
        setConcertsLoadingProgress(80);
        
        // Step 4: Calculating vibe scores (progress: 80-100%)
        setConcertsLoadingStep(3);
        setSampleConcerts(data.source === 'mock');
        setConcerts(data.concerts || []);
        setLocation(loc);
        
        setConcertsLoadingProgress(100);
        
        if (data.source === 'mock') {
          toast.info('Live listings are unavailable. Showing sample events.');
        } else if (data.concerts && data.concerts.length > 0) {
          toast.success(`Found ${data.concerts.length} concerts in ${data.location}!`);
        } else {
          toast.info('No concerts found in this area. Try a different location.');
        }
      } else {
        throw new Error(`Concert search failed (${response.status}). Please try again.`);
      }
    } catch (error) {
      if (requestId === concertRequest.current) setConcertError(error instanceof Error ? error.message : 'Concert search failed.');
    } finally {
      if (requestId === concertRequest.current) {
        setConcertsLoading(false);
        setConcertsLoadingProgress(0);
        setConcertsLoadingStep(0);
      }
    }
  };

  const handleLocationSearch = () => {
    console.log('Search button clicked!');
    console.log('Location:', locationInput);
    console.log('Session ID:', sessionId ? 'Valid' : 'Missing');
    
    if (!locationInput.trim()) { toast.error('Please enter a location'); return; }
    setLocation(locationInput.trim());
    fetchConcerts(locationInput.trim());
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
                signal: AbortSignal.timeout(8000)
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
              if (!city) throw new Error('No city returned');
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

  const profileArtists = [...libraryArtists(savedTracks,artistDetails)];
  for (const artist of topArtists) {
    const existing = profileArtists.find(a=>artistKey(a.name)===artistKey(artist.name));
    if (!existing) profileArtists.push(artist);
    else if (!existing.genres?.length) Object.assign(existing,{...artist,...existing,genres:artist.genres});
  }
  const shortlistEvents = Object.values(preferences.saved).map(saved=>{
    const latest=concerts.find(event=>eventKey(event)===eventKey(saved));
    return latest?{...saved,...latest,savedAt:saved.savedAt,refreshedFromSearch:true}:saved;
  });
  const rankedConcerts = rankConcerts(concerts, profileArtists, preferences);
  const filteredConcerts = filterConcerts(rankedConcerts, profileArtists, filters);
  if(filters.sortBy==='vibe') filteredConcerts.sort((a,b)=>b.recommendation.score-a.recommendation.score);
  const picks = nightOutPicks(filteredConcerts);
  const remainingConcerts = filteredConcerts.filter(e=>!picks.some(p=>eventKey(p)===eventKey(e)));
  const weekend=weekendRange();
  const weekendEnd=new Date(weekend.end);weekendEnd.setDate(weekendEnd.getDate()-1);
  const onFeedback = (artist:string,value:Feedback|null) => {
    setPreferences(previous=>{const feedback={...previous.feedback};if(value)feedback[artistKey(artist)]=value;else delete feedback[artistKey(artist)];return {...previous,feedback};});
    setFilters(previous=>({...previous,sortBy:'vibe'}));
  };
  const onSave = (concert:any) => setPreferences(previous=>{const saved={...previous.saved};const key=eventKey(concert);if(saved[key])delete saved[key];else saved[key]={...concert,sample:demoMode || sampleConcerts,savedAt:Date.now()};return {...previous,saved};});

  // Get all unique genres from concerts and top artists
  const getAllGenres = () => {
    const genreSet = new Set<string>();
    
    // Add genres from top artists
    profileArtists.forEach(artist => {
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
      toast.info('Enter your location to discover shows near you!', { duration: 5000 });
      setLocationPromptShown(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-stone-900">
      {/* Header */}
      <header className="bg-[#FAF8F4]/95 backdrop-blur-sm sticky top-0 z-10 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-2xl font-bold text-orange-700 tracking-tight">HeadTap</span>

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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 relative">
        {demoMode && (
          <div role="status" className="mb-4 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-900">
            Demo mode · Sample music and events, not live listings.
          </div>
        )}
        <Tabs value={activeTab} onValueChange={value=>{setActiveTab(value);handleTabChange(value);}} className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-3 h-auto bg-stone-100 border border-stone-200 p-1 shadow-none">
            <TabsTrigger 
              value="profile"
              className="h-11 data-[state=active]:bg-white data-[state=active]:text-orange-800 data-[state=active]:shadow-sm"
            >
              My Music
            </TabsTrigger>
            <TabsTrigger 
              value="concerts"
              className="h-11 data-[state=active]:bg-white data-[state=active]:text-orange-800 data-[state=active]:shadow-sm"
            >
              Concerts
            </TabsTrigger>
            <TabsTrigger value="saved" className="h-11">Saved ({Object.keys(preferences.saved).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" forceMount hidden={activeTab!=='profile'}>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-stone-900">Your Music Profile</h2>
              <p className="text-stone-600 mb-5">
                Discover your musical taste with insights from your listening history
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-stone-600">
                {profileUpdatedAt && <span>{demoMode ? 'Sample profile' : `Profile loaded at ${profileUpdatedAt.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`}</span>}
                {!demoMode && <Button variant="outline" size="sm" disabled={loading || libraryLoading} onClick={()=>fetchMusicData(true)}>Refresh profile</Button>}
                {libraryLoading && <span role="status">{libraryProgress || 'Loading your full saved library…'}</span>}
                {syncTime && <span>Library synced {new Date(syncTime).toLocaleString()}</span>}
                {storageError && <span role="alert">{storageError}</span>}
                {libraryError && <span role="alert">{libraryError} <button className="underline font-semibold" onClick={()=>fetchLibrary()}>Resume library</button></span>}
              </div>
              {musicError ? (
                <div role="alert" className="rounded-lg bg-white p-6">
                  <p>{musicError}</p>
                  <Button onClick={()=>fetchMusicData(true)}>Retry music profile</Button>
                  <Button variant="ghost" onClick={onLogout}>Disconnect</Button>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-orange-100 shadow-lg">
                  <LoadingProgress 
                    type="music" 
                    actualProgress={demoMode ? undefined : musicLoadingProgress}
                    currentStepIndex={demoMode ? undefined : musicLoadingStep}
                  />
                </div>
              ) : (
                <div className="space-y-6"><MusicProfile
                  topArtists={topArtists}
                  topTracks={topTracks}
                  savedTracks={savedTracks}
                  loading={loading}
                  sessionId={sessionId}
                  projectId={projectId}
                  publicAnonKey={publicAnonKey}
                  libraryArtists={libraryArtists(savedTracks, artistDetails)}
                  libraryProgress={libraryProgress}
                  libraryLoading={libraryLoading}
                  libraryError={libraryError}
                  demoMode={demoMode}
                /></div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="concerts" forceMount hidden={activeTab!=='concerts'} className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-stone-900">Find your next show</h2>
              <p className="text-stone-600 mb-5">
                Based on {profileArtists.length} loaded artists and your discovery preferences
              </p>

              <ShowAlerts sessionId={sessionId} artists={profileArtists} libraryLoading={libraryLoading || loading} demoMode={demoMode}/>
              <form onSubmit={(event) => { event.preventDefault(); handleLocationSearch(); }} className="mb-5 rounded-xl border border-stone-200 bg-white p-3 sm:p-4">
                <label htmlFor="concert-location" className="block text-sm font-semibold text-stone-700 mb-2">Where do you want to go?</label>
                <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
                  <Input id="concert-location" type="text" placeholder="City, state or postcode" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} className="col-span-2 sm:col-span-1 h-11 w-full min-w-0 bg-stone-50 border-stone-300 text-base" disabled={concertsLoading}/>
                  <Button type="submit" className="h-11 bg-orange-700 hover:bg-orange-800 text-white px-5" disabled={concertsLoading}><Search className="w-4 h-4"/>{concertsLoading ? 'Searching…' : 'Find shows'}</Button>
                  <Button type="button" variant="outline" className="h-11 border-stone-300 text-stone-700" onClick={handleLocateMe} disabled={concertsLoading}><MapPin className="w-4 h-4"/>Use my location</Button>
                </div>
              </form>
              <ConcertFilters availableGenres={availableGenres} filters={filters} onFilterChange={setFilters} discovery={
                <fieldset className="border-t border-stone-100 pt-5"><legend className="sr-only">Discovery style</legend><h3 className="font-semibold text-sm mb-1">What are you in the mood for?</h3><p className="text-xs text-stone-500 mb-3">Choose how adventurous your recommendations feel.</p><div className="grid sm:grid-cols-3 gap-2">{([{value:0,title:'Familiar favorites',description:'Artists already in your music.'},{value:50,title:'A bit of both',description:'Favorites with new discoveries.'},{value:100,title:'Something new',description:'New names connected to your taste.'}]).map(option=>{const selected=option.value=== (preferences.adventure<25?0:preferences.adventure>75?100:50);return <button key={option.value} disabled={!preferencesReady} aria-pressed={selected} onClick={()=>{setPreferences(p=>({...p,adventure:option.value}));setFilters(p=>({...p,sortBy:'vibe'}));}} className={`rounded-xl border p-3 min-h-16 text-left transition-colors ${selected?'bg-orange-50 border-orange-600 ring-1 ring-orange-600':'border-stone-200 hover:border-orange-300'}`}><span className="flex items-center justify-between gap-2 text-sm font-semibold text-stone-900">{option.title}<span aria-hidden="true" className={`w-4 h-4 rounded-full border flex-shrink-0 ${selected?'border-[5px] border-orange-600 bg-white':'border-stone-300'}`}/></span><span className="block text-xs text-stone-600 mt-1">{option.description}</span></button>;})}</div><p className="text-xs text-stone-500 mt-2">Changes Best match ordering; your date, distance and budget still apply.</p>{preferencesError&&<p role="alert" className="text-sm mt-2">{preferencesError}</p>}</fieldset>
              }/>
              {location && <p className="text-sm text-stone-600 mb-3" role="status">{location} · {filters.dateRange==='all'?'Any date':filters.dateRange==='weekend'?'This weekend':filters.dateRange==='week'?'Next 7 days':filters.dateRange==='month'?'Next 30 days':'Next 3 months'} · Within {filters.distance} miles · {Number.isFinite(filters.maxCost)?`Up to $${filters.maxCost}`:'Any price'}</p>}
              {(concerts.length > 0 || savedOnly) && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <p className="text-sm text-stone-600">{filteredConcerts.length} {demoMode || sampleConcerts ? 'sample ' : ''}shows</p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="concert-sort" className="text-sm text-stone-600">Sort by</label>
                    <select id="concert-sort" value={filters.sortBy} onChange={event => setFilters({...filters, sortBy: event.target.value as FilterOptions['sortBy']})} className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900">
                      <option value="date">Soonest first</option><option value="vibe">Best match</option><option value="cost_low">Price: low to high</option><option value="cost_high">Price: high to low</option>
                    </select>
                  </div>
                </div>
              )}


              {concertsLoading ? (
                <div className="flex items-center justify-center py-16 bg-white/80 backdrop-blur-sm rounded-lg border border-orange-100 shadow-lg">
                  <LoadingProgress 
                    type="concerts" 
                    actualProgress={demoMode ? undefined : concertsLoadingProgress}
                    currentStepIndex={demoMode ? undefined : concertsLoadingStep}
                  />
                </div>
              ) : (
                <>

                  {!savedOnly && !concertError && picks.length>0 && <section className="mb-8 space-y-3" aria-label="Your next night out"><h3 className="text-2xl font-bold">Your next night out</h3><p className="text-sm text-stone-600">{demoMode?'Sample picks':'Standout shows'} for your taste, location and current filters. One pick per artist.</p><ConcertList concerts={picks} preferences={preferences} controlsReady={preferencesReady} onFeedback={onFeedback} onSave={onSave} sample={demoMode || sampleConcerts}/></section>}
                  {!savedOnly && remainingConcerts.length>0 && <h3 className="text-xl font-bold mb-4">More shows to explore</h3>}
                  {!concertError && hasSearched && !filteredConcerts.length && concerts.length>0 && <Button variant="outline" className="mb-3" onClick={()=>setFilters(p=>({...p,dateRange:'all',minCost:0,maxCost:Infinity,selectedGenres:[],jointBudget:0}))}>Show all dates and prices</Button>}
                  {concertError && <Button variant="outline" className="mb-3" onClick={()=>fetchConcerts(location)}>Retry show search</Button>}
                  {sampleConcerts && <p role="status">Live listings are unavailable. Showing sample events.</p>}
                  {savedOnly && !rankedConcerts.length ? <p role="status" className="p-6 text-center">No saved concerts yet. Save a show from your search results to find it here.</p> : (remainingConcerts.length>0 || !picks.length) ? <ConcertList preferences={preferences} controlsReady={preferencesReady} onFeedback={onFeedback} onSave={onSave} searched={(hasSearched && !picks.length) || savedOnly} error={savedOnly ? null : concertError} filteredOut={rankedConcerts.length > 0 && filteredConcerts.length === 0} concerts={remainingConcerts} loading={false} sample={demoMode || sampleConcerts} /> : null}
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="saved" forceMount hidden={activeTab!=='saved'}><h2 className="text-2xl font-bold mb-4">Saved shows</h2>{shortlistEvents.length ? <ShowShortlist events={shortlistEvents} onRemove={onSave}/> : <div className="rounded-xl bg-white border p-6"><p>No saved shows yet.</p><Button className="mt-3" onClick={()=>setActiveTab('concerts')}>Find a show</Button></div>}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
}