import { Button } from './ui/button';
import { Music, Sparkles, MapPin, TrendingUp, Play } from 'lucide-react';

interface LandingPageProps {
  onConnect: () => void;
  onDemo: () => void;
  loading?: boolean;
}

export function LandingPage({ onConnect, onDemo, loading }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F0] via-orange-50 to-orange-100 relative">
      {/* Subtle Background Pattern */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative">
        {/* Navigation Bar */}
        <nav className="border-b border-orange-200 backdrop-blur-sm bg-[#FFFBF5]/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-orange-600">HeadTap</span>
              <div className="hidden sm:block text-sm text-orange-700/70">
                Your Personalized Concert Discovery
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {/* Hero Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-300 rounded-full px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span className="text-orange-800 font-medium">AI-Powered Concert Matching</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent leading-tight">
                Find Live Music<br />You'll Actually Love
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 font-light max-w-3xl mx-auto leading-relaxed">
                Connect your Spotify and discover concerts perfectly matched to your taste—powered by intelligent vibe scoring
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                onClick={onConnect}
                disabled={loading}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all hover:scale-105 border-0"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Connect with Spotify
                  </span>
                )}
              </Button>
              
              <Button
                onClick={onDemo}
                disabled={loading}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Try Demo Mode
                </span>
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Reads your music taste • Requests permission to create playlists
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white/90 backdrop-blur-xl border border-orange-200 rounded-3xl p-10 md:p-12 shadow-xl shadow-orange-100">
            <h2 className="text-3xl font-bold text-orange-600 text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto font-bold text-2xl text-white shadow-xl shadow-orange-500/30">
                  1
                </div>
                <h3 className="font-bold text-lg text-orange-700">Connect Spotify</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Securely link your account to analyze your music preferences
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto font-bold text-2xl text-white shadow-xl shadow-orange-500/30">
                  2
                </div>
                <h3 className="font-bold text-lg text-orange-700">Enter Location</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Tell us where you are to find concerts happening near you
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto font-bold text-2xl text-white shadow-xl shadow-orange-500/30">
                  3
                </div>
                <h3 className="font-bold text-lg text-orange-700">Discover Shows</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Get personalized recommendations with match scores and reasons
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/80 backdrop-blur-lg border border-orange-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-orange-100 transition-all group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl w-12 h-12 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-orange-600 mb-3">Smart Matching</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI analyzes your artists, liked songs, and listening patterns to find concerts you'll love
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/80 backdrop-blur-lg border border-orange-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-orange-100 transition-all group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl w-12 h-12 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-orange-600 mb-3">Local & Nearby</h3>
              <p className="text-gray-600 leading-relaxed">
                Discover amazing shows happening in your city with real-time data from Ticketmaster
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 backdrop-blur-lg border border-orange-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-orange-100 transition-all group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl w-12 h-12 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-orange-600 mb-3">Genre Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Filter by genre, explore your music profile, and see all your saved songs organized by style
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-500 text-sm">
            © 2026 HeadTap • Built with Spotify & Ticketmaster APIs
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Made by Josiah deGrasse
          </p>
        </div>
      </div>
    </div>
  );
}