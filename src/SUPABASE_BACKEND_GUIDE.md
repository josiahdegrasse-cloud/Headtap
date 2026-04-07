# HeadTap Supabase Backend Guide

## 🎯 Overview

Your HeadTap app uses a fully functional Supabase backend with edge functions written in TypeScript/Deno. The backend handles:

- ✅ Spotify OAuth authentication
- ✅ Automatic token refresh (tokens auto-renew when expired)
- ✅ Session management with KV storage
- ✅ Music profile caching (1 hour)
- ✅ Advanced vibe scoring algorithm (ported from Python)
- ✅ Ticketmaster API integration
- ✅ Match reason generation
- ✅ Concert recommendations

## 📁 Backend Structure

```
/supabase/functions/server/
├── index.tsx           # Main server with all API endpoints
├── vibe_scoring.tsx    # Sophisticated vibe scoring algorithm
└── kv_store.tsx        # Key-value storage utilities (protected)
```

## 🔑 Environment Variables Required

You need to set these secrets in your Supabase project:

1. **SPOTIFY_CLIENT_ID** ✅ (already set)
2. **SPOTIFY_CLIENT_SECRET** ✅ (already set)
3. **TICKETMASTER_API_KEY** ✅ (already set)
4. **SUPABASE_URL** (auto-set by Supabase)
5. **SUPABASE_ANON_KEY** (auto-set by Supabase)
6. **SUPABASE_SERVICE_ROLE_KEY** (auto-set by Supabase)

## ⚠️ First-Time Setup: Spotify OAuth

Before users can connect, you need to add the redirect URI to your Spotify app:

1. **Get your redirect URI**: On the login page, click "Getting 'Invalid redirect URI' error?"
2. **Copy the URI** shown in the helper
3. **Add to Spotify Dashboard**:
   - Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   - Click your app → Settings
   - Add the redirect URI
   - Click Save

See [SPOTIFY_OAUTH_SETUP.md](./SPOTIFY_OAUTH_SETUP.md) for detailed instructions.

## 🛣️ API Endpoints

### Base URL
```
https://{projectId}.supabase.co/functions/v1/make-server-a9c438e5
```

### 1. Health Check
```
GET /health
Response: { "status": "ok" }
```

### 2. Spotify OAuth: Get Authorization URL
```
GET /spotify/auth-url

Response:
{
  "authUrl": "https://accounts.spotify.com/authorize?...",
  "state": "random-uuid"
}
```

### 3. Spotify OAuth: Callback
```
GET /spotify/callback?code={code}

Redirects to: /?session={sessionId}
```

### 4. Get User's Top Artists
```
GET /spotify/top-artists?session={sessionId}
Headers: { Authorization: "Bearer {publicAnonKey}" }

Response: Spotify API format with top 20 artists
```

### 5. Get User's Top Tracks
```
GET /spotify/top-tracks?session={sessionId}
Headers: { Authorization: "Bearer {publicAnonKey}" }

Response: Spotify API format with top 20 tracks
```

### 6. Get Personalized Concerts
```
GET /concerts?session={sessionId}&location={location}
Headers: { Authorization: "Bearer {publicAnonKey}" }

Response:
{
  "concerts": [
    {
      "artist": "Artist Name",
      "event_name": "Event Name",
      "venue": "Venue Name",
      "city": "City",
      "date": "2026-03-15",
      "url": "https://...",
      "price_min": 45,
      "imageUrl": "https://...",
      "vibe_score": 87.5,
      "matchScore": 87.5,
      "matchReasons": [
        "Artist is in your top 5 artists!",
        "Matches your taste in indie & alternative"
      ],
      "genres": ["indie", "alternative"],
      "popularity": 65,
      "audio_profile": { ... }
    }
  ],
  "location": "New York",
  "source": "ticketmaster" // or "mock"
}
```

## 🔄 Token Refresh System

Your backend automatically handles Spotify token expiration:

1. **Checks token expiration** before every API call
2. **Auto-refreshes** if token expires within 5 minutes
3. **Updates KV store** with new tokens
4. **Seamless experience** - users never see auth errors

```typescript
// Example token check (happens automatically)
const tokenResult = await getValidAccessToken(sessionId);
if (tokenResult.error) {
  // Token refresh failed, user needs to re-authenticate
}
```

## 💾 Caching Strategy

### Session Data (Indefinite)
```
Key: spotify:session:{sessionId}
Value: {
  access_token: string,
  refresh_token: string,
  expires_at: number (timestamp)
}
```

