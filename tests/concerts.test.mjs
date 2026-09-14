import test from 'node:test';
import assert from 'node:assert/strict';
import { filterConcerts, concertPrice } from '../src/utils/concerts.ts';
const now = new Date('2026-09-10T12:00:00Z');
const defaults = { selectedGenres: [], minCost: 0, maxCost: Infinity, ticketCount: 1, jointBudget: 0, sortBy: 'date', dateRange: 'all' };
const event = (id, extra = {}) => ({ id, artist: 'Artist', date: '2026-09-11T20:00:00Z', ...extra });
const run = (events, changes = {}) => filterConcerts(events, [], { ...defaults, ...changes }, now).map(c => c.id);
test('free events retain zero prices', () => assert.equal(concertPrice({price_min: 0, price: 70}), 0));
test('zero maximum means free only, not unlimited', () => assert.deepEqual(run([event('free', {price:0}), event('paid',{price:10}),event('unknown')], {maxCost:0}), ['free']));
test('unknown prices stay visible by default but cannot satisfy a budget', () => { assert.deepEqual(run([event('unknown')]), ['unknown']); assert.deepEqual(run([event('unknown')], {jointBudget:100}), []); });
test('joint budget accounts for ticket count', () => assert.deepEqual(run([event('yes',{price:25}),event('no',{price:30})],{ticketCount:4,jointBudget:100}),['yes']));
test('past and invalid dates never show as upcoming', () => assert.deepEqual(run([event('past',{date:'2020-01-01'}),event('bad',{date:'x'}),event('future')]),['future']));
test('date range excludes distant events', () => assert.deepEqual(run([event('soon'),event('later',{date:'2026-10-20'})],{dateRange:'week'}),['soon']));
test('unknown prices sort last in either direction without mutating input', () => {const events=[event('unknown'),event('cheap',{price:10}),event('costly',{price:20})];assert.deepEqual(run(events,{sortBy:'cost_high'}),['costly','cheap','unknown']);assert.equal(events[0].id,'unknown');});
test('genre filtering uses event genres when artist is unknown', () => assert.deepEqual(run([event('match',{genres:['indie pop']}),event('other',{genres:['rock']})],{selectedGenres:['pop']}),['match']));

test('no limit includes expensive events', () => assert.deepEqual(run([event('expensive',{price:1500})]),['expensive']));
