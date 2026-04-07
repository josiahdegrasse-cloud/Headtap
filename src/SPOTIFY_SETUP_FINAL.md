# ✅ Final Spotify OAuth Setup

## 🔐 Your Configuration (Confirmed)

✅ **Spotify Client ID:** e938cd4285c4475cad88dd699ebc28e2  
✅ **Spotify Client Secret:** 0c8b3780a6804f5aa1cb0134ac1a889c (stored securely)  
✅ **Supabase Project ID:** fycepbloyompgfqaoqvq

---

## 🎯 Your Exact Redirect URI

**Copy this EXACT URI and add it to your Spotify Dashboard:**

```
https://fycepbloyompgfqaoqvq.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
```

---

## 📝 Step-by-Step Instructions (2 Minutes)

### Step 1: Go to Spotify Developer Dashboard
**URL:** https://developer.spotify.com/dashboard

### Step 2: Select Your App
- If you already have an app, click on it
- If not, click **"Create App"**:
  - App Name: `HeadTap` (or any name)
  - App Description: `Concert discovery app`
  - Redirect URI: (you'll add this in the next step)
  - Check: Web API
  - Click **"Save"**

### Step 3: Add Redirect URI
1. Click your app to open it
2. Click **"Settings"** (top right button)
3. Scroll down to **"Redirect URIs"**
4. Click **"Add"** or the edit button
5. **Paste this EXACT URI:**
   ```
   https://fycepbloyompgfqaoqvq.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
   ```
6. Click **"ADD"** (the green button)
7. Scroll to the bottom and click **"SAVE"** (very important!)

### Step 4: Wait
⏰ **Wait 30-60 seconds** for Spotify to propagate the changes

### Step 5: Test Connection
1. Go back to your HeadTap app
2. Click **"Connect with Spotify"**
3. You'll be redirected to Spotify
4. Click **"Agree"** to authorize
5. You'll be redirected back to HeadTap
6. ✅ Success! You should see your music profile!

---

## ✅ Verification Checklist

Before clicking "Connect with Spotify", verify:

- [ ] Client ID matches: `e938cd4285c4475cad88dd699ebc28e2`
- [ ] Client Secret is set (already stored in Supabase)
- [ ] Redirect URI is EXACTLY: `https://fycepbloyompgfqaoqvq.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback`
- [ ] Clicked "ADD" in Spotify Dashboard
- [ ] Clicked "SAVE" at the bottom
- [ ] Waited at least 30 seconds

---

## 🎯 What Should Happen

### When You Click "Connect with Spotify":

```
1. HeadTap redirects you to Spotify's website
   URL: https://accounts.spotify.com/authorize?client_id=e938cd...

2. Spotify shows authorization page:
   "HeadTap wants to access your Spotify data"
   - View your top artists
   - View your recently played tracks
   - Access your library

3. You click "AGREE"

4. Spotify redirects back to:
   https://fycepbloyompgfqaoqvq.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback?code=...

5. Backend exchanges code for access token

6. You're redirected to HeadTap:
   https://[your-app-url]/?session=abc123...

7. ✅ Success! You see your music profile
```

---

## 🐛 Common Errors & Fixes

### Error: "INVALID_CLIENT: Invalid redirect URI"

**Cause:** Redirect URI doesn't match exactly

**Fix:**
1. Go back to Spotify Dashboard
2. Check the redirect URI - must be EXACTLY:
   ```
   https://fycepbloyompgfqaoqvq.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
   ```
3. Common mistakes:
   - ❌ Extra space at the end
   - ❌ Missing `/spotify/callback`
   - ❌ Wrong project ID
   - ❌ `http://` instead of `https://`
4. After fixing, click SAVE
5. Wait 30-60 seconds
6. Try again

### Error: "access_denied"

**Cause:** You clicked "Cancel" on Spotify's authorization page

**Fix:**
1. Click "Connect with Spotify" again
2. This time click "AGREE"

### Error: "Session expired"

**Cause:** Your session is old (tokens last 1 hour)

**Fix:**
1. Click "Disconnect"
2. Click "Connect with Spotify" again
3. Fresh session created!

---

## 🎵 After Successful Connection

Once connected, you can:

1. **View Your Music Profile**
   - Go to "My Music" tab
   - See your top 50 artists
   - See your top 20 tracks
   - Genre breakdown
   - Category filtering

2. **Search for Concerts**
   - Go to "Concerts" tab
   - Click "Search" (defaults to New York, NY)
   - Or type your city and click "Search"
   - See personalized recommendations!

3. **Use Advanced Filters**
   - Click "Show Filters"
   - Select genres (multiple)
   - Set price range
   - Joint budget calculator (for groups)
   - Sort by vibe, price, or date

---

## 🚀 Quick Test

**Right now, without connecting Spotify:**

1. Click **"Try Demo Mode"**
2. Click "Search" button
3. Open console (F12)
4. See the emoji logs:
   ```
   🔍 Search button clicked!
   📍 Location: New York, NY
   🎵 Session ID: Valid
   🎭 Demo Mode: true
   📋 Using demo data (no API calls)
   ```

This confirms the search button is working!

---

## 📊 Your Configuration Summary

```yaml
Frontend:
  - App running on Figma Make
  - Using React + TypeScript
  - Tailwind CSS v4

Backend:
  - Supabase Edge Functions
  - Project ID: fycepbloyompgfqaoqvq
  - Server path: /make-server-a9c438e5

Spotify OAuth:
  - Client ID: e938cd4285c4475cad88dd699ebc28e2
  - Client Secret: 0c8b3780a6804f5aa1cb0134ac1a889c (secure)
  - Redirect URI: https://fycepbloyompgfqaoqvq.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
  - Scopes: user-top-read, user-read-recently-played, user-library-read

APIs:
  - Spotify Web API (for music data)
  - Ticketmaster Discovery API (for concerts)
  - OpenStreetMap Nominatim (for geocoding)

Features:
  - Auto token refresh (no manual re-auth needed)
  - Vibe scoring algorithm
  - Advanced filtering
  - Demo mode
```

---

## 🎯 Your Next Steps

1. **⏱️ 30 seconds:** Try Demo Mode right now
2. **⏱️ 2 minutes:** Add redirect URI to Spotify Dashboard
3. **⏱️ 1 minute:** Wait for Spotify to update
4. **⏱️ 30 seconds:** Click "Connect with Spotify"
5. **⏱️ 1 minute:** Search for concerts in your city!

**Total time: 5 minutes to full functionality! 🎉**

---

## 💡 Pro Tips

1. **Bookmark your Spotify Dashboard** - https://developer.spotify.com/dashboard
2. **Keep console open (F12)** - see detailed logs
3. **Try Demo Mode first** - see how everything works
4. **Use bigger cities** - more concerts available (NYC, LA, Chicago, Austin)
5. **Joint budget is powerful** - perfect for groups planning together

---

## 🔗 Quick Links

- **Spotify Developer Dashboard:** https://developer.spotify.com/dashboard
- **Spotify API Docs:** https://developer.spotify.com/documentation/web-api
- **Your Supabase Project:** https://fycepbloyompgfqaoqvq.supabase.co

---

## ✅ Ready!

Your HeadTap app is **fully configured** and ready to use!

**All you need to do:**
1. Add the redirect URI to Spotify Dashboard (copy from above)
2. Click "Connect with Spotify"
3. Start discovering concerts! 🎸🎤🎹

**Or try Demo Mode right now - no setup needed!**
