import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page = fs.readFileSync(new URL('../summit/index.html', import.meta.url), 'utf8');
const start = page.indexOf('function respond(t){');
const end = page.indexOf('\nfunction ask(text){', start);
assert.ok(start >= 0 && end > start, 'Summit responder exists');
const context = { window: {}, turns: 0 };
vm.createContext(context);
vm.runInContext(page.slice(start, end), context);
const ask = (q) => context.respond(q);

test('summit FAQs use verified date, speaker list and programme framing', () => {
  assert.match(ask('When and where is the summit?'), /17 to 19 November.*BIEC/);
  assert.match(ask('Which speakers are coming?'), /Vivek Raghavan/);
  assert.match(ask('Is there a vernacular AI session?'), /Bhasha & Beyond/);
});

test('networking question does not get mistaken for venue question', () => {
  assert.match(ask('Where can I meet investors?'), /Best lead hunt/);
});

test('opt-in Ailon mini-quiz supports an actual second turn', () => {
  assert.match(ask('Play a quiz'), /What does BIEC stand for/);
  assert.match(ask('A'), /Exactly/);
  assert.equal(context.window.rwSummitMiniQuiz, false);
});

test('free Pro is never falsely promised by scanning', () => {
  assert.match(ask('Does this QR give me free Pro?'), /does not automatically grant Founder Pro/);
});

test('signup links preserve summit attribution on the landing page', () => {
  assert.match(page, /function carrySource\(\)/);
  assert.match(page, /searchParams\.set\('rw_rep',code\)/);
  assert.match(page, /searchParams\.set\('rw_campaign','bts26'\)/);
});
