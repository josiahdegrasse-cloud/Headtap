import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, MapPin, DollarSign, Ticket, ExternalLink, Sparkles } from 'lucide-react';

interface Concert {
  id?: string;
  artist: string;
  event_name?: string;
  date: string;
  venue: string;
  city?: string;
  location?: string;
  price?: number;
  price_min?: number | null;
  price_max?: number | null;
  imageUrl: string;
  url?: string;
  vibe_score?: number;
  matchScore?: number;
  matchReasons?: string[];
  genres?: string[];
}

interface ConcertListProps {
  concerts: Concert[];
  loading?: boolean;
}

export function ConcertList({ concerts, loading }: ConcertListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden border border-orange-100">
            <div className="h-48 bg-gradient-to-br from-orange-100 to-amber-100"></div>
            <div className="p-5 space-y-3">
              <div className="h-6 bg-orange-100 rounded w-3/4"></div>
              <div className="h-4 bg-orange-50 rounded w-full"></div>
              <div className="h-4 bg-orange-50 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (concerts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MapPin className="w-12 h-12 text-orange-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to discover concerts?</h3>
        <p className="text-gray-600 text-lg mb-1">Enter your location above to find shows near you</p>
        <p className="text-gray-500 text-sm">
          We'll match you with concerts based on your music taste
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Convert score to qualitative label
  const getMatchLabel = (score?: number): string | null => {
    if (!score) return null;
    if (score >= 85) return 'Perfect Match';
    if (score >= 75) return 'Excellent Match';
    if (score >= 65) return 'Great Fit';
    if (score >= 55) return 'Good Fit';
    if (score >= 45) return 'Nice Match';
    // Don't show label for scores below 45
    return null;
  };

  const getVibeColor = (score?: number) => {
    if (!score) return 'bg-gray-500';
    if (score >= 85) return 'bg-gradient-to-r from-purple-600 to-pink-600'; // Perfect
    if (score >= 75) return 'bg-gradient-to-r from-green-500 to-emerald-600'; // Excellent
    if (score >= 65) return 'bg-blue-600'; // Great
    if (score >= 55) return 'bg-indigo-500'; // Good
    if (score >= 45) return 'bg-purple-500'; // Nice
    return 'bg-gray-500';
  };

  const formatPrice = (concert: Concert): string => {
    const min = concert.price_min || concert.price;
    const max = concert.price_max;
    
    if (!min && !max) return 'TBA';
    if (min && max && min !== max) return `$${Math.round(min)}-$${Math.round(max)}`;
    if (min) return `$${Math.round(min)}+`;
    return 'TBA';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {concerts.map((concert, idx) => (
        <Card key={concert.id || idx} className="overflow-hidden hover:shadow-2xl hover:shadow-orange-100 transition-all hover:-translate-y-1 duration-300 group bg-white/80 backdrop-blur-sm border-orange-100 flex flex-col">
          <div className="relative h-48 overflow-hidden">
            <img
              src={concert.imageUrl}
              alt={concert.artist}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            {/* Vibe Score Badge */}
            {concert.vibe_score !== undefined && getMatchLabel(concert.vibe_score) && (
              <Badge className={`absolute top-3 left-3 ${getVibeColor(concert.vibe_score)} text-white hover:opacity-90 flex items-center gap-1 shadow-lg`}>
                <Sparkles className="w-3 h-3" />
                {getMatchLabel(concert.vibe_score)}
              </Badge>
            )}
            
            {/* Price Badge */}
            <Badge className="absolute top-3 right-3 bg-orange-600 hover:bg-orange-700 shadow-lg">
              {formatPrice(concert)}
            </Badge>
          </div>
          
          <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-xl font-bold mb-2 line-clamp-2 text-gray-900">{concert.event_name || concert.artist}</h3>
            
            {/* Genres */}
            {concert.genres && concert.genres.length > 0 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {concert.genres.slice(0, 2).map((genre, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full capitalize border border-orange-200">
                    {genre}
                  </span>
                ))}
              </div>
            )}
            
            {/* Match Reasons */}
            {concert.matchReasons && concert.matchReasons.length > 0 && (
              <div className="mb-3 space-y-1">
                {concert.matchReasons.slice(0, 2).map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 px-2 py-1.5 rounded border border-orange-100">
                    <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{reason}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(concert.date)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{concert.venue}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>From {formatPrice(concert)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all mt-auto"
              onClick={() => {
                if (concert.url) {
                  window.open(concert.url, '_blank');
                }
              }}
            >
              {concert.url ? (
                <>
                  Get Tickets
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              ) : (
                'Get Tickets'
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}