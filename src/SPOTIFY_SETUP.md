# 🎵 Spotify OAuth Setup - FINAL INSTRUCTIONS

## ✅ GOOD NEWS!
I've fixed the 401 error! The redirect URI issue is now resolved.

---

## 🎯 What You Need to Do

### Step 1: Get Your App URL
1. Look at your browser's address bar right now
2. Copy the full URL (it should look like: `https://something.figma.com` or similar)
3. **That's your redirect URI!**

### Step 2: Add It to Spotify
1. Go to https://developer.spotify.com/dashboard
2. Click your app
3. Click **"Settings"** (top right)
4. Scroll to **"Redirect URIs"**
5. **Remove the old Supabase callback URL** if you added it earlier
6. **Add your app URL** (the one from Step 1)
7. Click **"ADD"**
8. Click **"SAVE"**
9. Wait 60 seconds

### Step 3: Test It!
1. Come back to HeadTap
2. Click **"Connect with Spotify"**
3. It should work! 🎉

---

## 🔧 What I Fixed

**The Problem:**
- Spotify wouldn't allow `http://localhost:5173` in production (not secure)
- The old Supabase callback URL got a 401 error (missing auth header)

**The Solution:**
- Your app now uses its own HTTPS URL as the redirect
- When Spotify redirects back, your app handles the code
- Your app then calls the backend WITH proper authentication
- No more 401 errors! ✅

---

## 📋 Example

If your app is running at:
```
https://my-headtap-app.figma.com
```

Then your Spotify Redirect URI should be exactly:
```
https://my-headtap-app.figma.com
```

**NOT:**
- ~~http://localhost:5173~~ ❌ (not secure)
- ~~https://fycepbloyompgfqaoqvq.supabase.co/functions/v1/...~~ ❌ (causes 401)

---

## ❓ Troubleshooting

### Still getting "Invalid redirect URI"?
- Make sure the URL matches EXACTLY (no typos)
- No trailing slash
- Must be HTTPS (not HTTP)
- Wait 60 seconds after saving

### Getting a different error?
- Open browser console (F12)
- Look for the log message: "Auth URL generated with redirect_uri:"
- That shows what URL is being used
- Make sure that exact URL is in your Spotify settings

### Need help?
The app will automatically detect your URL and use it. Just:
1. Click "Connect with Spotify"
2. Check the browser console for the redirect_uri
3. Add that exact URL to Spotify Dashboard

---

## 🎉 That's It!

Once you add your app's HTTPS URL to Spotify, everything will work perfectly!

The OAuth flow is now:
1. You click "Connect with Spotify"
2. Your app generates an auth URL using its own URL as redirect
3. Spotify redirects back to your app
4. Your app exchanges the code for tokens (with proper auth!)
5. You're connected! 🎵

**No more 401 errors!**
