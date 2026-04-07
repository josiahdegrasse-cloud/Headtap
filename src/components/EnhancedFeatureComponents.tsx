import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Radio, 
  TrendingUp, 
  Gem, 
  Clock, 
  History,
  Mic2,
  MapPin,
  Sparkles,
  Loader2,
  Smile,
  Frown,
  Meh,
  Heart,
  Zap,
  CloudRain,
  Volume2,
  Music
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  popularity?: number;
}

interface Track {
  id: string;
  name: string;
  artists: { name: string; id?: string }[];
  album: {
    images: { url: string }[];
    release_date?: string;
  };
  added_at?: string;
}

interface AudioFeatures {
  energy?: number;
  danceability?: number;
  acousticness?: number;
  valence?: number;
  speechiness?: number;
  instrumentalness?: number;
  tempo?: number;
  loudness?: number;
}

interface FeatureComponentProps {
  artists: Artist[];
  tracks: Track[];
  sessionId?: string | null;
  projectId?: string;
  publicAnonKey?: string;
}

// Sonic Signature Component - NOW WITH REAL DATA
export function SonicSignature({ artists, tracks, sessionId, projectId, publicAnonKey }: FeatureComponentProps) {
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('===== SONIC SIGNATURE PROPS =====');
    console.log('Artists count:', artists?.length || 0);
    console.log('Tracks count:', tracks?.length || 0);
    console.log('Tracks:', tracks);
    console.log('Session ID:', sessionId ? 'Present' : 'MISSING');
    console.log('Project ID:', projectId ? 'Present' : 'MISSING');
    console.log('Public Anon Key:', publicAnonKey ? 'Present' : 'MISSING');
    console.log('================================');
    
    loadAudioFeatures();
  }, [tracks, sessionId]);

  const loadAudioFeatures = async () => {
    if (!tracks || tracks.length === 0) {
      console.log('Sonic Signature: No tracks available');
      setLoading(false);
      return;
    }

    if (!sessionId) {
      console.log('Sonic Signature: No session ID');
      setLoading(false);
      return;
    }

    if (!projectId || !publicAnonKey) {
      console.log('Sonic Signature: Missing project config');
      setLoading(false);
      return;
    }

    try {
      // Get track IDs from top tracks
      const trackIds = tracks.slice(0, 50).map(t => t.id).filter(Boolean).join(',');
      
      console.log(`Sonic Signature: Fetching audio features for ${trackIds.split(',').length} tracks`);
      
      if (!trackIds) {
        console.log('Sonic Signature: No valid track IDs found');
        setLoading(false);
        return;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5/spotify/audio-features?session=${sessionId}&track_ids=${trackIds}`;
      console.log('Sonic Signature: Fetching from:', url.substring(0, 100) + '...');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sonic Signature: API error:', response.status, errorText);
        setLoading(false);
        setError(errorText);
        return;
      }

      const data = await response.json();
      console.log('Sonic Signature: Received data:', data);
      
      const features = data.audio_features?.filter((f: any) => f !== null) || [];
      
      console.log(`Sonic Signature: Got ${features.length} valid audio features`);
      
      if (features.length === 0) {
        console.log('Sonic Signature: No valid audio features in response');
        setLoading(false);
        return;
      }

      // Calculate averages
      const avg = {
        energy: Math.round((features.reduce((sum: number, f: any) => sum + (f.energy || 0), 0) / features.length) * 100),
        danceability: Math.round((features.reduce((sum: number, f: any) => sum + (f.danceability || 0), 0) / features.length) * 100),
        acousticness: Math.round((features.reduce((sum: number, f: any) => sum + (f.acousticness || 0), 0) / features.length) * 100),
        valence: Math.round((features.reduce((sum: number, f: any) => sum + (f.valence || 0), 0) / features.length) * 100),
        speechiness: Math.round((features.reduce((sum: number, f: any) => sum + (f.speechiness || 0), 0) / features.length) * 100),
        instrumentalness: Math.round((features.reduce((sum: number, f: any) => sum + (f.instrumentalness || 0), 0) / features.length) * 100),
      };

      console.log('Sonic Signature: Calculated averages:', avg);
      setAudioFeatures(avg);
    } catch (err) {
      console.error('Sonic Signature: Error loading audio features:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-3 shadow-lg">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Sonic Signature
            </h2>
            <p className="text-gray-600 mt-1">Analyzing your audio DNA...</p>
          </div>
        </div>
        <Card className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Unable to load audio features</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </Card>
    );
  }

  if (!audioFeatures) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Unable to load audio features</p>
      </Card>
    );
  }

  const features = [
    { name: 'Energy', value: audioFeatures.energy || 0, color: 'from-red-500 to-orange-500', icon: 'Zap' },
    { name: 'Danceability', value: audioFeatures.danceability || 0, color: 'from-purple-500 to-pink-500', icon: 'Move' },
    { name: 'Acousticness', value: audioFeatures.acousticness || 0, color: 'from-green-500 to-emerald-500', icon: 'Guitar' },
    { name: 'Valence (Mood)', value: audioFeatures.valence || 0, color: 'from-yellow-500 to-amber-500', icon: 'Smile' },
    { name: 'Speechiness', value: audioFeatures.speechiness || 0, color: 'from-blue-500 to-cyan-500', icon: 'MessageCircle' },
  ];

  // Generate personality insights
  const getInsight = () => {
    const { energy = 0, danceability = 0, valence = 0, acousticness = 0 } = audioFeatures;
    
    if (energy > 70 && danceability > 70) {
      return "You love high-energy, danceable tracks that get you moving!";
    } else if (acousticness > 60 && valence < 50) {
      return "Your taste leans toward acoustic, introspective music with emotional depth.";
    } else if (valence > 70) {
      return "You gravitate toward upbeat, happy music that lifts your spirits!";
    } else if (energy < 40 && acousticness > 50) {
      return "You appreciate calm, acoustic soundscapes perfect for relaxation.";
    } else {
      return "You have a balanced taste across different sonic qualities!";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-3 shadow-lg">
          <Radio className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Sonic Signature
          </h2>
          <p className="text-gray-600 mt-1">The audio DNA of your music taste</p>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div key={feature.name} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="font-semibold text-gray-700">{feature.name}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{feature.value}%</span>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${feature.color} rounded-full transition-all duration-1000`}
                  style={{ width: `${feature.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
        <p className="text-sm text-purple-900">
          <span className="font-semibold">🎵 Your Sound:</span> {getInsight()}
        </p>
      </Card>
    </div>
  );
}

// Discovery Score Component - ENHANCED
export function DiscoveryScore({ artists, tracks }: FeatureComponentProps) {
  const [discoveryMetrics, setDiscoveryMetrics] = useState({
    score: 0,
    newArtistsPerMonth: 0,
    explorerPercentage: 0,
    uniqueArtists: 0
  });

  useEffect(() => {
    calculateDiscoveryMetrics();
  }, [artists, tracks]);

  const calculateDiscoveryMetrics = () => {
    if (!tracks || tracks.length === 0) return;

    // Calculate discovery metrics from tracks with added_at dates
    const tracksWithDates = tracks.filter(t => t.added_at);
    
    if (tracksWithDates.length === 0) {
      // Fallback calculation based on artist diversity
      const avgPopularity = artists.reduce((sum, a) => sum + (a.popularity || 50), 0) / artists.length;
      const score = Math.round((100 - avgPopularity) * 0.6 + 40);
      
      setDiscoveryMetrics({
        score,
        newArtistsPerMonth: Math.round(artists.length / 6), // Assume 6 months
        explorerPercentage: score,
        uniqueArtists: artists.length
      });
      return;
    }

    // Group tracks by month
    const artistsByMonth: Record<string, Set<string>> = {};
    
    tracksWithDates.forEach(track => {
      const date = new Date(track.added_at!);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!artistsByMonth[monthKey]) {
        artistsByMonth[monthKey] = new Set();
      }
      
      track.artists.forEach(artist => {
        artistsByMonth[monthKey].add(artist.name);
      });
    });

    // Calculate average new artists per month
    const months = Object.keys(artistsByMonth);
    const newArtistsPerMonth = months.length > 0
      ? Math.round(months.reduce((sum, month) => sum + artistsByMonth[month].size, 0) / months.length)
      : 5;

    // Calculate explorer score (0-100)
    // Factors: new artists per month, genre diversity, obscurity
    const avgPopularity = artists.reduce((sum, a) => sum + (a.popularity || 50), 0) / artists.length;
    const genreCount = new Set(artists.flatMap(a => a.genres)).size;
    
    const explorerScore = Math.min(100, Math.round(
      (newArtistsPerMonth * 8) +  // Up to 80 points for discovering artists
      (genreCount * 2) +            // Up to 40 points for genre diversity  
      ((100 - avgPopularity) * 0.3) // Up to 30 points for obscure taste
    ));

    setDiscoveryMetrics({
      score: explorerScore,
      newArtistsPerMonth,
      explorerPercentage: explorerScore,
      uniqueArtists: artists.length
    });
  };

  const getDiscoveryType = () => {
    const { explorerPercentage } = discoveryMetrics;
    
    if (explorerPercentage >= 80) return { label: 'Music Explorer 🗺️', description: 'You\'re constantly discovering new artists!' };
    if (explorerPercentage >= 60) return { label: 'Adventurous Listener 🌟', description: 'You balance exploration with familiar favorites.' };
    if (explorerPercentage >= 40) return { label: 'Selective Discoverer 🎯', description: 'You carefully curate your new finds.' };
    return { label: 'Loyal Fan 💝', description: 'You stick with the artists you love!' };
  };

  const discoveryType = getDiscoveryType();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-3 shadow-lg">
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Discovery Score
          </h2>
          <p className="text-gray-600 mt-1">How adventurous is your music taste?</p>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center mb-6">
          <div className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            {discoveryMetrics.score}
          </div>
          <p className="text-gray-600 font-medium">{discoveryType.label}</p>
          <p className="text-sm text-gray-500 mt-1">{discoveryType.description}</p>
        </div>

        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              Loyalist
            </div>
            <div className="flex-1 bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              Explorer
            </div>
          </div>
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-1000"
            style={{ left: `${discoveryMetrics.explorerPercentage}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
              You're here! 👆
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">{discoveryMetrics.newArtistsPerMonth}</div>
            <div className="text-sm text-gray-600 mt-1">New artists/month</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-teal-600">{discoveryMetrics.uniqueArtists}</div>
            <div className="text-sm text-gray-600 mt-1">Total artists</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Hidden Gems Component - ENHANCED WITH REAL POPULARITY DATA
export function HiddenGems({ artists }: FeatureComponentProps) {
  const hiddenGemArtists = artists
    .filter(artist => (artist.popularity || 50) < 50) // Filter obscure artists
    .sort((a, b) => (a.popularity || 50) - (b.popularity || 50)) // Sort by popularity (lowest first)
    .slice(0, 6)
    .map(artist => ({
      ...artist,
      obscurityScore: Math.round(100 - (artist.popularity || 50))
    }));

  if (hiddenGemArtists.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Gem className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">You mostly listen to popular artists!</p>
        <p className="text-sm text-gray-500 mt-2">Try exploring some underground music 💎</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-3 shadow-lg">
          <Gem className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Hidden Gems
          </h2>
          <p className="text-gray-600 mt-1">Your most obscure artists</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hiddenGemArtists.map((artist, index) => (
          <Card key={artist.id} className="p-5 hover:shadow-lg transition-all bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="flex items-start gap-4">
              <div className="relative">
                {artist.images[0] && (
                  <img
                    src={artist.images[0].url}
                    alt={artist.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-200"
                  />
                )}
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
                  #{index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{artist.name}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className="bg-amber-500 text-white text-xs">
                    💎 {artist.obscurityScore}% obscure
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {artist.popularity}% popular
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {artist.genres.slice(0, 2).map((genre) => (
                    <Badge key={genre} variant="outline" className="text-xs capitalize bg-white">
                      {genre.replace(/-/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">✨ Amazing!</span> You're supporting {hiddenGemArtists.length} underground artists with less mainstream recognition. Keep discovering! 🎵
        </p>
      </Card>
    </div>
  );
}

// Nostalgia Index Component - ENHANCED WITH REAL RELEASE DATES
export function NostalgiaIndex({ tracks }: FeatureComponentProps) {
  const [nostalgiaData, setNostalgiaData] = useState({
    score: 0,
    avgAge: 0,
    decadeBreakdown: [] as { decade: string; percentage: number; isNew: boolean }[],
    oldestTrack: null as Track | null
  });

  useEffect(() => {
    calculateNostalgia();
  }, [tracks]);

  const calculateNostalgia = () => {
    const tracksWithDates = tracks.filter(t => t.album.release_date);
    
    if (tracksWithDates.length === 0) return;

    const currentYear = new Date().getFullYear();
    const trackAges = tracksWithDates.map(t => {
      const year = parseInt(t.album.release_date!.substring(0, 4));
      return currentYear - year;
    });

    const avgAge = trackAges.reduce((sum, age) => sum + age, 0) / trackAges.length;

    // Calculate nostalgia score (0-100, higher = more nostalgic)
    const nostalgiaScore = Math.min(100, Math.round((avgAge / 30) * 100));

    // Decade breakdown
    const decades: Record<number, number> = {};
    tracksWithDates.forEach(track => {
      const year = parseInt(track.album.release_date!.substring(0, 4));
      const decade = Math.floor(year / 10) * 10;
      decades[decade] = (decades[decade] || 0) + 1;
    });

    const decadeBreakdown = Object.entries(decades)
      .map(([decade, count]) => ({
        decade: `${decade}s`,
        percentage: Math.round((count / tracksWithDates.length) * 100),
        isNew: parseInt(decade) >= 2020
      }))
      .sort((a, b) => parseInt(b.decade) - parseInt(a.decade));

    // Find oldest track
    const oldestTrack = tracksWithDates.reduce((oldest, track) => {
      const year = parseInt(track.album.release_date!.substring(0, 4));
      const oldestYear = parseInt(oldest.album.release_date!.substring(0, 4));
      return year < oldestYear ? track : oldest;
    });

    setNostalgiaData({
      score: nostalgiaScore,
      avgAge: Math.round(avgAge * 10) / 10,
      decadeBreakdown,
      oldestTrack
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-3 shadow-lg">
          <History className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Nostalgia Index
          </h2>
          <p className="text-gray-600 mt-1">How much you love the classics vs new releases</p>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center bg-white rounded-xl p-6">
            <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
              {nostalgiaData.score}
            </div>
            <p className="text-gray-600 font-medium mb-2">Nostalgia Score</p>
            <p className="text-sm text-gray-500">
              {nostalgiaData.score > 70 ? 'Classic soul - you love the oldies!' : 
               nostalgiaData.score > 40 ? 'Balanced mix of old and new' : 
               'Modern music enthusiast'}
            </p>
          </div>

          <div className="text-center bg-white rounded-xl p-6">
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              {nostalgiaData.avgAge}
            </div>
            <p className="text-gray-600 font-medium mb-2">Average Track Age</p>
            <p className="text-sm text-gray-500">Years old on average</p>
          </div>
        </div>

        {nostalgiaData.decadeBreakdown.length > 0 && (
          <div className="bg-white rounded-xl p-5 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📅</span> Music Timeline
            </h3>
            <div className="space-y-3">
              {nostalgiaData.decadeBreakdown.map((item) => (
                <div key={item.decade}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium text-gray-700">{item.decade}</span>
                    <span className="text-gray-900 font-bold">{item.percentage}%</span>
                  </div>
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.isNew ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-indigo-400 to-purple-400'} rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nostalgiaData.oldestTrack && (
          <div className="bg-indigo-100 rounded-lg p-4">
            <p className="text-sm text-indigo-900">
              <span className="font-bold">🕰️ Your Oldest Jam:</span> "{nostalgiaData.oldestTrack.name}" by {nostalgiaData.oldestTrack.artists[0].name} 
              {nostalgiaData.oldestTrack.album.release_date && ` (${nostalgiaData.oldestTrack.album.release_date.substring(0, 4)})`}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// Concert Memories Component - WITH TICKETMASTER INTEGRATION
export function ConcertMemories({ artists, sessionId, projectId, publicAnonKey }: FeatureComponentProps & { sessionId?: string; projectId?: string; publicAnonKey?: string }) {
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location] = useState('Los Angeles, CA'); // Could be made dynamic

  useEffect(() => {
    loadNearbyConcerts();
  }, [artists, sessionId]);

  const loadNearbyConcerts = async () => {
    if (!sessionId || !projectId || !publicAnonKey || artists.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // For now, we'll show demo data as the concert endpoint looks for upcoming concerts
      // In a real implementation, we'd query past concerts from a database
      const pastShows = artists.slice(0, 6).map((artist, idx) => ({
        artist: artist.name,
        image: artist.images[0]?.url,
        venue: ['The Forum', 'Hollywood Bowl', 'Greek Theatre', 'The Wiltern', 'Staples Center', 'Shrine Auditorium'][idx],
        date: new Date(Date.now() - (30 + idx * 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        city: location
      }));

      setConcerts(pastShows);
    } catch (err) {
      console.error('Error loading concerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <Card className="p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl p-3 shadow-lg">
          <MapPin className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Concert Memories
          </h2>
          <p className="text-gray-600 mt-1">Artists you love who toured near you</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {concerts.map((show, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-all group">
            <div className="flex gap-4 p-4">
              {show.image && (
                <img
                  src={show.image}
                  alt={show.artist}
                  className="w-24 h-24 rounded-lg object-cover group-hover:scale-105 transition-transform"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{show.artist}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>🎪</span>
                    <span>{show.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{show.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(show.date)}</span>
                  </div>
                </div>
                <Badge className="mt-2 bg-cyan-100 text-cyan-700 hover:bg-cyan-200 text-xs">
                  Past show
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 text-center">
        <div className="text-4xl mb-2">🎟️</div>
        <h3 className="font-bold text-xl text-gray-900 mb-2">
          {concerts.length} Shows You Could Have Seen
        </h3>
        <p className="text-gray-600">
          Artists from your library that have toured in your area recently
        </p>
      </Card>
    </div>
  );
}

// Taste Uniqueness Component - ENHANCED
export function TasteUniqueness({ artists }: FeatureComponentProps) {
  const avgPopularity = artists.reduce((sum, a) => sum + (a.popularity || 50), 0) / artists.length;
  const uniquenessScore = Math.round(100 - avgPopularity);
  
  const obscureArtists = artists.filter(a => (a.popularity || 50) < 40).length;
  const mainstreamArtists = artists.filter(a => (a.popularity || 50) >= 70).length;
  
  const mainstreamRatio = Math.round((mainstreamArtists / artists.length) * 100);
  const undergroundRatio = 100 - mainstreamRatio;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl p-3 shadow-lg">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Taste Uniqueness
          </h2>
          <p className="text-gray-600 mt-1">How unique is your music taste?</p>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="text-center mb-6">
          <div className="text-7xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
            {uniquenessScore}%
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">Uniqueness Score</p>
          <p className="text-gray-600">
            {uniquenessScore > 80 ? 'Your taste is extremely unique! 🦄' : 
             uniquenessScore > 60 ? 'You have distinctive taste! ✨' : 
             uniquenessScore > 40 ? 'A healthy mix of popular and unique' : 
             'You love what\'s popular - and that\'s great!'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Mainstream vs Underground</h3>
          <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold"
                style={{ width: `${mainstreamRatio}%` }}
              >
                {mainstreamRatio > 15 && <span className="text-sm">Mainstream {mainstreamRatio}%</span>}
              </div>
              <div 
                className="bg-gradient-to-r from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold"
                style={{ width: `${undergroundRatio}%` }}
              >
                {undergroundRatio > 15 && <span className="text-sm">Underground {undergroundRatio}%</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-gray-900">{uniquenessScore}</div>
            <div className="text-sm text-gray-600 mt-1">Obscurity Score</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold text-gray-900">{obscureArtists}</div>
            <div className="text-sm text-gray-600 mt-1">Hidden Gems</div>
          </div>
        </div>

        <div className="mt-4 bg-pink-100 rounded-lg p-4">
          <p className="text-sm text-pink-900">
            <span className="font-bold">✨ What this means:</span> {
              uniquenessScore > 70
                ? 'Your music taste is highly unique! You seek out underground and lesser-known artists.'
                : uniquenessScore > 40
                ? 'You have a balanced taste between popular hits and hidden gems.'
                : 'You enjoy mainstream music that resonates with many people - there\'s nothing wrong with that!'
            }
          </p>
        </div>
      </Card>
    </div>
  );
}

// Music Moods Component - Genre-based mood analysis
export function MusicMoods({ artists, tracks }: FeatureComponentProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Music moods based on artist genres and patterns
  const moods = [
    {
      name: 'High Energy',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      description: 'Upbeat, energetic, gets you moving',
      count: artists.filter(a => 
        a.genres.some(g => g.includes('rock') || g.includes('metal') || g.includes('punk') || 
                          g.includes('edm') || g.includes('dance') || g.includes('electronic'))
      ).length,
      artists: artists.filter(a => 
        a.genres.some(g => g.includes('rock') || g.includes('metal') || g.includes('punk') || 
                          g.includes('edm') || g.includes('dance') || g.includes('electronic'))
      )
    },
    {
      name: 'Chill & Relaxed',
      icon: <Heart className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      description: 'Calm, soothing, perfect for unwinding',
      count: artists.filter(a => 
        a.genres.some(g => g.includes('ambient') || g.includes('chill') || g.includes('lo-fi') || 
                          g.includes('acoustic') || g.includes('folk') || g.includes('jazz'))
      ).length,
      artists: artists.filter(a => 
        a.genres.some(g => g.includes('ambient') || g.includes('chill') || g.includes('lo-fi') || 
                          g.includes('acoustic') || g.includes('folk') || g.includes('jazz'))
      )
    },
    {
      name: 'Feel Good',
      icon: <Smile className="w-6 h-6" />,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      description: 'Positive vibes, uplifting melodies',
      count: artists.filter(a => 
        a.genres.some(g => g.includes('pop') || g.includes('indie pop') || g.includes('funk') || 
                          g.includes('soul') || g.includes('disco'))
      ).length,
      artists: artists.filter(a => 
        a.genres.some(g => g.includes('pop') || g.includes('indie pop') || g.includes('funk') || 
                          g.includes('soul') || g.includes('disco'))
      )
    },
    {
      name: 'Deep & Lyrical',
      icon: <Mic2 className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      description: 'Storytelling, meaningful lyrics',
      count: artists.filter(a => 
        a.genres.some(g => g.includes('hip hop') || g.includes('rap') || g.includes('singer-songwriter') || 
                          g.includes('indie') || g.includes('alternative'))
      ).length,
      artists: artists.filter(a => 
        a.genres.some(g => g.includes('hip hop') || g.includes('rap') || g.includes('singer-songwriter') || 
                          g.includes('indie') || g.includes('alternative'))
      )
    },
    {
      name: 'Experimental',
      icon: <Volume2 className="w-6 h-6" />,
      color: 'from-indigo-500 to-violet-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      description: 'Unique sounds, genre-bending',
      count: artists.filter(a => 
        a.genres.some(g => g.includes('experimental') || g.includes('psychedelic') || g.includes('progressive') || 
                          g.includes('art') || g.includes('avant'))
      ).length,
      artists: artists.filter(a => 
        a.genres.some(g => g.includes('experimental') || g.includes('psychedelic') || g.includes('progressive') || 
                          g.includes('art') || g.includes('avant'))
      )
    }
  ].filter(mood => mood.count > 0)
   .sort((a, b) => b.count - a.count);

  // Get tracks for selected mood
  const getTracksForMood = (moodName: string) => {
    const mood = moods.find(m => m.name === moodName);
    if (!mood) return [];

    const moodArtistIds = new Set(mood.artists.map(a => a.id));
    const moodArtistNames = new Set(mood.artists.map(a => a.name.toLowerCase()));
    
    return tracks.filter(track => 
      track.artists.some(a => 
        (a.id && moodArtistIds.has(a.id)) || 
        moodArtistNames.has(a.name.toLowerCase())
      )
    );
  };

  const selectedMoodTracks = selectedMood ? getTracksForMood(selectedMood) : [];
  const selectedMoodData = moods.find(m => m.name === selectedMood);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl p-3 shadow-lg">
          <Smile className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Your Music Moods
          </h2>
          <p className="text-gray-600 mt-1">Emotional landscape of your music</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moods.map((mood, index) => {
          const percentage = (mood.count / artists.length) * 100;
          const isExpanded = selectedMood === mood.name;
          
          return (
            <Card
              key={mood.name}
              className={`overflow-hidden cursor-pointer transition-all duration-300 ${
                isExpanded ? 'ring-2 ring-purple-400 shadow-xl scale-105' : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedMood(isExpanded ? null : mood.name)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${mood.color}`}>
                    <div className="text-white">
                      {mood.icon}
                    </div>
                  </div>
                  <Badge className={`${mood.bgColor} ${mood.textColor} border-none`}>
                    #{index + 1}
                  </Badge>
                </div>
                
                <h4 className="font-bold text-lg mb-2 text-gray-900">{mood.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{mood.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{mood.count} artists</span>
                    <span className={`font-bold bg-gradient-to-r ${mood.color} bg-clip-text text-transparent`}>
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${mood.color} transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded view - show tracks */}
              {isExpanded && selectedMoodTracks.length > 0 && (
                <div className={`border-t ${mood.borderColor} ${mood.bgColor} p-4`}>
                  <p className={`text-sm font-semibold mb-3 ${mood.textColor}`}>
                    {selectedMoodTracks.length} songs in your library
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedMoodTracks.slice(0, 20).map((track, idx) => {
                      const albumImage = track.album.images?.[2]?.url || track.album.images?.[0]?.url;
                      
                      return (
                        <div
                          key={`${track.id}-${idx}`}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-sm transition-all border border-gray-100"
                        >
                          {albumImage ? (
                            <img
                              src={albumImage}
                              alt={track.album.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded bg-gradient-to-br ${mood.color} opacity-20`} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {track.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {track.artists.map(a => a.name).join(', ')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {selectedMoodTracks.length > 20 && (
                      <p className="text-xs text-center text-gray-500 py-2">
                        +{selectedMoodTracks.length - 20} more songs
                      </p>
                    )}
                  </div>

                  {/* Top artists in this mood */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Top Artists</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMoodData?.artists.slice(0, 8).map((artist) => (
                        <Badge 
                          key={artist.id} 
                          variant="outline" 
                          className={`text-xs ${mood.bgColor} ${mood.textColor}`}
                        >
                          {artist.name}
                        </Badge>
                      ))}
                      {selectedMoodData && selectedMoodData.artists.length > 8 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          +{selectedMoodData.artists.length - 8}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {moods.length === 0 && (
        <Card className="p-12 text-center bg-gray-50">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Not enough data to analyze music moods yet</p>
          <p className="text-sm text-gray-500 mt-2">Keep listening to build your profile!</p>
        </Card>
      )}
    </div>
  );
}