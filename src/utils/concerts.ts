import {localEventDate,weekendRange} from './nightOut.ts';
export interface ConcertFilters {
  selectedGenres: string[];
  minCost: number;
  maxCost: number;
  ticketCount: number;
  jointBudget: number;
  sortBy: 'vibe' | 'cost_low' | 'cost_high' | 'date';
  dateRange: string;
}
export function concertPrice(concert: any): number | null {
  const price = concert.price_min ?? concert.price;
  return typeof price === 'number' && Number.isFinite(price) && price >= 0 ? price : null;
}
export function filterConcerts(concerts: any[], artists: any[], filters: ConcertFilters, now = new Date()) {
  const genres = new Map(artists.map(a => [a.name.toLowerCase(), a.genres || []]));
  const days = { week: 7, month: 30, '3months': 90 }[filters.dateRange];
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const budgetActive = filters.jointBudget > 0 && filters.ticketCount > 0;
  const priceActive = filters.minCost > 0 || Number.isFinite(filters.maxCost) || budgetActive;
  return concerts.filter(c => {
    const date = localEventDate(c.date);
    if (!Number.isFinite(date.getTime()) || date < today) return false;
    if (filters.dateRange === 'weekend') {const range=weekendRange(now);if(date<range.start || date>=range.end)return false;}
    if (days && date.getTime() > now.getTime() + days * 86400000) return false;
    const artistGenres: string[] = genres.get((c.artist || '').toLowerCase()) || c.genres || [];
    if (filters.selectedGenres.length && !filters.selectedGenres.some(g => artistGenres.some(a => a.toLowerCase().includes(g.toLowerCase())))) return false;
    if (priceActive && c.currency && c.currency !== 'USD') return false;
    const price = concertPrice(c);
    if (price === null) return !priceActive;
    if (price < filters.minCost || price > filters.maxCost) return false;
    return !budgetActive || price * filters.ticketCount <= filters.jointBudget;
  }).sort((a, b) => {
    if (filters.sortBy === 'vibe') return (b.vibe_score ?? b.matchScore ?? 0) - (a.vibe_score ?? a.matchScore ?? 0);
    if (filters.sortBy.startsWith('cost_')) {
      const ap = concertPrice(a), bp = concertPrice(b);
      if (ap === null) return bp === null ? 0 : 1;
      if (bp === null) return -1;
      return filters.sortBy === 'cost_low' ? ap - bp : bp - ap;
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}
