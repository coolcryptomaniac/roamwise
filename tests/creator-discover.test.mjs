// Nov 2026: Discover swipe deck, Nomad tab, Natasha banner and single wallet control.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('bottom bar defaults include Discover and Nomad, with icons', () => {
  const s = read('js/ui/adaptive-shell.js');
  assert.match(s, /RW_TABS_DEFAULT = \['home','copilot','discover','plan','nomad','more'\]/);
  assert.match(s, /discover: \{icon:/); assert.match(s, /nomad: +\{icon:/);
  assert.match(s, /\n  discover:'</); assert.match(s, /\n  nomad:'</);
  assert.match(s, /'\["home","copilot","plan","more"\]'/, 'old 4-tab default migrates to the new bar');
});
test('index loads the deck, banner and styles', () => {
  const h = read('index.html');
  for (const f of ['design/creator-discover.css', 'js/ui/swipe-discover.js', 'js/ui/ambassador-banner.js']) assert.ok(h.includes(f), f);
});
test('wallet de-duplication follows sign-in state, not the current tab', () => {
  assert.doesNotMatch(read('js/ui/home-mobile-recovery.js'), /getComputedStyle\(chip\)/);
  assert.doesNotMatch(read('design/ailon-first.css'), /#rwWalletChip \{display:none/);
});
test('banner fallback matches the artist data for Natasha', () => {
  const d = JSON.parse(read('creators/artists-data.json'));
  const n = d.artists.find((a) => a.id === 'natasha-guleria');
  const b = read('js/ui/ambassador-banner.js');
  assert.ok(b.includes(n.instagram)); assert.ok(b.includes(n.photo.src));
  for (const m of b.matchAll(/image: '([^']+)'/g)) assert.ok(fs.existsSync(new URL('..' + m[1], import.meta.url)), m[1]);
});
test('swipe deck never books, prices or sends enquiries', () => {
  const s = read('js/ui/swipe-discover.js');
  assert.doesNotMatch(s, /fetch\([^)]*(enquir|book|pay|checkout)/i);
  assert.match(s, /window\.rwOpenDiscover|W\.rwOpenDiscover = open/);
});
