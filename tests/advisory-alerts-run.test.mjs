// End-to-end run of worker/handlers/advisory-alerts.js against a fake Google (OAuth, Firestore,
// FCM), a fake Gmail relay and an in-memory KV. Checks who is told, by which channel, and once.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { runAdvisoryAlerts } from '../worker/handlers/advisory-alerts.js';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = JSON.stringify({ project_id: 'rw-test', client_email: 'x@rw-test.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
const FEED = fs.readFileSync('data/conditions.json', 'utf8');
const NOW = Date.parse('2026-10-30T05:30:00Z');

function val(v) {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return { integerValue: String(v) };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(val) } };
  return { mapValue: { fields: fields(v) } };
}
function fields(o) { return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, val(v)])); }
const docOf = (col, id, o) => ({ name: `projects/rw-test/databases/(default)/documents/${col}/${id}`, fields: fields(o) });

function world(settings) {
  const db = {
    'config/tripNotifySettings': settings,
    'users/guest1': { email: 'guest1@x.com', pushTokens: { d1: { token: 'tok-guest1' } } },
    'users/guest2': { email: 'guest2@x.com' },
    'users/owner1': { email: 'owner@x.com' },
    'users/fan1': { email: 'fan@x.com', alertRegions: ['pithoragarh'], pushTokens: { d9: { token: 'tok-fan' } } },
    'users/boss': { email: 'boss@x.com', pushTokens: { d2: { token: 'tok-boss' } } },
  };
  const bookings = [
    { id: 'b1', status: 'confirmed', guestUid: 'guest1', guestEmail: 'guest1@x.com', guestName: 'Asha', partnerUid: 'owner1', property: 'Kainchi View', zone: 'Nainital', area: 'Bhowali', checkIn: '2026-11-07', checkOut: '2026-11-09', ref: 'RW-1', guests: 2 },
    { id: 'b2', status: 'requested', guestUid: '', guestEmail: 'guest2@x.com', guestName: 'Ravi', partnerUid: 'owner1', property: 'Kainchi View', zone: 'Nainital', area: 'Bhowali', checkIn: '2026-11-02', checkOut: '2026-11-03', ref: 'RW-2', guests: 1 },
    { id: 'b3', status: 'confirmed', guestUid: 'guest1', guestEmail: 'guest1@x.com', property: 'Goa Villa', zone: 'Goa', area: 'Candolim', checkIn: '2026-11-07', checkOut: '2026-11-09' },
  ];
  const log = { push: [], mail: [], deleted: [] };
  const fetchMock = async (url, init = {}) => {
    const u = String(url);
    const body = init.body ? String(init.body) : '';
    if (u.startsWith('https://oauth2.googleapis.com/token')) return Response.json({ access_token: 'at', expires_in: 3600 });
    if (u.endsWith('/data/conditions.json')) return new Response(FEED, { headers: { 'content-type': 'application/json' } });
    if (u.startsWith('https://fcm.googleapis.com/')) { log.push.push(JSON.parse(body).message.token); return Response.json({ name: 'ok' }); }
    if (u.startsWith('https://script.google.com/')) { log.mail.push(JSON.parse(body).to); return Response.json({ ok: true }); }
    const fs = 'https://firestore.googleapis.com/v1/projects/rw-test/databases/(default)/documents';
    if (u === fs + ':runQuery') {
      const q = JSON.parse(body).structuredQuery;
      const f = q.where.fieldFilter;
      let rows = [];
      if (q.from[0].collectionId === 'roomBookings') rows = bookings.filter((b) => b.status === f.value.stringValue).map((b) => docOf('roomBookings', b.id, b));
      if (q.from[0].collectionId === 'users' && f.op === 'ARRAY_CONTAINS') rows = Object.entries(db).filter(([k, v]) => k.startsWith('users/') && (v.alertRegions || []).includes(f.value.stringValue)).map(([k, v]) => docOf('users', k.slice(6), v));
      return Response.json(rows.map((d) => ({ document: d })));
    }
    if (u.startsWith(fs + '/admins')) return Response.json({ documents: [docOf('admins', 'boss', { role: 'founder' })] });
    if (u.startsWith(fs + '/')) {
      const path = decodeURIComponent(u.slice(fs.length + 1).split('?')[0]);
      if (init.method === 'PATCH') { log.deleted.push(path); return Response.json({}); }
      return db[path] ? Response.json({ fields: fields(db[path]) }) : new Response('', { status: 404 });
    }
    throw new Error('unexpected fetch ' + u);
  };
  const kv = new Map();
  const env = {
    FIREBASE_SERVICE_ACCOUNT_JSON: SA, GMAIL_RELAY_URL: 'https://script.google.com/x/exec', GMAIL_RELAY_SECRET: 's',
    ALERT_TEAM_EMAILS: 'team@x.com, bad-address',
    RW_KV: { get: async (k) => kv.get(k) || null, put: async (k, v) => { kv.set(k, v); } },
  };
  return { env, log, kv, fetchMock };
}

