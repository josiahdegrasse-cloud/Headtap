import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { HTTPException } from "npm:hono/http-exception";
import { timeout } from "npm:hono/timeout";
import * as kv from "./kv_store.tsx";
import * as vibe from "./vibe_scoring.tsx";
import * as appleMusic from "./apple_music.tsx";
import { getAlternativeRecommendations } from "./recommendations_alternative.tsx";

import { distanceMiles, bestEventImage } from "../../../utils/eventDetails.ts";

const app = new Hono();

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';
const TICKETMASTER_API_KEY = Deno.env.get('TICKETMASTER_API_KEY') || '';
const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '';
// Change redirect to go back to the app instead of the callback endpoint
const APP_URL = Deno.env.get('APP_URL') || 'https://headtap.figma.site';
const allowedRedirects = new Set([APP_URL, ...(Deno.env.get('ALLOWED_APP_URLS') || '').split(',').map(s => s.trim()).filter(Boolean)]);
const REDIRECT_URI = APP_URL; // Redirect back to the app, which will handle the code

const WINDOW_DAYS = 90;
const FETCH_TIMEOUT = 25000; // 25 second timeout for individual API calls

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Helper function to refresh Spotify access token
async function refreshSpotifyToken(refreshToken: string): Promise<any> {
  try {
    const response = await fetchWithTimeout('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    }, 10000); // 10 second timeout for token refresh

    if (!response.ok) {
      console.log(`Token refresh failed: ${await response.text()}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.log(`Token refresh exception: ${err}`);
    return null;
  }
}

// Helper function to get valid access token (refreshing if needed)
async function getValidAccessToken(sessionId: string): Promise<{ access_token: string; error?: string } | null> {
  const sessionData = await kv.get(`spotify:session:${sessionId}`);
  
  if (!sessionData) {
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now();
  const expiresAt = sessionData.expires_at || 0;
  
  if (expiresAt > now + (5 * 60 * 1000)) {
    // Token is still valid
    return { access_token: sessionData.access_token };
  }

  // Token expired or about to expire, refresh it
  
  const tokenData = await refreshSpotifyToken(sessionData.refresh_token);
  
  if (!tokenData) {
    return { access_token: '', error: 'Failed to refresh token' };
  }

  // Update session with new token
  await kv.set(`spotify:session:${sessionId}`, {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || sessionData.refresh_token,
    expires_at: Date.now() + (tokenData.expires_in * 1000)
  });

  return { access_token: tokenData.access_token };
}

// Enable logger
// Avoid logging query strings: they contain session credentials.

// Add timeout middleware for all routes (55 seconds - just under the 60s Deno Deploy limit)
app.use('*', timeout(55000, new HTTPException(504, { message: 'Request timeout' })));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Global error handler - must come before routes
app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  // Handle broken pipe and connection errors gracefully
  if (err.message?.includes('broken pipe') || 
      err.message?.includes('connection') ||
      err.message?.includes('EPIPE')) {
    console.log('Client disconnected during request');
    // Don't try to send a response if connection is broken
    return new Response(null, { status: 499 });
  }
  
  console.error('Global error handler caught:', err);
  console.error('Error stack:', err.stack);
  
  // Don't try to send response if already sent or connection broken
  try {
    return c.json({ 
      error: 'Internal server error', 
      message: err.message,
      details: String(err)
    }, 500);
  } catch (responseError) {
    console.error('Failed to send error response:', responseError);
    // Return a minimal response
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Health check endpoint
app.get("/make-server-a9c438e5/health", (c) => {
  return c.json({ status: "ok" });
});

// Debug endpoint to show redirect URI (for setup)
app.get("/make-server-a9c438e5/debug/redirect-uri", (c) => {
  return c.json({ 
    redirect_uri: REDIRECT_URI,
    supabase_url: Deno.env.get('SUPABASE_URL'),
    client_id: SPOTIFY_CLIENT_ID ? `${SPOTIFY_CLIENT_ID.substring(0, 8)}...` : 'NOT SET',
    client_secret_set: !!SPOTIFY_CLIENT_SECRET,
    instructions: "Add this exact redirect_uri to your Spotify Developer Dashboard"
  });
});

// Debug endpoint to test all environment variables
app.get("/make-server-a9c438e5/debug/env-check", (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  
  return c.json({
    status: 'Environment Check',
    supabase_url: {
      set: !!supabaseUrl,
      value: supabaseUrl || 'NOT SET',
    },
    spotify_client_id: {
      set: !!clientId,
      value: clientId ? `${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 4)}` : 'NOT SET',
      length: clientId?.length || 0,
    },
    spotify_client_secret: {
      set: !!clientSecret,
      length: clientSecret?.length || 0,
    },
    redirect_uri: {
      value: REDIRECT_URI,
      valid: REDIRECT_URI.startsWith('https://'),
    },
    instructions: [
      '1. Copy the redirect_uri value below',
      '2. Go to https://developer.spotify.com/dashboard',
      '3. Click your app → Settings → Redirect URIs',
      '4. Paste and click Add, then Save',
      '5. Wait 30 seconds, then try connecting again'
    ]
  });
});

// Spotify OAuth: Generate authorization URL
app.get("/make-server-a9c438e5/spotify/auth-url", (c) => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return c.json({ error: 'Spotify connection is not configured' }, 503);
  // Get the app URL from query parameter (passed by frontend)
  const appUrl = c.req.query('app_url');
  
  if (!appUrl) {
    return c.json({ error: 'app_url parameter required' }, 400);
  }
  
  if (!allowedRedirects.has(appUrl)) return c.json({ error: 'App redirect URL is not configured' }, 400);
  const scopes = [
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'playlist-modify-public',
    'playlist-modify-private'
  ].join(' ');
  
  const state = crypto.randomUUID();
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${SPOTIFY_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(appUrl)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `state=${state}`;
  
  return c.json({ authUrl, state, redirect_uri: appUrl });
});

// Spotify OAuth: Handle callback
app.get("/make-server-a9c438e5/spotify/callback", (c) => c.json({ error: 'Use the registered app origin for Spotify sign-in.' }, 410));

app.post("/make-server-a9c438e5/spotify/exchange-code", async (c) => {
  console.log('=== CODE EXCHANGE REQUEST ===');
  
  try {
    const body = await c.req.json();
    const { code, redirect_uri } = body;
    if (typeof code !== 'string' || typeof redirect_uri !== 'string' || !allowedRedirects.has(redirect_uri)) return c.json({ error: 'Invalid authorization request' }, 400);
    
    
    if (!code) {
      console.log('ERROR: No code provided');
      return c.json({ error: 'No code provided' }, 400);
    }
    
    if (!redirect_uri) {
      console.log('ERROR: No redirect_uri provided');
      return c.json({ error: 'No redirect_uri provided' }, 400);
    }
    
    console.log('Exchanging code for tokens...');
    console.log('Using redirect_uri:', redirect_uri);
    console.log('Spotify Client ID:', SPOTIFY_CLIENT_ID ? `${SPOTIFY_CLIENT_ID.substring(0, 10)}...` : 'NOT SET');
    console.log('Spotify Client Secret:', SPOTIFY_CLIENT_SECRET ? 'SET' : 'NOT SET');
    
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.log('ERROR: Missing Spotify credentials');
      return c.json({ 
        error: 'Server configuration error', 
        details: 'Spotify credentials not configured' 
      }, 500);
    }
    
    // Exchange code for access token
    const tokenResponse = await fetchWithTimeout('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri // Use the same redirect_uri that was used to get the code
      })
    }, 10000);
    
    const tokenData = await tokenResponse.json();
    
    console.log('Spotify API response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.log(`Spotify token exchange error: ${JSON.stringify(tokenData)}`);
      return c.json({ error: 'Token exchange failed', details: tokenData }, 400);
    }
    
    console.log('Token exchange successful!');
    
    // Generate a session ID for the user
    const sessionId = crypto.randomUUID();
    
    // Store tokens in KV store
    await kv.set(`spotify:session:${sessionId}`, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    });
    
    
    return c.json({ sessionId, success: true });
  } catch (err) {
    console.log(`Code exchange exception: ${err}`);
    console.error(err instanceof Error ? err.message : 'Code exchange failed');
    return c.json({ error: 'Server error during code exchange', details: String(err) }, 500);
  }
});

// Get user's top artists
app.get("/make-server-a9c438e5/spotify/top-artists", async (c) => {
  const sessionId = c.req.query('session');
  const timeRange = c.req.query('time_range') || 'medium_term'; // short_term, medium_term, long_term
  
  if (!sessionId) {
    return c.json({ error: 'No session provided' }, 401);
  }
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    if (tokenResult.error) {
      return c.json({ error: tokenResult.error }, 401);
    }
    
    const { access_token } = tokenResult;
    
    console.log(`Fetching top artists with time_range=${timeRange}`);
    
    // The profile shows a ranked top-50 sample, not an entire library.
    const response = await fetchWithTimeout(`https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${encodeURIComponent(timeRange)}`, {headers:{Authorization:`Bearer ${access_token}`}}, 15000);
    if (!response.ok) return c.json({ error: 'Top artists could not be loaded' }, response.status === 401 ? 401 : response.status === 429 ? 429 : 502);
    const data = await response.json();
    return c.json({ items: data.items || [], total: data.total, time_range: timeRange });

  } catch (err) {
    console.log(`Error fetching top artists: ${err}`);
    return c.json({ error: 'Server error fetching top artists' }, 500);
  }
});

// Get user's top tracks
app.get("/make-server-a9c438e5/spotify/top-tracks", async (c) => {
  const sessionId = c.req.query('session');
  const timeRange = c.req.query('time_range') || 'medium_term'; // short_term, medium_term, long_term
  
  if (!sessionId) {
    return c.json({ error: 'No session provided' }, 401);
  }
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    if (tokenResult.error) {
      return c.json({ error: tokenResult.error }, 401);
    }
    
    const { access_token } = tokenResult;
    
    console.log(`Fetching top tracks with time_range=${timeRange}`);
    
    // Fetch up to 50 top tracks (Spotify's max per request for this endpoint)
    const response = await fetchWithTimeout(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    }, 15000);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.log(`Spotify top tracks error: ${errorData}`);
      return c.json({ error: 'Failed to fetch top tracks' }, response.status === 401 ? 401 : response.status === 429 ? 429 : 502);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.items?.length || 0} top tracks for time_range=${timeRange}`);
    
    return c.json(data);
  } catch (err) {
    console.log(`Error fetching top tracks: ${err}`);
    return c.json({ error: 'Server error fetching top tracks' }, 500);
  }
});

