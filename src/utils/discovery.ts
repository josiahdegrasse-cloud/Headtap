export type Feedback = 'interested' | 'not-for-me' | 'known';
export type Preferences = {adventure:number; feedback:Record<string,Feedback>; saved:Record<string,any>};
export const defaultPreferences:Preferences = {adventure:50,feedback:{},saved:{}};
export const artistKey = (name:string) => (name || '').trim().toLowerCase();
export const eventKey = (event:any) => event.id || [event.artist,event.date,event.venue].join('|');
const genresOf = (artist:any):string[] => [...new Set<string>((artist.genres || []).map((g:string)=>g.trim().toLowerCase()))];
export function similarity(a:any,b:any) {
  const left = new Set(genresOf(a)), right = new Set(genresOf(b));
  const shared = [...left].filter(g=>right.has(g));
  return {shared, score: shared.length / (new Set([...left,...right]).size || 1)};
}
export function explainConcert(event:any, artists:any[], preferences:Preferences) {
  const known = artists.find(a=>artistKey(a.name)===artistKey(event.artist));
  const connections = artists.map(a=>({name:a.name,...similarity(event,a)})).filter(a=>a.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  const feedback = preferences.feedback[artistKey(event.artist)];
  const familiar = Boolean(known || feedback==='known');
  const relevance = known ? 1 : connections[0]?.score || 0;
  // Distance and budget remain explicit filters, not invented affinity evidence.
  const novelty = familiar ? 0 : relevance > 0 ? 1 : 0.25;
  const score = 70*relevance + 30*((1-preferences.adventure/100)*(familiar?1:0) + preferences.adventure/100*novelty) + (feedback==='interested'?20:feedback==='not-for-me'?-100:0);
  const evidence:string[] = [];
  if (known) evidence.push(`${known.name} appears in your loaded music profile${known.savedTrackCount ? ` on ${known.savedTrackCount} saved ${known.savedTrackCount===1?'song':'songs'}` : ''}.`);
  if (connections.length) evidence.push(...connections.filter(a=>artistKey(a.name)!==artistKey(event.artist)).map(a=>`Shares ${a.shared.join(', ')} with ${a.name}.`));
  if (!known && !connections.length) evidence.push('No shared genre evidence is available in your loaded profile. This is an exploratory suggestion.');
  if (feedback==='interested') evidence.push('You marked this artist as interesting, so their shows move up.');
  if (feedback==='known') evidence.push('You marked this artist as already known; they count as familiar.');
  if (feedback==='not-for-me') evidence.push('You marked this artist as not your sound; their shows move down.');
  return {score,familiar,connections,evidence,label:known?'In your music':connections.length?'Shared genres':'Explore something different'};
}
export function rankConcerts(events:any[],artists:any[],preferences:Preferences) {
  return events.map(event=>({...event,recommendation:explainConcert(event,artists,preferences)})).sort((a,b)=>b.recommendation.score-a.recommendation.score || eventKey(a).localeCompare(eventKey(b)));
}
