import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Newspaper, ExternalLink, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    name: string;
  };
  artist: string;
}

interface Artist {
  id: string;
  name: string;
  images?: { url: string }[];
}

interface ArtistNewsProps {
  artists: Artist[];
  sessionId: string | null;
  projectId: string;
  publicAnonKey: string;
}

export function ArtistNews({ artists, sessionId, projectId, publicAnonKey }: ArtistNewsProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    loadNews();
  }, [artists, sessionId]);

  const loadNews = async () => {
    if (!artists || artists.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get top 5 artists for focused, relevant news
      const topArtists = artists.slice(0, 5).map(a => a.name).join(',');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a9c438e5/artist-news?artists=${encodeURIComponent(topArtists)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();

      // Check if we got a message about missing API key
      if (data.message === 'News API key not configured') {
        setDemoMode(true);
        loadDemoNews();
        return;
      }

      if (data.articles && data.articles.length > 0) {
        setArticles(data.articles);
        setDemoMode(false);
      } else {
        // No articles found, use demo
        setDemoMode(true);
        loadDemoNews();
      }
    } catch (err) {
      console.error('Error loading news:', err);
      setDemoMode(true);
      loadDemoNews();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoNews = () => {
    // Generate demo news based on actual artists
    const demoArticles: NewsArticle[] = [];

    artists.slice(0, 5).forEach((artist, index) => {
      const newsTypes = [
        {
          title: `${artist.name} Announces 2026 World Tour`,
          description: `${artist.name} has announced an extensive world tour starting this summer, with dates across North America, Europe, and Asia. Pre-sale tickets go on sale next week.`,
          source: { name: 'Rolling Stone' }
        },
        {
          title: `New Album from ${artist.name} Coming Soon`,
          description: `${artist.name} teases upcoming album release with cryptic social media posts. Fans speculate about collaborations and new musical direction.`,
          source: { name: 'Pitchfork' }
        },
        {
          title: `${artist.name} Wins Major Music Award`,
          description: `${artist.name} takes home top honors at recent music awards ceremony, delivering emotional acceptance speech and surprise performance.`,
          source: { name: 'Billboard' }
        }
      ];

      const newsItem = newsTypes[index % newsTypes.length];
      const daysAgo = Math.floor(Math.random() * 14) + 1;
      const publishDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      demoArticles.push({
        ...newsItem,
        url: `https://example.com/article-${artist.id}`,
        urlToImage: artist.images?.[0]?.url || undefined,
        publishedAt: publishDate.toISOString(),
        artist: artist.name
      });
    });

    // Sort by date
    demoArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    setArticles(demoArticles);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      const weeks = Math.floor(diffInHours / (24 * 7));
      return `${weeks}w ago`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-3 shadow-lg">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Artist News
            </h2>
            <p className="text-gray-600 mt-1">Loading latest updates...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-3 shadow-lg">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Artist News & Updates
            </h2>
            <p className="text-gray-600 mt-1">
              {demoMode ? 'Demo news for your top artists' : 'Recent news about your favorite artists'}
            </p>
          </div>
        </div>
        {demoMode && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            Demo Mode
          </Badge>
        )}
      </div>

      {/* News Grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article, index) => (
            <Card 
              key={`${article.url}-${index}`}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
            >
              {/* Article Image */}
              {article.urlToImage && (
                <div className="w-full h-48 overflow-hidden bg-gray-100">
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-5">
                {/* Time stamp */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(article.publishedAt)}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {article.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {article.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">
                    {article.source.name}
                  </span>
                  {!demoMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-orange-600 hover:text-orange-700"
                      onClick={() => window.open(article.url, '_blank')}
                    >
                      Read More
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                  {demoMode && (
                    <span className="text-xs text-gray-400 italic">Demo article</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-gray-50">
          <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent news found for your artists</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for updates!</p>
        </Card>
      )}

      {/* Info Banner */}
      {demoMode && articles.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-400 rounded-lg p-2">
              <Newspaper className="w-5 h-5 text-yellow-900" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-1">Demo Mode Active</h4>
              <p className="text-sm text-yellow-800">
                You're viewing sample news articles. To see real news about your artists, configure the NEWS_API_KEY in your Supabase environment.
                Get a free API key at <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" className="underline font-medium">newsapi.org</a>
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}