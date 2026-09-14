import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { validateAuthorization, validCallbackState } from './utils/oauth';
import { projectId, publicAnonKey } from './utils/supabase/info';

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const exchangeCodeForTokens = async (code: string) => {
    setLoading(true);
    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5`;
      const appUrl = window.location.origin; // Get the current app URL

      console.log('🔄 Exchanging code for tokens...');
      console.log('📍 App URL:', appUrl);


      const response = await fetch(`${baseUrl}/spotify/exchange-code`, {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: appUrl // Must match the redirect_uri used to get the code
        }),
      });

      console.log(' Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Spotify connection failed (${response.status}). Please try connecting again.`);
      }

      const data = await response.json();
      if (typeof data.sessionId !== 'string' || !data.sessionId) {
        throw new Error('Server returned an invalid session');
      }

      const newSessionId = data.sessionId;
      setSessionId(newSessionId);
      localStorage.setItem('spotify_session', newSessionId);
      toast.success('Connected to Spotify successfully!');

      // Clean up URL
      window.history.replaceState({}, document.title, '/');
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect to Spotify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for Spotify OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const state = params.get('state');
    const expectedState = sessionStorage.getItem('spotify_oauth_state');

    if (error) {
      sessionStorage.removeItem('spotify_oauth_state');
      window.history.replaceState({}, document.title, window.location.pathname);
      console.error('Spotify OAuth error:', error);
      toast.error(`Spotify connection failed: ${error}`);
      return;
    }

    // If we have an OAuth code, exchange it for tokens
    if (code) {
      sessionStorage.removeItem('spotify_oauth_state');
      window.history.replaceState({}, document.title, window.location.pathname);
      if (!validCallbackState(state, expectedState)) {
        toast.error('Spotify sign-in expired or could not be verified. Please connect again.');
        return;
      }
      console.log('OAuth code received, exchanging for tokens...');
      exchangeCodeForTokens(code);
      return;
    }

    const savedSession = localStorage.getItem('spotify_session');
    const savedDemoMode = localStorage.getItem('demo_mode');
    if (savedSession) setSessionId(savedSession);
    else if (savedDemoMode === 'true') setDemoMode(true);

  }, []);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('spotify_session', sessionId);
      localStorage.removeItem('demo_mode');
    }
  }, [sessionId]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5`;
      const appUrl = window.location.origin; // Get the current app URL (https://...)

      console.log('🔗 Connecting to Spotify...');
      console.log('📍 Base URL:', baseUrl);
      console.log('📍 App URL:', appUrl);
      console.log('🔑 Project ID:', projectId);

      const response = await fetch(`${baseUrl}/spotify/auth-url?app_url=${encodeURIComponent(appUrl)}`, {
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      console.log('📡 Auth URL response status:', response.status);

      if (!response.ok) throw new Error(`The music connection service is unavailable (${response.status}). Try Demo Mode.`);

      const data = await response.json();
      console.log('Auth URL generated with redirect_uri:', data.redirect_uri);

      const authorizationUrl = validateAuthorization(data, appUrl);
      sessionStorage.setItem('spotify_oauth_state', data.state);
      window.location.href = authorizationUrl;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast.error('The music connection service is unavailable. Try Demo Mode while the connection is restored.', { duration: 10000 });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSessionId(null);
    setDemoMode(false);
    localStorage.removeItem('spotify_session');
    localStorage.removeItem('demo_mode');
    sessionStorage.removeItem('spotify_oauth_state');
    toast.info('Disconnected from Spotify');
  };

  const handleDemoMode = () => {
    setSessionId(null);
    localStorage.removeItem('spotify_session');
    setDemoMode(true);
    localStorage.setItem('demo_mode', 'true');
    toast.success('Welcome to demo mode!');
  };

  return (
    <>
      {sessionId || demoMode ? (
        <Dashboard sessionId={sessionId} onLogout={handleLogout} demoMode={demoMode} />
      ) : (
        <LandingPage onConnect={handleConnect} onDemo={handleDemoMode} loading={loading} />
      )}
      <Toaster />
    </>
  );
}
