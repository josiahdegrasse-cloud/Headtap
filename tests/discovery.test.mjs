import test from 'node:test';
import assert from 'node:assert/strict';
import {rankConcerts,explainConcert,similarity,defaultPreferences} from '../src/utils/discovery.ts';
const artists=[{name:'Known',genres:['indie pop'],savedTrackCount:7}];
const events=[{id:'known',artist:'Known',genres:['indie pop']},{id:'new',artist:'New',genres:['indie pop']},{id:'unknown',artist:'Mystery',genres:[]}];
test('adventure shifts a relevant discovery above a familiar artist',()=>{
 assert.equal(rankConcerts(events,artists,{...defaultPreferences,adventure:0})[0].id,'known');
 assert.equal(rankConcerts(events,artists,{...defaultPreferences,adventure:100})[0].id,'new');
});
test('negative feedback demotes artist without removing saved data',()=>{
 const result=rankConcerts(events,artists,{...defaultPreferences,feedback:{known:'not-for-me'}});
 assert.equal(result.at(-1).id,'known');assert.equal(result.length,3);
});
test('unknown metadata gives honest explanation and no invented connection',()=>{
 const result=explainConcert(events[2],artists,defaultPreferences);
 assert.equal(result.connections.length,0);assert.match(result.evidence[0],/No shared genre evidence/);
});
test('explanations cite actual library counts and exact shared genres',()=>{
 assert.match(explainConcert(events[0],artists,defaultPreferences).evidence[0],/7 saved songs/);
 assert.match(explainConcert(events[1],artists,defaultPreferences).evidence[0],/indie pop with Known/);
 assert.equal(similarity({genres:['pop','pop']},{genres:['pop']}).score,1);
});
