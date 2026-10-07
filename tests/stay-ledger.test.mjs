import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import {
  validCode, commissionFor, parseSettle, buildStatement, sha256Hex, monthOf,
} from '../worker/lib/stay-ledger-core.js';
import { handleStay } from '../worker/handlers/stay-ledger.js';

test('commission and GST are whole rupees and always add up', () => {
  const c = commissionFor(12345, 7, 18);
  assert.equal(c.commission, 864);            // 864.15 -> 864
  assert.equal(c.gst, 156);                   // 155.52 -> 156
  assert.equal(c.total, c.commission + c.gst);
  assert.deepEqual(commissionFor(-5, 7, 18).total, 0);
  assert.equal(commissionFor(1000, 99, 18).commissionPct, 30);   // capped
});

test('codes: strict shape, no look-alike characters', () => {
  assert.ok(validCode('RW-7KQ2MX'));
  for (const bad of ['RW-7KQ2M0', 'RW-7KQ2MI', 'rw-7kq2mx', 'RW-7KQ2M', 'RW-7KQ2MXX', '', null, 5]) assert.equal(validCode(bad), false);
});

test('settle validation', () => {
  assert.equal(parseSettle({ code: 'RW-7KQ2MX', status: 'completed' }).error, 'completed needs an amount');
  assert.equal(parseSettle({ code: 'RW-7KQ2MX', status: 'enquired' }).error, 'bad status');
  assert.equal(parseSettle({ code: 'nope', status: 'completed', amount: 10 }).error, 'bad code');
  const ok = parseSettle({ code: 'RW-7KQ2MX', status: 'completed', amount: '4500.4', commissionPct: 5, checkIn: '2026-10-03' });
  assert.deepEqual(ok.value, { code: 'RW-7KQ2MX', status: 'completed', amount: 4500, commissionPct: 5, checkIn: '2026-10-03' });
  assert.ok(parseSettle({ code: 'RW-MABC12', status: 'cancelled', partnerId: 'milan-heights' }).value);
});

test('statement totals and leakage flags', () => {
  const rows = [
    { code: 'RW-AAAAAA', partnerId: 'p1', status: 'completed', amount: 10000, commissionPct: 7, checkIn: '2026-10-02', guestStayed: 'yes' },
    { code: 'RW-BBBBBB', partnerId: 'p1', status: 'enquired', guestStayed: 'yes', checkIn: '2026-10-05' },
    { code: 'RW-CCCCCC', partnerId: 'p1', status: 'cancelled', guestStayed: 'yes', createdAt: '2026-10-06T00:00:00Z' },
    { code: 'RW-DDDDDD', partnerId: 'p2', status: 'completed', amount: 5000, commissionPct: 5, settledAt: '2026-10-09T00:00:00Z', guestStayed: 'no' },
    { code: 'RW-EEEEEE', partnerId: 'p2', status: 'completed', amount: 9999, createdAt: '2026-09-30T00:00:00Z' },
  ];
  const s = buildStatement(rows, '2026-10');
  assert.equal(s.totals.completed, 2);
  assert.equal(s.totals.gross, 15000);
  assert.equal(s.totals.commission, 700 + 250);
  assert.equal(s.totals.total, s.totals.commission + s.totals.gst);
  assert.equal(s.totals.unreported, 1);
  assert.equal(s.totals.conflicts, 2);
  assert.deepEqual(s.flags.map((f) => f.kind).sort(), [
    'conflict_reported_cancelled_guest_yes', 'conflict_reported_completed_guest_no', 'guest_stayed_not_reported',
  ]);
  assert.equal(monthOf('2026-10-02T10:00:00Z'), '2026-10');
});

