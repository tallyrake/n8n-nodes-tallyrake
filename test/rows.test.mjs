// What the node hands to the next step in a workflow: one item per row by default, and a cut at the plan's row cap
// that is never silent.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { rowsFrom, toRows } = require('../dist/nodes/Tallyrake/rows.js');

const body = (extra = {}) => ({ count: 2, rowCap: 100, fetchedAt: '2026-10-26T07:00:45Z', items: [{ term: 'a', value: 1 }, { term: 'a', value: 2 }], ...extra });

test('rows mode: one item per row, rows unchanged', () => {
	assert.deepEqual(rowsFrom(body(), 'rows'), [{ json: { term: 'a', value: 1 } }, { json: { term: 'a', value: 2 } }]);
});

test('a cut answer marks every row truncated: true', () => {
	const rows = rowsFrom(body({ truncated: true }), 'rows');
	assert.equal(rows.length, 2);
	assert.ok(rows.every((r) => r.json.truncated === true));
});

test('an answer that was not cut adds no truncated field', () => {
	assert.ok(rowsFrom(body({ truncated: false }), 'rows').every((r) => !('truncated' in r.json)));
});

test('response mode: the whole answer as one item, truncated included', () => {
	const b = body({ truncated: true });
	assert.deepEqual(rowsFrom(b, 'response'), [{ json: b }]);
});

test('an answer with no rows is no items, not a crash', () => {
	assert.deepEqual(rowsFrom({ count: 0, items: [] }, 'rows'), []);
	assert.deepEqual(rowsFrom(null, 'rows'), []);
});

test('toRows reads the Output parameter, defaulting to rows', async () => {
	const ctx = (value) => ({ getNodeParameter: (name, fallback) => (name === 'output' ? value ?? fallback : fallback) });
	assert.equal((await toRows.call(ctx(undefined), [], { body: body() })).length, 2);
	assert.equal((await toRows.call(ctx('response'), [], { body: body() })).length, 1);
});
