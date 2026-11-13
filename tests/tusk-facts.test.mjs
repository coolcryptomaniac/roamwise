import test from 'node:test';
import assert from 'node:assert/strict';
import { matchFacts, factsBlock, directFactAnswer, guardAnswer, liveItems } from '../worker/lib/tusk-facts.js';
import { TUSK_FACTS } from '../worker/data/tusk-facts.js';

test('facts pack is well formed', () => {
  const ids = new Set();
  for(const it of TUSK_FACTS.items){
    assert.ok(it.id && !ids.has(it.id), 'unique id ' + it.id); ids.add(it.id);
    assert.ok(it.keys.length && it.facts.length && it.sources.length, it.id);
    assert.match(it.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    for(const s of it.sources) assert.ok(new URL(s).protocol === 'https:', s);
    for(const f of it.facts) assert.ok(!/wa\.me|whatsapp/i.test(f), 'no WhatsApp numbers in facts');
  }
});

test('matches the named destination, not a lookalike', () => {
  assert.equal(matchFacts('Is Gir safari open next week?')[0].id, 'gir');
  assert.equal(matchFacts('dhikala zone jeep safari')[0].id, 'corbett');
  assert.equal(matchFacts('girls trip to goa').length, 0);
});

test('stale items are never served', () => {
  const now = new Date('2030-01-01');
  assert.equal(liveItems(TUSK_FACTS, now).length, 0);
  assert.equal(matchFacts('gir safari', { now }).length, 0);
});

test('facts block carries today and the check date', () => {
  const b = factsBlock(matchFacts('kedarnath trip'), new Date('2026-11-14'));
  assert.match(b, /Today is 2026-11-14/);
  assert.match(b, /11 November 2026/);
});

test('emergency questions are answered directly', () => {
  const d = directFactAnswer('emergency number in manali?', matchFacts('emergency number in manali?'));
  assert.ok(d && /112/.test(d.text) && /1363/.test(d.text));
  assert.equal(directFactAnswer('plan corbett 3 days', matchFacts('plan corbett 3 days')), null);
});

test('guard masks invented numbers and links, keeps verified ones and prices', () => {
  const t = guardAnswer('Call 112 or 1800-11-1363. Hotel desk +91 98765 43210. Book at girlion.gujarat.gov.in not at girsafaribooking.com. Price ₹ 1,700 or Rs 25000. Season 2026-2027. https://evil.example.com/x');
  assert.match(t, /112/);
  assert.match(t, /1800-11-1363/);
  assert.doesNotMatch(t, /98765/);
  assert.match(t, /girlion\.gujarat\.gov\.in/);
  assert.doesNotMatch(t, /girsafaribooking/);
  assert.doesNotMatch(t, /evil\.example/);
  assert.match(t, /₹ 1,700/);
  assert.match(t, /Rs 25000/);
  assert.match(t, /2026-2027/);
});
