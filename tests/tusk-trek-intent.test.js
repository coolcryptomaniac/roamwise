'use strict';
/* Tusk's offline engine must not answer a conference question with the Trek
   vault just because the event is called a "summit". */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'js/copilot/rich-reply.js'), 'utf8');
const m = /function rwIsTrekQuestion\(raw\)\{[\s\S]*?\n\}\n/.exec(src);
assert.ok(m, 'rwIsTrekQuestion not found');
const ctx = {};
vm.runInNewContext(m[0] + ';this.f = rwIsTrekQuestion;', ctx);
const isTrek = ctx.f;

test('event and product words are not trekking', () => {
  ['Plan my trip to Bengaluru Tech Summit 2026',
   'Bengaluru Tech Summit 19-21 Nov, stay near the venue',
   'Web Summit Lisbon budget', 'global investor summit in Dehradun',
   'how does Trail Mesh work', 'open trail mesh', 'G20 summit traffic in Delhi'
  ].forEach((q) => assert.equal(isTrek(q), false, q));
});
test('real trekking questions still open the Trek vault', () => {
  ['easy treks near Manali', 'Kedarkantha trek cost', 'hiking in Kumaon', 'Everest base camp',
   'best trails near Almora', 'summit push on Stok Kangri', 'how hard is the climb to the summit',
   'trek to attend the tech summit'
  ].forEach((q) => assert.equal(isTrek(q), true, q));
});
test('the trekking rule uses the helper', () => {
  assert.match(src, /if\(rwIsTrekQuestion\(String\(it\._raw\|\|''\)\)\)\{/);
});
