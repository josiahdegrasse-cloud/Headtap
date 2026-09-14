import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuthorization, validCallbackState } from '../src/utils/oauth.ts';
const redirect = 'http://127.0.0.1:3000';
const authUrl = `https://accounts.spotify.com/authorize?state=nonce&redirect_uri=${encodeURIComponent(redirect)}&response_type=code`;
test('authorization URL must match Spotify, nonce and registered redirect', () => assert.equal(validateAuthorization({authUrl,state:'nonce'},redirect),authUrl));
test('rejects attacker host, callback destination, response type and state', () => {for (const url of [authUrl.replace('accounts.spotify.com','evil.example'),authUrl.replace('nonce','other'),authUrl.replace('3000','4000'),authUrl.replace('response_type=code','response_type=token')]) assert.throws(()=>validateAuthorization({authUrl:url,state:'nonce'},redirect));});
test('callback requires an exact nonempty browser nonce', () => {assert.equal(validCallbackState('nonce','nonce'),true);for(const pair of [[null,null],['',''],['x',null],['x','y']]) assert.equal(validCallbackState(...pair),false);});
