import { Button } from './ui/button';
import { Music, ChevronDown, ChevronUp } from 'lucide-react';
import { SpotifySetupHelper } from './SpotifySetupHelper';
import { useState } from 'react';

interface ConnectSpotifyProps {
  onConnect: () => void;
  onDemo?: () => void;
  loading?: boolean;
}

export function ConnectSpotify({ onConnect, onDemo, loading }: ConnectSpotifyProps) {
  const [showSetup, setShowSetup] = useState(false);

  // Auto-show setup helper if there's an OAuth error in the URL
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setShowSetup(true);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-4">
      <div className="text-center text-white max-w-2xl w-full space-y-6">
        <div className="flex justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-full p-8">
            <Music className="w-20 h-20" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold">HeadTap</h1>
        <p className="text-xl text-white/90">
          Discover concerts from your favorite artists, tailored to your music taste
        </p>
        
        {/* Setup Helper - Collapsible */}
        <div className="w-full">
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="w-full text-left bg-white/5 hover:bg-white/10 backdrop-blur-lg rounded-lg p-3 mb-2 transition-colors flex items-center justify-between"
          >
            <span className="text-sm font-medium">
              Getting "Invalid redirect URI" error? Click here
            </span>
            {showSetup ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          
          {showSetup && (
            <div className="mb-4">
              <SpotifySetupHelper />
            </div>
          )}
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">How it works</h2>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold">1</span>
              </div>
              <p className="text-sm">Connect your Spotify account</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold">2</span>
              </div>
              <p className="text-sm">We analyze your music preferences</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold">3</span>
              </div>
              <p className="text-sm">Get personalized concert recommendations</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={onConnect}
            disabled={loading}
            size="lg"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-6 text-lg rounded-full"
          >
            {loading ? 'Connecting...' : 'Connect with Spotify'}
          </Button>
          
          {onDemo && (
            <Button
              onClick={onDemo}
              size="lg"
              variant="outline"
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold px-8 py-6 text-lg rounded-full backdrop-blur-lg"
            >
              Try Demo Mode
            </Button>
          )}
        </div>
        
        <p className="text-xs text-white/60 mt-6">
          We only read your music preferences. We never post or modify anything.
        </p>
      </div>
    </div>
  );
}