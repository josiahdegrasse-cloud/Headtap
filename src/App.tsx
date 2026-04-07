import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
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
      console.log('🔑 Code:', code.substring(0, 20) + '...');
      
      const response = await fetch(`${baseUrl}/spotify/exchange-code`, {
        method: 'POST',
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
        const errorText = await response.text();
        console.error('Token exchange error response:', errorText);
        
        // Try to parse as JSON for better error message
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Error details:', errorJson);
          
          // Show detailed error information
          if (errorJson.details) {
            console.error('Spotify API Error:', errorJson.details);
            const spotifyError = errorJson.details.error_description || errorJson.details.error || 'Unknown error';
            
            // Check for Premium requirement error
            if (spotifyError.toLowerCase().includes('premium')) {
              toast.error('Spotify Premium required to connect. Try Demo Mode instead!', { duration: 10000 });
            } else if (spotifyError.toLowerCase().includes('user') || spotifyError.toLowerCase().includes('limit')) {
              toast.error('User limit reached (5 max in Development Mode). Try Demo Mode!', { duration: 10000 });
            } else {
              toast.error(`Spotify says: ${spotifyError}`, { duration: 8000 });
            }
          } else {
            toast.error(`Error: ${errorJson.error || 'Unknown error'}`, { duration: 8000 });
          }
        } catch {
          // Check status code for common issues
          if (response.status === 403) {
            toast.error('Spotify Premium required or user limit reached. Try Demo Mode!', { duration: 10000 });
          } else {
            toast.error(`Failed to connect: ${response.status} ${response.statusText}. Try Demo Mode!`, { duration: 8000 });
          }
        }
        throw new Error('Failed to exchange code for tokens');
      }

      const data = await response.json();
      console.log('Token exchange successful, session ID:', data.sessionId);
      
      const newSessionId = data.sessionId;
      setSessionId(newSessionId);
      localStorage.setItem('spotify_session', newSessionId);
      toast.success('Connected to Spotify successfully!');
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/');
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      toast.error('Failed to connect to Spotify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for Spotify OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const sessionParam = params.get('session');
    
    if (error) {
      console.error('Spotify OAuth error:', error);
      toast.error(`Spotify connection failed: ${error}`);
      return;
    }
    
    // If we have an OAuth code, exchange it for tokens
    if (code) {
      console.log('OAuth code received, exchanging for tokens...');
      exchangeCodeForTokens(code);
      return;
    }
    
    if (sessionParam) {
      // Session ID from successful callback
      setSessionId(sessionParam);
      localStorage.setItem('spotify_session', sessionParam);
      toast.success('Connected to Spotify successfully!');
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/');
    } else {
      // Check for existing session
      const savedSession = localStorage.getItem('spotify_session');
      const savedDemoMode = localStorage.getItem('demo_mode');
      
      if (savedSession) {
        setSessionId(savedSession);
      } else if (savedDemoMode === 'true') {
        setDemoMode(true);
      }
    }
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
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      console.log('📡 Auth URL response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get auth URL:', errorText);
        
        // Try to parse error details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Error details:', errorJson);
          toast.error(`Connection failed: ${errorJson.error || errorJson.message || 'Unknown error'}`, { duration: 10000 });
        } catch {
          toast.error(`Failed to connect to Spotify server (${response.status}). Please check console for details.`, { duration: 10000 });
        }
        
        throw new Error('Failed to get authorization URL');
      }

      const data = await response.json();
      console.log('Auth URL generated with redirect_uri:', data.redirect_uri);
      
      // Redirect to Spotify authorization
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast.error('Failed to connect to Spotify. Please try again or use Demo Mode.', { duration: 10000 });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSessionId(null);
    setDemoMode(false);
    localStorage.removeItem('spotify_session');
    localStorage.removeItem('demo_mode');
    toast.info('Disconnected from Spotify');
  };

  const handleDemoMode = () => {
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