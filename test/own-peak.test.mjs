// The README says each term in an Interest Over Time answer is scored against its own peak, so two terms are not
// comparable unless 'Compare Terms on One Scale' is on. This replays one real call (pickleball and padel, US,
// recorded 2026-10-26 through RapidAPI) and pins both halves: the node asks the question that was recorded, and in
// that answer each term reaches 100 in its own week.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { pairs, requestFor } from './request.mjs';

const require = createRequire(import.meta.url);
const { Tallyrake } = require('../dist/nodes/Tallyrake/Tallyrake.node.js');
const { rowsFrom, toRows } = require('../dist/nodes/Tallyrake/rows.js');

const FIXTURE = JSON.parse(fs.readFileSync(new URL('./fixtures/interest-pickleball-padel-2026-10-26.json', import.meta.url), 'utf8'));
const description = new Tallyrake().description;
const SAMPLE = { terms: 'pickleball, padel', options: { geo: 'US', timeRange: 'today 12-m' } };

export function peaks(rows) {
	const by = {};
	for (const { json: row } of rows) (by[row.term] ??= []).push(row);
	return Object.fromEntries(Object.entries(by).map(([term, list]) => {
		const max = Math.max(...list.map((r) => r.value));
		return [term, { max, at: list.filter((r) => r.value === max).map((r) => r.time) }];
	}));
}

test('the README sample asks the recorded question on the recorded route, with no compare parameter', () => {
	const req = requestFor(description, 'interest', SAMPLE);
	const recorded = new URL(FIXTURE.request.url);
	assert.equal(req.method, FIXTURE.request.method);
	assert.equal(req.url.host, recorded.host);
	assert.equal(req.url.pathname, recorded.pathname);
	assert.deepEqual(pairs(req.url), pairs(recorded));
	assert.equal(req.url.searchParams.has('compare'), false);
});

test('only the options a user adds are sent: terms alone is a one-parameter question', () => {
	const req = requestFor(description, 'interest', { terms: 'pickleball' });
	assert.deepEqual(pairs(req.url), [['terms', 'pickleball']]);
});

test('compare is sent only when the user turns it on', () => {
	const req = requestFor(description, 'interest', { ...SAMPLE, options: { ...SAMPLE.options, compare: true } });
	assert.equal(req.url.searchParams.get('compare'), 'true');
});

test('every operation hands the answer to toRows', () => {
	for (const op of ['interest', 'regions', 'related']) assert.deepEqual(requestFor(description, op, { terms: 'x' }).postReceive, [toRows]);
});

test('each term in the recorded answer peaks at 100 in its own week', () => {
	const rows = rowsFrom(FIXTURE.response.body, 'rows');
	assert.equal(rows.length, FIXTURE.response.body.items.length);
	const p = peaks(rows);
	assert.deepEqual(Object.keys(p).sort(), ['padel', 'pickleball']);
	assert.equal(p.pickleball.max, 100);
	assert.equal(p.padel.max, 100);
	assert.notDeepEqual(p.pickleball.at, p.padel.at);
});

test('a shared-scale answer would fail the peak check', () => {
	const body = { ...FIXTURE.response.body, items: FIXTURE.response.body.items.map((r) => (r.term === 'padel' ? { ...r, value: Math.round(r.value / 4) } : r)) };
	assert.notEqual(peaks(rowsFrom(body, 'rows')).padel.max, 100);
});
