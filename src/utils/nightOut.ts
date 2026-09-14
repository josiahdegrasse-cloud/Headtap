import {artistKey,eventKey} from './discovery.ts';
export function localEventDate(value:string) {return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?`${value}T12:00:00`:value);}
export function weekendRange(now=new Date()) {
 const start=new Date(now);start.setHours(0,0,0,0);
 const day=start.getDay();start.setDate(start.getDate()+(day===0?-2:day>=5?5-day:5-day));
 const end=new Date(start);end.setDate(end.getDate()+3);
 return {start,end};
}
export function nightOutPicks(events:any[],limit=3) {
 const seen=new Set<string>();
 return [...events].sort((a,b)=>(b.recommendation?.score||0)-(a.recommendation?.score||0)).filter(e=>{
  const key=artistKey(e.artist);if(!key||seen.has(key)||e.recommendation?.score<0)return false;seen.add(key);return true;
 }).slice(0,limit);
}
export function sameDateShows(events:any[]) {
 const counts=new Map<string,number>();
 for(const e of events){const date=e.date?.slice(0,10);if(date)counts.set(date,(counts.get(date)||0)+1);}
 return new Set(events.filter(e=>(counts.get(e.date?.slice(0,10))||0)>1).map(eventKey));
}
export function spotifyArtistId(value:unknown) {return typeof value==='string'&&/^[A-Za-z0-9]{22}$/.test(value)?value:null;}
