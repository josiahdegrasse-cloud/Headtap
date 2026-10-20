export type AlertPreferences = {
  zip: string; radius: number; maxPrice: number | null;
  frequency: 'daily' | 'new'; timezone: string; artists: string[];
};
export const normalizeArtist = (name: string) => name.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
export function validateAlertPreferences(value: any): AlertPreferences {
  if (!value || !/^\d{5}$/.test(value.zip)) throw new Error('Enter a five-digit US ZIP code.');
  if (![10,25,50,100].includes(value.radius)) throw new Error('Choose a travel radius.');
  if (value.maxPrice !== null && (typeof value.maxPrice !== 'number' || !Number.isFinite(value.maxPrice) || value.maxPrice < 0 || value.maxPrice > 10000)) throw new Error('Enter a valid ticket budget.');
  if (!['daily','new'].includes(value.frequency)) throw new Error('Choose an alert frequency.');
  if (typeof value.timezone !== 'string') throw new Error('Choose a valid time zone.');
  try { new Intl.DateTimeFormat('en-US', {timeZone:value.timezone}).format(); } catch { throw new Error('Choose a valid time zone.'); }
  if (!Array.isArray(value.artists) || !value.artists.length || value.artists.length > 10000 || value.artists.some((a:unknown)=>typeof a !== 'string' || !a.trim() || a.length > 200)) throw new Error('Load your music before enabling alerts (up to 10,000 artists).');
  return {zip:value.zip, radius:value.radius, maxPrice:value.maxPrice, frequency:value.frequency, timezone:value.timezone, artists:[...new Set<string>(value.artists.map(normalizeArtist))]};
}
export function allowedPushEndpoint(endpoint: unknown): boolean {
  if (typeof endpoint !== 'string' || endpoint.length > 4096) return false;
  try {
    const u=new URL(endpoint);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && (
      u.hostname === 'fcm.googleapis.com' || u.hostname === 'updates.push.services.mozilla.com' ||
      u.hostname === 'web.push.apple.com' || u.hostname.endsWith('.push.apple.com') || u.hostname.endsWith('.notify.windows.com'));
  } catch { return false; }
}
export function quietHours(timezone: string, now = new Date()): boolean {
  const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:timezone,hour:'numeric',hourCycle:'h23'}).format(now));
  return hour < 9 || hour >= 21;
}
export function matchingShows(events: any[], prefs: AlertPreferences) {
  const artists=new Set(prefs.artists.map(normalizeArtist));
  return events.filter(event=>{
    if (!event.id || ['cancelled','postponed','rescheduled'].includes(event.dates?.status?.code)) return false;
    if (!(event._embedded?.attractions || []).some((a:any)=>typeof a.name==='string' && artists.has(normalizeArtist(a.name)))) return false;
    const price=listedPrice(event);
    return prefs.maxPrice === null || (price !== null && price <= prefs.maxPrice);
  });
}
export function listedPrice(event:any): number | null {
  const prices=(event.priceRanges || []).filter((p:any)=>p.currency==='USD' && typeof p.min==='number' && Number.isFinite(p.min) && p.min>=0).map((p:any)=>p.min);
  return prices.length ? Math.min(...prices) : null;
}
export function showMessage(event:any): string {
  const price=listedPrice(event);
  const venue=event._embedded?.venues?.[0]?.name || 'Venue to be announced';
  const date=event.dates?.start?.localDate || 'Date to be announced';
  const distance=Number.isFinite(event.distance) ? ` · ${Math.round(event.distance)} mi` : '';
  return `${event.name} · ${date} · ${venue}${distance} · ${price === null ? 'Price unavailable' : `Listed from $${price}; final price may differ`}`;
}
