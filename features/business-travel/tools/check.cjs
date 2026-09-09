#!/usr/bin/env node
// Dependency-free architecture and asset budget gate; included by npm run check.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { gzipSync } = require('node:zlib');
const feature = path.resolve(__dirname, '..');
const repo = path.resolve(__dirname, '../../..');
const manifest = require('../feature.json');
const read = file => fs.readFileSync(path.join(feature, file), 'utf8');
const html = fs.readFileSync(path.join(repo, manifest.publicPage), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)];
const prefix = '../features/business-travel/';
assert.deepEqual(scripts.map(m => m[1]), manifest.browserScripts.map(f => prefix + f), 'Browser script order drift');
assert.ok(scripts.every(m => /\bdefer\b/.test(m[0])), 'Feature scripts must defer in order');
const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(styles, manifest.stylesheets.map(f => prefix + f));
assert.match(html, /connect-src 'none'/);
assert.doesNotMatch(fs.readFileSync(path.join(repo, 'index.html'), 'utf8'), /<script[^>]+(?:features\/business-travel|business\/)/);
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (m[1].startsWith('#')) continue;
  assert.ok(fs.existsSync(path.resolve(repo, 'business', m[1].split('#')[0])), 'Missing link/asset: ' + m[1]);
}
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:js|cjs)$/.test(entry.name)) files.push(file);
  }
}
walk(feature);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const relative = path.relative(feature, file).split(path.sep).join('/');
  if (/^(?:core|ui|api)\//.test(relative)) {
    assert.ok(manifest.modules[relative], 'Unindexed runtime module: ' + relative);
    assert.ok(fs.readFileSync(file, 'utf8').split('\n').length <= manifest.runtimeModuleLineLimit, 'Split module: ' + relative);
  }
}
Object.keys(manifest.modules).forEach(read);
let gzipBytes = gzipSync(html).length, rawBytes = Buffer.byteLength(html);
for (const file of [...manifest.browserScripts, ...manifest.stylesheets]) {
  const source = read(file); gzipBytes += gzipSync(source).length; rawBytes += Buffer.byteLength(source);
}
assert.ok(gzipBytes < manifest.gzipBudgetBytes, 'Business frontend exceeded its gzip budget');
const api = JSON.parse(read('contracts/openapi.json'));
assert.equal(api.swagger, '2.0');
function checkRefs(value) {
  if (!value || typeof value !== 'object') return;
  if (value.$ref) assert.ok(api.definitions[value.$ref.split('/').pop()], 'Unknown OpenAPI reference: ' + value.$ref);
  Object.values(value).forEach(checkRefs);
}
checkRefs(api);
console.log(`Business check PASS: ${files.length} JS files; ${rawBytes} raw / ${gzipBytes} gzip frontend bytes; script order, module map, limits, links and OpenAPI references valid.`);
