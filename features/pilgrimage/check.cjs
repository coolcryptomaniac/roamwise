'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { spawnSync } = require('node:child_process'), { gzipSync } = require('node:zlib');
const repo = path.resolve(__dirname, '../..');
const generated = spawnSync(process.execPath, [path.join(__dirname, 'build-pages.cjs'), '--check'], { encoding: 'utf8' });
assert.equal(generated.status, 0, generated.stderr);
const { scriptsFor, styles } = require('./build-pages.cjs');
for (const name of fs.readdirSync(__dirname).filter(f => /\.(js|cjs)$/.test(f))) {
  const file = path.join(__dirname, name), result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.ok(fs.readFileSync(file, 'utf8').split('\n').length <= 350, 'Split module: ' + name);
}
for (const slug of ['pilgrimage', 'char-dham', 'panch-kedar', 'kumbh', 'vaishno-devi', 'kashi', 'tirupati', 'ayodhya', 'dwarka-somnath', 'puri-konark', 'amarnath', 'shirdi', 'bodh-gaya', 'rameswaram-madurai', 'kasar-devi-almora', 'jageshwar', 'adi-kailash', 'kailash-mansarovar']) {
  const source = fs.readFileSync(path.join(repo, slug, 'index.html'), 'utf8'); let size = gzipSync(source).length;
  for (const asset of [...scriptsFor(slug), ...styles]) size += gzipSync(fs.readFileSync(path.resolve(repo, slug, asset))).length;
  assert.ok(size < 61440, slug + ' exceeds 60 KiB gzip source budget');
}
console.log('Pilgrimage check PASS: eighteen generated entries, classic scripts, syntax/line limits and 60 KiB per-page source budgets.');
