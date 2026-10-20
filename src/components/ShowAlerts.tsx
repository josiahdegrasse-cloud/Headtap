import { useEffect, useState } from 'react';
import { Bell, ChevronDown, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { normalizeArtist, validateAlertPreferences } from '../utils/showAlerts';

type Props = {sessionId:string|null; artists:{name:string}[]; libraryLoading:boolean; demoMode:boolean};
const url=`https://${projectId}.supabase.co/functions/v1/show-alerts`;
function keyBytes(key:string) {
  const decoded=atob(key.replace(/-/g,'+').replace(/_/g,'/'));
  return Uint8Array.from(decoded,c=>c.charCodeAt(0));
}
async function endpointId(endpoint:string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(endpoint)))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function ShowAlerts({sessionId,artists,libraryLoading,demoMode}:Props) {
  const [open,setOpen]=useState(new URLSearchParams(location.search).get('view')==='alerts');
  const [zip,setZip]=useState('');
  const [radius,setRadius]=useState(25);
  const [budget,setBudget]=useState('');
  const [frequency,setFrequency]=useState<'daily'|'new'>('daily');
  const [devices,setDevices]=useState<any[]>([]);
  const [deviceId,setDeviceId]=useState<string|null>(null);
  const [config,setConfig]=useState<{ready:boolean;publicKey:string}|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [loaded,setLoaded]=useState(false);
  const [install,setInstall]=useState<any>(null);
  const supported=window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  const standalone=window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
  const current=devices.find(d=>d.id===deviceId);
  const names=[...new Set(artists.map(a=>a.name).filter(Boolean))];
  const [chosen,setChosen]=useState<string[]|null>(null);
  const [artistSearch,setArtistSearch]=useState('');
  const selected=names.filter(name=>chosen===null || chosen.includes(normalizeArtist(name)));
  const api=async(route:string,method='GET',body?:unknown)=>{
    const response=await fetch(`${url}/${route}`,{method,headers:{Authorization:`Bearer ${publicAnonKey}`,'X-Headtap-Session':sessionId || '','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});
    if(!response.ok) {
      let detail='Show alerts are not available yet. The server needs to be activated.';
      try {detail=(await response.json()).error || detail;} catch { /* deployment or network error */ }
      throw new Error(detail);
    }
    return response.json();
  };
  useEffect(()=>{
    const listener=(event:Event)=>{event.preventDefault();setInstall(event);};
    window.addEventListener('beforeinstallprompt',listener);
    return ()=>window.removeEventListener('beforeinstallprompt',listener);
  },[]);
  useEffect(()=>{
    if(!open || demoMode || !sessionId) return;
    let cancelled=false;
    setLoaded(false);setError('');
    (async()=>{
      try {
        const settings=await api('config');
        if(cancelled)return;
        setConfig(settings);
        if(!settings.ready) return;
        const data=await api('devices');
        if(cancelled)return;
        setDevices(data.devices || []);
        if(supported) {
          const registration=await navigator.serviceWorker.register('/sw.js');
          const subscription=await registration.pushManager.getSubscription();
          const id=subscription?await endpointId(subscription.endpoint):null;
          if(cancelled)return;
          setDeviceId(id);
          const record=data.devices?.find((d:any)=>d.id===id);
          if(record) {
            setZip(record.preferences.zip);setRadius(record.preferences.radius);setBudget(record.preferences.maxPrice===null?'':String(record.preferences.maxPrice));setFrequency(record.preferences.frequency);
            setChosen(record.preferences.artists);
          }
        }
      } catch(err) {if(!cancelled)setError(err instanceof Error?err.message:'Could not load alerts.');}
      finally {if(!cancelled)setLoaded(true);}
    })();
    return ()=>{cancelled=true;};
  },[open,sessionId,demoMode]);
  const save=async()=>{
    setError('');setMessage('');
    let prefs;
    try {prefs=validateAlertPreferences({zip,radius,maxPrice:budget===''?null:Number(budget),frequency,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,artists:selected});}
    catch(err){setError((err as Error).message);return;}
    if(demoMode || !supported || !config?.ready) return;
    setBusy(true);
    try {
      // Permission request must occur directly inside the user's tap for iOS.
      const permission=await Notification.requestPermission();
      if(permission!=='granted') throw new Error('Notifications are blocked. Allow them in your browser or phone settings, then try again.');
      await navigator.serviceWorker.register('/sw.js');
      const registration=await navigator.serviceWorker.ready;
      let subscription=await registration.pushManager.getSubscription();
      const created=!subscription;
      if(!subscription) subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(config.publicKey)});
      try {
        const result=await api('subscribe','POST',{subscription:subscription.toJSON(),preferences:prefs});
        setDeviceId(result.id);
        setDevices(items=>[...items.filter(d=>d.id!==result.id),{id:result.id,preferences:prefs,enabled:true}]);
      } catch(err) {if(created)await subscription.unsubscribe();throw err;}
      setMessage('Alerts saved on this device. Checks run hourly, with notifications between 9 am and 9 pm in your time zone.');
    } catch(err){setError(err instanceof Error?err.message:'Could not enable notifications.');}
    finally {setBusy(false);}
  };
  const remove=async(id:string)=>{
    setBusy(true);setError('');setMessage('');
    try {
      await api('devices','DELETE',{id});
      setDevices(items=>items.filter(d=>d.id!==id));
      if(id===deviceId && supported) {
        const registration=await navigator.serviceWorker.getRegistration();
        await (await registration?.pushManager.getSubscription())?.unsubscribe();
        setDeviceId(null);
      }
      setMessage('Alerts turned off for that device.');
    } catch(err){setError((err as Error).message);}finally{setBusy(false);}
  };
  return <section className="rounded-xl border border-stone-200 bg-white mb-6">
    <button className="flex w-full items-center justify-between gap-3 p-4 text-left min-h-14" aria-expanded={open} aria-controls="show-alert-settings" onClick={()=>setOpen(!open)}>
      <span className="flex items-center gap-3"><Bell className="w-5 h-5 text-orange-700"/><span><span className="block font-semibold">Show alerts</span><span className="block text-sm text-stone-600">Your artists, nearby. Delivered to your phone.</span></span></span><ChevronDown className={`w-5 h-5 transition-transform ${open?'rotate-180':''}`}/>
    </button>
    {open && <div id="show-alert-settings" className="border-t border-stone-100 p-4 sm:p-5 space-y-5">
      {!standalone && <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-950"><p className="font-semibold flex gap-2 items-center"><Smartphone className="w-4 h-4"/>Add HeadTap to your phone</p><p className="mt-1">{ios?'In Safari, tap Share → Add to Home Screen. Open HeadTap from its icon, connect Spotify, then enable alerts. Requires iOS 16.4 or newer.':'Use your browser’s Install app or Add to Home Screen option, then open HeadTap from its icon.'}</p>{install && <Button variant="outline" className="mt-2" onClick={async()=>{await install.prompt();setInstall(null);}}>Install HeadTap</Button>}</div>}
      {demoMode && <p className="text-sm rounded-lg bg-stone-50 p-3">Preview your alert settings here. Connect Spotify to enable real notifications.</p>}<>
        <p className="text-sm text-stone-600">Checks Ticketmaster listings in the US for your selected artists over the next 90 days. Your music selection is saved when you enable or update alerts.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="text-sm font-medium">US ZIP code<Input inputMode="numeric" autoComplete="postal-code" maxLength={5} value={zip} onChange={e=>setZip(e.target.value)} placeholder="e.g. 10001" className="mt-2 h-11"/></label>
          <label className="text-sm font-medium">Travel radius<select className="block mt-2 h-11 w-full rounded-md border bg-white px-3" value={radius} onChange={e=>setRadius(Number(e.target.value))}>{[10,25,50,100].map(n=><option key={n} value={n}>{n} miles</option>)}</select></label>
          <label className="text-sm font-medium">Max ticket price (USD)<Input type="number" min="0" max="10000" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Any price" className="mt-2 h-11"/></label>
        </div>
        <p className="text-xs text-stone-500">Prices are listed estimates, not guaranteed checkout totals. Setting a budget excludes shows without a listed USD price.</p>
        <fieldset><legend className="text-sm font-semibold mb-2">How often?</legend><div className="grid sm:grid-cols-2 gap-2">{([{value:'daily',title:'Daily roundup',detail:'At most one notification every 24 hours.'},{value:'new',title:'New matches',detail:'Checked hourly; at most one alert every 6 hours.'}] as const).map(option=><button type="button" key={option.value} aria-pressed={frequency===option.value} className={`rounded-lg border p-3 text-left ${frequency===option.value?'border-orange-600 bg-orange-50':'border-stone-200'}`} onClick={()=>setFrequency(option.value)}><span className="block text-sm font-semibold">{option.title}</span><span className="text-xs text-stone-600">{option.detail}</span></button>)}</div></fieldset>
        <details><summary className="cursor-pointer text-sm font-medium py-2">Artists to watch · {selected.length} selected</summary><p className="text-xs text-stone-500 mb-2">All loaded artists are selected by default. Search to exclude someone. Update alerts after refreshing your library to include newly loaded artists.</p><Input aria-label="Find an artist to include or exclude" placeholder="Find an artist" value={artistSearch} onChange={e=>setArtistSearch(e.target.value)}/><div className="mt-2 max-h-48 overflow-y-auto">{names.filter(name=>name.toLowerCase().includes(artistSearch.toLowerCase())).slice(0,50).map(name=><label key={name} className="flex gap-3 items-center min-h-11 text-sm"><input type="checkbox" checked={chosen===null || chosen.includes(normalizeArtist(name))} onChange={e=>{const checked=e.target.checked;setChosen(values=>{const current=values || names.map(normalizeArtist);return checked?[...current,normalizeArtist(name)]:current.filter(v=>v!==normalizeArtist(name));});}}/>{name}</label>)}</div><p className="text-xs text-stone-500">Showing up to 50 at a time. Search any loaded artist.</p><Button type="button" variant="ghost" onClick={()=>setChosen(null)}>Select all loaded artists</Button></details>
        {libraryLoading && <p role="status" className="text-sm">Your library is still loading. Wait for it to finish to include every artist.</p>}
        {loaded && config && !config.ready && <p role="status" className="text-sm">Phone alerts are being set up. You can install HeadTap now; enabling alerts will be available after server activation.</p>}
        {!supported && !(ios&&!standalone) && <p className="text-sm">This browser does not support push notifications. Open HeadTap in a supported browser over HTTPS.</p>}
        <div className="flex flex-wrap gap-2"><Button onClick={save} disabled={busy || !loaded || !config?.ready || !supported || (ios&&!standalone) || libraryLoading || !selected.length} className="bg-orange-700 hover:bg-orange-800">{busy?'Saving…':current?'Update alerts':'Enable notifications'}</Button>{current && <><Button variant="outline" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await api('test','POST',{id:deviceId});setMessage('Test sent. Check your device notifications.');}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}>Send test</Button><Button variant="ghost" disabled={busy} onClick={()=>remove(current.id)}>Turn off</Button></>}</div>
        {current && <div className="text-xs text-stone-500 space-y-1"><p>{current.last_checked_at?`Last checked ${new Date(current.last_checked_at).toLocaleString()}`:'Waiting for the first scheduled check.'}</p>{current.last_error&&<p>{current.last_error}</p>}{current.coverage_limited&&<p>Your area has more listings than this search can cover. Try a smaller radius.</p>}</div>}
        {devices.filter(d=>d.id!==deviceId).length>0 && <details><summary className="text-sm cursor-pointer">Manage other devices</summary>{devices.filter(d=>d.id!==deviceId).map((device,i)=><div className="flex items-center justify-between text-sm py-2" key={device.id}><span>Device {i+1} · ZIP {device.preferences.zip}</span><Button variant="ghost" disabled={busy} onClick={()=>remove(device.id)}>Turn off</Button></div>)}</details>}
        {current?.latest_matches?.length>0 && <div><h3 className="font-semibold mb-2">Your latest alert</h3><ul className="space-y-3">{current.latest_matches.map((show:any)=><li key={show.id} className="text-sm border-t pt-3"><p>{show.summary}</p>{show.url&&/^https:\/\//.test(show.url)&&<a className="text-orange-800 underline inline-block py-2" href={show.url} target="_blank" rel="noopener noreferrer">Check tickets</a>}</li>)}</ul></div>}
      </>
      {message && <p role="status" className="text-sm text-stone-700">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error} <button className="underline" onClick={()=>{setOpen(false);setTimeout(()=>setOpen(true),0);}}>Retry</button></p>}
    </div>}
  </section>;
}