// Get ALL user's saved/liked tracks
app.get("/make-server-a9c438e5/spotify/saved-tracks", async (c) => {
  const sessionId = c.req.query('session');
  
  if (!sessionId) {
    return c.json({ error: 'No session provided' }, 401);
  }
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    if (tokenResult.error) {
      return c.json({ error: tokenResult.error }, 401);
    }
    
    const { access_token } = tokenResult;
    
    // Fetch all saved tracks (Spotify API limit is 50 per request)
    const allTracks = [];
    const paged = c.req.query('offset') !== undefined;
    let offset = Number(c.req.query('offset') || 0);
    if (!Number.isSafeInteger(offset) || offset < 0) return c.json({error:'Invalid offset'},400);
    const limit = 50;
    let hasMore = true;
    
    console.log('Fetching user saved tracks...');
    
    // Fetch ALL saved tracks, no limit
    while (hasMore) {
      const response = await fetchWithTimeout(
        `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log(`Spotify saved tracks error at offset ${offset}: ${response.status}`);
        return c.json({ error: 'Could not load saved tracks. Please retry.' }, response.status === 401 ? 401 : response.status === 429 ? 429 : 502);
      }
      
      const data = await response.json();
      const tracks = data.items || [];
      
      if (tracks.length === 0) {
        if (paged) return c.json({items:[],total:data.total,nextOffset:null});
        hasMore = false;
        break;
      }
      
      // Extract track info and enrich with artist genres
      for (const item of tracks) {
        const track = item.track;
        if (track) {
          allTracks.push({
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            added_at: item.added_at
          });
        }
      }
      
      if (paged) return c.json({items:allTracks, total:data.total, nextOffset:data.next ? offset + limit : null});
      offset += limit;
      
      // Check if there are more tracks
      if (tracks.length < limit || !data.next) {
        hasMore = false;
      }
    }
    
    console.log(`Fetched ${allTracks.length} saved tracks`);
    
    return c.json({ items: allTracks, total: allTracks.length });
  } catch (err) {
    console.log(`Error fetching saved tracks: ${err}`);
    return c.json({ error: 'Server error fetching saved tracks' }, 500);
  }
});

// Get audio features for multiple tracks
app.get("/make-server-a9c438e5/spotify/audio-features", async (c) => {
  const sessionId = c.req.query('session');
  const trackIds = c.req.query('track_ids'); // Comma-separated track IDs
  
  if (!sessionId) {
    return c.json({ error: 'No session provided' }, 401);
  }
  
  if (!trackIds) {
    return c.json({ error: 'No track IDs provided' }, 400);
  }
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    if (tokenResult.error) {
      return c.json({ error: tokenResult.error }, 401);
    }
    
    const { access_token } = tokenResult;
    
    // Spotify allows up to 100 track IDs per request
    const trackIdArray = trackIds.split(',').slice(0, 100);
    
    console.log(`Fetching audio features for ${trackIdArray.length} tracks`);
    
    const response = await fetchWithTimeout(
      `https://api.spotify.com/v1/audio-features?ids=${trackIdArray.join(',')}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      },
      15000
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      console.log(`Spotify audio features error: ${errorData}`);
      return c.json({ error: 'Failed to fetch audio features' }, response.status === 401 ? 401 : response.status === 429 ? 429 : 502);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (err) {
    console.log(`Error fetching audio features: ${err}`);
    return c.json({ error: 'Server error fetching audio features' }, 500);
  }
});

// Get ALL artists from saved tracks with full details (genres, popularity, etc.)
// Resolve only the artist IDs already discovered in the library; never scan it again.
app.get("/make-server-a9c438e5/spotify/library-artists", async (c) => {
  const ids = (c.req.query('ids') || '').split(',');
  if (!ids.length || ids.length > 50 || ids.some(id => !/^[a-zA-Z0-9]{22}$/.test(id))) return c.json({error:'Invalid artist IDs'},400);
  const session = c.req.query('session');
  if (!session) return c.json({error:'No session provided'},401);
  const token = await getValidAccessToken(session);
  if (!token || token.error) return c.json({error:'Invalid or expired session'},401);
  const cached:any[] = [];
  const missing:string[] = [];
  await Promise.all(ids.map(async id => {
    try {
      const entry = await kv.get(`library-artist:${id}`);
      if (entry?.artist && Date.now()-entry.updatedAt < 7*86400000) {cached.push(entry.artist);return;}
    } catch { /* Cache failure must not prevent upstream loading. */ }
    missing.push(id);
  }));
  if (!missing.length) return c.json({items:cached});
  const response = await fetchWithTimeout(`https://api.spotify.com/v1/artists?ids=${missing.join(',')}`, {headers:{Authorization:`Bearer ${token.access_token}`}},15000);
  if (!response.ok) return c.json({error:'Artist details unavailable. Retry to complete genre coverage.'},response.status === 401 ? 401 : response.status === 429 ? 429 : 502);
  const data = await response.json();
  const fresh = (data.artists || []).filter(Boolean);
  await Promise.all(fresh.map(async (artist:any) => {
    try {await kv.set(`library-artist:${artist.id}`,{artist,updatedAt:Date.now()});} catch { /* Best-effort public metadata cache. */ }
  }));
  return c.json({items:[...cached,...fresh]});
});

app.get("/make-server-a9c438e5/spotify/saved-artists", async (c) => {
  const sessionId = c.req.query('session');
  
  if (!sessionId) {
    return c.json({ error: 'No session provided' }, 401);
  }
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    if (tokenResult.error) {
      return c.json({ error: tokenResult.error }, 401);
    }
    
    const { access_token } = tokenResult;
    
    // First, fetch ALL saved tracks to get unique artists (not limited to 6 months)
    const allTracks = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    
    console.log('Fetching all saved tracks to extract artists...');
    
    while (hasMore) {
      const response = await fetchWithTimeout(
        `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );
      
      if (!response.ok) {
        break;
      }
      
      const data = await response.json();
      const tracks = data.items || [];
      
      if (tracks.length === 0) {
        hasMore = false;
        break;
      }
      
      allTracks.push(...tracks);
      offset += limit;
      
      if (tracks.length < limit || !data.next) {
        hasMore = false;
      }
    }
    
    // Count tracks per artist
    const artistTrackCount: Record<string, number> = {};
    const artistIds = new Set<string>();
    
    for (const item of allTracks) {
      if (item.track && item.track.artists) {
        for (const artist of item.track.artists) {
          artistIds.add(artist.id);
          artistTrackCount[artist.id] = (artistTrackCount[artist.id] || 0) + 1;
        }
      }
    }
    
    console.log(`Found ${artistIds.size} unique artists from ${allTracks.length} total saved tracks`);
    
    // Fetch full artist details in batches (Spotify allows up to 50 artists per request)
    const allArtists = [];
    const artistIdArray = Array.from(artistIds);
    
    for (let i = 0; i < artistIdArray.length; i += 50) {
      const batch = artistIdArray.slice(i, i + 50);
      const artistResponse = await fetchWithTimeout(
        `https://api.spotify.com/v1/artists?ids=${batch.join(',')}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );
      
      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        const artists = artistData.artists || [];
        // Add track count to each artist
        for (const artist of artists) {
          if (artist) {
            allArtists.push({
              ...artist,
              savedTrackCount: artistTrackCount[artist.id] || 0
            });
          }
        }
      }
    }
    
    // Sort artists by number of saved tracks (most to least)
    allArtists.sort((a, b) => b.savedTrackCount - a.savedTrackCount);
    
    console.log(`Fetched and sorted ${allArtists.length} artists by saved track count`);
    
    return c.json({ items: allArtists, total: allArtists.length });
  } catch (err) {
    console.log(`Error fetching saved artists: ${err}`);
    return c.json({ error: 'Server error fetching saved artists' }, 500);
  }
});

// Helper to resolve location coordinates
async function resolveLocation(city?: string, lat?: number, lon?: number) {
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon, city: city || "Current" };
  }
  
  if (city) {
    const coordinates = city.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (coordinates) {
      const lat = Number(coordinates[1]), lon = Number(coordinates[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon, city: city.trim() };
      throw new HTTPException(400, { message: 'Invalid coordinates' });
    }
    try {
      const response = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(city)}&format=json&limit=1`,
        {
          headers: { 'User-Agent': 'ConcertMatch/1.0' }
        },
        5000 // 5 second timeout for geocoding
      );
      
      const results = await response.json();
      if (results && results.length > 0) {
        const loc = results[0];
        return { lat: parseFloat(loc.lat), lon: parseFloat(loc.lon), city: loc.display_name || city };
      }
    } catch (e) {
      console.log(`Geocoding error: ${e}`);
    }
  }
  
  throw new HTTPException(400, { message: 'Location not found. Enter a city and state or country.' });
}

// GET /concerts - Find concerts based on user's music taste
app.get('/make-server-a9c438e5/concerts', async (c) => {
  const sessionId = c.req.query('session');
  const locationQuery = c.req.query('location');
  const distance = Number(c.req.query('distance') || '40');
  if (!Number.isFinite(distance) || distance <= 0 || distance > 1000) return c.json({ error: 'Invalid search distance' }, 400);
  if (!TICKETMASTER_API_KEY) return c.json({ error: 'Live concert listings are not configured' }, 503); // Default 40 km (~25 miles)

  if (!sessionId) {
    return c.json({ error: 'Missing session ID' }, 400);
  }

  if (!locationQuery) {
    return c.json({ error: 'Missing location' }, 400);
  }
  
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    if (tokenResult.error) {
      return c.json({ error: tokenResult.error }, 401);
    }
    
    const { access_token } = tokenResult;
    
    // Check cache for user profile
    let userProfile = await kv.get(`spotify:profile:${sessionId}`);
    if (userProfile && (!userProfile.cached_at || Date.now() - userProfile.cached_at > 86400000)) userProfile = null;
    
    if (!userProfile) {
      // Build user profile from ALL saved tracks
      console.log('Building comprehensive user profile from saved tracks...');
      
      // First, fetch all saved tracks to get unique artists
      const allTracks = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;
      
      console.log('Fetching saved tracks to extract artists...');
      
      while (hasMore) {
        const response = await fetchWithTimeout(
          `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          }
        );
        
        if (!response.ok) {
          break;
        }
        
        const data = await response.json();
        const tracks = data.items || [];
        
        if (tracks.length === 0) {
          hasMore = false;
          break;
        }
        
        allTracks.push(...tracks);
        offset += limit;
        
        if (tracks.length < limit || !data.next) {
          hasMore = false;
        }
      }
      
      // Count tracks per artist
      const artistTrackCount: Record<string, number> = {};
      const artistIds = new Set<string>();
      
      for (const item of allTracks) {
        if (item.track && item.track.artists) {
          for (const artist of item.track.artists) {
            artistIds.add(artist.id);
            artistTrackCount[artist.id] = (artistTrackCount[artist.id] || 0) + 1;
          }
        }
      }
      
      console.log(`Found ${artistIds.size} unique artists from ${allTracks.length} saved tracks`);
      
      // Fetch full artist details in batches (Spotify allows up to 50 artists per request)
      const allArtists = [];
      const artistIdArray = Array.from(artistIds);
      
      // OPTIMIZATION: Fetch artist batches in parallel
      const batchPromises = [];
      for (let i = 0; i < artistIdArray.length; i += 50) {
        const batch = artistIdArray.slice(i, i + 50);
        batchPromises.push(
          fetchWithTimeout(
            `https://api.spotify.com/v1/artists?ids=${batch.join(',')}`,
            {
              headers: {
                'Authorization': `Bearer ${access_token}`
              }
            }
          ).then(async (artistResponse) => {
            if (artistResponse.ok) {
              const artistData = await artistResponse.json();
              const artists = artistData.artists || [];
              return artists.map((artist: any) => {
                if (artist) {
                  return {
                    ...artist,
                    savedTrackCount: artistTrackCount[artist.id] || 0
                  };
                }
                return null;
              }).filter(Boolean);
            }
            return [];
          })
        );
      }
      
      // Wait for all batches to complete
      const artistBatches = await Promise.all(batchPromises);
      for (const batch of artistBatches) {
        allArtists.push(...batch);
      }
      
      // Sort artists by number of saved tracks (most to least)
      allArtists.sort((a, b) => b.savedTrackCount - a.savedTrackCount);
      
      console.log(`Fetched and sorted ${allArtists.length} artists by saved track count`);
      
      // Build detailed profile with genres and audio features
      const details: Record<string, any> = {};
      
      for (const artist of allArtists) {
        const genres = vibe.assignGenre(artist.genres || []);
        details[artist.name] = {
          genres,
          popularity: artist.popularity || 50,
          audio_features: {} // Will be enriched later if needed
        };
      }
      
      userProfile = {
        artists: allArtists.map((a: any) => a.name),
        details
      };
      
      // Cache for 24 hours (increased from 1 hour for better performance)
      userProfile.cached_at = Date.now();
      await kv.set(`spotify:profile:${sessionId}`, userProfile);
      console.log(`✅ User profile cached for 24 hours (${allArtists.length} artists)`);
    } else {
      console.log(`✅ Using cached user profile (${userProfile.artists?.length || 0} artists)`);
    }
    
    // Build user vibe
    const userVibe = vibe.buildUserVibe(
      userProfile.artists.map((a: string) => a.toLowerCase()),
      userProfile.details
    );
    
    // Resolve location
    const loc = await resolveLocation(locationQuery);
    console.log(`Searching concerts near ${loc.city} (${loc.lat}, ${loc.lon})`);
    
    // Fetch from Ticketmaster if API key is available
    if (TICKETMASTER_API_KEY) {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);
      
      const tmParams = new URLSearchParams({
        apikey: TICKETMASTER_API_KEY,
        latlong: `${loc.lat},${loc.lon}`,
        radius: distance.toString(),
        unit: 'km',
        startDateTime: startDate.toISOString().split('.')[0] + 'Z',
        endDateTime: endDate.toISOString().split('.')[0] + 'Z',
        size: '100',
        classificationName: 'music'
      });
      
      const tmResponse = await fetchWithTimeout(
        `https://app.ticketmaster.com/discovery/v2/events.json?${tmParams}`
      );
      
      if (tmResponse.ok) {
        const tmData = await tmResponse.json();
        const tmEvents = tmData._embedded?.events || [];
        
        console.log(`Found ${tmEvents.length} Ticketmaster events`);
        
        // Log first 3 events for debugging
        if (tmEvents.length > 0) {
          console.log('=== SAMPLE EVENTS ===');
          tmEvents.slice(0, 3).forEach((event: any, idx: number) => {
            console.log(`Event ${idx + 1}:`, {
              name: event.name,
              attractions: event._embedded?.attractions?.map((a: any) => a.name) || 'none',
              url: event.url
            });
          });
        }
        
        // OPTIMIZATION 1: Limit to 50 events to process faster
        const eventsToProcess = tmEvents.slice(0, 50);
        
        // OPTIMIZATION 2: Extract unique artists first to avoid duplicate API calls
        const uniqueArtists = new Map<string, string>(); // lowercase name -> actual name
        for (const event of eventsToProcess) {
          const mainArtist = vibe.getMainArtistFromTicketmaster(event);
          const lowerName = mainArtist.toLowerCase();
          if (!uniqueArtists.has(lowerName)) {
            uniqueArtists.set(lowerName, mainArtist);
          }
        }
        
        console.log(`Processing ${uniqueArtists.size} unique artists`);
        
        // OPTIMIZATION 3: Fetch Spotify data for all unique artists in parallel with caching
        const artistDataCache = new Map<string, any>();
        
        // Process in batches of 10 to avoid rate limits
        const artistNames = Array.from(uniqueArtists.values());
        const batchSize = 10;
        
        for (let i = 0; i < artistNames.length; i += batchSize) {
          const batch = artistNames.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (artistName) => {
            const cacheKey = `spotify:artist:${artistName.toLowerCase()}`;
            
            // Check cache first (7-day TTL for better performance)
            let artistData = await kv.get(cacheKey);
            
            if (!artistData?.cached_at || Date.now() - artistData.cached_at > 7 * 86400000) {
              // Fetch from Spotify
              artistData = await vibe.getSpotifyArtistData(artistName, access_token);
              
              // Cache for 7 days if we got data (artist info rarely changes)
              if (artistData) {
                await kv.set(cacheKey, { ...artistData, cached_at: Date.now() });
              }
            }
            
            if (artistData) {
              artistDataCache.set(artistName.toLowerCase(), artistData);
            }
          });
          
          await Promise.all(batchPromises);
        }
        
        console.log(`Cached ${artistDataCache.size} artist data entries`);
        
        // OPTIMIZATION 4: Build enriched events using cached data (no more API calls!)
        const enrichedEvents = [];
        
        for (const event of eventsToProcess) {
          if (!event.url) continue;
          
          const mainArtist = vibe.getMainArtistFromTicketmaster(event);
          const venue = event._embedded?.venues?.[0];
          
          // Filter out tribute bands and cover bands
          const artistLower = mainArtist.toLowerCase();
          const eventNameLower = event.name.toLowerCase();
          const isTributeBand = 
            artistLower.includes('tribute') ||
            (artistLower.includes('experience') && (artistLower.includes('the ') || artistLower.includes('a '))) ||
            eventNameLower.includes('tribute') ||
            eventNameLower.includes('tribute to') ||
            eventNameLower.includes('a tribute') ||
            eventNameLower.includes('tribute band') ||
            eventNameLower.includes('cover band') ||
            eventNameLower.includes('covers ') ||
            eventNameLower.includes('impersonator') ||
            eventNameLower.includes('celebration of') ||
            eventNameLower.includes('performed by') ||
            eventNameLower.includes('in the style of') ||
            (artistLower.includes('experience') && eventNameLower.includes('tribute'));
          
          if (isTributeBand) {
            console.log(`🚫 Filtered out tribute/cover band: "${mainArtist}" / "${event.name}"`);
            continue;
          }
          
          // Get cached Spotify data
          const spotifyData = artistDataCache.get(mainArtist.toLowerCase());
          
// Ticketmaster events remain visible even when Spotify enrichment is unavailable.
          
          const enrichedEvent = {
            id: event.id,
            artist: spotifyData?.name || mainArtist,
            spotify_artist_id: spotifyData?.id || null,
            currency: event.priceRanges?.[0]?.currency || null,
            fetched_at: new Date().toISOString(),
            event_name: event.name || '',
            venue: venue?.name || 'Unknown Venue',
            city: venue?.city?.name || '',
            region: venue?.state?.stateCode || venue?.state?.name || '',
            country: venue?.country?.name || '',
            address: [venue?.address?.line1, venue?.address?.line2, venue?.city?.name, venue?.state?.stateCode, venue?.postalCode].filter(Boolean).join(', '),
            venue_lat: venue?.location?.latitude ? Number(venue.location.latitude) : null,
            venue_lon: venue?.location?.longitude ? Number(venue.location.longitude) : null,
            distance_miles: venue?.location?.latitude != null && venue?.location?.longitude != null ? distanceMiles(loc.lat!, loc.lon!, Number(venue.location.latitude), Number(venue.location.longitude)) : null,
            search_location: loc.city,
            date: event.dates?.start?.localDate || '',
            url: event.url,
            price_min: event.priceRanges?.[0]?.min ?? null,
            price_max: event.priceRanges?.[0]?.max ?? null,
            genres: spotifyData?.genres || [],
            popularity: spotifyData?.popularity ?? 0,
            audio_profile: spotifyData?.audio_features || {},
            imageUrl: bestEventImage(spotifyData?.images, event.images),
            fallbackImageUrl: bestEventImage([], event.images),
            vibe_score: 0
          };
          
          // Calculate vibe score with reasons
          const { score, reasons } = vibe.calculateVibeScoreWithReasons(
            enrichedEvent,
            userVibe,
            userProfile.artists
          );
          
          enrichedEvent.vibe_score = Math.round(score * 10) / 10;
          (enrichedEvent as any).matchScore = enrichedEvent.vibe_score;
          (enrichedEvent as any).matchReasons = spotifyData ? reasons : ['Artist match details are unavailable'];
          enrichedEvents.push(enrichedEvent);
        }
        
        // Sort by vibe score
        enrichedEvents.sort((a, b) => b.vibe_score - a.vibe_score);
        
        console.log(`Enriched ${enrichedEvents.length} events with vibe scores`);
        
        return c.json({ 
          concerts: enrichedEvents,
          location: loc.city,
          source: 'ticketmaster'
        });
      }
    }
    
    return c.json({ error: 'Live concert listings are unavailable. Please try again later.' }, 502);
  } catch (err) {
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
    console.log(`Error fetching concerts: ${err}`);
    return c.json({ error: 'Server error fetching concerts' }, 500);
  }
});

