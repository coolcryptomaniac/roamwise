// Regression: esc() in event-handoff.js once had the '"' key twice and no "'" key,
// so every apostrophe in an event or city name rendered as the word "undefined".
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../js/copilot/event-handoff.js', import.meta.url), 'utf8');
const escSrc = src.match(/function esc\([^\n]*/)[0];
const esc = new Function(escSrc + ';return esc;')();

test('event-handoff esc() escapes every HTML-special character', () => {
  assert.equal(esc("Kainchi Dham's Mela"), 'Kainchi Dham&#39;s Mela');
  assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  assert.doesNotMatch(esc(`'"<>&`), /undefined/);
  assert.equal(esc(null), '');
});
