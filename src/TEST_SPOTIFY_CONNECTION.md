# ✅ Spotify Connection Test Guide

Your Spotify Client Secret is configured! Let's test the connection.

## 🔍 Step 1: Check Environment Variables

Your backend has these secrets configured:
- ✅ SPOTIFY_CLIENT_ID
- ✅ SPOTIFY_CLIENT_SECRET  
- ✅ TICKETMASTER_API_KEY
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_DB_URL

## 🎯 Step 2: Get Your Redirect URI

**Your redirect URI should be:**
```
https://[your-project-id].supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
```

To find your exact redirect URI:

1. **Click "Try Demo Mode"** on the login screen
2. Go to Concerts tab
3. Open browser console (F12)
4. **OR** click the setup helper on the login page

The redirect URI will be shown.

## 🔧 Step 3: Add Redirect URI to Spotify Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Click on your app (or create one if you don't have one)
3. Click **"Settings"** (top right)
4. Scroll to **"Redirect URIs"**
5. Paste your redirect URI
6. Click **"ADD"**
7. Scroll down and click **"SAVE"**
8. **Wait 30-60 seconds** for Spotify to update

## ✅ Step 4: Test the Connection

### Option A: Use Demo Mode First (Recommended)
1. Click **"Try Demo Mode"**
2. Test all features:
   - ✓ See music profile
   - ✓ Search for concerts
   - ✓ Use filters (genre, price, budget)
   - ✓ Sort concerts
3. This confirms the app works!

### Option B: Connect Real Spotify
1. After adding redirect URI to Spotify Dashboard
2. Wait 30-60 seconds
3. Click **"Connect with Spotify"**
4. You'll be redirected to Spotify
5. Click **"Agree"** to authorize
6. You'll be redirected back to HeadTap
7. You should see a success message!

## 🐛 Common Issues & Fixes

### Issue 1: "INVALID_CLIENT: Invalid redirect URI"

**Cause:** The redirect URI in Spotify Dashboard doesn't match exactly.

**Fix:**
```
1. Double-check spelling - it must match EXACTLY
2. Check for extra spaces or slashes
3. Must start with https://
4. Must include /spotify/callback at the end
5. After adding, SAVE and wait 30-60 seconds
```

### Issue 2: "Session expired" when searching concerts

**Cause:** Your session is old or invalid.

**Fix:**
```
1. Click "Disconnect" (top right)
2. Click "Connect with Spotify" again
3. This creates a fresh session
```

### Issue 3: Search button does nothing

**Cause:** Multiple possible reasons.

**Fix:**
```
1. Open browser console (F12)
2. Click "Search"
3. Look for error messages:
   - "No session provided" → Not connected, reconnect
   - "401" → Session expired, reconnect
   - "Network error" → Check internet connection
```

### Issue 4: "No concerts found"

**Cause:** No events in that location, OR no Ticketmaster API key.

**Fix:**
```
1. Try a bigger city (e.g., "New York, NY" or "Los Angeles, CA")
2. If no API key, it will use mock data (6 concerts)
3. Check console for: "Using mock concert data"
```

## 🎵 How to Verify It's Working

### When Demo Mode Works:
```
✓ You see artist cards in "My Music"
✓ You see concert cards in "Concerts"  
✓ Filters work (genre, price, budget)
✓ Sort options work
✓ = App is functioning correctly!
```

### When Real Spotify Works:
```
✓ After clicking "Connect with Spotify"
✓ You're redirected to Spotify's website
✓ You authorize the app
✓ You're redirected back
✓ URL has ?session=... in it
✓ You see YOUR actual artists and tracks
✓ Success message appears
✓ = Spotify OAuth is working!
```

### When Concert Search Works:
```
✓ Click "Search" button
✓ See toast: "Searching concerts near [city]..."
✓ Loading spinner appears
✓ Concerts appear (6-50 depending on API key)
✓ Each concert has a vibe score
✓ Success message: "Found X concerts!"
✓ = Backend is working!
```

## 📊 Debug Checklist

Go through this checklist:

- [ ] Environment variables are set (all 7 secrets)
- [ ] Redirect URI is copied correctly
- [ ] Redirect URI is added to Spotify Dashboard
- [ ] Clicked "SAVE" in Spotify Dashboard
- [ ] Waited 30-60 seconds after saving
- [ ] Tried Demo Mode (to confirm app works)
- [ ] Browser console is open (F12)
- [ ] No ad blockers blocking requests
- [ ] Using HTTPS (not HTTP)

## 🚀 Quick Test Flow

**5-Minute Full Test:**

```
1. [30 sec] Click "Try Demo Mode"
   → Verify app loads and filters work

2. [2 min] Add redirect URI to Spotify Dashboard
   → Copy from setup helper
   → Paste in Spotify settings
   → Click ADD → SAVE
   
3. [1 min] Wait 60 seconds
   → Spotify needs time to update

4. [30 sec] Click "Connect with Spotify"
   → Authorize on Spotify
   → Redirected back
   
5. [1 min] Test search
   → Go to "Concerts" tab
   → Click "Search"
   → See your personalized concerts!
```

## 💡 Pro Tips

1. **Always try Demo Mode first** - confirms the app is working
2. **Check browser console** - see detailed error messages
3. **Wait after saving** - Spotify needs 30-60 seconds to propagate changes
4. **Use full city names** - "Los Angeles, CA" not "LA"
5. **Bigger cities = more concerts** - try NYC, LA, Chicago, Austin

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Demo mode shows data
2. ✅ Spotify login redirects you
3. ✅ You see YOUR artists (not demo data)
4. ✅ Search returns concerts
5. ✅ Vibe scores appear (0-100%)
6. ✅ Filters work
7. ✅ No error messages in console

---

## 🔐 Security Note

Your Spotify Client Secret is safely stored in Supabase environment variables and is never exposed to the frontend. Good job keeping it secure! 🔒

---

## 📞 Still Having Issues?

If you're still stuck:

1. Open browser console (F12)
2. Click "Connect with Spotify"
3. Copy the error message
4. Check the specific error below:

### Error: "INVALID_CLIENT: Invalid redirect URI"
→ Redirect URI not added to Spotify Dashboard, or doesn't match exactly

### Error: "access_denied"
→ You clicked "Cancel" on Spotify's authorization page
→ Solution: Try again and click "Agree"

### Error: "No session provided"
→ Not connected to Spotify yet
→ Solution: Click "Connect with Spotify"

### Error: "Session expired"
→ Your session is old (happens after a while)
→ Solution: Logout and reconnect

---

## 🎯 Next Steps

Once connected:

1. ✅ Go to "My Music" tab → See your profile
2. ✅ Click on genre categories → Filter tracks
3. ✅ Go to "Concerts" tab → Search your city
4. ✅ Click "Show Filters" → Apply filters
5. ✅ Sort by vibe score → See best matches
6. ✅ Click "Get Tickets" → Buy tickets!

**Enjoy discovering concerts perfectly matched to your music taste! 🎵🎉**
