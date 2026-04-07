import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Newspaper, 
  TrendingUp, 
  Sparkles, 
  Gem, 
  History,
  Smile
} from 'lucide-react';

interface FeaturePreview {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  enabled: boolean;
  preview: string;
}

interface FeaturePreviewsProps {
  onToggle: (featureId: string, enabled: boolean) => void;
  enabledFeatures: string[];
}

export function FeaturePreviews({ onToggle, enabledFeatures }: FeaturePreviewsProps) {
  const features: FeaturePreview[] = [
    {
      id: 'artist-news',
      title: 'Artist News',
      description: 'Recent news & tour announcements',
      icon: <Newspaper className="w-5 h-5" />,
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-50',
      enabled: enabledFeatures.includes('artist-news'),
      preview: 'Shows articles, tour dates, and news about artists you follow'
    },
    {
      id: 'music-moods',
      title: 'Music Moods',
      description: 'Emotional landscape of your music',
      icon: <Smile className="w-5 h-5" />,
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-violet-50',
      enabled: enabledFeatures.includes('music-moods'),
      preview: 'Happy, sad, chill, intense - discover your mood categories'
    },
    {
      id: 'discovery-score',
      title: 'Discovery Score',
      description: 'Explorer vs Loyalist rating',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-50',
      enabled: enabledFeatures.includes('discovery-score'),
      preview: 'Explorer vs Loyalist meter, new artist discovery rate'
    },
    {
      id: 'hidden-gems',
      title: 'Hidden Gems',
      description: 'Most obscure artists',
      icon: <Gem className="w-5 h-5" />,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-amber-50',
      enabled: enabledFeatures.includes('hidden-gems'),
      preview: 'Artists with <10k monthly listeners that you love'
    },
    {
      id: 'nostalgia-index',
      title: 'Nostalgia Index',
      description: 'Old vs new music preference',
      icon: <History className="w-5 h-5" />,
      color: 'from-indigo-600 to-blue-600',
      bgColor: 'bg-indigo-50',
      enabled: enabledFeatures.includes('nostalgia-index'),
      preview: 'Tracks the age of music you listen to and replay patterns'
    },
    {
      id: 'taste-uniqueness',
      title: 'Taste Uniqueness',
      description: 'How unique is your taste?',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-pink-600 to-rose-600',
      bgColor: 'bg-pink-50',
      enabled: enabledFeatures.includes('taste-uniqueness'),
      preview: 'Obscurity score, mainstream vs underground ratio'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="mb-3">
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Choose Features
        </h3>
        <p className="text-xs text-gray-600">Select insights to display</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className={`p-2 transition-all duration-300 cursor-pointer hover:scale-102 ${ 
              feature.enabled 
                ? `ring-2 ring-purple-400 shadow-md ${feature.bgColor}` 
                : 'hover:shadow-sm hover:bg-gray-50'
            }`}
            onClick={() => onToggle(feature.id, !feature.enabled)}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md bg-gradient-to-br ${feature.color} flex-shrink-0`}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-gray-900 truncate">{feature.title}</h4>
                <p className="text-[10px] text-gray-500 truncate">{feature.description}</p>
              </div>
              <Badge
                variant={feature.enabled ? "default" : "outline"}
                className={`flex-shrink-0 text-[10px] px-1.5 py-0 h-5 ${
                  feature.enabled ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''
                }`}
              >
                {feature.enabled ? '✓' : '+'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}