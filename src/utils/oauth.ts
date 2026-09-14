export function validateAuthorization(data: { authUrl?: string; state?: string; redirect_uri?: string }, redirectUri: string) {
  const url = new URL(data.authUrl || '');
  if (url.origin !== 'https://accounts.spotify.com' || url.pathname !== '/authorize' ||
      !data.state || url.searchParams.get('state') !== data.state ||
      url.searchParams.get('redirect_uri') !== redirectUri || url.searchParams.get('response_type') !== 'code') {
    throw new Error('The sign-in service returned an invalid authorization URL.');
  }
  return url.href;
}
export function validCallbackState(state: string | null, expected: string | null) {
  return Boolean(state && expected && state === expected);
}
