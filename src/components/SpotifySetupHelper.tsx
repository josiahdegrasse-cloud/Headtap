import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Copy, CheckCircle, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface EnvCheck {
  status: string;
  supabase_url: { set: boolean; value: string };
  spotify_client_id: { set: boolean; value: string; length: number };
  spotify_client_secret: { set: boolean; length: number };
  redirect_uri: { value: string; valid: boolean };
  instructions: string[];
}

export function SpotifySetupHelper() {
  const [envData, setEnvData] = useState<EnvCheck | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const appUrl = window.location.origin; // Get the actual app URL

  useEffect(() => {
    fetchEnvCheck();
  }, []);

  const fetchEnvCheck = async () => {
    setLoading(true);
    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5`;
      const response = await fetch(`${baseUrl}/debug/env-check`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEnvData(data);
      }
    } catch (error) {
      console.error('Failed to fetch env check:', error);
      toast.error('Failed to load debug info');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Copy the app URL instead of the backend redirect_uri
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="animate-pulse">
          <div className="h-4 bg-yellow-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-yellow-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!envData) {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-yellow-900 text-lg mb-1">
              Spotify Setup Required
            </h3>
            <p className="text-yellow-800 text-sm">
              To fix the "Invalid redirect URI" error, add this URL to your Spotify app settings:
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 border border-yellow-300">
          <div className="flex items-center justify-between gap-2">
            <code className="text-sm text-gray-800 break-all flex-1">
              {appUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-3 text-sm text-yellow-900">
          <p className="font-semibold">Follow these steps:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>
              Go to{' '}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Spotify Developer Dashboard
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Click on your HeadTap app (or create one if you haven't)</li>
            <li>Click "Settings" or "Edit Settings"</li>
            <li>Find the "Redirect URIs" section</li>
            <li><strong>Remove any old Supabase URLs</strong> if you added them before</li>
            <li>Click the "Copy" button above and paste the URL</li>
            <li>Click "Add" then "Save"</li>
            <li>Wait a few seconds, then try connecting to Spotify again</li>
          </ol>
        </div>

        <div className="mt-4 pt-4 border-t border-yellow-300">
          <p className="text-xs text-yellow-700">
            <strong>✅ NEW:</strong> We've fixed the 401 error! Now use your app's HTTPS URL as the redirect URI.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-yellow-50 border-yellow-200">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-yellow-900 text-lg mb-1">
            Spotify Setup Required
          </h3>
          <p className="text-yellow-800 text-sm">
            To fix the "Invalid redirect URI" error, add this URL to your Spotify app settings:
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 border border-yellow-300">
        <div className="flex items-center justify-between gap-2">
          <code className="text-sm text-gray-800 break-all flex-1">
            {appUrl}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-3 text-sm text-yellow-900">
        <p className="font-semibold">Follow these steps:</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>
            Go to{' '}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Spotify Developer Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>Click on your HeadTap app (or create one if you haven't)</li>
          <li>Click "Settings" or "Edit Settings"</li>
          <li>Find the "Redirect URIs" section</li>
          <li><strong>Remove any old Supabase URLs</strong> if you added them before</li>
          <li>Click the "Copy" button above and paste the URL</li>
          <li>Click "Add" then "Save"</li>
          <li>Wait a few seconds, then try connecting to Spotify again</li>
        </ol>
      </div>

      <div className="mt-4 pt-4 border-t border-yellow-300">
        <p className="text-xs text-yellow-700">
          <strong>✅ NEW:</strong> We've fixed the 401 error! Now use your app's HTTPS URL as the redirect URI.
        </p>
      </div>
      
      {/* Diagnostics Section */}
      <div className="mt-4 pt-4 border-t border-yellow-300">
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-yellow-800 hover:text-yellow-900 mb-2">
            🔧 Show Diagnostics
          </summary>
          <div className="bg-gray-50 rounded p-3 space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Supabase URL:</span>
              <span className={envData.supabase_url.set ? 'text-green-600' : 'text-red-600'}>
                {envData.supabase_url.set ? '✓ Set' : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Spotify Client ID:</span>
              <span className={envData.spotify_client_id.set ? 'text-green-600' : 'text-red-600'}>
                {envData.spotify_client_id.set ? `✓ ${envData.spotify_client_id.value}` : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Spotify Client Secret:</span>
              <span className={envData.spotify_client_secret.set ? 'text-green-600' : 'text-red-600'}>
                {envData.spotify_client_secret.set ? `✓ Set (${envData.spotify_client_secret.length} chars)` : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Redirect URI Valid:</span>
              <span className={envData.redirect_uri.valid ? 'text-green-600' : 'text-red-600'}>
                {envData.redirect_uri.valid ? '✓ Valid' : '✗ Invalid'}
              </span>
            </div>
            {(!envData.spotify_client_id.set || !envData.spotify_client_secret.set) && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                <strong>⚠️ Missing credentials!</strong>
                <p className="mt-1">Make sure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in your Supabase environment variables.</p>
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={fetchEnvCheck}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </details>
      </div>
    </Card>
  );
}