import test from 'node:test';
import assert from 'node:assert/strict';
import {libraryArtistCount,genreSummary,libraryArtists} from '../src/utils/musicSummary.ts';
test('library counts artists once and tolerates missing items',()=>assert.equal(libraryArtistCount([{artists:[{id:'a',name:'A'},{id:'b',name:'B'}]},{artists:[{id:'a',name:'A'}]},null]),2));
test('genre shares deduplicate tags and exclude artists with no genres',()=>assert.deepEqual(genreSummary([{genres:['pop','pop','rock']},{genres:['pop']},{genres:[]}]),[{genre:'pop',count:2,percent:100,artistsWithGenres:2},{genre:'rock',count:1,percent:50,artistsWithGenres:2}]));
test('empty data never produces invalid percentages',()=>assert.deepEqual(genreSummary([]),[]));

test('full genre collection is not capped at six',()=>assert.equal(genreSummary([{genres:Array.from({length:80},(_,i)=>`genre-${i}`)}],Infinity).length,80));
test('library preserves artists beyond the top fifty and merges genre details',()=>{
 const tracks=Array.from({length:123},(_,i)=>({artists:[{id:String(i),name:`Artist ${i}`}]}));
 const result=libraryArtists(tracks,[{id:'100',name:'Artist 100',genres:['jazz']}]);
 assert.equal(result.length,123);
 assert.deepEqual(result.find(a=>a.id==='100').genres,['jazz']);
 assert.equal(result.find(a=>a.id==='100').savedTrackCount,1);
});
