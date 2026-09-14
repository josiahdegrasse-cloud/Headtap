import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Music2, Heart, Users, TrendingUp, Sparkles, Play, X, Award, Radio, Headphones } from 'lucide-react';
import { mockAlltimeArtists, mockAlltimeTracks } from '../utils/mockData';
import { libraryArtistCount, genreSummary } from '../utils/musicSummary';
import { toast } from 'sonner';
import { SoundProfile } from './SoundProfile';
import { ConcertImage } from './ConcertImage';

type Artist = {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  popularity: number;
};

type Track = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
    release_date: string;
  };
};

interface MusicProfileProps {
  topArtists: Artist[];
  topTracks: Track[];
  savedTracks: Track[];
  loading: boolean;
  sessionId?: string | null;
  projectId?: string;
  publicAnonKey?: string;
  demoMode?: boolean;
  libraryArtists?: any[];
  libraryProgress?: string;
  libraryLoading?: boolean;
  libraryError?: string | null;
}

export function MusicProfile({ topArtists, topTracks, savedTracks, loading, sessionId, projectId, publicAnonKey, demoMode, libraryLoading = false, libraryError, libraryArtists = [], libraryProgress }: MusicProfileProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [artistTimeRange, setArtistTimeRange] = useState<'recent' | 'alltime'>('recent');
  const [songTimeRange, setSongTimeRange] = useState<'recent' | 'alltime'>('recent');
  const [alltimeArtists, setAlltimeArtists] = useState<Artist[]>([]);
  const [alltimeTracks, setAlltimeTracks] = useState<Track[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const totalUniqueArtists = libraryArtistCount(savedTracks);
  const loadingTotalArtists = libraryLoading;
  const breakdown = genreSummary(topArtists);

  // Fetch all-time data when toggle is switched
  const fetchAlltimeArtists = async () => {
    // In demo mode, use mock data
    if (demoMode) {
      if (alltimeArtists.length > 0) return; // Already set
      setAlltimeArtists(mockAlltimeArtists);
      return;
    }
    
    if (!sessionId || !projectId || !publicAnonKey) return;
    if (alltimeArtists.length > 0) return; // Already fetched
    
    setLoadingArtists(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5/spotify/top-artists?session=${sessionId}&time_range=long_term`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` }, signal: AbortSignal.timeout(30000) }
      );
      
      if (!response.ok) throw new Error(`Spotify request failed (${response.status})`);
      if (response.ok) {
        const data = await response.json();
        setAlltimeArtists(data.items || []);
      }
    } catch (error) {
      setArtistTimeRange('recent');
      toast.error('Could not load all-time artists. Showing recent music; try again.');
    } finally {
      setLoadingArtists(false);
    }
  };

  const fetchAlltimeTracks = async () => {
    // In demo mode, use mock data
    if (demoMode) {
      if (alltimeTracks.length > 0) return; // Already set
      setAlltimeTracks(mockAlltimeTracks);
      return;
    }
    
    if (!sessionId || !projectId || !publicAnonKey) return;
    if (alltimeTracks.length > 0) return; // Already fetched
    
    setLoadingTracks(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5/spotify/top-tracks?session=${sessionId}&time_range=long_term`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` }, signal: AbortSignal.timeout(30000) }
      );
      
      if (!response.ok) throw new Error(`Spotify request failed (${response.status})`);
      if (response.ok) {
        const data = await response.json();
        setAlltimeTracks(data.items || []);
      }
    } catch (error) {
      setSongTimeRange('recent');
      toast.error('Could not load all-time tracks. Showing recent music; try again.');
    } finally {
      setLoadingTracks(false);
    }
  };

  // Fetch all-time data when toggled
  const handleArtistTimeRangeChange = (range: 'recent' | 'alltime') => {
    if (loadingArtists) return;
    setArtistTimeRange(range);
    if (range === 'alltime') {
      fetchAlltimeArtists();
    }
  };

  const handleSongTimeRangeChange = (range: 'recent' | 'alltime') => {
    if (loadingTracks) return;
    setSongTimeRange(range);
    if (range === 'alltime') {
      fetchAlltimeTracks();
    }
  };

  // Determine which data to display
  const displayArtists = artistTimeRange === 'recent' || loadingArtists ? topArtists : alltimeArtists;
  const displayTracks = songTimeRange === 'recent' || loadingTracks ? topTracks : alltimeTracks;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Extract unique genres from top artists with counts
  const allGenres = topArtists.flatMap((artist) => artist.genres);
  const genreCounts = allGenres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Calculate music characteristics
  const totalArtists = topArtists.length;
  const avgPopularity = topArtists.reduce((sum, a) => sum + (a.popularity || 0), 0) / totalArtists || 0;

  // Calculate obscurity score (inverse of popularity)
  const obscurityScore = 100 - avgPopularity;

  // Filter tracks by selected genre - using ALL saved tracks
  const getFilteredTracks = () => {
    if (!selectedGenre) return [];

    // Find artists with the selected genre
    const genreArtists = topArtists.filter(artist => 
      artist.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase())
    );

    const genreArtistNames = genreArtists.map(a => a.name.toLowerCase());

    // Filter saved tracks (all liked songs) by artists in that genre
    const tracksToFilter = savedTracks.length > 0 ? savedTracks : topTracks;
    const filtered = tracksToFilter.filter(track => {
      const trackArtistNames = track.artists.map(a => a.name.toLowerCase());
      return trackArtistNames.some(name => genreArtistNames.includes(name));
    });

    return filtered;
  };

  const filteredTracks = getFilteredTracks();

  // Calculate Music Personality Type
  const getMusicPersonality = () => {
    const genreCount = Object.keys(genreCounts).length;
    const mainGenres = topGenres.slice(0, 3).map(([g]) => g);
    
    // Hipster score
    const hipsterScore = Math.round(obscurityScore);
    
    // Genre diversity
    const diversity = genreCount > 15 ? 'eclectic' : genreCount > 8 ? 'diverse' : 'focused';
    
    // Determine personality type
    let personality = '';
    let description = '';
    let emoji = '🎵';
    let tagline = '';
    let badges = [];
    
    // Check specific conditions first (high priority)
    if (hipsterScore > 70 && diversity === 'eclectic') {
      personality = 'The Music Archaeologist';
      description = "You dig deep for hidden gems and pride yourself on discovering artists before they're cool.";
      tagline = "\"I knew them before they were famous\"";
      emoji = '🔍';
      badges = ['Trend Setter', 'Deep Diver', 'Curator'];
    } else if (hipsterScore > 60 && mainGenres.some(g => g.includes('indie') || g.includes('alternative'))) {
      personality = 'The Indie Connoisseur';
      description = "Alternative vibes run through your veins. You're all about authenticity and underground sounds.";
      tagline = `"Mainstream? Never heard of it."`;
      emoji = '🎸';
      badges = ['Authentic', 'Underground', 'Alt-Soul'];
    } else if (avgPopularity > 70 && diversity === 'focused') {
      personality = 'The Hit Collector';
      description = "You know what you like and you like what's hot! No shame in loving the mainstream.";
      tagline = '"If it\'s on the charts, it\'s in my playlist"';
      emoji = '⭐';
      badges = ['Chart Chaser', 'Radio Ready', 'Pop Culture'];
    } 
    // Check genre-specific personas BEFORE generic diversity check
    else if (mainGenres.some(g => g.includes('rock') || g.includes('metal'))) {
      personality = 'The Rockstar Soul';
      description = "Guitar-driven anthems and powerful vocals fuel your energy. You live for the riff, the solo, and the raw emotion.";
      tagline = '"Turn it up to 11"';
      emoji = '🎸';
      badges = ['Headbanger', 'Guitar Hero', 'Rebel'];
    } else if (mainGenres.some(g => g.includes('electronic') || g.includes('edm') || g.includes('dance'))) {
      personality = 'The Beat Chaser';
      description = "Electronic beats and synth waves are your happy place. The dance floor is calling and you must go.";
      tagline = '"Life is better at 128 BPM"';
      emoji = '🎧';
      badges = ['Dance Floor', 'Beat Driven', 'Synth Wave'];
    } else if (mainGenres.some(g => g.includes('hip hop') || g.includes('rap') || g.includes('hip-hop'))) {
      personality = 'The Lyric Analyst';
      description = "Bars, beats, and flows. You appreciate the art of wordplay, the culture, and the stories behind the music.";
      tagline = '"Real recognizes real"';
      emoji = '🎤';
      badges = ['Culture Keeper', 'Word Smith', 'Flow Master'];
    } else if (mainGenres.some(g => g.includes('pop'))) {
      personality = 'The Pop Enthusiast';
      description = "Catchy hooks and polished production make your heart sing. You appreciate a perfectly crafted pop song.";
      tagline = '"Life needs a soundtrack, and mine is catchy"';
      emoji = '✨';
      badges = ['Hook Lover', 'Radio Star', 'Melody Master'];
    } else if (mainGenres.some(g => g.includes('jazz') || g.includes('blues') || g.includes('soul'))) {
      personality = 'The Smooth Operator';
      description = "Sophisticated tastes run deep. You appreciate the classics, the craft, and the soul behind every note.";
      tagline = '"Good music never goes out of style"';
      emoji = '🎺';
      badges = ['Timeless', 'Sophisticated', 'Soul Seeker'];
    } else if (mainGenres.some(g => g.includes('country') || g.includes('folk') || g.includes('americana'))) {
      personality = 'The Storyteller';
      description = "You love narratives woven through melody. Every song tells a story, and you're here for every word.";
      tagline = '"Life is a country song"';
      emoji = '🤠';
      badges = ['Authentic', 'Heart & Soul', 'Roots Music'];
    } else if (mainGenres.some(g => g.includes('r&b') || g.includes('rnb'))) {
      personality = 'The Groove Master';
      description = "Smooth vocals and silky production are your weakness. You know good vibes when you hear them.";
      tagline = '"Feeling the rhythm"';
      emoji = '💫';
      badges = ['Smooth', 'Soulful', 'Vibe Curator'];
    } 
    // Generic diversity check comes AFTER specific genre checks
    else if (diversity === 'eclectic') {
      personality = 'The Genre Nomad';
      description = `Your playlist is a wild journey. ${mainGenres[0] ? `From ${mainGenres[0]}` : 'You jump genres'} to ${mainGenres[1] || 'everything else'} without missing a beat. Musical boundaries don't exist in your world.`;
      tagline = '"Why choose one genre when you can have them all?"';
      emoji = '🌍';
      badges = ['Adventurous', 'Open-Minded', 'Unpredictable'];
    } else {
      personality = 'The Music Explorer';
      description = "Your taste is uniquely yours. You follow your ears wherever they lead you, creating a soundtrack that's one-of-a-kind.";
      tagline = '"My playlist, my rules"';
      emoji = '🧭';
      badges = ['Unique', 'Independent', 'Fearless'];
    }
    
    return { personality, description, emoji, hipsterScore, diversity, tagline, badges };
  };

  const musicPersonality = getMusicPersonality();

  // Get top genre details for personality card
  const topGenresList = topGenres.slice(0, 3).map(([genre]) => genre.replace(/-/g, ' '));
  const mostListenedArtist = topArtists[0];
  
  // Calculate Musical Span from saved tracks (or top tracks as fallback)
  const tracksForYears = savedTracks.length > 0 ? savedTracks : topTracks;
  const currentYear = new Date().getFullYear();
  const releaseYears = tracksForYears
        .filter(t => t.album.release_date)
        .map(t => parseInt(t.album.release_date.substring(0, 4)))
        .filter(y => !isNaN(y) && y > 1900 && y <= currentYear); // Filter out invalid years
  const oldestYear = releaseYears.length > 0 ? Math.min(...releaseYears) : 0;
  const newestYear = releaseYears.length > 0 ? Math.max(...releaseYears) : 0;
  const yearSpan = releaseYears.length > 0 ? newestYear - oldestYear : 0;

  // Calculate Decade Distribution from saved tracks (or top tracks as fallback)
  const tracksForDecades = savedTracks.length > 0 ? savedTracks : topTracks;
  const decades = tracksForDecades.reduce((acc, track) => {
    if (track.album.release_date) {
      const year = parseInt(track.album.release_date.substring(0, 4));
      const decade = Math.floor(year / 10) * 10;
      acc[decade] = (acc[decade] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const topDecades = Object.entries(decades)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Group songs by decade for display
  const songsByDecade = topDecades.reduce((acc, [decade]) => {
    const decadeNum = Number(decade);
    acc[decadeNum] = tracksForDecades.filter(track => {
      if (!track.album.release_date) return false;
      const year = parseInt(track.album.release_date.substring(0, 4));
      const trackDecade = Math.floor(year / 10) * 10;
      return trackDecade === decadeNum;
    });
    return acc;
  }, {} as Record<number, Track[]>);


  return (
    <div className="space-y-8">
      {/* Music Personality Card - ENHANCED WITH PERSONALIZATION */}
      <Card className="overflow-hidden relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white border-0 shadow-none gap-0">
        
        <div className="relative p-5 sm:p-6">
          {/* Header Section */}
          <div className="mb-3">
            <Badge className="bg-black/20 text-white border-black/30 mb-3">
              Your Music Personality
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
              {musicPersonality.personality}
            </h2>
            <p className="text-orange-50 text-base max-w-2xl leading-relaxed">
              {musicPersonality.description}
            </p>
            <p className="mt-3 text-base italic text-white border-l-2 border-white/50 pl-3">{musicPersonality.tagline}</p>

          </div>

          {/* Personality Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {musicPersonality.badges.map((badge, idx) => (
              <Badge key={idx} className="bg-black/30 text-white border-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
                {badge}
              </Badge>
            ))}
          </div>

          <div className="pt-3">
          {/* Personalized Details Section */}
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Your Musical DNA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {mostListenedArtist && (
                <div className="flex items-start gap-3">
                  <div className="bg-white/10 rounded-lg p-2">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">Top Artist</p>
                    <p className="font-bold text-base">{mostListenedArtist.name}</p>
                  </div>
                </div>
              )}
              {topGenresList.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="bg-white/10 rounded-lg p-2">
                    <Music2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">Signature Sound</p>
                    <p className="font-bold text-base capitalize">{topGenresList[0]}</p>
                  </div>
                </div>
              )}
              {yearSpan > 0 && (
                <div className="flex items-start gap-3">
                  <div className="bg-white/10 rounded-lg p-2">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">Musical Span</p>
                    <p className="font-bold text-base">{yearSpan} {yearSpan === 1 ? 'year' : 'years'}</p>
                    <p className="text-xs text-white/60">{oldestYear} - {newestYear}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-black/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-amber-200" />
                <span className="text-xs text-white/70">Hipster Score</span>
              </div>
              <div className="text-3xl font-bold">{musicPersonality.hipsterScore}%</div>
              <div className="text-xs text-white/60 mt-1">
                {musicPersonality.hipsterScore > 70 ? 'Underground expert' : 
                 musicPersonality.hipsterScore > 40 ? 'Balanced taste' : 
                 'Mainstream lover'}
              </div>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-black/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-amber-200" />
                <span className="text-xs text-white/70">Genres</span>
              </div>
              <div className="text-3xl font-bold">{Object.keys(genreCounts).length}</div>
              <div className="text-xs text-white/60 mt-1 capitalize">{musicPersonality.diversity} taste</div>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-black/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-amber-200" />
                <span className="text-xs text-white/70">Artists</span>
              </div>
              {loadingTotalArtists ? (
                <div className="animate-pulse">
                  <div className="h-9 bg-white/20 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-white/10 rounded w-12"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{libraryError ? '—' : totalUniqueArtists}</div>
                  <div className="text-xs text-white/60 mt-1">In loaded library</div>
                </>
              )}
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-black/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-amber-200" />
                <span className="text-xs text-white/70">Library</span>
              </div>
              <div className="text-3xl font-bold">{libraryLoading ? '…' : libraryError ? '—' : savedTracks.length}</div>
              <div className="text-xs text-white/60 mt-1">Saved tracks</div>
            </div>
          </div>

          {/* Genre Flavor Text */}
          {topGenresList.length >= 2 && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-sm text-white/90">
                <span className="font-semibold">Your vibe:</span> You're into{' '}
                <span className="font-bold capitalize">{topGenresList[0]}</span>
                {topGenresList[1] && (
                  <>
                    {' '}with a side of{' '}
                    <span className="font-bold capitalize">{topGenresList[1]}</span>
                  </>
                )}
                {topGenresList[2] && (
                  <>
                    {' '}and some{' '}
                    <span className="font-bold capitalize">{topGenresList[2]}</span>
                  </>
                )}
                . {musicPersonality.diversity === 'eclectic' 
                  ? "Your playlist is an adventure!"
                  : musicPersonality.diversity === 'diverse'
                  ? "You keep things interesting!"
                  : "You know what you love!"}
              </p>
            </div>
          )}
          </div>
        </div>
      </Card>

      {/* Recent Favorites Section - DIFFERENT STYLE */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-full p-2">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Top Artists</h2>
          </div>
          
          {/* Time Range Tabs */}
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleArtistTimeRangeChange('recent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                artistTimeRange === 'recent'
                  ? 'bg-white shadow-sm text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recent (6mo)
            </button>
            <button
              disabled={loadingArtists}
              aria-pressed={artistTimeRange === 'alltime'}
              onClick={() => handleArtistTimeRangeChange('alltime')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                artistTimeRange === 'alltime'
                  ? 'bg-white shadow-sm text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {loadingArtists ? 'Loading…' : 'Long term'}
            </button>
          </div>
        </div>
        
        {!loadingArtists && displayArtists.length === 0 && <p className="text-stone-600 py-4">Spotify hasn’t returned ranked artists for this period yet. Try another period after listening to more music.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-busy={loadingArtists}>
          {displayArtists.slice(0, 6).map((artist, index) => (
            <Card key={artist.id} className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 group">
              <div className="relative w-full pb-[100%]">
                <div className="absolute inset-0">
                  <ConcertImage src={artist.images?.[0]?.url} artist={artist.name} eager={index < 2} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute top-2 left-2">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-bold text-white text-sm line-clamp-2 text-center">{artist.name}</p>
                  {artist.genres.length > 0 && (
                    <p className="text-xs text-white/80 text-center mt-1 capitalize line-clamp-1">
                      {artist.genres[0].replace(/-/g, ' ')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Songs Section with Time Range Tabs */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-full p-2">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Top Songs</h2>
          </div>
          
          {/* Time Range Tabs */}
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleSongTimeRangeChange('recent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                songTimeRange === 'recent'
                  ? 'bg-white shadow-sm text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recent (6mo)
            </button>
            <button
              disabled={loadingTracks}
              aria-pressed={songTimeRange === 'alltime'}
              onClick={() => handleSongTimeRangeChange('alltime')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                songTimeRange === 'alltime'
                  ? 'bg-white shadow-sm text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {loadingTracks ? 'Loading…' : 'Long term'}
            </button>
          </div>
        </div>
        
        {!loadingTracks && displayTracks.length === 0 && <p className="text-stone-600 py-4">Spotify hasn’t returned ranked songs for this period yet.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy={loadingTracks}>
          {displayTracks.slice(0, 6).map((track, index) => (
            <Card key={track.id} className="overflow-hidden hover:shadow-xl transition-all hover:scale-102 group">
              <div className="relative h-48">
                <ConcertImage src={track.album?.images?.[0]?.url} artist={track.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute top-3 left-3">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-bold text-white text-base line-clamp-1">{track.name}</p>
                  <p className="text-sm text-white/90 line-clamp-1">
                    {track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>



      {/* Genre Universe Graph - NEW COMPREHENSIVE VISUALIZATION */}
      {topArtists.length > 0 && (
        <SoundProfile artists={topArtists} savedTracks={savedTracks} />
      )}

      {/* Genre-Filtered Tracks Display */}
      {selectedGenre && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-semibold">
                Your <span className="capitalize text-orange-600">{selectedGenre.replace(/-/g, ' ')}</span> Tracks
              </h3>
              {savedTracks.length > 0 && (
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                  {filteredTracks.length} saved songs
                </Badge>
              )}
            </div>
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-orange-50"
              onClick={() => setSelectedGenre(null)}
            >
              Clear ✕
            </Badge>
          </div>

          {filteredTracks.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50">
              <p className="text-gray-500">No saved tracks found in this genre</p>
              <button 
                className="text-orange-600 hover:underline mt-2 text-sm font-medium"
                onClick={() => setSelectedGenre(null)}
              >
                Clear filter
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTracks.map((track, index) => (
                <Card 
                  key={track.id} 
                  className="p-4 flex items-center gap-3 hover:shadow-lg transition-all hover:bg-orange-50/50"
                >
                  <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <img
                    src={track.album.images[0]?.url || 'https://via.placeholder.com/80'}
                    alt={track.name}
                    className="w-14 h-14 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{track.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {track.artists.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}