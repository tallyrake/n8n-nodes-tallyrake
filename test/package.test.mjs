// The package-level rules a community node is checked against (docs.n8n.io, read 2026-10-26): the n8n- name prefix,
// the community keyword, MIT, no runtime dependencies, nodes and credentials listed under "n8n", and no environment
// or file-system access in the shipped code. Plus the one thing that is ours: every call says which client made it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const { VERSION, USER_AGENT, RAPIDAPI_HOST } = require('../dist/nodes/Tallyrake/constants.js');
const { Tallyrake } = require('../dist/nodes/Tallyrake/Tallyrake.node.js');
const { TallyrakeApi } = require('../dist/credentials/TallyrakeApi.credentials.js');

test('name, keyword and license are the ones n8n looks for', () => {
	assert.match(pkg.name, /^n8n-nodes-/);
	assert.ok(pkg.keywords.includes('n8n-community-node-package'));
	assert.equal(pkg.license, 'MIT');
	assert.ok(fs.existsSync(path.join(ROOT, 'LICENSE.md')), 'LICENSE.md ships with the repo');
});

// KILN-N8N-README-1 (2026-10-27): a keyword is an indexed claim. This node returns a 0 to 100 index, a geo split and
// related queries, not volume, difficulty or CPC, so no keyword-research tag in any spelling and no "any country".
test('no keyword promises what the node does not return', () => {
	for (const k of pkg.keywords) {
		assert.doesNotMatch(k.replace(/[^a-z]/gi, '').toLowerCase(), /keywordresearch|anycountry/, k);
	}
	assert.doesNotMatch(pkg.description, /keyword research|any country/i);
});

test('no runtime dependencies: only devDependencies and the n8n-workflow peer', () => {
	assert.deepEqual(Object.keys(pkg.dependencies ?? {}), []);
	assert.deepEqual(Object.keys(pkg.peerDependencies ?? {}), ['n8n-workflow']);
});

test('every node and credential listed under "n8n" exists in the build', () => {
	for (const rel of [...pkg.n8n.nodes, ...pkg.n8n.credentials]) assert.ok(fs.existsSync(path.join(ROOT, rel)), rel);
});

test('the User-Agent names this package at the version in package.json', () => {
	assert.equal(VERSION, pkg.version);
	assert.equal(USER_AGENT, `n8n-nodes-tallyrake/${pkg.version}`);
	const d = new Tallyrake().description;
	assert.equal(d.requestDefaults.headers['User-Agent'], USER_AGENT);
	assert.equal(new TallyrakeApi().test.request.headers['User-Agent'], USER_AGENT);
});

test('the node and its credential point at the one RapidAPI listing', () => {
	const d = new Tallyrake().description;
	assert.equal(d.displayName, 'Google Trends (Tallyrake)');
	assert.equal(d.requestDefaults.baseURL, `https://${RAPIDAPI_HOST}`);
	assert.equal(RAPIDAPI_HOST, 'google-trends-data.p.rapidapi.com');
	const cred = new TallyrakeApi();
	assert.deepEqual(Object.keys(cred.authenticate.properties.headers).sort(), ['x-rapidapi-host', 'x-rapidapi-key']);
	assert.equal(cred.authenticate.properties.headers['x-rapidapi-host'], RAPIDAPI_HOST);
	assert.equal(cred.properties.find((p) => p.name === 'apiKey').typeOptions.password, true);
});

test('the shipped code reads no environment variables and touches no files', () => {
	const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
	const js = walk(path.join(ROOT, 'dist')).filter((f) => f.endsWith('.js'));
	assert.ok(js.length >= 4);
	for (const f of js) {
		const src = fs.readFileSync(f, 'utf8');
		assert.doesNotMatch(src, /process\.env|require\(["'](node:)?(fs|child_process|os)["']\)/, path.relative(ROOT, f));
		for (const [, mod] of src.matchAll(/require\(["']([^"']+)["']\)/g)) assert.ok(mod === 'n8n-workflow' || mod.startsWith('.'), `${path.relative(ROOT, f)} requires ${mod}`);
	}
});