// POST /playlists/create - Create a Spotify playlist
app.post('/make-server-a9c438e5/playlists/create', async (c) => {
  const sessionId = c.req.query('session');
  
  if (!sessionId) {
    return c.json({ error: 'Missing session ID' }, 400);
  }
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    if (tokenResult.error) {
      return c.json({ error: tokenResult.error }, 401);
    }
    
    const { access_token } = tokenResult;
    
    // Get request body
    const body = await c.req.json();
    const { name, description, track_uris, public: isPublic } = body;
    
    if (!name || !track_uris || !Array.isArray(track_uris)) {
      return c.json({ error: 'Missing required fields: name and track_uris (array)' }, 400);
    }
    
    // Get user ID first
    const meResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    if (!meResponse.ok) {
      return c.json({ error: 'Failed to get user info' }, meResponse.status === 401 ? 401 : meResponse.status === 429 ? 429 : 502);
    }
    
    const userData = await meResponse.json();
    const userId = userData.id;
    
    console.log(`Creating playlist "${name}" for user ${userId} with ${track_uris.length} tracks`);
    
    // Create playlist
    const createResponse = await fetchWithTimeout(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description: description || 'Created by HeadTap',
          public: isPublic !== undefined ? isPublic : false
        })
      }
    );
    
    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.log(`Failed to create playlist: ${errorData}`);
      return c.json({ error: 'Failed to create playlist' }, createResponse.status === 401 ? 401 : createResponse.status === 429 ? 429 : 502);
    }
    
    const playlistData = await createResponse.json();
    const playlistId = playlistData.id;
    
    // Add tracks to playlist (max 100 at a time)
    const chunkSize = 100;
    for (let i = 0; i < track_uris.length; i += chunkSize) {
      const chunk = track_uris.slice(i, i + chunkSize);
      
      const addTracksResponse = await fetchWithTimeout(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: chunk
          })
        }
      );
      
      if (!addTracksResponse.ok) {
        const errorData = await addTracksResponse.text();
        console.log(`Failed to add tracks to playlist: ${errorData}`);
        // Continue anyway - partial success is better than nothing
      }
    }
    
    console.log(`Successfully created playlist: ${playlistData.external_urls.spotify}`);
    
    return c.json({
      success: true,
      playlist: {
        id: playlistId,
        name: playlistData.name,
        url: playlistData.external_urls.spotify,
        tracks_added: track_uris.length
      }
    });
  } catch (err) {
    console.log(`Error creating playlist: ${err}`);
    return c.json({ error: 'Server error creating playlist' }, 500);
  }
});