async function withFetch(f, fn) { const real = globalThis.fetch; globalThis.fetch = f; try { return await fn(); } finally { globalThis.fetch = real; } }

test('switches off: nothing is read or sent', async () => {
  const w = world({});
  const r = await withFetch(w.fetchMock, () => runAdvisoryAlerts(w.env, { now: NOW, digest: true }));
  assert.equal(r.off, true);
  assert.deepEqual([w.log.push.length, w.log.mail.length], [0, 0]);
});

test('all on: guests, follower, partner and team are each told once', async () => {
  const w = world({ advisoryAlerts: true, partnerAlerts: true, teamDigest: true, maxEmailsPerRun: 10 });
  const r = await withFetch(w.fetchMock, () => runAdvisoryAlerts(w.env, { now: NOW, digest: true }));
  assert.equal(r.affectedBookings, 2, 'the Goa booking is not affected');
  assert.equal(r.guests, 2);
  assert.equal(r.followers, 1);
  assert.equal(r.partners, 1);
  assert.ok(w.log.push.includes('tok-guest1'), 'guest with a device gets push');
  assert.ok(w.log.mail.includes('guest2@x.com'), 'guest without a device gets email');
  assert.ok(w.log.push.includes('tok-fan'), 'follower of Pithoragarh hears about Adi Kailash');
  assert.ok(w.log.mail.includes('owner@x.com'), 'partner without a device gets email');
  assert.ok(w.log.mail.includes('team@x.com') && !w.log.mail.includes('bad-address'), 'digest to the valid team address');
  assert.ok(w.log.push.includes('tok-boss'), 'digest push to admins');
  assert.ok(w.kv.has('adv:kainchi-crowds-autumn-2026:g:b1'));
  assert.ok(w.kv.has('digest:2026-10-30'));

  w.log.push.length = 0; w.log.mail.length = 0;
  const again = await withFetch(w.fetchMock, () => runAdvisoryAlerts(w.env, { now: NOW + 3600000, digest: true }));
  assert.deepEqual([again.guests, again.followers, again.partners, w.log.push.length, w.log.mail.length], [0, 0, 0, 0, 0], 'nobody is told twice');
});

test('Worker var turns alerts on without any Firestore switch', async () => {
  const w = world(null);
  w.env.ADVISORY_ALERTS = 'guests';
  const r = await withFetch(w.fetchMock, () => runAdvisoryAlerts(w.env, { now: NOW }));
  assert.deepEqual([r.settings.advisoryAlerts, r.settings.partnerAlerts, r.guests, r.partners], [true, false, 2, 0]);
});

test('dry run sends nothing and marks nothing; no KV means no live send', async () => {
  const w = world({ advisoryAlerts: true, partnerAlerts: true, teamDigest: true });
  const r = await withFetch(w.fetchMock, () => runAdvisoryAlerts(w.env, { now: NOW, dry: true, digest: true }));
  assert.equal(r.guests, 2);
  assert.deepEqual([w.log.push.length, w.log.mail.length, w.kv.size], [0, 0, 0]);
  const noKv = { ...w.env, RW_KV: undefined };
  const r2 = await withFetch(w.fetchMock, () => runAdvisoryAlerts(noKv, { now: NOW }));
  assert.equal(r2.skipped, 'no_kv');
});

test('email budget is respected and the rest is deferred', async () => {
  const w = world({ advisoryAlerts: true, partnerAlerts: true, maxEmailsPerRun: 1 });
  const r = await withFetch(w.fetchMock, () => runAdvisoryAlerts(w.env, { now: NOW }));
  assert.equal(w.log.mail.length, 1);
  assert.ok(r.deferred >= 1);
});
