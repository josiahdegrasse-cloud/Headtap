import {ArtistListening} from './ArtistListening';
import {localEventDate} from '../utils/nightOut';
import { artistKey, eventKey, type Feedback, type Preferences } from '../utils/discovery';
import { ConcertImage } from './ConcertImage';
import { featuredReasons } from '../utils/eventDetails';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, MapPin, DollarSign, Ticket, ExternalLink, Sparkles } from 'lucide-react';

interface Concert {
  spotify_artist_id?: string;
  currency?: string;
  sample?: boolean;
  recommendation?: {score:number;label:string;evidence:string[];connections?:{name:string;shared:string[]}[]};
  id?: string;
  artist: string;
  event_name?: string;
  date: string;
  venue: string;
  city?: string;
  region?: string;
  country?: string;
  address?: string;
  venue_lat?: number | null;
  venue_lon?: number | null;
  distance_miles?: number | null;
  search_location?: string;
  fallbackImageUrl?: string;
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
  preferences?: Preferences;
  onFeedback?: (artist:string,value:Feedback|null)=>void;
  onSave?: (concert:any)=>void;
  controlsReady?: boolean;
  concerts: Concert[];
  loading?: boolean;
  sample?: boolean;
  searched?: boolean;
  error?: string | null;
  filteredOut?: boolean;
}

export function ConcertList({ concerts, loading, sample = false, searched = false, error, filteredOut = false, preferences, onFeedback, onSave, controlsReady = true }: ConcertListProps) {
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

  if (error) return <div role="alert" className="p-6 text-center">{error}</div>;
  if (searched && concerts.length === 0) return <div role="status" className="p-6 text-center">{filteredOut ? 'No shows match your filters. Try a wider date range or budget.' : 'No shows found. Try a different location or a wider distance.'}</div>;
  if (concerts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MapPin className="w-12 h-12 text-orange-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to discover a show?</h3>
        <p className="text-gray-600 text-lg mb-1">Enter your location above to find shows near you</p>
        <p className="text-gray-500 text-sm">
          Your recommendations will appear here.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = localEventDate(dateString);
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
    if (score >= 85) return 'bg-stone-900'; // Perfect
    if (score >= 75) return 'bg-stone-900'; // Excellent
    if (score >= 65) return 'bg-stone-900'; // Great
    if (score >= 55) return 'bg-stone-900'; // Good
    if (score >= 45) return 'bg-stone-900'; // Nice
    return 'bg-gray-500';
  };

  const formatPrice = (concert: Concert): string => {
    const symbol = concert.currency && concert.currency !== 'USD' ? `${concert.currency} ` : '$';
    const min = concert.price_min ?? concert.price;
    const max = concert.price_max;
    
    if (min === 0 && (!max || max === 0)) return 'Free';
    if (min == null && max == null) return 'TBA';
    if (min != null && max != null && min !== max) return `${symbol}${Math.round(min)}–${symbol}${Math.round(max)}`;
    if (min != null) return `${symbol}${Math.round(min)}+`;
    return 'TBA';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {concerts.map((concert, idx) => (
        <Card key={concert.id || idx} className="overflow-hidden hover:shadow-md transition-shadow duration-200 group bg-white border-stone-200 flex flex-col gap-0">
          <div className="relative aspect-[16/9] overflow-hidden">
            <ConcertImage src={concert.imageUrl} fallback={concert.fallbackImageUrl} artist={concert.artist} eager={idx < 3} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            

          </div>
          
          <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-xl font-bold mb-1 leading-snug text-stone-900">{concert.artist}</h3>
            {concert.event_name && concert.event_name !== concert.artist && <p className="text-sm text-gray-600 mb-3">{concert.event_name}</p>}
            
            {concert.recommendation && <details className="mb-3 text-sm text-stone-700"><summary className="cursor-pointer py-2">{concert.recommendation.evidence[0] || 'Why this show?'}</summary><ul className="mt-2 space-y-2 text-stone-600">{concert.recommendation.evidence.slice(1).map((reason,i)=><li key={i}>{reason}</li>)}</ul><p className="text-xs text-stone-500 mt-2">Based on your loaded music and feedback.</p></details>}
            <ArtistListening artist={concert.artist} id={concert.spotify_artist_id} sample={sample || concert.sample}/>
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(concert.date)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{concert.venue}</span>
              </div>
              
              <p className="text-sm text-gray-500 pl-6">{concert.address || [concert.city || concert.location, concert.region, concert.country].filter(Boolean).join(', ')}</p>
              {!sample && concert.distance_miles != null && Number.isFinite(concert.distance_miles) && (
                <p className="text-sm font-medium text-orange-700 pl-6">{concert.distance_miles < 0.1 ? 'Less than 0.1' : concert.distance_miles.toFixed(1)} miles away · straight-line distance<br/><span className="text-xs font-normal text-gray-500">From {concert.search_location || 'your search location'}</span></p>
              )}
              {!sample && (concert.address || (concert.venue_lat != null && concert.venue_lon != null)) && (
                <a className="text-sm text-orange-700 underline underline-offset-4 pl-6 inline-flex items-center gap-1" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(concert.venue_lat != null && concert.venue_lon != null ? `${concert.venue_lat},${concert.venue_lon}` : `${concert.venue}, ${concert.address}`)}`} target="_blank" rel="noopener noreferrer">View venue on map <ExternalLink className="w-3 h-3"/></a>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>{formatPrice(concert)}</span>
              </div>
            </div>
            
            {preferences && <div className="mb-4 space-y-2"><Button disabled={!controlsReady} variant="outline" className="w-full" aria-pressed={Boolean(preferences.saved[eventKey(concert)])} onClick={()=>onSave?.(concert)}>{preferences.saved[eventKey(concert)]?'Saved ✓':'Save show'}</Button><details><summary className="cursor-pointer text-xs text-stone-600 py-2">Improve my matches</summary><div className="flex flex-wrap gap-1">{([['interested','Interested'],['not-for-me','Not my sound'],['known','Already know them']] as const).map(([value,label])=><button disabled={!controlsReady} key={value} aria-pressed={preferences.feedback[artistKey(concert.artist)]===value} onClick={()=>onFeedback?.(concert.artist,preferences.feedback[artistKey(concert.artist)]===value?null:value)} className={`text-xs border rounded-full px-3 py-2 min-h-11 ${preferences.feedback[artistKey(concert.artist)]===value?'bg-orange-100 border-orange-500':'border-stone-200'}`}>{label}</button>)}</div></details></div>}

            <Button 
              className="w-full bg-orange-700 hover:bg-orange-800 text-white h-11 shadow-none transition-colors mt-auto"
              disabled={sample || concert.sample || !concert.url}
              onClick={() => {
                if (concert.url) {
                  window.open(concert.url, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {sample || concert.sample ? 'Sample event' : concert.url ? (
                <>
                  Check tickets
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              ) : (
                'Tickets unavailable'
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}