import {useEffect,useState,useId} from 'react';
import {spotifyArtistId} from '../utils/nightOut';
// A single active embed across all concert groups. Switching artists unmounts
// the previous player, stopping its playback without cross-origin inspection.
const listeners=new Set<(key:string)=>void>();
let active='';
export function stopListening(){active='';listeners.forEach(fn=>fn(''));}
export function ArtistListening({artist,id,sample}:{artist:string;id?:string;sample?:boolean}) {
 const instance=useId();
 const valid=spotifyArtistId(id);
 const [open,setOpen]=useState(false);
 useEffect(()=>{const listener=(key:string)=>setOpen(key===instance);listeners.add(listener);return()=>{listeners.delete(listener);};},[instance]);
 const url=valid?`https://open.spotify.com/artist/${valid}`:`https://open.spotify.com/search/${encodeURIComponent(artist)}`;
 return <div className="mb-4 space-y-2">{valid&&!sample&&<button className="text-sm font-semibold text-orange-800 underline" aria-expanded={open} onClick={()=>{active=open?'':instance;listeners.forEach(fn=>fn(active));}}>{open?'Close player':'Listen'}</button>}
 {open&&valid&&!sample&&<iframe title={`Spotify player for ${artist}`} src={`https://open.spotify.com/embed/artist/${valid}?theme=0`} width="100%" height="152" className="rounded-xl border-0" allow="encrypted-media; fullscreen; picture-in-picture" loading="lazy" />}
 {!sample&&(!valid || open)&&<a className="block text-xs text-stone-600 underline" href={url} target="_blank" rel="noopener noreferrer">{valid?'Open in Spotify':'Listen on Spotify'}</a>}
 {open&&<p className="text-xs text-stone-500">Playback availability is controlled by Spotify. If the player doesn’t load, use the artist link.</p>}</div>;
}
