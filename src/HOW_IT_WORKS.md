# 🎵 HeadTap - How It Works

## Flow When You Click "Search"

Here's exactly what happens when you click the Search button:

### 1. **Button Click** → `handleLocationSearch()`
```
You type "Los Angeles, CA" and click Search
↓
handleLocationSearch() is called
↓
Sets location state
↓
Calls fetchConcerts("Los Angeles, CA")
```

### 2. **Fetch Concerts** → Backend API Call
```
fetchConcerts() runs:
├─ Shows loading spinner
├─ Displays toast: "Searching concerts near Los Angeles, CA..."
├─ Calls: /concerts?session=abc123&location=Los Angeles, CA
└─ Waits for response...
```

### 3. **Backend Processing** → Supabase Edge Function
```
Server receives request:
├─ Validates session ID
├─ Gets your Spotify access token (auto-refreshes if expired!)
├─ Checks cache for your music profile
│  └─ If not cached:
│      ├─ Fetches your top 50 Spotify artists
│      ├─ Extracts genres from each artist
│      └─ Caches for 1 hour
├─ Builds your "User Vibe":
│  ├─ Genre preferences (rock: 40%, pop: 30%, indie: 20%, etc.)
│  ├─ Popularity preference
│  └─ Audio feature preferences
├─ Geocodes location: "Los Angeles, CA" → lat: 34.05, lon: -118.24
├─ Searches Ticketmaster API:
│  ├─ Within 50km radius
│  ├─ Next 90 days
│  ├─ Music events only
│  └─ Gets up to 100 events
├─ For EACH concert found:
│  ├─ Enriches with Spotify artist data
│  ├─ Calculates Vibe Score (0-100%)
│  └─ Generates match reasons ("You love indie rock", etc.)
└─ Sorts by vibe score and returns top 50
```

### 4. **Frontend Receives Data**
```
Dashboard receives concerts:
├─ Sets concerts state
├─ Shows success toast: "Found 47 concerts near Los Angeles!"
├─ Filters are applied (genre, price, budget)
└─ Concerts are displayed sorted by vibe score
```

---

## 🎯 What Makes It Smart: The Vibe Scoring Algorithm

Your old Python FastAPI app had this algorithm. It's now ported to TypeScript!

### How Vibe Score is Calculated:

```javascript
For each concert:
  1. Genre Match (40% weight)
     ├─ Compare concert artist genres vs your top genres
     ├─ Exact match: 100 points
     ├─ Similar genre: 70 points
     └─ Different genre: 0 points

  2. Popularity Match (20% weight)
     ├─ Is artist popularity similar to your average?
     └─ Closer = higher score

  3. Top Artist Boost (30% weight)
     ├─ Is this one of YOUR top 50 artists?
     └─ Yes = 100 points! (You'll LOVE this show)

  4. Audio Features (10% weight)
     ├─ Energy, danceability, acousticness
     └─ Matches your listening profile

  Final Vibe Score = Sum of weighted scores
  Result: 0-100% match
```

### Match Reasons:

The algorithm generates human-readable reasons:
- "Perfect match! You're a huge fan of this artist" (Top artist)
- "You love indie rock and alternative" (Genre match)
- "Similar to The National, Arctic Monkeys" (Similar artists)
- "Matches your taste for energetic music" (Audio features)

---

## 🔍 What Happens in Demo Mode

When you click "Try Demo Mode":

```
1. Loads mock data (mockTopArtists, mockTopTracks, mockConcerts)
2. No API calls to Spotify or Ticketmaster
3. Shows example data so you can:
   ✓ Test all filters
   ✓ See how vibe scores work
   ✓ Understand the UI
   ✓ Try location search (just updates display)
4. Perfect for learning the app before connecting Spotify!
```

---

## 🎨 Filtering System (From Your Original App)

### How Filters Work:

1. **Genre Filter**
   - Gets all genres from your top artists
   - Gets genres from concert artists
   - Click to select multiple
   - Shows only concerts matching selected genres

2. **Price Range**
   - Min: $0 (or your custom min)
   - Max: $1000 (or your custom max)
   - Filters out concerts outside range

3. **Joint Budget Calculator** (Your Original Feature!)
   ```
   Example:
   - Ticket Count: 4 people
   - Joint Budget: $200 total
   - Result: Shows only concerts where 4 × ticket_price ≤ $200
   - So max $50/ticket
   ```

4. **Sort Options**
   - Vibe Score (default): Best matches first
   - Price Low → High: Cheapest first
   - Price High → Low: Most expensive first
   - Date: Soonest concerts first

