# 🔧 HeadTap Troubleshooting Guide

## "INVALID_CLIENT: Invalid redirect URI" Error

This is the most common setup error. Here's how to fix it step by step:

### ✅ Step-by-Step Fix

1. **Open your HeadTap app** and click **"Getting 'Invalid redirect URI' error? Click here"**

2. **Click "Copy"** to copy your exact redirect URI to clipboard

3. **Go to** [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

4. **Log in** with your Spotify account

5. **Find or create your app:**
   - If you see your HeadTap app: Click on it
   - If not: Click **"Create app"**

6. **Click "Settings"** (or "Edit Settings")

7. **Scroll to "Redirect URIs"** section

8. **Paste your redirect URI** (the one you copied in step 2)

9. **Click "Add"** then **"Save"**

10. **Wait 30 seconds** for Spotify to update

11. **Try connecting again!**

### 🔍 Use the Diagnostics Tool

In the setup helper, click **"🔧 Show Diagnostics"** to see:

- ✓ Is Supabase URL set?
- ✓ Is Spotify Client ID set?
- ✓ Is Spotify Client Secret set?
- ✓ Is your redirect URI valid?

**All should show green checkmarks!**

### 🚨 Common Mistakes

#### ❌ Wrong: Adding the wrong URI
```
http://localhost:3000/callback           ← Wrong (localhost)
https://example.com/callback              ← Wrong (not your Supabase URL)
https://xxx.supabase.co/callback          ← Wrong (missing full path)
```

#### ✅ Correct: Should look like this
```
https://abcdefghijklmnop.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
```

#### ❌ Wrong: Typos or missing parts
- Extra spaces before/after the URI
- Missing `https://`
- Missing `/functions/v1/make-server-a9c438e5/spotify/callback`
- Adding a trailing slash at the end

#### ✅ Correct: Copy from the helper, don't type manually!

### 🔑 Check Your Credentials

Make sure these are set in your Supabase project:

1. **SPOTIFY_CLIENT_ID** - From your Spotify Developer Dashboard
2. **SPOTIFY_CLIENT_SECRET** - From your Spotify Developer Dashboard (click "View client secret")

**How to check:**
- In the setup helper, expand "🔧 Show Diagnostics"
- You should see:
  - `✓ Spotify Client ID: abc12345...`
  - `✓ Spotify Client Secret: Set (32 chars)`

**If they show `✗ Missing`:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click your app
3. Copy the Client ID
4. Click "View client secret" and copy it
5. Update them in your Supabase environment variables

---

## Other Common Issues

### "Access Denied" Error

**Cause:** You clicked "Cancel" on Spotify's authorization page

**Fix:** Just try connecting again and click "Agree" this time

### Nothing Happens When Clicking "Connect with Spotify"

**Possible causes:**
1. JavaScript is disabled in your browser
2. Pop-up blocker is blocking the redirect
3. Browser extension is interfering

**Fix:**
1. Check browser console for errors (F12 → Console tab)
2. Disable pop-up blocker for this site
3. Try a different browser (Chrome, Firefox, Safari)
4. Try incognito/private mode

### "Failed to fetch authorization URL"

**Cause:** Backend is not responding

**Fix:**
1. Check that your Supabase edge function is deployed
2. Wait a few minutes and try again
3. Check Supabase function logs for errors

### Concerts Not Loading

**Possible causes:**
1. No Ticketmaster API key set
2. Network error
3. Location geocoding failed

**Fix:**
1. Check if `TICKETMASTER_API_KEY` is set in Supabase
2. Try a different location (e.g., "New York, NY")
3. Click "Locate Me" to use your current location
4. Check browser console for error messages

### Music Profile Shows Wrong Data

**Cause:** Cached data from previous session

**Fix:**
1. Log out and log back in
2. Music profiles are cached for 1 hour
3. After 1 hour, the data will refresh automatically

### Low Match Scores for All Concerts

**This is normal!** It means:
- The artists performing don't match your music taste
- Try searching concerts in a different city
- Try using "Demo Mode" to see how high match scores look

---

## 🔬 Advanced Debugging

### Check Backend Health

Open this URL in your browser (replace `{projectId}` with your Supabase project ID):
```
https://{projectId}.supabase.co/functions/v1/make-server-a9c438e5/health
```

**Should return:**
```json
{"status":"ok"}
```

### Check Environment Variables

```
https://{projectId}.supabase.co/functions/v1/make-server-a9c438e5/debug/env-check
```

**Should show:**
- `supabase_url.set: true`
- `spotify_client_id.set: true`
- `spotify_client_secret.set: true`
- `redirect_uri.valid: true`

### Check Your Redirect URI

```
https://{projectId}.supabase.co/functions/v1/make-server-a9c438e5/debug/redirect-uri
```

**Copy the `redirect_uri` value** and make sure it's in your Spotify app settings

### Browser Console Logs

1. Open browser console (F12)
2. Go to "Console" tab
3. Look for red error messages
4. Common errors:
   - `401 Unauthorized` → Session expired, log out and log back in
   - `Failed to fetch` → Network error or backend down
   - `Invalid session` → Clear localStorage and reconnect

### Supabase Function Logs

1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. Click on your function
4. View the logs for error messages

---

## 📝 Checklist: Is Everything Set Up?

Use this checklist to verify your setup:

- [ ] Spotify app created in Developer Dashboard
- [ ] Client ID copied and set in Supabase as `SPOTIFY_CLIENT_ID`
- [ ] Client Secret copied and set in Supabase as `SPOTIFY_CLIENT_SECRET`
- [ ] Redirect URI copied from the helper
- [ ] Redirect URI added to Spotify app settings (Settings → Redirect URIs)
- [ ] Clicked "Save" in Spotify Dashboard
- [ ] Waited 30+ seconds for Spotify to update
- [ ] All diagnostics show green checkmarks ✓
- [ ] Tried connecting to Spotify

---

## 🆘 Still Not Working?

If you've tried everything above:

1. **Clear browser cache and cookies**
2. **Try incognito/private mode**
3. **Try a different browser**
4. **Check Spotify API status:** [status.spotify.com](https://status.spotify.com)
5. **Wait 24 hours** - Sometimes Spotify takes time to propagate changes

### Last Resort: Create a New Spotify App

1. Go to Spotify Developer Dashboard
2. Create a brand new app
3. Copy the NEW Client ID and Secret
4. Update your Supabase environment variables
5. Add the redirect URI to the new app
6. Try connecting again

---

## ✅ Success Indicators

You know it's working when:

1. ✅ Clicking "Connect with Spotify" redirects to Spotify's login page
2. ✅ After logging in, you see a permission request screen
3. ✅ After accepting, you're redirected back to HeadTap
4. ✅ You see your top artists and tracks
5. ✅ Concerts load with match scores
6. ✅ Match reasons appear on concert cards

---

## 💡 Pro Tips

- **Use Demo Mode** to see what the app should look like when working
- **Check diagnostics first** - saves time debugging
- **Copy, don't type** - Always use the copy button for redirect URI
- **Be patient** - Spotify can take 30-60 seconds to update settings
- **One-time setup** - Once it works, you never have to do this again!

---

**Need more help? Check the other guides:**
- [QUICK_START.md](./QUICK_START.md) - 2-minute quick fix
- [SPOTIFY_OAUTH_SETUP.md](./SPOTIFY_OAUTH_SETUP.md) - Detailed setup guide
- [SUPABASE_BACKEND_GUIDE.md](./SUPABASE_BACKEND_GUIDE.md) - Backend documentation
