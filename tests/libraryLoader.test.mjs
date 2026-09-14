import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSavedLibrary} from '../src/utils/libraryLoader.ts';
test('loads every page past fifty and publishes increasing progress',async()=>{
 const offsets=[], progress=[];
 const items=Array.from({length:123},(_,id)=>({id}));
 const result=await loadSavedLibrary(async offset=>{offsets.push(offset);return {items:items.slice(offset,offset+50),total:123,nextOffset:offset+50<123?offset+50:null};},rows=>progress.push(rows.length));
 assert.deepEqual(offsets,[0,50,100]);
 assert.deepEqual(progress,[50,100,123]);
 assert.deepEqual(result,items);
});
test('failed later page does not erase published songs or report completion',async()=>{
 let visible=[];
 await assert.rejects(loadSavedLibrary(async offset=>{if(offset)throw new Error('Rate limited');return {items:[{id:'a'}],total:2,nextOffset:50};},rows=>visible=rows),/Rate limited/);
 assert.equal(visible.length,1);
});
test('rejects repeating pagination and old backend responses',async()=>{
 await assert.rejects(loadSavedLibrary(async()=>({items:[],nextOffset:0}),()=>{}),/Invalid library page/);
 await assert.rejects(loadSavedLibrary(async()=>({items:[]}),()=>{}),/updated backend/);
});
test('resumes from checkpoint without fetching completed pages',async()=>{
 const offsets=[];
 const result=await loadSavedLibrary(async offset=>{offsets.push(offset);return {items:[{id:'b'}],total:2,nextOffset:null};},()=>{}, {tracks:[{id:'a'}],nextOffset:50});
 assert.deepEqual(offsets,[50]);assert.deepEqual(result,[{id:'a'},{id:'b'}]);
});
