import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAlertPreferences, matchingShows, allowedPushEndpoint, quietHours, showMessage} from '../src/utils/showAlerts.ts';
const prefs={zip:'10001',radius:25,maxPrice:null,frequency:'daily',timezone:'America/New_York',artists:['  Artist One  ']};
const show=(price=40,currency='USD')=>({id:'e1',name:'Artist One live',dates:{status:{code:'onsale'},start:{localDate:'2026-11-20'}},_embedded:{attractions:[{name:'Artist One'}],venues:[{name:'The Venue'}]},priceRanges:price===null?[]:[{min:price,currency}],distance:12.2});
test('alert preferences preserve every artist beyond fifty and validate numeric inputs',()=>{
 const p=validateAlertPreferences({...prefs,artists:Array.from({length:1500},(_,i)=>`Artist ${i}`)});
 assert.equal(p.artists.length,1500);
 assert.throws(()=>validateAlertPreferences({...prefs,zip:'1000'}));
 assert.throws(()=>validateAlertPreferences({...prefs,maxPrice:NaN}));
 assert.throws(()=>validateAlertPreferences({...prefs,radius:10000}));
 assert.throws(()=>validateAlertPreferences({...prefs,timezone:'not-a-zone'}));
 assert.deepEqual(validateAlertPreferences(prefs).artists,['artist one']);
});
test('matching uses attraction identity, excludes cancelled shows and honors free/unknown budgets',()=>{
 assert.equal(matchingShows([show()],prefs).length,1);
 assert.equal(matchingShows([{...show(),_embedded:{attractions:[{name:'Artist One Tribute'}]}}],prefs).length,0);
 assert.equal(matchingShows([{...show(),dates:{status:{code:'cancelled'}}}],prefs).length,0);
 assert.equal(matchingShows([show(0),show(null),show(10)],{...prefs,maxPrice:0}).length,1);
 assert.equal(matchingShows([show(null)],prefs).length,1);
 assert.equal(matchingShows([show(30,'EUR')],{...prefs,maxPrice:50}).length,0);
});
test('push destinations reject SSRF, credential tricks and lookalike domains',()=>{
 for(const endpoint of ['http://fcm.googleapis.com/x','https://localhost/x','https://127.0.0.1','https://fcm.googleapis.com.attacker.example/x','https://fcm.googleapis.com:8443/x','https://user@fcm.googleapis.com/x']) assert.equal(allowedPushEndpoint(endpoint),false,endpoint);
 for(const endpoint of ['https://fcm.googleapis.com/fcm/send/x','https://web.push.apple.com/x','https://updates.push.services.mozilla.com/wpush/v2/x']) assert.equal(allowedPushEndpoint(endpoint),true);
});
test('quiet hours use local time and follow daylight saving changes',()=>{
 assert.equal(quietHours('America/New_York',new Date('2026-10-20T12:59:00Z')),true);
 assert.equal(quietHours('America/New_York',new Date('2026-10-20T13:00:00Z')),false);
 assert.equal(quietHours('America/New_York',new Date('2026-10-21T01:00:00Z')),true);
 assert.equal(quietHours('America/New_York',new Date('2026-12-20T13:59:00Z')),true);
});
test('notification prices are qualified and absent prices never become free',()=>{
 assert.match(showMessage(show()),/Listed from \$40; final price may differ/);
 assert.match(showMessage(show(null)),/Price unavailable/);
 assert.match(showMessage(show()),/12 mi/);
});
