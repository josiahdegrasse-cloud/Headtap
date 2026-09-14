export function distanceMiles(lat: number, lon: number, targetLat: number, targetLon: number): number | null {
  if (![lat, lon, targetLat, targetLon].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(targetLat) > 90 || Math.abs(lon) > 180 || Math.abs(targetLon) > 180) return null;
  const rad = (v: number) => v * Math.PI / 180;
  const a = Math.sin(rad(targetLat-lat)/2)**2 + Math.cos(rad(lat))*Math.cos(rad(targetLat))*Math.sin(rad(targetLon-lon)/2)**2;
  return Math.round(3958.7613 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0,1-a))) * 10) / 10;
}
export function bestEventImage(artistImages: any[] = [], eventImages: any[] = []): string {
  const valid = (images: any[]) => images.filter(i => typeof i.url === 'string' && i.url.startsWith('https://'));
  const artists = valid(artistImages).sort((a,b) => Math.abs((a.width || 640)-800) - Math.abs((b.width || 640)-800));
  if (artists.length) return artists[0].url;
  const events = valid(eventImages).sort((a,b) => {
    const score = (i: any) => (i.fallback ? -10000 : 0) + Math.min(i.width || 0,1600) - Math.abs((i.width / (i.height || 1))-16/9)*200;
    return score(b)-score(a);
  });
  return events[0]?.url || '';
}
export function featuredReasons(reasons: string[] = []): string[] {
  const unique = [...new Set(reasons)];
  const rank = (r: string) => /superstar/i.test(r) ? 0 : /great new artist|new discovery|highly recommended/i.test(r) ? 1 : 2;
  return unique.sort((a,b)=>rank(a)-rank(b)).slice(0,3);
}
