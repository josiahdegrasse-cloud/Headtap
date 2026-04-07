# 🚀 HeadTap Quick Start Guide

## 🎯 You're Getting This Error:
```
INVALID_CLIENT: Invalid redirect URI
```

## ✅ Here's How to Fix It (2 minutes):

### Step 1: Get Your Redirect URI (30 seconds)

**On your HeadTap login page:**
1. Look for the button that says **"Getting 'Invalid redirect URI' error? Click here"**
2. Click it to expand
3. Click the **"Copy"** button
4. ✅ Your redirect URI is now in your clipboard!

### Step 2: Add to Spotify (90 seconds)

1. Open [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) in a new tab
2. Log in with your Spotify account
3. Click on your app (or create a new one if you don't have one)
4. Click **"Settings"** or **"Edit Settings"**
5. Find the **"Redirect URIs"** section
6. **Paste** the URI you copied (Ctrl+V or Cmd+V)
7. Click **"Add"**
8. Click **"Save"** at the bottom
9. ✅ Done!

### Step 3: Test It (10 seconds)

1. Go back to your HeadTap app
2. Click **"Connect with Spotify"**
3. ✅ You should now see Spotify's login page!

---

## 🎵 What Your Redirect URI Looks Like

It should look like this (your project ID will be different):
```
https://abcdefghijklmnop.supabase.co/functions/v1/make-server-a9c438e5/spotify/callback
```

**Important:**
- ✅ Starts with `https://`
- ✅ Ends with `/spotify/callback`
- ✅ No trailing slash
- ✅ Exactly matches what's in the helper

---

## 🔑 Your Spotify App Settings

You also need to make sure these are set correctly:

### Client ID & Secret
1. In Spotify Developer Dashboard, you'll see your **Client ID**
2. Click **"View client secret"** to see your **Client Secret**
3. These should already be set in your Supabase environment variables:
   - `SPOTIFY_CLIENT_ID` ✅
   - `SPOTIFY_CLIENT_SECRET` ✅

If you need to update them, do it in your Supabase project settings.

---

## 🎉 After Setup

Once connected, HeadTap will:
- ✅ Analyze your Spotify listening history
- ✅ Show your top artists and tracks
- ✅ Find concerts near you
- ✅ Score concerts based on your music taste (0-100%)
- ✅ Explain WHY each concert matches your vibe
- ✅ Auto-refresh your tokens (never expires!)

---

## 🆘 Still Having Issues?

### Error: "Invalid Client"
- Your Client ID or Secret is wrong
- Double-check they're set correctly in Supabase

### Error: "Access Denied"
- You clicked "Cancel" on Spotify's page
- Just try connecting again

### Redirect URI Still Not Working
1. Make sure you copied the EXACT URI from the helper (don't type it manually)
2. Make sure you clicked "Save" in Spotify Dashboard
3. Wait 10-30 seconds for Spotify's cache to update
4. Try again

### Nothing Happens When I Click Connect
- Check your browser console for errors
- Make sure JavaScript is enabled
- Try a different browser

---

## 📚 More Info

- **Full backend guide:** [SUPABASE_BACKEND_GUIDE.md](./SUPABASE_BACKEND_GUIDE.md)
- **Detailed OAuth setup:** [SPOTIFY_OAUTH_SETUP.md](./SPOTIFY_OAUTH_SETUP.md)

---

## ✨ Pro Tips

1. **Demo Mode:** Don't want to connect Spotify? Click "Try Demo Mode" to see what the app looks like
2. **Token Refresh:** Your Spotify connection automatically renews - you'll never need to reconnect!
3. **Privacy:** HeadTap only READS your music data. It never posts, modifies, or shares anything.
4. **Offline:** Once you connect, your music profile is cached for faster loading

---

**Ready to discover amazing concerts? Fix that redirect URI and let's go! 🎸🎤**
