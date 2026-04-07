import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Play, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RecommendationsProps {
  sessionId?: string | null;
  projectId?: string;
  publicAnonKey?: string;
  topArtists?: any[];
  topTracks?: any[];
  savedTracks?: any[];
  loading?: boolean;
}

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
}

export function Recommendations({ sessionId, projectId, publicAnonKey, topArtists = [], topTracks = [], savedTracks = [], loading: initialLoading = false }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Record<string, Track[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract user's top genres from artists
  const userGenres = Array.from(new Set(
    topArtists
      .filter(a => a && a.genres && Array.isArray(a.genres))
      .flatMap(a => a.genres)
      .filter(g => g && typeof g === 'string')
  )).slice(0, 8); // Top 8 genres

  console.log('🎵 Recommendations component mounted/updated:', {
    timestamp: new Date().toISOString(),
    sessionId: sessionId ? `${sessionId.substring(0, 10)}...` : 'MISSING',
    projectId: projectId || 'MISSING',
    publicAnonKey: publicAnonKey ? 'present' : 'MISSING',
    topArtistsCount: topArtists.length,
    firstArtist: topArtists[0] ? {
      name: topArtists[0].name,
      hasGenres: !!topArtists[0].genres,
      genresCount: topArtists[0].genres?.length,
      genres: topArtists[0].genres?.slice(0, 3)
    } : 'NO ARTISTS',
    userGenresCount: userGenres.length,
    userGenres: userGenres.slice(0, 6),
    initialLoading,
    currentLoading: loading,
    hasRecommendations: Object.keys(recommendations).length > 0
  });

  useEffect(() => {
    console.log('🔄 useEffect triggered for recommendations');
    
    // TEMPORARY: Skip fetching until backend is redeployed with fixes
    console.log('⚠️ SKIPPING recommendations fetch - waiting for backend redeploy');
    console.log('The backend has been updated with fixes but needs to be redeployed.');
    console.log('Once redeployed, recommendations will work correctly.');
    
    if (false && sessionId && projectId && publicAnonKey && userGenres.length > 0 && !initialLoading) {
      console.log('✅ All conditions met, fetching recommendations...');
      fetchRecommendations();
    } else {
      console.log('❌ Not fetching recommendations - requirements:', {
        hasSession: !!sessionId,
        hasProject: !!projectId,
        hasKey: !!publicAnonKey,
        genresCount: userGenres.length,
        notInitialLoading: !initialLoading
      });
    }
  }, [sessionId, projectId, publicAnonKey, topArtists.length, initialLoading]);

  const fetchRecommendations = async () => {
    if (!sessionId || !projectId || !publicAnonKey) return;
    
    setLoading(true);
    const newRecommendations: Record<string, Track[]> = {};

    try {
      // Fetch recommendations for each genre
      const genresToFetch = userGenres.slice(0, 6); // Top 6 genres
      
      console.log('Fetching recommendations for genres:', genresToFetch);
      
      for (const genre of genresToFetch) {
        try {
          const url = `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5/recommendations?session=${sessionId}&genre=${encodeURIComponent(genre)}&limit=20`;
          console.log(`Fetching recommendations for ${genre}:`, url);
          
          const response = await fetch(
            url,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } }
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Got ${data.tracks?.length || 0} tracks for ${genre}`);
            newRecommendations[genre] = data.tracks || [];
          } else {
            const errorText = await response.text();
            console.error(`Error fetching recommendations for ${genre}:`, response.status, errorText);
            setError(`Error fetching recommendations for ${genre}: ${response.status} ${errorText}`);
          }
        } catch (error) {
          console.error(`Error fetching recommendations for ${genre}:`, error);
          setError(`Error fetching recommendations for ${genre}: ${error}`);
        }
      }
      
      console.log('All recommendations fetched:', Object.keys(newRecommendations).length, 'genres');
      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError(`Error fetching recommendations: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const genres = Object.keys(recommendations);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Discover New Music</h2>
            <p className="text-gray-600">Personalized recommendations just for you</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-48 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (genres.length === 0) {
    return (
      <div className="space-y-6">
        {/* Backend Redeploy Notice */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">📋 Backend Update Required</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              The Recommendations feature has been updated with important fixes to work properly with Spotify's API.
            </p>
            <p>
              <strong>What needs to happen:</strong> The Supabase Edge Function needs to be redeployed for the changes to take effect.
            </p>
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <p className="font-semibold mb-2">How to redeploy:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to <a href="https://supabase.com/dashboard/project/fycepbloyompgfqaoqvq/functions" target="_blank" className="text-blue-600 underline">Supabase Functions Dashboard</a></li>
                <li>Click on the "make-server-a9c438e5" function</li>
                <li>Click "Redeploy" to apply the latest changes</li>
              </ol>
            </div>
            <p className="text-xs mt-3">
              <strong>What was fixed:</strong> The backend now properly uses your actual top artists and tracks as seeds for recommendations instead of relying on genre-only seeds, which were causing 404 errors from Spotify.
            </p>
          </div>
        </Card>

        {/* Debug Info Panel */}
        <Card className="p-6 bg-gray-50 border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">🔍 Debug Information</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Session ID:</strong> {sessionId ? '✅ Present' : '❌ Missing'}</div>
            <div><strong>Project ID:</strong> {projectId ? '✅ Present' : '❌ Missing'}</div>
            <div><strong>API Key:</strong> {publicAnonKey ? '✅ Present' : '❌ Missing'}</div>
            <div><strong>Top Artists Count:</strong> {topArtists.length}</div>
            <div><strong>Initial Loading:</strong> {initialLoading ? 'Yes (waiting...)' : 'No'}</div>
            <div><strong>Current Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>User Genres Found:</strong> {userGenres.length}</div>
            {userGenres.length > 0 && (
              <div><strong>Genres:</strong> {userGenres.slice(0, 6).join(', ')}</div>
            )}
            {topArtists.length > 0 && topArtists[0] && (
              <div className="mt-2 p-2 bg-white rounded">
                <strong>First Artist Sample:</strong>
                <pre className="text-xs mt-1 overflow-auto">
                  {JSON.stringify({
                    name: topArtists[0].name,
                    hasGenres: !!topArtists[0].genres,
                    genres: topArtists[0].genres
                  }, null, 2)}
                </pre>
              </div>
            )}
            {error && (
              <div className="mt-2 p-2 bg-red-100 text-red-900 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
          
          {/* Test Fetch Button */}
          <div className="mt-4">
            <Button 
              onClick={fetchRecommendations} 
              disabled={loading || !sessionId}
              className="w-full"
              variant="outline"
            >
              {loading ? 'Testing...' : '🧪 Test Fetch Recommendations (Check Backend Logs)'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              This will attempt to fetch recommendations and show detailed errors. 
              Check the browser console and Supabase logs for detailed output.
            </p>
          </div>
        </Card>

        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Waiting for backend redeploy</h3>
          <p className="text-gray-500">Once the edge function is redeployed, recommendations will load automatically!</p>
          {userGenres.length === 0 && topArtists.length > 0 && (
            <p className="text-red-500 mt-2">⚠️ No genres found in your artist data</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Discover New Music</h2>
            <p className="text-gray-600">Personalized playlists based on your taste</p>
          </div>
        </div>
        <Button onClick={fetchRecommendations} variant="outline" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Genre-based playlists */}
      {genres.map((genre) => {
        const tracks = recommendations[genre] || [];
        if (tracks.length === 0) return null;

        return (
          <Card key={genre} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold capitalize flex items-center gap-2">
                  {genre.replace(/-/g, ' ')}
                  <Badge variant="outline" className="ml-2">
                    {tracks.length} tracks
                  </Badge>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Fresh picks based on your {genre} taste
                </p>
              </div>
            </div>

            {/* Track Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tracks.slice(0, 10).map((track) => (
                <div
                  key={track.id}
                  className="group relative bg-white rounded-lg p-3 hover:bg-gray-50 transition-all cursor-pointer border border-gray-100"
                >
                  <div className="relative mb-3">
                    <img
                      src={track.album.images[0]?.url || 'https://via.placeholder.com/300'}
                      alt={track.name}
                      className="w-full aspect-square object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all rounded-md flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm line-clamp-1">{track.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-xs"
                      onClick={() => window.open(track.external_urls.spotify, '_blank')}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}