import { useMemo, useState } from 'react';
import { genreSummary } from '../utils/musicSummary';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function LibraryBrowser({tracks, artists, loading, error, progress}: {tracks:any[]; artists:any[]; loading:boolean; error?:string|null; progress?:string}) {
  const [view, setView] = useState<'songs'|'artists'|'genres'>('songs');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const genres = useMemo(() => genreSummary(artists, Infinity), [artists]);
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const source = view === 'songs' ? tracks.map(t => ({name:t.name, detail:(t.artists || []).map((a:any)=>a.name).join(', ')}))
      : view === 'artists' ? artists.map(a => ({name:a.name, detail:`${a.savedTrackCount} saved songs · ${a.genres?.length ? a.genres.join(', ') : 'Genre data unavailable'}`}))
      : genres.map(g => ({name:g.genre, detail:`${g.count} artists · ${g.percent}% of artists with genre data`}));
    return source.filter(row => `${row.name} ${row.detail}`.toLowerCase().includes(term));
  }, [tracks, artists, genres, query, view]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length / 50) - 1));
  return <section className="bg-white border border-orange-100 rounded-xl p-4 sm:p-6 space-y-4" aria-label="Full saved library">
    <h2 className="text-2xl font-bold">Your full saved library</h2>
    <p className="text-sm text-stone-600">Every available Liked Song, its artists, and their reported genres. Favorites above are a separate listening ranking. Playlists and complete listening history are not included here.</p>
    <p role="status" className="text-sm text-stone-600">{loading ? progress || 'Loading…' : error ? 'Partial library — loading needs a retry.' : progress || `${tracks.length} saved songs loaded`}</p>
    <div className="flex flex-wrap gap-2">{(['songs','artists','genres'] as const).map(key => <Button key={key} variant={view===key ? 'default':'outline'} aria-pressed={view===key} onClick={()=>{setView(key);setPage(0);setQuery('');}}>{key === 'songs' ? `Songs (${tracks.length})` : key === 'artists' ? `Artists (${artists.length})` : `Genres (${genres.length})`}</Button>)}</div>
    <label className="block text-sm font-medium">Search {view}<Input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder={`Search all loaded ${view}`} className="mt-2" /></label>
    <p className="text-xs text-stone-500">{rows.length} matching {view}. Showing up to 50 per page; the full loaded collection is searchable.{view === 'genres' && ' Genre coverage depends on Spotify metadata. Missing genres are not guessed, and artists can have multiple genres.'}</p>
    <ul className="divide-y divide-stone-100">{rows.slice(currentPage*50,(currentPage+1)*50).map((row,index)=><li key={`${currentPage}-${index}`} className="py-3 min-w-0"><p className="font-semibold break-words">{row.name}</p><p className="text-sm text-stone-600 break-words">{row.detail}</p></li>)}</ul>
    {!rows.length && <p className="text-stone-600">{loading ? 'Items will appear as they load.' : 'No matching items in the loaded library.'}</p>}
    {rows.length > 50 && <div className="flex items-center justify-between gap-2"><Button variant="outline" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</Button><span className="text-sm">{currentPage+1} / {Math.ceil(rows.length/50)}</span><Button variant="outline" disabled={(currentPage+1)*50>=rows.length} onClick={()=>setPage(currentPage+1)}>Next</Button></div>}
  </section>;
}
