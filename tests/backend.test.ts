// No real account, database, or upstream API calls are made by these tests.
Deno.env.set('SPOTIFY_CLIENT_ID', 'test-client');
Deno.env.set('SPOTIFY_CLIENT_SECRET', 'test-secret');
Deno.env.set('APP_URL', 'https://headtap.example');
Deno.env.delete('TICKETMASTER_API_KEY');
const { app } = await import('../src/supabase/functions/server/index.tsx');
function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
Deno.test('health endpoint responds', async () => {
 const res = await app.request('/make-server-a9c438e5/health'); equal(res.status, 200); equal(await res.json(), {status:'ok'});
});
Deno.test('unregistered OAuth redirect is rejected', async () => {
 const res = await app.request('/make-server-a9c438e5/spotify/auth-url?app_url=https://evil.example'); equal(res.status,400); await res.text();
});
Deno.test('registered OAuth redirect produces a state-bound authorization URL', async () => {
 const res = await app.request('/make-server-a9c438e5/spotify/auth-url?app_url=https://headtap.example'); equal(res.status,200);
 const data = await res.json(); const url = new URL(data.authUrl); equal(url.origin,'https://accounts.spotify.com'); equal(url.searchParams.get('state'),data.state); equal(url.searchParams.get('redirect_uri'),'https://headtap.example');
});
Deno.test('legacy unchecked callback is disabled', async () => {
 const res = await app.request('/make-server-a9c438e5/spotify/callback?code=untrusted'); equal(res.status,410); await res.text();
});
Deno.test('code exchange rejects unauthorized destination before contacting Spotify', async () => {
 const res = await app.request('/make-server-a9c438e5/spotify/exchange-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:'fake',redirect_uri:'https://evil.example'})}); equal(res.status,400); await res.text();
});
Deno.test('missing Ticketmaster key never returns invented concerts', async () => {
 const res = await app.request('/make-server-a9c438e5/concerts?session=fake&location=Boston'); equal(res.status,503); const data = await res.json(); equal(data.concerts,undefined);
});
Deno.test('invalid distances are rejected', async () => {
 for (const distance of ['NaN','-1','999999']) { const res = await app.request(`/make-server-a9c438e5/concerts?session=fake&location=Boston&distance=${distance}`); equal(res.status,400); await res.text(); }
});