// GET /artist-news - Fetch recent news about top artists
app.get('/make-server-a9c438e5/artist-news', async (c) => {
  try {
    const artists = c.req.query('artists'); // Comma-separated artist names
    
    if (!artists) {
      return c.json({ error: 'Missing artists parameter' }, 400);
    }
    
    if (!NEWS_API_KEY) {
      // Return empty if no API key
      return c.json({ articles: [], message: 'News API key not configured' });
    }
    
    const artistList = artists.split(',').map(a => a.trim()).filter(Boolean).slice(0, 5); // Limit to top 5 artists for focused news
    console.log(`Fetching news for ${artistList.length} artists: ${artistList.join(', ')}`);
    
    // Fetch news for each artist
    const allArticles = [];
    
    for (const artist of artistList) {
      const artistTrimmed = artist.trim();
      if (!artistTrimmed) continue;
      
      // Check cache first (cache for 1 hour)
      const cacheKey = `news:artist:${artistTrimmed.toLowerCase()}`;
      let cachedNews = await kv.get(cacheKey);
      
      if (cachedNews && Array.isArray(cachedNews)) {
        console.log(`Using cached news for ${artistTrimmed}`);
        allArticles.push(...cachedNews);
        continue;
      }
      
      try {
        // Build search query - require artist name in title for better relevance
        const query = `"${artistTrimmed}" AND (tour OR album OR concert OR announces OR releases OR drops OR new)`;        
        const newsParams = new URLSearchParams({
          q: query,
          apiKey: NEWS_API_KEY,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: '10', // Get 10 to filter down to best 1-2
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
        });
        
        const newsResponse = await fetchWithTimeout(
          `https://newsapi.org/v2/everything?${newsParams}`
        );
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          const articles = (newsData.articles || [])
            .filter((article: any) => {
              // ULTRA STRICT filtering - only the most relevant articles
              const titleText = (article.title || '').toLowerCase();
              const descText = (article.description || '').toLowerCase();
              const contentText = (article.content || '').toLowerCase();
              const artistLower = artistTrimmed.toLowerCase();
              const sourceName = (article.source?.name || '').toLowerCase();
              
              // REQUIREMENT #1: Artist name MUST appear in title
              const titleHasArtist = titleText.includes(artistLower);
              if (!titleHasArtist) {
                console.log(`❌ Rejected (no artist in title): "${article.title}"`);
                return false;
              }
              
              // REQUIREMENT #2: Must have strong music-related keywords (not just any keyword)
              const strongMusicKeywords = ['tour', 'concert', 'album', 'announces', 'release', 'drops', 'perform', 'festival', 'show', 'live', 'debut', 'single', 'ep', 'record'];
              const hasStrongKeyword = strongMusicKeywords.some(keyword => 
                titleText.includes(keyword) || descText.includes(keyword)
              );
              
              if (!hasStrongKeyword) {
                console.log(`❌ Rejected (no strong music keyword): "${article.title}"`);
                return false;
              }
              
              // REQUIREMENT #3: Filter out listicles and aggregated content
              const isListicle = 
                /\b\d+\s+(best|top|worst|greatest|favorite|essential|must|songs?|albums?|artists?)\b/i.test(titleText) ||
                titleText.includes('ranked') ||
                titleText.includes('ranking') ||
                titleText.includes('power list') ||
                titleText.includes('hot 100') ||
                titleText.includes('billboard') && titleText.includes('chart') ||
                titleText.includes('spotify wrapped') ||
                titleText.includes('year in review') ||
                titleText.includes('best of') && !titleText.includes(artistLower + "'s best") ||
                titleText.includes('top 10') ||
                titleText.includes('top 20') ||
                titleText.includes('top 50') ||
                titleText.includes('playlist:') ||
                titleText.includes('roundup');
              
              if (isListicle) {
                console.log(`❌ Rejected (listicle/aggregation): "${article.title}"`);
                return false;
              }
              
              // REQUIREMENT #4: Filter out low-quality or irrelevant sources
              const isLowQualitySource = 
                sourceName.includes('reddit') ||
                sourceName.includes('youtube') ||
                sourceName.includes('twitter') ||
                sourceName.includes('facebook') ||
                sourceName.includes('instagram') ||
                sourceName.includes('blog') && !sourceName.includes('billboard') ||
                sourceName.includes('fansite');
              
              if (isLowQualitySource) {
                console.log(`❌ Rejected (low quality source): "${article.title}" from ${sourceName}`);
                return false;
              }
              
              // REQUIREMENT #5: Filter out tribute/cover/fan content
              const isTributeOrCover = 
                titleText.includes('tribute') ||
                titleText.includes('cover') && !titleText.includes('cover art') && !titleText.includes('discover') ||
                titleText.includes('covers ') ||
                titleText.includes('fan') && titleText.includes('made') ||
                titleText.includes('impersonator') ||
                titleText.includes('lookalike') ||
                titleText.includes('sound-alike') ||
                titleText.includes('in the style of');
              
              if (isTributeOrCover) {
                console.log(`❌ Rejected (tribute/cover/fan): "${article.title}"`);
                return false;
              }
              
              // REQUIREMENT #6: Must have substantial description (not just a stub)
              if (!descText || descText.length < 50) {
                console.log(`❌ Rejected (insufficient description): "${article.title}"`);
                return false;
              }
              
              // REQUIREMENT #7: Filter out streaming/playlist announcements unless it's the artist's own
              const isPlaylistSpam = 
                (titleText.includes('playlist') || titleText.includes('streaming')) && 
                !titleText.includes(artistLower + ' releases') &&
                !titleText.includes(artistLower + ' drops') &&
                !titleText.includes(artistLower + ' announces') &&
                !titleText.includes('new album') &&
                !titleText.includes('new single');
              
              if (isPlaylistSpam) {
                console.log(`❌ Rejected (playlist spam): "${article.title}"`);
                return false;
              }
              
              // REQUIREMENT #8: Article must be primarily ABOUT the artist (artist name near start of title)
              const titleWords = titleText.split(' ');
              const artistFirstWordIndex = titleWords.findIndex((word: string) => artistLower.split(' ')[0] === word);
              const artistMentionedEarly = artistFirstWordIndex >= 0 && artistFirstWordIndex < 8; // Within first 8 words
              
              if (!artistMentionedEarly) {
                console.log(`❌ Rejected (artist not prominent in title): "${article.title}"`);
                return false;
              }
              
              console.log(`✅ Accepted: "${article.title}"`);
              return true;
            })
            .slice(0, 1) // Only keep THE BEST article per artist
            .map((article: any) => ({
              ...article,
              artist: artistTrimmed // Tag which artist this article is about
            }));
          
          // Cache the results
          await kv.set(cacheKey, articles);
          
          allArticles.push(...articles);
          console.log(`Found ${articles.length} relevant articles for ${artistTrimmed}`);
        } else {
          console.log(`News API error for ${artistTrimmed}: ${newsResponse.status}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.log(`Error fetching news for ${artistTrimmed}: ${err}`);
      }
    }
    
    // Sort by date (newest first) and limit total results
    allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    const limitedArticles = allArticles.slice(0, 12); // Return top 12 most recent
    
    console.log(`Returning ${limitedArticles.length} total articles`);
    
    return c.json({ articles: limitedArticles, total: limitedArticles.length });
  } catch (err) {
    console.log(`Error in artist-news endpoint: ${err}`);
    return c.json({ error: 'Server error fetching artist news' }, 500);
  }
});

// GET /apple-music/enrich - Enrich artists with Apple Music catalog data
app.get('/make-server-a9c438e5/apple-music/enrich', async (c) => {
  try {
    const artists = c.req.query('artists'); // Comma-separated artist names
    
    if (!artists) {
      return c.json({ error: 'Missing artists parameter' }, 400);
    }
    
    const artistList = artists.split(',').map(a => a.trim()).filter(Boolean);
    console.log(`Enriching ${artistList.length} artists with Apple Music data`);
    
    // Cache for Apple Music data (persist across requests)
    const enrichmentCache = new Map<string, appleMusic.AppleMusicEnrichment>();
    
    // Load cached data from KV store
    for (const artist of artistList) {
      const cacheKey = `apple:artist:${artist.toLowerCase()}`;
      const cached = await kv.get(cacheKey);
      if (cached) {
        enrichmentCache.set(artist.toLowerCase(), cached);
      }
    }
    
    // Enrich artists (uses internal caching)
    const enrichedData = await appleMusic.enrichArtistsWithAppleMusic(
      artistList,
      enrichmentCache
    );
    
    // Save updated cache to KV store (7-day TTL)
    for (const [artist, data] of enrichedData.entries()) {
      const cacheKey = `apple:artist:${artist.toLowerCase()}`;
      await kv.set(cacheKey, data);
    }
    
    // Convert Map to object for JSON response
    const result: Record<string, appleMusic.AppleMusicEnrichment> = {};
    for (const [artist, data] of enrichedData.entries()) {
      result[artist] = data;
    }
    
    console.log(`✅ Enriched ${Object.keys(result).length} artists with Apple Music data`);
    
    return c.json({ 
      enrichments: result,
      total: Object.keys(result).length,
      source: 'iTunes Search API (free, no auth required)'
    });
  } catch (err) {
    console.log(`Error in apple-music/enrich endpoint: ${err}`);
    return c.json({ error: 'Server error enriching with Apple Music' }, 500);
  }
});

// GET /recommendation-genres - Test endpoint to get available genre seeds
app.get('/make-server-a9c438e5/recommendation-genres', async (c) => {
  const sessionId = c.req.query('session');
  
  if (!sessionId) {
    return c.json({ error: 'No session provided' }, 401);
  }
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult || tokenResult.error) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    const { access_token } = tokenResult;
    
    // Test endpoint: /recommendations/available-genre-seeds
    console.log(`🧪 Testing Spotify recommendations API with /available-genre-seeds...`);
    const genresUrl = `https://api.spotify.com/v1/recommendations/available-genre-seeds`;
    
    const response = await fetch(genresUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Genre seeds response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error fetching genre seeds: ${errorText}`);
      return c.json({ error: 'Failed to fetch genre seeds', details: errorText, status: response.status }, response.status === 401 ? 401 : response.status === 429 ? 429 : 502);
    }
    
    const data = await response.json();
    console.log(`✅ Available genres: ${data.genres?.length || 0}`);
    
    return c.json(data);
  } catch (err) {
    console.log(`Error fetching recommendation genres: ${err}`);
    return c.json({ error: 'Server error' }, 500);
  }
});

// GET /recommendations - Get personalized track recommendations by genre
// Using alternative approach since Spotify's /recommendations API is not accessible
app.get('/make-server-a9c438e5/recommendations', async (c) => {
  const sessionId = c.req.query('session');
  const genre = c.req.query('genre'); // Optional: get recommendations for specific genre
  const limit = parseInt(c.req.query('limit') || '20');
  
  console.log(`🎵 RECOMMENDATIONS ENDPOINT CALLED - Version 3.0 (Alternative approach)`);
  
  if (!sessionId) {
    return c.json({ error: 'No session provided' }, 401);
  }
  
  try {
    const tokenResult = await getValidAccessToken(sessionId);
    
    if (!tokenResult || tokenResult.error) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }
    
    const { access_token } = tokenResult;
    
    // Use alternative recommendations approach
    const recommendations = await getAlternativeRecommendations(access_token, genre, limit);
    
    console.log(`✅ Fetched ${recommendations.tracks?.length || 0} recommended tracks`);
    
    return c.json(recommendations);
  } catch (err) {
    console.log(`Error fetching recommendations: ${err}`);
    return c.json({ error: 'Server error fetching recommendations', details: String(err) }, 500);
  }
});

export { app };
export function serve() {
  return Deno.serve({ handler: app.fetch });
}
if (import.meta.main) serve();
