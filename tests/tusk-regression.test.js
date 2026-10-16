'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { makeTusk, eventPrompt } = require('../tools/ai-ops/tusk-harness.cjs');

const NOW = new Date('2026-10-16T09:30:00+05:30');
const tusk = makeTusk();
const flat = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('the DGTL India request from the Oct 2026 report is answered as an event trip, not month picks', () => {
  const dgtl = tusk.events.find(e => /DGTL/.test(e.name));
  const q = eventPrompt(dgtl, 'Mumbai');
  assert.ok(q.length > 220, 'this is the long prompt that used to be wrapped by rwStartAnywhere');
  assert.equal(tusk.parse(q)._recommendCount, undefined);
  const a = tusk.event(q, NOW);
  assert.ok(a, 'event answer expected');
  const text = flat(a.html);
  assert.match(text, /DGTL India/);
  assert.match(text, /13.14 November 2026/);
  assert.match(text, /Lalit Ashok, Bengaluru/);
  assert.match(text, /Ballard Pier, Mumbai/);
  assert.match(text, /you start in Mumbai/);
  assert.match(text, /which day is in which city/);
  assert.doesNotMatch(text, /strong picks for/);
  assert.equal(a.origin, 'Mumbai');
  assert.equal(a.city, 'Mumbai');
});

test('every event the page lists gets its own correct answer for its own prompt', () => {
  for(const e of tusk.events){
    const q = eventPrompt(e, 'Delhi');
    assert.equal(tusk.parse(q)._recommendCount, undefined, e.name + ': must not parse as best-places');
    const a = tusk.event(q, new Date('2026-10-16T09:30:00+05:30'));
    if(new Date(e.end + 'T23:59:59+05:30') < NOW){ continue; }
    assert.ok(a, e.name + ': event answer expected');
    const text = flat(a.html);
    assert.ok(text.includes(e.name.replace(/&/g, '&amp;')) || text.includes(e.name), e.name + ': names the event');
    assert.ok(text.includes(e.when), e.name + ': shows the dates from the data');
    assert.match(text, /official page/, e.name + ': tells the user to confirm on the official page');
    assert.doesNotMatch(text, /strong picks for/);
  }
});

test('a finished event says so instead of planning a trip to the past', () => {
  const rif = tusk.events.find(e => /Jodhpur RIFF/.test(e.name));
  const a = tusk.event(eventPrompt(rif, 'Delhi'), new Date('2026-12-01T10:00:00+05:30'));
  assert.match(flat(a.html), /already finished/);
});

test('the pasted-text wrapper wording is never read as a best-places request', () => {
  const wrapped = 'The user pasted a long block of text. Extract the travel intent from it: the destination(s), any dates/duration, budget, and the kind of trip.';
  assert.equal(tusk.parse(wrapped)._recommendCount, undefined);
  assert.equal(tusk.parse('x'.repeat(10) + ' best places ' + 'y'.repeat(220))._recommendCount, undefined);
});

test('genuine recommendation asks still work', () => {
  const r = tusk.parse('just tell me five besties for next month that is October');
  assert.equal(r._recommendCount, 5);
  assert.equal(r._recommendMonth, 10);
  assert.equal(tusk.parse('best places in November')._recommendCount, 5);
});

test('answer cache keys: same question matches, order matters, follow-ups and thin queries are never cached', () => {
  const k1 = tusk.key('Plan 4 days in Udaipur under 12000 please');
  const k2 = tusk.key('  plan 4 DAYS in udaipur under 12000 ');
  assert.ok(k1 && k1 === k2, 'case, spacing and filler do not change the key');
  assert.notEqual(tusk.key('flights from Delhi to Goa in March'), tusk.key('flights from Goa to Delhi in March'));
  assert.equal(tusk.key('what about food there'), null);
  assert.equal(tusk.key('Udaipur'), null);
  assert.equal(tusk.key('best places to visit in march', { _recommendCount: 5 }), null);
});

test('relevance gate: an answer that ignores the places in the question is never saved', () => {
  const q = 'Plan a trip around DGTL India in Mumbai';
  assert.equal(tusk.relevant(q, '5 strong picks for November: Chopta, Prague, Petra'), false);
  assert.equal(tusk.relevant(q, 'DGTL India runs 13-14 November; stay near Ballard Pier in Mumbai.'), true);
  assert.equal(tusk.relevant('how do I get a visa quickly', 'Apply online and keep your passport ready for the appointment.'), true);
  assert.equal(tusk.relevant(q, 'ok'), false);
  assert.equal(tusk.relevant(q, 'ASK: which city? || Mumbai | Bengaluru'), false);
});

test('answer cache stores, serves, expires live questions, and forgets on thumbs-down', () => {
  const s = tusk.state;
  const key = s.rwAnsKey('How much does Kedarnath helicopter cost today');
  const t0 = 1_700_000_000_000;
  assert.ok(s.rwAnsPut(key, '<b>answer</b>', 'How much does Kedarnath helicopter cost today', t0));
  assert.ok(s.rwAnsGet(key, null, t0 + 60_000), 'fresh hit');
  assert.equal(s.rwAnsGet(key, null, t0 + 4 * 3600_000), null, 'live question expires after 3 hours');
  assert.ok(s.rwAnsGet(key, { stale: true }, t0 + 4 * 3600_000), 'stale answer still usable as offline fallback');
  const k2 = s.rwAnsKey('Best time to visit Ladakh for photography');
  s.rwAnsPut(k2, '<b>Ladakh</b>', 'Best time to visit Ladakh for photography', t0);
  assert.ok(s.rwAnsGet(k2, null, t0 + 6 * 24 * 3600_000), 'normal answers last 7 days');
  assert.equal(s.rwAnsGet(k2, null, t0 + 8 * 24 * 3600_000), null);
  s.rwAnsDrop(k2);
  assert.equal(s.rwAnsGet(k2, { stale: true }, t0 + 1000), null, 'thumbs-down forgets the answer');
});

test('answer cache keeps at most 80 entries', () => {
  const s = tusk.state;
  for(let i = 0; i < 95; i++) s.rwAnsPut('k' + i, '<i>' + i + '</i>', 'q', 1_700_000_000_000 + i);
  assert.ok(Object.keys(s.rwAnsLoad()).length <= 80);
  assert.ok(s.rwAnsGet('k94', null, 1_700_000_000_000 + 100), 'newest kept');
  assert.equal(s.rwAnsGet('k0', { stale: true }, 1_700_000_000_000 + 100), null, 'oldest evicted');
});
