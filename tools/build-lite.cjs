#!/usr/bin/env node
'use strict';
/* Builds the compact destination guide embedded in lite/index.html from js/data/destinations.js
   (the single source of truth), so the low-data page never drifts from the full app.
   node tools/build-lite.cjs          rewrite the data block
   node tools/build-lite.cjs --check  exit 1 if lite/index.html is out of date */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const START = '/*LITE-DATA-START*/', END = '/*LITE-DATA-END*/';

function compact() {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/data/destinations.js'), 'utf8') + ';this.__DB = DB;', ctx);
  return ctx.__DB.filter((d) => d.country === 'India').map((d) => {
    const quiet = d.crowd.map((v, i) => [v, i + 1]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, 3).map((x) => x[1]).sort((a, b) => a - b);
    return { n: d.name, b: d.bestM, q: quiet, c: [d.cost.budget, d.cost.mid, d.cost.luxury], f: (d.food || []).slice(0, 3), g: (d.gems || []).slice(0, 3), l: d.local || '' };
  });
}

function render(html) {
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a < 0 || b < a) throw new Error('lite/index.html is missing the LITE-DATA markers');
  return html.slice(0, a + START.length) + JSON.stringify(compact()) + html.slice(b);
}

if (require.main === module) {
  const file = path.join(root, 'lite/index.html');
  const cur = fs.readFileSync(file, 'utf8'), next = render(cur);
  if (process.argv.includes('--check')) {
    if (cur !== next) { console.error('lite/index.html is out of date. Run: node tools/build-lite.cjs'); process.exit(1); }
    console.log('Lite check PASS: ' + compact().length + ' India destinations, ' + Buffer.byteLength(cur) + ' bytes.');
  } else { fs.writeFileSync(file, next); console.log('Wrote ' + compact().length + ' destinations into lite/index.html (' + Buffer.byteLength(next) + ' bytes).'); }
}
module.exports = { compact, render };