### User Profile (1 hour)
```
Key: spotify:profile:{sessionId}
Value: {
  artists: string[],
  details: {
    [artistName]: {
      genres: string[],
      popularity: number,
      audio_features: object
    }
  }
}
```

## 🎵 Vibe Scoring Algorithm

Your sophisticated scoring system analyzes:

### 1. **Top Artist Match** (40 points max)
- Artist is in user's top 5: "Artist is in your top 5 artists!"
- Artist is in user's top 10: "Artist is in your top 10 artists"
- Artist in listening history: "You listen to {artist} frequently"

### 2. **Favorite Artist** (30 points max)
- Artist in user's favorites: "{Artist} is one of your favorite artists"

### 3. **Genre Match** (20 points max)
- Matches single genre: "Matches your taste in {genre}"
- Matches multiple: "Matches your taste in {genre1} & {genre2}"

### 4. **Popularity Similarity** (10 points max)
- High popularity match: "Popular artist matching your taste"
- Low popularity match: "Underground artist matching your taste"
- Moderate match: "Artist popularity matches your preferences"

### 5. **Audio Features** (10 points max)
- Analyzes: energy, danceability, valence, acousticness, instrumentalness
- High similarity: "Musical vibe matches your listening style"
- Specific feature: "Similar {feature} to your preferences"

### Total Score: 0-100
- 80+: Green badge (Great match!)
- 60-79: Blue badge (Good match)
- 40-59: Yellow badge (Okay match)
- <40: Gray badge

## 📊 Genre Classification

The backend normalizes Spotify's granular genres into 12 main categories:

```typescript
{
  rock, alternative, indie, pop,
  hip hop, r&b, electronic, jazz,
  country, latin, classical, blues
}
```

Each artist's genres are mapped to up to 3 main categories for better matching.

## 🎯 Concert Data Flow

```
User searches location
    ↓
Backend geocodes location (OpenStreetMap)
    ↓
Fetch concerts from Ticketmaster
    ↓
For each concert:
  - Extract main artist
  - Fetch Spotify artist data
  - Get audio features from top tracks
  - Calculate vibe score with reasons
    ↓
Sort by vibe score (highest first)
    ↓
Return top 50 concerts to frontend
```

## 🔧 Performance Optimizations

1. **Profile Caching**: User music profiles cached for 1 hour
2. **Batch Processing**: Audio features fetched for top 5 tracks per artist
3. **Parallel Requests**: Frontend fetches artists + tracks simultaneously
4. **Early Returns**: Invalid sessions return immediately
5. **Geocoding Cache**: Location coordinates cached in response

## 🚀 Deployment

Your Supabase edge functions are automatically deployed when you:

1. Make changes to `/supabase/functions/server/*.tsx`
2. The platform auto-deploys on save
3. Functions run on Deno runtime (fast & secure)

## 🐛 Debugging

### Check Logs
View your Supabase function logs in the Supabase dashboard for:
- Token refresh attempts
- API call errors
- Concert search results
- Vibe score calculations

### Common Issues

**"Invalid session" error**
- Session expired or doesn't exist
- User needs to reconnect Spotify

**No concerts found**
- Check Ticketmaster API key is set
- Backend falls back to mock data if no key

**Low vibe scores**
- User has different music taste than available concerts
- Genre mismatch (algorithm working as designed)

## 📈 Future Enhancements

Potential improvements you could add:

1. **Audio Feature Enrichment**: Fetch audio features for user's top artists too
2. **Recent Tracks Weight**: Give more weight to recently played music
3. **Time Range Options**: Let users choose short/medium/long term preferences
4. **Collaborative Filtering**: Suggest concerts other similar users liked
5. **Smart Notifications**: Alert users when highly-matched artists tour nearby
6. **Price Filtering**: Let users filter by price range
7. **Date Filtering**: Filter concerts by date range

## ✨ What Makes This Backend Special

✅ **Production-Ready**: Token refresh, error handling, caching
✅ **Sophisticated**: Python-level vibe scoring in TypeScript
✅ **Fast**: Edge functions deploy globally, low latency
✅ **Secure**: Tokens never exposed to frontend
✅ **Smart**: Match reasons explain why concerts are recommended
✅ **Scalable**: KV store handles thousands of sessions
✅ **Well-Logged**: Comprehensive logging for debugging

## 🎉 It Just Works™

Your backend is now fully operational with:
- Automatic token management ✅
- Intelligent concert matching ✅
- Real Ticketmaster integration ✅
- Detailed match explanations ✅
- Production-grade error handling ✅

Just connect your Spotify account and start discovering concerts!