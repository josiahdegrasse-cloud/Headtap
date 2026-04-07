import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Sparkles, 
  Calendar, 
  Award, 
  Activity,
  TrendingUp,
  Zap,
  Heart,
  Music,
  Radio
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
    release_date?: string;
  };
}

interface Artist {
  id: string;
  name: string;
  popularity?: number;
  genres: string[];
}

interface AudioFeatures {
  id: string;
  valence: number; // happiness 0-1
  energy: number; // 0-1
  danceability: number; // 0-1
  acousticness: number; // 0-1
  tempo: number; // BPM
  instrumentalness: number;
  speechiness: number;
}

interface MusicInsightsProps {
  tracks: Track[];
  artists: Artist[];
  sessionId?: string | null;
  projectId?: string;
  publicAnonKey?: string;
  mockAudioFeatures?: AudioFeatures[]; // For demo mode
}

export function MusicInsights({ tracks, artists, sessionId, projectId, publicAnonKey, mockAudioFeatures }: MusicInsightsProps) {
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch audio features for tracks
  useEffect(() => {
    const fetchAudioFeatures = async () => {
      if (!sessionId || !projectId || !publicAnonKey || tracks.length === 0) return;

      setLoading(true);
      try {
        // Batch tracks in groups of 100 (Spotify API limit)
        const batchSize = 100;
        const allFeatures: AudioFeatures[] = [];

        for (let i = 0; i < tracks.length; i += batchSize) {
          const batch = tracks.slice(i, i + batchSize);
          const trackIds = batch.map(t => t.id).join(',');

          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5/spotify/audio-features?session=${sessionId}&track_ids=${trackIds}`,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.audio_features) {
              allFeatures.push(...data.audio_features.filter((f: AudioFeatures | null) => f !== null));
            }
          }
        }

        setAudioFeatures(allFeatures);
      } catch (error) {
        console.error('Error fetching audio features:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mockAudioFeatures) {
      setAudioFeatures(mockAudioFeatures);
    } else {
      fetchAudioFeatures();
    }
  }, [tracks, sessionId, projectId, publicAnonKey, mockAudioFeatures]);

  // Calculate obscurity score
  const calculateObscurityScore = () => {
    if (artists.length === 0) return 0;
    const avgPopularity = artists.reduce((sum, a) => sum + (a.popularity || 0), 0) / artists.length;
    // Global average is around 60, so we calculate how much more obscure
    const globalAverage = 60;
    const obscurityScore = Math.max(0, Math.min(100, 100 - avgPopularity));
    const percentMoreObscure = Math.round(((globalAverage - avgPopularity) / globalAverage) * 100);
    
    return { obscurityScore: Math.round(obscurityScore), percentMoreObscure, avgPopularity: Math.round(avgPopularity) };
  };

  // Calculate mood/energy breakdown
  const calculateMoodEnergy = () => {
    if (audioFeatures.length === 0) return null;

    const avgValence = audioFeatures.reduce((sum, f) => sum + f.valence, 0) / audioFeatures.length;
    const avgEnergy = audioFeatures.reduce((sum, f) => sum + f.energy, 0) / audioFeatures.length;
    const avgDanceability = audioFeatures.reduce((sum, f) => sum + f.danceability, 0) / audioFeatures.length;
    const avgAcousticness = audioFeatures.reduce((sum, f) => sum + f.acousticness, 0) / audioFeatures.length;

    // Categorize mood
    let moodLabel = '';
    let moodEmoji = '';
    let moodColor = '';
    
    if (avgValence > 0.7) {
      moodLabel = 'Euphoric';
      moodEmoji = '😁';
      moodColor = 'from-yellow-400 to-orange-400';
    } else if (avgValence > 0.5) {
      moodLabel = 'Upbeat';
      moodEmoji = '😊';
      moodColor = 'from-green-400 to-emerald-400';
    } else if (avgValence > 0.3) {
      moodLabel = 'Mellow';
      moodEmoji = '😌';
      moodColor = 'from-blue-400 to-cyan-400';
    } else {
      moodLabel = 'Introspective';
      moodEmoji = '😔';
      moodColor = 'from-indigo-400 to-purple-400';
    }

    // Energy level
    let energyLabel = '';
    if (avgEnergy > 0.7) energyLabel = 'High octane';
    else if (avgEnergy > 0.5) energyLabel = 'Energetic';
    else if (avgEnergy > 0.3) energyLabel = 'Moderate';
    else energyLabel = 'Calm';

    return {
      valence: Math.round(avgValence * 100),
      energy: Math.round(avgEnergy * 100),
      danceability: Math.round(avgDanceability * 100),
      acousticness: Math.round(avgAcousticness * 100),
      moodLabel,
      moodEmoji,
      moodColor,
      energyLabel
    };
  };

  // Calculate decade breakdown
  const calculateDecadeBreakdown = () => {
    const currentYear = new Date().getFullYear();
    const decades: Record<string, number> = {};
    const validTracks = tracks.filter(t => t.album.release_date);

    validTracks.forEach(track => {
      const year = parseInt(track.album.release_date!.substring(0, 4));
      if (year > 1900 && year <= currentYear) {
        const decade = Math.floor(year / 10) * 10;
        const decadeLabel = `${decade}s`;
        decades[decadeLabel] = (decades[decadeLabel] || 0) + 1;
      }
    });

    const total = validTracks.length;
    const decadeData = Object.entries(decades)
      .map(([decade, count]) => ({
        decade,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => {
        // Sort by decade, newest first
        return parseInt(b.decade) - parseInt(a.decade);
      });

    // Find dominant decade
    const topDecade = decadeData.length > 0 ? decadeData.reduce((max, d) => d.count > max.count ? d : max) : null;

    return { decadeData, topDecade, total };
  };

  // Calculate BPM stats
  const calculateBPMStats = () => {
    if (audioFeatures.length === 0) return null;

    const tempos = audioFeatures.map(f => f.tempo);
    const avgTempo = Math.round(tempos.reduce((sum, t) => sum + t, 0) / tempos.length);
    
    // Categorize by workout intensity
    let category = '';
    let categoryEmoji = '';
    let categoryColor = '';
    
    if (avgTempo > 160) {
      category = 'Cardio Beast';
      categoryEmoji = '🏃‍♂️';
      categoryColor = 'from-red-500 to-orange-500';
    } else if (avgTempo > 140) {
      category = 'Running Pace';
      categoryEmoji = '🏃';
      categoryColor = 'from-orange-500 to-yellow-500';
    } else if (avgTempo > 120) {
      category = 'Workout Ready';
      categoryEmoji = '💪';
      categoryColor = 'from-green-500 to-emerald-500';
    } else if (avgTempo > 100) {
      category = 'Chill Groove';
      categoryEmoji = '🚶';
      categoryColor = 'from-blue-500 to-cyan-500';
    } else {
      category = 'Meditation Mode';
      categoryEmoji = '🧘';
      categoryColor = 'from-purple-500 to-indigo-500';
    }

    return { avgTempo, category, categoryEmoji, categoryColor };
  };

  const obscurity = calculateObscurityScore();
  const mood = calculateMoodEnergy();
  const decades = calculateDecadeBreakdown();
  const bpm = calculateBPMStats();

  if (loading && audioFeatures.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-green-600 animate-pulse" />
          <h3 className="text-lg font-bold">Analyzing Your Music...</h3>
        </div>
        <div className="space-y-2">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* BPM Analysis */}
      {bpm && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-bold">BPM & Tempo Analysis</h3>
          </div>

          <div className={`bg-gradient-to-br ${bpm.categoryColor} text-white rounded-xl p-5 mb-4`}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{bpm.categoryEmoji}</span>
              <div>
                <div className="text-2xl font-bold">{bpm.category}</div>
                <div className="text-white/90">
                  Average tempo: <span className="font-bold">{bpm.avgTempo} BPM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{bpm.avgTempo}</div>
              <div className="text-xs text-gray-600 mt-1">Average BPM</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-gray-900">{bpm.category}</div>
              <div className="text-xs text-gray-600 mt-1">Workout Category</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-700">
                {bpm.avgTempo > 140 ? (
                  <>Perfect for <span className="font-bold">running</span> & cardio!</>
                ) : bpm.avgTempo > 120 ? (
                  <>Great for <span className="font-bold">workouts</span> & gym sessions</>
                ) : bpm.avgTempo > 100 ? (
                  <>Ideal for <span className="font-bold">walking</span> & light exercise</>
                ) : (
                  <>Best for <span className="font-bold">yoga</span> & meditation</>
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-100">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">💡 Tip:</span> Your music averages{' '}
              <span className="font-bold">{bpm.avgTempo} BPM</span>
              {bpm.avgTempo >= 140 && bpm.avgTempo <= 160 && (
                <span> - the perfect range for running playlists!</span>
              )}
              {bpm.avgTempo > 160 && (
                <span> - you're built for high-intensity training!</span>
              )}
              {bpm.avgTempo < 100 && (
                <span> - perfect for relaxation and focus.</span>
              )}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}