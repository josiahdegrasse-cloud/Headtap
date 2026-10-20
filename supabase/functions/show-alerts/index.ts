import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import webpush from 'npm:web-push@3.6.7';
import { allowedPushEndpoint, validateAlertPreferences, matchingShows, quietHours, showMessage } from '../../../src/utils/showAlerts.ts';

const env = (name:string) => Deno.env.get(name) || '';
const db = () => createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
const table = 'headtap_show_alerts';
const origins = () => new Set([env('APP_URL'), ...env('ALLOWED_APP_URLS').split(',')].filter(Boolean).map(s=>s.trim()));
const ready = () => ['VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT','SHOW_ALERTS_CRON_SECRET','TICKETMASTER_API_KEY'].every(name=>!!env(name));
const hash = async (value:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
async function checked(result:any) { if(result.error) throw new Error('Database operation failed'); return result.data; }
async function jsonFetch(url:string, init:RequestInit={}) {
  const response=await fetch(url,{...init,signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error(`Upstream request failed (${response.status})`);
  return response.json();
}
// Use the existing opaque Spotify session, then ask Spotify for a stable owner ID.
async function owner(session:string|null) {
  if(!session || !/^[a-f0-9-]{36}$/i.test(session)) throw new Error('Unauthorized');
  const client=db();
  const record=await checked(await client.from('kv_store_a9c438e5').select('value').eq('key',`spotify:session:${session}`).maybeSingle());
  let token=record?.value;
  if(!token?.access_token) throw new Error('Unauthorized');
  if(token.expires_at < Date.now()+60000) {
    const refreshed=await jsonFetch('https://accounts.spotify.com/api/token',{
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded',Authorization:`Basic ${btoa(`${env('SPOTIFY_CLIENT_ID')}:${env('SPOTIFY_CLIENT_SECRET')}`)}`},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token.refresh_token})
    });
    token={...token,access_token:refreshed.access_token,refresh_token:refreshed.refresh_token || token.refresh_token,expires_at:Date.now()+refreshed.expires_in*1000};
    await checked(await client.from('kv_store_a9c438e5').update({value:token}).eq('key',`spotify:session:${session}`));
  }
  const me=await jsonFetch('https://api.spotify.com/v1/me',{headers:{Authorization:`Bearer ${token.access_token}`}});
  if(!me.id) throw new Error('Unauthorized');
  return me.id as string;
}
function validateSubscription(value:any) {
  if(!allowedPushEndpoint(value?.endpoint) || !/^[A-Za-z0-9_-]{87}=?$/.test(value?.keys?.p256dh || '') || !/^[A-Za-z0-9_-]{22}={0,2}$/.test(value?.keys?.auth || '')) throw new Error('Invalid push subscription');
  return {endpoint:value.endpoint,keys:{p256dh:value.keys.p256dh,auth:value.keys.auth}};
}
async function send(subscription:any,payload:any) {
  // Validate again before outbound requests, even for records already in storage.
  validateSubscription(subscription);
  await webpush.sendNotification(subscription,JSON.stringify(payload),{
    vapidDetails:{subject:env('VAPID_SUBJECT'),publicKey:env('VAPID_PUBLIC_KEY'),privateKey:env('VAPID_PRIVATE_KEY')},
    TTL:3600,timeout:8000,urgency:'normal'
  });
}
async function eventsFor(prefs:any) {
  const events:any[]=[]; let limited=false;
  const start=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
  const end=new Date(Date.now()+90*86400000).toISOString().replace(/\.\d{3}Z$/,'Z');
  for(let page=0;page<5;page++) {
    const params=new URLSearchParams({apikey:env('TICKETMASTER_API_KEY'),postalCode:prefs.zip,countryCode:'US',radius:String(prefs.radius),unit:'miles',classificationName:'music',size:'200',page:String(page),sort:'date,asc',startDateTime:start,endDateTime:end});
    const data=await jsonFetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    events.push(...(data._embedded?.events || []));
    limited=(data.page?.totalElements || 0)>1000;
    if(page+1 >= (data.page?.totalPages || 0)) break;
  }
  return {events,limited};
}
async function processDevice(row:any) {
  const client=db(), now=new Date();
  // Compare-and-swap lease prevents concurrent scheduler invocations sending twice.
  const claim=await checked(await client.from(table).update({next_check_at:new Date(+now+3600000).toISOString()}).eq('id',row.id).eq('next_check_at',row.next_check_at).eq('updated_at',row.updated_at).eq('enabled',true).select('id'));
  if(!claim?.length) return;
  try {
    const prefs=validateAlertPreferences(row.preferences);
    if(quietHours(prefs.timezone,now)) return;
    const minimumGap=prefs.frequency==='daily'?24*3600000:6*3600000;
    if(row.last_sent_at && +now-Date.parse(row.last_sent_at)<minimumGap) return;
    const {events,limited}=await eventsFor(prefs);
    const seen=new Set(row.seen_ids);
    const matches=matchingShows(events,prefs).filter(e=>!seen.has(e.id));
    const update:any={last_checked_at:now.toISOString(),last_error:null,coverage_limited:limited};
    if(matches.length) {
      // Recheck enabled/revision after fetching so a paused or edited subscription is not sent stale alerts.
      const fresh=await checked(await client.from(table).select('enabled,updated_at').eq('id',row.id).maybeSingle());
      if(!fresh?.enabled || fresh.updated_at!==row.updated_at) return;
      const first=matches[0];
      await send(row.subscription,{title:matches.length===1?'A show for your music':`${matches.length} shows for your music`,body:showMessage(first)+(matches.length>1?` · +${matches.length-1} more in HeadTap`:''),tag:`headtap-${first.id}`});
      update.seen_ids=[...row.seen_ids,...matches.map(e=>e.id)].slice(-5000);
      update.latest_matches=matches.slice(0,50).map(e=>({id:e.id,name:e.name,summary:showMessage(e),url:typeof e.url==='string' && e.url.startsWith('https://')?e.url:null}));
      update.last_sent_at=now.toISOString();
    }
    await checked(await client.from(table).update(update).eq('id',row.id).eq('updated_at',row.updated_at));
  } catch(error:any) {
    if([404,410].includes(error.statusCode)) {
      await checked(await client.from(table).delete().eq('id',row.id).eq('updated_at',row.updated_at));
    } else {
      // Do not log endpoints, artist preferences, access tokens or provider request bodies.
      console.error('Show alert check failed');
      await checked(await client.from(table).update({last_error:'The latest check failed; we will retry in an hour.'}).eq('id',row.id).eq('updated_at',row.updated_at));
    }
  }
}
export async function handler(req:Request):Promise<Response> {
  const origin=req.headers.get('origin') || '';
  const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if(origins().has(origin)) Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Headtap-Session','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS'});
  const reply=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
  const route=new URL(req.url).pathname.split('/').pop();
  try {
    if(route==='run' && req.method==='POST') {
      const expected=env('SHOW_ALERTS_CRON_SECRET');
      if(!expected || req.headers.get('authorization')!==`Bearer ${expected}`) return reply({error:'Unauthorized'},401);
      if(!ready()) return reply({error:'Alerts are not configured'},503);
      const rows=await checked(await db().from(table).select('*').eq('enabled',true).lte('next_check_at',new Date().toISOString()).order('next_check_at').limit(2));
      await Promise.all((rows || []).map(processDevice));
      return reply({checked:rows?.length || 0});
    }
    if(!origins().has(origin)) return reply({error:'Origin not allowed'},403);
    if(route==='config' && req.method==='GET') return reply({ready:ready(),publicKey:ready()?env('VAPID_PUBLIC_KEY'):null});
    const ownerId=await owner(req.headers.get('X-Headtap-Session'));
    if(req.method==='GET' && route==='devices') {
      const devices=await checked(await db().from(table).select('id,preferences,enabled,last_sent_at,last_checked_at,last_error,coverage_limited,latest_matches').eq('owner_id',ownerId));
      return reply({devices});
    }
    if(!['POST','DELETE'].includes(req.method)) return reply({error:'Not found'},404);
    const raw=await req.text();
    if(raw.length>2100000) return reply({error:'Request too large'},413);
    let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid JSON'},400);}
    if(req.method==='DELETE' && route==='devices') {
      if(typeof body.id!=='string') return reply({error:'Device required'},400);
      await checked(await db().from(table).delete().eq('id',body.id).eq('owner_id',ownerId));
      return reply({ok:true});
    }
    if(route==='subscribe' && req.method==='POST') {
      if(!ready()) return reply({error:'Show alerts are awaiting server setup.'},503);
      let subscription,preferences;
      try {subscription=validateSubscription(body.subscription);preferences=validateAlertPreferences(body.preferences);}catch(error){return reply({error:(error as Error).message},400);}
      const id=await hash(subscription.endpoint);
      const existing=await checked(await db().from(table).select('owner_id').eq('id',id).maybeSingle());
      if(existing && existing.owner_id!==ownerId) return reply({error:'Turn off this device’s existing alerts before connecting another account.'},409);
      const fields={id,owner_id:ownerId,subscription,preferences,app_origin:origin,enabled:true,updated_at:new Date().toISOString(),next_check_at:new Date().toISOString()};
      // Never upsert across owners; uniqueness also protects concurrent account changes.
      await checked(existing ? await db().from(table).update(fields).eq('id',id).eq('owner_id',ownerId) : await db().from(table).insert(fields));
      return reply({ok:true,id});
    }
    if(route==='test' && req.method==='POST') {
      const row=await checked(await db().from(table).select('*').eq('id',body.id).eq('owner_id',ownerId).maybeSingle());
      if(!row) return reply({error:'Enable alerts on this device first.'},404);
      await send(row.subscription,{title:'HeadTap alerts are connected',body:'Your phone is ready for nearby shows. This is a test, not a concert listing.',tag:'headtap-test'});
      return reply({ok:true});
    }
    return reply({error:'Not found'},404);
  } catch(error) {
    if((error as Error).message==='Unauthorized') return reply({error:'Reconnect Spotify to manage alerts.'},401);
    console.error('Show alert request failed');
    return reply({error:'Could not complete alert setup. Please retry.'},500);
  }
}
if(import.meta.main) Deno.serve(handler);
