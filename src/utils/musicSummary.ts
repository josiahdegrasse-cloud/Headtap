export function libraryArtistCount(tracks: any[]): number {
  const artists = new Set<string>();
  for (const item of tracks) for (const artist of item?.artists || []) {
    const key = artist.id || artist.name?.trim().toLowerCase();
    if (key) artists.add(key);
  }
  return artists.size;
}
export function genreSummary(artists: any[], limit = 6) {
  const known = artists.filter(a => a?.genres?.length);
  const counts = new Map<string, number>();
  for (const artist of known) for (const genre of new Set<string>(artist.genres)) counts.set(genre, (counts.get(genre) || 0) + 1);
  return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([genre,count])=>({genre,count,percent: Math.round(count / known.length * 100), artistsWithGenres:known.length}));
}

export function libraryArtists(tracks: any[], details: any[] = []) {
  const known = new Map(details.map(a => [a.id, a]));
  const names = new Map(details.map(a => [a.name?.trim().toLowerCase(), a]));
  const artists = new Map<string, any>();
  for (const track of tracks) for (const artist of track?.artists || []) {
    const key = artist.id || artist.name?.trim().toLowerCase();
    if (!key) continue;
    const previous = artists.get(key);
    artists.set(key, {...artist, ...(artist.id ? known.get(artist.id) : names.get(artist.name?.trim().toLowerCase())), savedTrackCount:(previous?.savedTrackCount || 0) + 1});
  }
  return [...artists.values()].sort((a,b) => b.savedTrackCount - a.savedTrackCount || a.name.localeCompare(b.name));
}
