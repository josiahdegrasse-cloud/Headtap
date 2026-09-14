import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceMiles, bestEventImage, featuredReasons } from '../src/utils/eventDetails.ts';
test('distance is zero at the origin and about 190 miles NYC to Boston',()=>{assert.equal(distanceMiles(0,0,0,0),0);assert.ok(Math.abs(distanceMiles(40.7128,-74.006,42.3601,-71.0589)-190)<5);});
test('invalid venue coordinates produce no distance',()=>assert.equal(distanceMiles(40,-74,NaN,10),null));
test('prefer real artist image, otherwise large landscape event image',()=>{assert.equal(bestEventImage([{url:'https://artist',width:640}],[{url:'https://event',width:1024}]),'https://artist');assert.equal(bestEventImage([],[{url:'https://tiny',width:50,height:50},{url:'https://large',width:1024,height:576}]),'https://large');assert.equal(bestEventImage(), '');});
test('highlight superstar and discovery reasons instead of truncating them',()=>assert.deepEqual(featuredReasons(['Genre match','⭐⭐ Major superstar - extremely popular artist','Other reason','🔍 Great new artist match - worth exploring']),['⭐⭐ Major superstar - extremely popular artist','🔍 Great new artist match - worth exploring','Genre match']));