/* ---- handler with an in-memory store ---- */
function store() {
  const m = new Map();
  return {
    m,
    configured: () => true,
    get: async (c) => m.get(c) || null,
    create: async (c, v) => { if (m.has(c)) return false; m.set(c, { ...v }); return true; },
    update: async (c, v) => { m.set(c, { ...m.get(c), ...v }); },
    list: async () => [...m.values()],
    isAdmin: async (req) => req.headers.get('authorization') === 'Bearer admin',
  };
}
const post = (path, body, headers = {}) => new Request('https://w.test/' + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const call = async (d, req, path) => { const r = await handleStay(req, {}, path, d); return [r.status, await r.json()]; };

test('enquiry is create-only and validates input', async () => {
  const d = store();
  const hash = await sha256Hex('secret-secret-123');
  assert.equal((await call(d, post('stay/enquiry', { code: 'RW-7KQ2MX', partnerId: 'milan-heights', secretHash: hash }), 'stay/enquiry'))[0], 200);
  // a second request with the same code must not overwrite the first
  const [, again] = await call(d, post('stay/enquiry', { code: 'RW-7KQ2MX', partnerId: 'evil', secretHash: await sha256Hex('x') }), 'stay/enquiry');
  assert.equal(again.created, false);
  assert.equal(d.m.get('RW-7KQ2MX').partnerId, 'milan-heights');
  assert.equal((await call(d, post('stay/enquiry', { code: 'bad', partnerId: 'p', secretHash: hash }), 'stay/enquiry'))[0], 400);
  assert.equal((await call(d, post('stay/enquiry', { code: 'RW-7KQ2MY', partnerId: 'p', secretHash: 'zz' }), 'stay/enquiry'))[0], 400);
});

test('only the device holding the secret can confirm', async () => {
  const d = store();
  const secret = 'abcdefgh-secret-1';
  await call(d, post('stay/enquiry', { code: 'RW-7KQ2MX', partnerId: 'p1', secretHash: await sha256Hex(secret) }), 'stay/enquiry');
  assert.equal((await call(d, post('stay/confirm', { code: 'RW-7KQ2MX', secret: 'wrong-secret-xx', stayed: 'yes' }), 'stay/confirm'))[0], 403);
  assert.equal((await call(d, post('stay/confirm', { code: 'RW-7KQ2MX', secret, stayed: 'maybe' }), 'stay/confirm'))[0], 400);
  assert.equal((await call(d, post('stay/confirm', { code: 'RW-7KQ2MZ', secret, stayed: 'yes' }), 'stay/confirm'))[0], 404);
  assert.equal((await call(d, post('stay/confirm', { code: 'RW-7KQ2MX', secret, stayed: 'yes' }), 'stay/confirm'))[0], 200);
  assert.equal(d.m.get('RW-7KQ2MX').guestStayed, 'yes');
  // a manually recorded stay has no secret: nobody can confirm it with an empty one
  d.m.set('RW-MAAAAA', { code: 'RW-MAAAAA', partnerId: 'p1', secretHash: '' });
});

test('settle and statement are admin-only and never leak the secret hash', async () => {
  const d = store();
  const secret = 'abcdefgh-secret-1';
  await call(d, post('stay/enquiry', { code: 'RW-7KQ2MX', partnerId: 'p1', secretHash: await sha256Hex(secret) }), 'stay/enquiry');
  const body = { code: 'RW-7KQ2MX', status: 'completed', amount: 8000, checkIn: '2026-10-04' };
  assert.equal((await call(d, post('stay/settle', body), 'stay/settle'))[0], 403);
  assert.equal((await call(d, post('stay/settle', body, { authorization: 'Bearer admin' }), 'stay/settle'))[0], 200);
  assert.equal(d.m.get('RW-7KQ2MX').commissionPct, 7);
  // manual stay for a property that reported without a code
  assert.equal((await call(d, post('stay/settle', { code: 'RW-MABC12', status: 'completed', amount: 3000, checkIn: '2026-10-06' }, { authorization: 'Bearer admin' }), 'stay/settle'))[0], 400);
  assert.equal((await call(d, post('stay/settle', { code: 'RW-MABC12', status: 'completed', amount: 3000, checkIn: '2026-10-06', partnerId: 'p2' }, { authorization: 'Bearer admin' }), 'stay/settle'))[0], 200);
  const getReq = (h) => new Request('https://w.test/stay/statement?month=2026-10', { headers: h });
  assert.equal((await call(d, getReq({}), 'stay/statement'))[0], 403);
  const [st, data] = await call(d, getReq({ authorization: 'Bearer admin' }), 'stay/statement');
  assert.equal(st, 200);
  assert.equal(data.totals.completed, 2);
  assert.equal(data.totals.gross, 11000);
  assert.ok(!JSON.stringify(data).includes('secretHash'));
});

test('unconfigured worker answers 501 and unknown routes 404', async () => {
  const d = { ...store(), configured: () => false };
  assert.equal((await call(d, post('stay/enquiry', {}), 'stay/enquiry'))[0], 501);
  assert.equal((await call(store(), post('stay/nope', {}), 'stay/nope'))[0], 404);
});

/* ---- browser side ---- */
test('browser code generator and message', () => {
  const store = {};
  const ctx = vm.createContext({
    window: { crypto: globalThis.crypto, addEventListener() {} }, document: undefined, localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    Uint8Array, Math, JSON, encodeURIComponent, fetch: async () => ({ ok: true }), console,
  });
  vm.runInContext(fs.readFileSync(new URL('../js/booking/stay-code.js', import.meta.url), 'utf8') + '\nthis.__t={rwStayNewCode,rwStayNewSecret,rwStayMessage,rwStayWaClick,rwStayLoad};', ctx);
  const t = ctx.__t;
  for (let i = 0; i < 200; i++) assert.ok(validCode(t.rwStayNewCode()));
  assert.ok(t.rwStayNewSecret().length >= 8);
  assert.match(t.rwStayMessage('Hello', 'RW-7KQ2MX'), /RoamWise booking code: RW-7KQ2MX\nAfter your stay.*stay\/\?c=RW-7KQ2MX/);
  const attrs = { 'data-wa-text': 'Hello hotel', 'data-wa-base': 'https://wa.me/917302315845', 'data-pid': 'milan-heights', 'data-pname': 'Milan Heights' };
  const a = { getAttribute: (k) => attrs[k], href: '' };
  assert.equal(t.rwStayWaClick(a), true);
  assert.match(decodeURIComponent(a.href), /RW-[A-Z2-9]{6}/);
  assert.equal(t.rwStayLoad().length, 1);
  assert.equal(t.rwStayLoad()[0].partnerId, 'milan-heights');
});

/* ---- property self-report ---- */
test('a verified property reports only its own codes and cannot touch the rate', async () => {
  const d = store();
  d.verifyUser = async (req) => { const a = req.headers.get('authorization') || ''; return a.startsWith('Bearer user:') ? { uid: a.slice(12) } : null; };
  d.getPartner = async (uid) => ({ u1: { name: 'Milan Heights', verified: true, commissionPct: 5 }, u2: { name: 'Other Place', verified: true }, u3: { name: 'Milan Heights', verified: false } }[uid] || null);
  d.m.set('RW-AAAAAA', { code: 'RW-AAAAAA', partnerId: 'p_milan_heights', status: 'enquired', createdAt: '2026-10-01T00:00:00Z', secretHash: 'x' });
  d.m.set('RW-BBBBBB', { code: 'RW-BBBBBB', partnerId: 'p_other_place', status: 'enquired', createdAt: '2026-10-02T00:00:00Z', secretHash: 'y' });
  const rep = (uid, body) => post('stay/report', body, uid ? { authorization: 'Bearer user:' + uid } : {});
  assert.equal((await call(d, rep(null, { code: 'RW-AAAAAA', status: 'cancelled' }), 'stay/report'))[0], 401);
  assert.equal((await call(d, rep('u3', { code: 'RW-AAAAAA', status: 'cancelled' }), 'stay/report'))[0], 403);   // not approved
  assert.equal((await call(d, rep('u2', { code: 'RW-AAAAAA', status: 'completed', amount: 5000 }), 'stay/report'))[0], 404); // someone else's code
  assert.equal((await call(d, rep('u1', { code: 'RW-AAAAAA', status: 'completed' }), 'stay/report'))[0], 400);              // needs a value
  assert.equal((await call(d, rep('u1', { code: 'RW-AAAAAA', status: 'completed', amount: 9000, commissionPct: 0, partnerId: 'x', checkIn: '2026-10-04' }), 'stay/report'))[0], 200);
  const row = d.m.get('RW-AAAAAA');
  assert.equal(row.status, 'completed'); assert.equal(row.amount, 9000); assert.equal(row.partnerId, 'p_milan_heights');
  assert.equal(row.commissionPct, 5);            // taken from the admin-set partner record, not from the request
  assert.equal(row.settledBy, 'partner');
  // the property's own list shows only its codes and never what guests answered
  const mine = await call(d, new Request('https://w.test/stay/mine', { headers: { authorization: 'Bearer user:u1' } }), 'stay/mine');
  assert.equal(mine[1].rows.length, 1); assert.ok(!JSON.stringify(mine[1]).includes('guestStayed'));
  // once an admin settles, the property can no longer change it
  await call(d, post('stay/settle', { code: 'RW-AAAAAA', status: 'disputed' }, { authorization: 'Bearer admin' }), 'stay/settle');
  assert.equal((await call(d, rep('u1', { code: 'RW-AAAAAA', status: 'cancelled' }), 'stay/report'))[0], 409);
});
