# 🔧 Fixing "Invalid Redirect URI" Error

## Quick Fix

Your app now has a built-in setup helper! Just:

1. **Click "Getting 'Invalid redirect URI' error? Click here"** on the login page
2. **Copy the redirect URI** shown
3. **Go to Spotify Developer Dashboard** and add it

## Detailed Instructions

### Step 1: Get Your Redirect URI

**Option A: Use the built-in helper (easiest)**
- On your HeadTap login page, click the dropdown that says "Getting 'Invalid redirect URI' error?"
- Click the "Copy" button to copy your exact redirect URI

**Option B: Call the debug endpoint manually**
1. Open your browser console
2. Run this (replace {projectId} with your actual project ID):
```javascript
fetch('https://{projectId}.supabase.co/functions/v1/make-server-a9c438e5/debug/redirect-uri')
  .then(r => r.json())
  .then(d => console.log(d.redirect_uri))
```

The redirect URI will look like:
```
https://xxxxxxxxxxxxxx.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
```

### Step 2: Add to Spotify Developer Dashboard

1. **Go to** [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

2. **Sign in** with your Spotify account

3. **Find or create your app:**
   - If you already have an app: Click on it
   - If not: Click "Create app"
     - App name: `HeadTap` (or whatever you prefer)
     - App description: `Concert discovery app`
     - Redirect URI: Paste the URI you copied (don't save yet, we'll add it properly below)
     - Check the boxes to agree to terms
     - Click "Save"

4. **Add the Redirect URI:**
   - Click "Settings" or "Edit Settings"
   - Scroll to "Redirect URIs"
   - Paste your redirect URI (the one you copied)
   - Click "Add"
   - Click "Save" at the bottom

5. **Copy your Client ID and Client Secret:**
   - You should see "Client ID" at the top
   - Click "View client secret" to reveal it
   - Copy both and keep them handy

### Step 3: Set Environment Variables

You've already set these, but just to confirm:

- ✅ `SPOTIFY_CLIENT_ID` - Set
- ✅ `SPOTIFY_CLIENT_SECRET` - Set

If you need to update them, use the Supabase secrets manager.

### Step 4: Test

1. Wait a few seconds for Spotify to update (usually instant)
2. Go back to your HeadTap app
3. Click "Connect with Spotify"
4. You should be redirected to Spotify's authorization page
5. After approving, you'll be redirected back to HeadTap with your music data!

## Common Issues

### "The redirect URI still doesn't work"

**Check these:**
1. ✅ The URI is EXACTLY the same (copy from the helper, don't type it)
2. ✅ No trailing slash at the end
3. ✅ Starts with `https://` not `http://`
4. ✅ You clicked "Save" in Spotify Dashboard
5. ✅ Wait 10-30 seconds for Spotify's cache to clear

### "Invalid Client" error

This means your Client ID or Client Secret is wrong:
1. Double-check you set `SPOTIFY_CLIENT_ID` correctly
2. Double-check you set `SPOTIFY_CLIENT_SECRET` correctly
3. Make sure there are no extra spaces or quotes

### "Access Denied" or permissions error

This is normal if you:
- Clicked "Cancel" on Spotify's authorization page
- Just go back and click "Connect with Spotify" again

## Example Redirect URI

Your redirect URI should look like this:

```
https://abcdefghijklmnop.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
```

**Important parts:**
- `https://` - Must be HTTPS
- `abcdefghijklmnop.supabase.co` - Your Supabase project URL
- `/functions/v1/make-server-a9c438e5/spotify/callback` - The callback path

## Still Having Issues?

1. Check the browser console for errors
2. Check your Supabase function logs
3. Make sure your Spotify app is not in "Development Mode" quota limits
4. Try logging out of Spotify and back in
5. Clear your browser cache and cookies

## Success! 🎉

Once it works, you'll:
1. Be redirected to Spotify to authorize
2. See your top artists and tracks
3. Get personalized concert recommendations
4. Never have to do this setup again!

The app will automatically refresh your Spotify tokens, so you won't need to reconnect unless you explicitly disconnect.
