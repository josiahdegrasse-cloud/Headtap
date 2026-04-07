import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Zap, Heart, Music, Smile, Mic2, Volume2, Clock, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity?: number;
  images?: { url: string }[];
}

interface Track {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    name: string;
    release_date: string;
    images?: { url: string }[];
  };
  added_at?: string;
}

interface AudioFeatures {
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  tempo: number;
  loudness: number;
}

interface SoundProfileProps {
  artists: Artist[];
  savedTracks: Track[];
  audioFeatures?: AudioFeatures;
}

export function SoundProfile({ artists, savedTracks, audioFeatures }: SoundProfileProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Calculate artist diversity score
  const genreSet = new Set(artists.flatMap(a => a.genres));
  const diversityScore = Math.min(100, (genreSet.size / artists.length) * 100);

  // Calculate popularity distribution
  const avgPopularity = artists.reduce((sum, a) => sum + (a.popularity || 50), 0) / artists.length;
  const popularityCategory = avgPopularity > 70 ? 'Mainstream' : avgPopularity > 40 ? 'Balanced' : 'Underground';

  // Group artists by popularity ranges
  const undergroundArtists = artists.filter(a => (a.popularity || 0) < 40);
  const risingArtists = artists.filter(a => (a.popularity || 0) >= 40 && (a.popularity || 0) < 70);
  const mainstreamArtists = artists.filter(a => (a.popularity || 0) >= 70);

  // Calculate era distribution
  const decades = savedTracks.reduce((acc, track) => {
    if (track.album.release_date) {
      const year = parseInt(track.album.release_date.substring(0, 4));
      const decade = Math.floor(year / 10) * 10;
      acc[decade] = (acc[decade] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const dominantDecade = Object.entries(decades).sort(([, a], [, b]) => b - a)[0];
  const eraBalance = Object.keys(decades).length;

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
    return savedTracks.filter(track => 
      track.artists.some(a => moodArtistIds.has(a.id))
    ).slice(0, 50);
  };

  const selectedMoodTracks = selectedMood ? getTracksForMood(selectedMood) : [];
  const selectedMoodData = moods.find(m => m.name === selectedMood);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-3 shadow-lg">
          <Music className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Your Sound DNA
          </h2>
          <p className="text-gray-600 mt-1">Detailed breakdown of your musical universe</p>
        </div>
      </div>

      {/* Listening Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Popularity Distribution */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl p-2.5">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Listener Type</p>
              <p className="text-2xl font-bold text-gray-900">{popularityCategory}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Underground</span>
              <span className="font-bold text-orange-600">{undergroundArtists.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rising Stars</span>
              <span className="font-bold text-orange-600">{risingArtists.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mainstream</span>
              <span className="font-bold text-amber-600">{mainstreamArtists.length}</span>
            </div>
          </div>
        </Card>

        {/* Genre Diversity */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl p-2.5">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Diversity Score</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(diversityScore)}%</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-600 to-amber-600 transition-all duration-700"
                style={{ width: `${diversityScore}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {genreSet.size} unique genres across {artists.length} artists
            </p>
          </div>
        </Card>

        {/* Era Balance */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl p-2.5">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Era Preference</p>
              <p className="text-2xl font-bold text-gray-900">
                {dominantDecade ? `${dominantDecade[0]}s` : 'Mixed'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Spanning <span className="font-bold text-orange-700">{eraBalance} decades</span>
            </p>
            <p className="text-xs text-gray-500">
              {eraBalance > 5 ? 'Time traveler vibes' : eraBalance > 3 ? 'Cross-generational' : 'Era specialist'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}