import { handler } from '../supabase/functions/show-alerts/index.ts';
function assert(value:unknown) { if(!value) throw new Error('Assertion failed'); }
Deno.test('scheduler rejects missing or incorrect secret before accessing database', async()=>{
  Deno.env.set('SHOW_ALERTS_CRON_SECRET','test-secret');
  for(const token of ['', 'Bearer public-anon-key']) {
    const response=await handler(new Request('https://example.com/show-alerts/run',{method:'POST',headers:{Authorization:token}}));
    assert(response.status===401);
  }
  Deno.env.delete('SHOW_ALERTS_CRON_SECRET');
});
Deno.test('private device routes require a Spotify session and trusted origin',async()=>{
  Deno.env.set('APP_URL','https://headtap.example');
  const denied=await handler(new Request('https://example.com/show-alerts/devices',{headers:{Origin:'https://evil.example'}}));
  assert(denied.status===403);
  const missingSession=await handler(new Request('https://example.com/show-alerts/devices',{headers:{Origin:'https://headtap.example'}}));
  assert(missingSession.status===401);
  assert(missingSession.headers.get('Access-Control-Allow-Origin')==='https://headtap.example');
});
Deno.test('configuration does not expose secrets or claim readiness with missing credentials',async()=>{
  Deno.env.set('APP_URL','https://headtap.example');
  Deno.env.delete('VAPID_PRIVATE_KEY');
  const response=await handler(new Request('https://example.com/show-alerts/config',{headers:{Origin:'https://headtap.example'}}));
  const data=await response.json();
  assert(data.ready===false && data.publicKey===null);
  assert(Object.keys(data).length===2);
});
