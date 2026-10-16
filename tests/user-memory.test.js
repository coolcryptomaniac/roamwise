'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { makeTusk, eventPrompt } = require('../tools/ai-ops/tusk-harness.cjs');

const H = 3600 * 1000;
const T0 = Date.UTC(2026, 9, 16, 4, 0, 0); // 09:30 IST

function fresh(){
  const t = makeTusk();
  t.state.showToast = () => {};
  return t;
}
const learn = (t, q, at) => {
  const intents = t.parse(q);
  return t.state.rwUmLearn(intents, q, at || T0);
};

test('learns home city, budget, days and style from ordinary questions, never raw text', () => {
  const t = fresh(), s = t.state;
  learn(t, 'Plan 4 days in Udaipur under 12000 for a romantic trip');
  learn(t, 'Plan 5 days in Jaipur under 15000 with my family');
  learn(t, 'I live in Almora, plan 3 days in Kasar Devi under 9k');
  const g = s.rwUmGet();
  assert.equal(g.home, 'Almora');
  assert.equal(g.homeSrc, 'stated');
  assert.equal(g.days, 4);
  assert.equal(g.budget, 12000);
  assert.ok(g.places.length >= 2);
  const stored = JSON.stringify(s.rwUmLoad());
  assert.ok(!/romantic trip|my family|Plan 4 days/.test(stored), 'raw question text must not be stored');
});

test('home city is inferred only after the same starting city appears twice', () => {
  const t = fresh(), s = t.state;
  learn(t, 'Plan a trip to Goa. My starting city is Mumbai.');
  assert.equal(s.rwUmGet().home, '');
  learn(t, 'Plan a trip to Manali. My starting city is Mumbai.');
  const g = s.rwUmGet();
  assert.equal(g.home, 'Mumbai');
  assert.equal(g.homeSrc, 'inferred');
  learn(t, 'I live in Pune and want 3 days in Goa');
  assert.equal(s.rwUmGet().home, 'Pune', 'a stated city beats an inferred one');
});

test('smalltalk, memory commands, weak guesses and follow-ups are not learned', () => {
  const t = fresh(), s = t.state;
  assert.equal(s.rwUmLearn({ smalltalk: 'greet' }, 'hello there', T0), false);
  assert.equal(learn(t, 'what do you remember about me'), false);
  s.rwUmLearn({ dest: 'Zzyzx', _weakDest: true, days: 3 }, 'zzyzx 3 days trip', T0);
  s.rwUmLearn({ dest: 'Goa', _inherited: true }, 'what about food there', T0);
  assert.equal(Object.keys(s.rwUmLoad().dests).length, 0);
});

test('pausing stops learning, forgetting wipes it, and the profile never leaks into the prompt when empty', () => {
  const t = fresh(), s = t.state;
  learn(t, 'Plan 4 days in Udaipur under 12000');
  learn(t, 'Plan 4 days in Udaipur under 12000 please');
  assert.ok(s.rwUmHasData());
  assert.match(s.rwUmPrompt(), /soft default/);
  assert.match(s.rwUmPrompt(), /usual budget about ₹12000/);
  s.rwUmPause(true);
  const before = s.rwUmLoad().n;
  learn(t, 'Plan 6 days in Goa under 30000');
  assert.equal(s.rwUmLoad().n, before, 'paused: nothing learned');
  assert.equal(s.rwUmPrompt(), '', 'paused: nothing sent to the AI');
  s.rwUmPause(false);
  s.rwUmForget('all');
  assert.equal(s.rwUmHasData(), false);
  assert.equal(s.rwUmPrompt(), '');
});

test('forget one item at a time', () => {
  const t = fresh(), s = t.state;
  learn(t, 'I live in Almora, plan 4 days in Udaipur under 12000');
  learn(t, 'Plan 4 days in Udaipur under 12000');
  s.rwUmForget('home');
  let g = s.rwUmGet();
  assert.equal(g.home, '');
  assert.ok(g.budget, 'budget kept');
  s.rwUmForget('money');
  g = s.rwUmGet();
  assert.ok(!g.budget && !g.days);
  s.rwUmForget('places');
  assert.equal(s.rwUmGet().places.length, 0);
});

test('chat commands show the card, forget, pause and resume', () => {
  const t = fresh(), s = t.state;
  learn(t, 'I live in Almora, plan 4 days in Udaipur under 12000');
  const card = s.rwUmAnswer('What do you remember about me?');
  assert.match(card, /What Ailon Tusk remembers about you/);
  assert.match(card, /Almora/);
  assert.match(card, /rwUmForget\('all'\)/);
  assert.match(card, /Stored on this device only/);
  assert.match(s.rwUmAnswer('stop remembering'), /paused/);
  assert.equal(s.rwUmOn(), false);
  assert.match(s.rwUmAnswer('resume learning'), /back on/);
  assert.match(s.rwUmAnswer('forget everything'), /forgotten everything/);
  assert.equal(s.rwUmHasData(), false);
  assert.equal(s.rwUmAnswer('plan 3 days in Goa'), null);
});

