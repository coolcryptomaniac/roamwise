import test from 'node:test';
import assert from 'node:assert/strict';
import { runPartnerInform, planFor, WINDOW_UTC, ROUTINE_HOUR_UTC } from '../worker/handlers/partner-inform.js';
import { partnerEmail, promoFor } from '../worker/lib/partner-email.js';

const at = (h) => Date.parse(`2026-11-16T${String(h).padStart(2, '0')}:10:00Z`);
const row = (o) => ({ id: o.id, name: o.name, email: o.email, location: { town: o.town || '' }, niches: [], stage: 'new', flags: [], metrics: {}, best: o.best || null });
const perfect = { name: 'Big Bro Hotel', propertyId: 'bb', verdict: 'send', score: 90, terms: { lines: [{ item: 'cash', status: 'ok' }] } };

function fakeDeps(apps){
  const kv = new Map(), sent = [], boxes = [], patches = [];
  return { kv, sent, boxes, patches,
    creators: async () => apps, partners: async () => [], policies: async () => [], approved: async () => [],
    outbox: async (id, v) => boxes.push({ id, ...v }), patch: async (p, v) => patches.push([p, v]),
    kvGet: async (k) => kv.get(k) || null, kvPut: async (k, v) => kv.set(k, v),
    send: async (m) => { sent.push(m); return { ok: true, provider: 'brevo' }; } };
}

test('plan: perfect, cash ask goes to review, missing town gets a nudge, opt-out skipped', () => {
  assert.equal(planFor(row({ id: 'a', name: 'A', email: 'a@x.com', town: 'Nainital', best: perfect })).tier, 'perfect');
  const cash = { ...perfect, terms: { lines: [{ item: 'cash', status: 'gap' }] } };
  assert.equal(planFor(row({ id: 'b', name: 'B', email: 'b@x.com', town: 'Delhi', best: cash })).tier, 'review');
  assert.equal(planFor(row({ id: 'c', name: 'C', email: 'c@x.com' })).msg.kind, 'profile');
  assert.equal(planFor(row({ id: 'd', name: 'D', email: 'd@x.com' }), { emailOptOut: true }).tier, 'skip');
  assert.equal(planFor(row({ id: 'e', name: 'E', email: 'e@x.com', town: 'X', best: { ...perfect, verdict: 'negotiate', score: 60 } })), null);
});

test('no mail at night', async () => {
  const r = await runPartnerInform({ PARTNER_INFORM_ENABLED: 'true' }, { deps: fakeDeps([]), now: at(WINDOW_UTC[1] + 2) });
  assert.equal(r.skipped, 'night');
});

test('dry run only writes drafts', async () => {
  const d = fakeDeps([{ id: 'c1', seg: 'creator', name: 'Cee', email: 'c@x.com', consent: true }]);
  const r = await runPartnerInform({}, { deps: d, now: at(ROUTINE_HOUR_UTC) });
  assert.equal(r.live, false); assert.equal(d.sent.length, 0); assert.equal(d.boxes[0].status, 'draft');
});

test('routine mail waits for the daily batch hour and respects the cap', async () => {
  const apps = [1, 2, 3].map((i) => ({ id: 'c' + i, seg: 'creator', name: 'Cee' + i, email: `c${i}@x.com` }));
  const off = fakeDeps(apps);
  await runPartnerInform({ PARTNER_INFORM_ENABLED: 'true' }, { deps: off, now: at(ROUTINE_HOUR_UTC + 2) });
  assert.equal(off.sent.length, 0);
  const on = fakeDeps(apps);
  const r = await runPartnerInform({ PARTNER_INFORM_ENABLED: 'true', PARTNER_DAILY_CAP: '2', EMAIL_UNSUB_SECRET: 's' }, { deps: on, now: at(ROUTINE_HOUR_UTC) });
  assert.equal(r.routine, 2); assert.equal(on.sent.length, 2);
  assert.match(on.sent[0].html, /Unsubscribe/); assert.match(on.sent[0].html, /RoamWise/);
  assert.equal(on.patches[0][1].stage, 'contacted');
  const again = await runPartnerInform({ PARTNER_INFORM_ENABLED: 'true', PARTNER_DAILY_CAP: '2' }, { deps: on, now: at(ROUTINE_HOUR_UTC) });
  assert.equal(again.sent, 0, 'same people are not mailed twice');
});

test('email never carries prices or phone numbers, and rotates promos', () => {
  const m = partnerEmail({ kind: 'match', name: 'Asha Rao', propertyName: 'Big Bro Hotel', unsubUrl: 'https://x/u' });
  assert.match(m.subject, /Big Bro Hotel/); assert.match(m.html, /Hi|Good news, Asha/);
  assert.doesNotMatch(m.html + m.text, /₹|\+91|\b\d{10}\b/);
  assert.notEqual(promoFor(new Date('2026-11-16')).title, promoFor(new Date('2026-11-23')).title);
});
