import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('public MOU offers carry no phone numbers, emails or street addresses', () => {
  const s = read('partner/mou/offers.js');
  assert.doesNotMatch(s, /\d{10}/);
  assert.doesNotMatch(s, /@/);
  const offers = JSON.parse(s.split('window.RW_MOU_OFFERS = ')[1].trim().replace(/;$/, ''));
  const ids = Object.keys(offers);
  assert.ok(ids.length >= 50 && ids.length <= 150);
  for (const id of ids) {
    assert.match(id, /^[a-z2-9]{8}$/);
    assert.ok(offers[id].n && !('a' in offers[id]));
  }
});

test('MOU keeps V4 terms and adds a separate long-stay annexure; RoamWise pre-signs only real offers', () => {
  const mou = read('partner/mou/index.html'), js = read('partner/mou/mou.js');
  assert.match(mou, /RW-PMOU-2026-09-27-V4/);
  assert.match(mou, /RW-PMOU-LS-2026-10-15-A1/);
  assert.match(mou, /changes none of them/);
  assert.match(js, /hasOwnProperty\.call\(offers, offerId\)/);
  assert.match(js, /if \(offer\) \{\s*\$\('rwPresigned'\)\.hidden = false/);
  assert.match(js, /new Date\(\)\.toISOString\(\)/);
});

test('join form records long-stay details without self-verifying and requires a typed signature', () => {
  const join = read('partner/join/index.html'), ls = read('partner/join/longstay.js');
  assert.match(join, /RW-PMOU-2026-09-27-V4/);
  assert.match(join, /longstay\.js/);
  assert.match(join, /id="mouSign"/);
  assert.match(ls, /verified: false/);
  assert.match(ls, /serverTimestamp\(\)/);
  assert.doesNotMatch(ls, /\bstatus\s*[:=]\s*['"](approved|live|signed)/);
});