test('a remembered home city fills a missing starting city in event answers, and says so', () => {
  const t = fresh(), s = t.state;
  learn(t, 'I live in Delhi, plan 3 days in Goa under 20000');
  const dgtl = t.events.find(e => /DGTL/.test(e.name));
  const noOrigin = eventPrompt(dgtl, '');
  const a = s.rwEventTripAnswer(noOrigin, new Date('2026-10-16T09:30:00+05:30'), s.rwUmOrigin());
  assert.equal(a.origin, 'Delhi');
  assert.match(a.html.replace(/<[^>]+>/g, ' '), /Using your usual starting city, Delhi/);
  const own = s.rwEventTripAnswer(eventPrompt(dgtl, 'Mumbai'), new Date('2026-10-16T09:30:00+05:30'), s.rwUmOrigin());
  assert.equal(own.origin, 'Mumbai', 'what the user says now always wins');
  assert.doesNotMatch(own.html.replace(/<[^>]+>/g, ' '), /usual starting city/);
});

test('suggestion chips come from the profile and are escaped', () => {
  const t = fresh(), s = t.state;
  assert.equal(s.rwUmChipsHTML(), '');
  learn(t, 'I live in Almora, weather in Udaipur for 4 days under 12000');
  learn(t, 'weather in Udaipur for 4 days under 12000');
  const chips = s.rwUmSuggestions();
  assert.ok(chips.length >= 2 && chips.length <= 3);
  assert.ok(chips.some(c => /Udaipur/.test(c.label)));
  assert.match(s.rwUmChipsHTML(), /cpFollow\('/);
});

test('one-time notice appears once, only after something is remembered', () => {
  const t = fresh(), s = t.state;
  assert.equal(s.rwUmNotice(), '');
  learn(t, 'I live in Almora, plan 4 days in Udaipur under 12000');
  learn(t, 'plan 4 days in Udaipur under 12000');
  assert.match(s.rwUmNotice(), /remembers your travel preferences on this device/);
  assert.equal(s.rwUmNotice(), '');
});

test('memory is capped and old places are dropped', () => {
  const t = fresh(), s = t.state;
  for(let i = 0; i < 45; i++) s.rwUmLearn({ dest: 'Place' + String.fromCharCode(65 + (i % 26)) + String.fromCharCode(97 + Math.floor(i / 26)) + 'xyz', days: 3 }, 'trip to place number ' + i, T0 + i);
  assert.ok(Object.keys(s.rwUmLoad().dests).length <= 30);
  assert.ok(s.rwUmLoad().trips.length <= 5);
});

test('account sync is off by default, needs sign-in, sends the profile only, and turning it off deletes the copy', () => {
  const t = fresh(), s = t.state;
  const writes = [];
  const FieldValue = { serverTimestamp: () => 'TS', delete: () => 'DEL' };
  s.AUTH_READY = true;
  s.firebase = {
    auth: () => ({ currentUser: { uid: 'u1' } }),
    firestore: Object.assign(() => ({ collection: c => ({ doc: id => ({ set: (d, o) => { writes.push({ c, id, d, o }); return Promise.resolve(); }, get: () => Promise.resolve({ exists: false }) }) }) }), { FieldValue })
  };
  learn(t, 'I live in Almora, plan 4 days in Udaipur under 12000');
  assert.equal(s.rwUmSyncOn(), false);
  s.rwUmPush();
  assert.equal(writes.length, 0, 'nothing leaves the device before consent');
  s.rwUmSetSync(true);
  const w = writes.find(x => x.d.tuskMemory && x.d.tuskMemory !== 'DEL');
  assert.ok(w, 'profile pushed after opt-in');
  assert.equal(w.c, 'users');
  assert.equal(w.id, 'u1');
  assert.equal(w.o.merge, true);
  assert.ok(!/Plan 4 days|under 12000 /.test(w.d.tuskMemory), 'no chat text in the synced payload');
  s.rwUmSetSync(false);
  const del = writes[writes.length - 1];
  assert.equal(del.d.tuskMemory, 'DEL');
  assert.equal(s.rwUmSyncOn(), false);
});

test('sync refuses when signed out', () => {
  const t = fresh(), s = t.state;
  let toast = '';
  s.showToast = m => { toast = m; };
  s.rwUmSetSync(true);
  assert.equal(s.rwUmSyncOn(), false);
  assert.match(toast, /Sign in/);
});

test('the pre-answer hook handles memory commands without an AI call and leaves normal questions alone', () => {
  const t = fresh(), s = t.state;
  const finished = [];
  s.cpFinish = (b, html, intents, raw) => finished.push({ html, intents, raw });
  const it = t.parse('what do you remember about me');
  assert.equal(s.rwTuskPreAnswer({}, it, 'what do you remember about me'), true);
  assert.equal(it.smalltalk, 'memory');
  assert.match(finished[0].html, /remembers about you/);
  const it2 = t.parse('plan 3 days in Goa');
  assert.equal(s.rwTuskPreAnswer({}, it2, 'plan 3 days in Goa'), false);
});

test('cache keys ignore word order unless the question has a direction', () => {
  const t = fresh();
  assert.equal(t.key('plan 4 days in udaipur under 12000'), t.key('udaipur 12000 4 days plan under in'));
  assert.notEqual(t.key('flights from Delhi to Goa in March'), t.key('flights from Goa to Delhi in March'));
});
