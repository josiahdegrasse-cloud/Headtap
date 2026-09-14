import test from 'node:test';
import assert from 'node:assert/strict';
import {weekendRange,nightOutPicks,sameDateShows,spotifyArtistId,localEventDate} from '../src/utils/nightOut.ts';
import {filterConcerts} from '../src/utils/concerts.ts';
test('weekend means Friday through Sunday including current Sunday',()=>{
 for(const [date,start,end] of [['2026-09-14',18,21],['2026-09-20',18,21]]){
 const range=weekendRange(new Date(date+'T12:00:00'));assert.equal(range.start.getDate(),start);assert.equal(range.end.getDate(),end);
 }
});
test('picks prioritize recommendation score and distinct artists',()=>{
 const e=(id,artist,score)=>({id,artist,recommendation:{score}});
 assert.deepEqual(nightOutPicks([e('a','A',90),e('b','A',80),e('c','C',70),e('d','D',-1)]).map(e=>e.id),['a','c']);
});
test('same-date warnings do not imply exact time collisions',()=>assert.deepEqual([...sameDateShows([{id:'a',date:'2026-09-20'},{id:'b',date:'2026-09-20'},{id:'c',date:'2026-09-21'}])],['a','b']));
test('date-only events preserve their venue day and invalid Spotify IDs cannot embed',()=>{
 assert.equal(localEventDate('2026-09-18').getDate(),18);assert.equal(spotifyArtistId('../bad'),null);assert.equal(spotifyArtistId('a'.repeat(22)),'a'.repeat(22));
});
test('weekend budget excludes unknown prices, non-USD prices and weekdays',()=>{
 const events=[{id:'yes',date:'2026-09-18',price:20},{id:'unknown',date:'2026-09-18'},{id:'eur',date:'2026-09-18',price:20,currency:'EUR'},{id:'mon',date:'2026-09-21',price:20}];
 const filters={selectedGenres:[],dateRange:'weekend',minCost:0,maxCost:50,jointBudget:0,ticketCount:1,sortBy:'date'};
 assert.deepEqual(filterConcerts(events,[],filters,new Date('2026-09-14T12:00:00')).map(e=>e.id),['yes']);
});