### All filters apply INSTANTLY (React state):
```
filters change → getFilteredConcerts() runs → UI updates
```

---

## 🔐 Session & Token Management

### How Your Spotify Session Works:

```
1. Connect with Spotify
   ├─ Redirects to Spotify OAuth
   └─ User approves

2. Backend receives OAuth code
   ├─ Exchanges for access_token + refresh_token
   ├─ Stores in KV database with session ID
   └─ Redirects to app with session ID

3. Frontend saves session ID
   ├─ Stored in localStorage
   └─ Included in all API requests

4. Backend auto-refreshes tokens
   ├─ Access token expires in 1 hour
   ├─ Backend checks expiry before each request
   ├─ If expired, uses refresh_token to get new access_token
   └─ User never knows tokens expired!
```

**This is better than your original app** which didn't auto-refresh!

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     USER CLICKS SEARCH                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Frontend (React)     │
         │  Dashboard.tsx        │
         │  fetchConcerts()      │
         └───────────┬───────────┘
                     │ HTTP GET /concerts?session=...&location=...
                     ▼
         ┌───────────────────────┐
         │  Supabase Edge Fn     │
         │  /server/index.tsx    │
         └───────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│ Spotify API   │         │ Ticketmaster │
│ Top Artists   │         │ Search Events│
│ Genres        │         │ in Radius    │
└───────┬───────┘         └──────┬───────┘
        │                         │
        │   ┌─────────────────────┘
        │   │
        ▼   ▼
    ┌─────────────────┐
    │ Vibe Scoring    │
    │ Algorithm       │
    │ vibe_scoring.tsx│
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Return Concerts │
    │ with Scores +   │
    │ Match Reasons   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Frontend        │
    │ - Apply filters │
    │ - Display cards │
    └─────────────────┘
```

---

## 🚀 Performance Optimizations

### 1. **Caching**
- User music profile cached for 1 hour
- Avoids fetching top artists on every search
- Stored in Supabase KV store

### 2. **Parallel Requests**
- Top artists + Top tracks fetched in parallel
- Faster initial load

### 3. **Smart Token Refresh**
- Checks token expiry BEFORE making Spotify requests
- Refreshes proactively, not reactively
- No failed requests due to expired tokens

### 4. **Client-Side Filtering**
- All filtering happens in browser
- No server round-trips
- Instant filter updates

---

## 🐛 Debugging: What to Check

### Search Button Not Working?

1. **Open Browser Console** (F12)
2. **Click Search**
3. **Look for these logs:**

```
✓ Good:
  "Fetching concerts for location: New York, NY, session: abc123..."
  "Concert response status: 200"
  "Received 47 concerts"

✗ Bad - Session Issue:
  "Concert response status: 401"
  → Session expired or invalid
  → Logout and reconnect

✗ Bad - Network Issue:
  "Network error. Please check your connection..."
  → Check internet connection
  → Check Supabase edge function is deployed

✗ Bad - API Key Missing:
  "Using mock concert data (no Ticketmaster API key)"
  → TICKETMASTER_API_KEY not set
  → Will return mock data instead
```

### In Demo Mode?
- Search button updates location display only
- No real API calls
- Uses mockConcerts data

---

## 💡 Pro Tips

1. **Try Demo Mode First**
   - See all features working
   - No Spotify connection needed
   - Understand the interface

2. **Check Browser Console**
   - All API calls are logged
   - Error messages appear here
   - Great for debugging

3. **Use Filters**
   - Genre filter narrows down concerts
   - Joint budget perfect for groups
   - Sort by vibe to see best matches first

4. **Location Tips**
   - "Los Angeles, CA" works better than just "LA"
   - "New York, NY" better than "NYC"
   - Include state/country for accuracy

5. **Understanding Vibe Scores**
   - 80-100% = Highly recommended!
   - 60-79% = Good match
   - 40-59% = Might enjoy
   - 0-39% = Not your style

---

## 🎯 Summary

When you click Search:
1. ✅ Your session is validated
2. ✅ Your music taste is analyzed (cached)
3. ✅ Location is geocoded
4. ✅ Ticketmaster is searched
5. ✅ Each concert is enriched with Spotify data
6. ✅ Vibe scores are calculated
7. ✅ Match reasons are generated
8. ✅ Results are sorted and returned
9. ✅ Filters are applied
10. ✅ Concerts are displayed!

**All in about 2-3 seconds! 🚀**
