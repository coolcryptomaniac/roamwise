import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyAccount, addEarning, markPaid, summary, publicEarnings, taxYearOf, istMonthOf } from '../worker/lib/earnings-core.js';
import { handleEarnings } from '../worker/handlers/earnings.js';
import { buildLedger } from '../worker/lib/company-ledger.js';

const NOV = Date.parse('2026-11-14T06:00:00Z'), DEC = Date.parse('2026-12-02T06:00:00Z');

test('IST month and tax year boundaries', () => {
  assert.equal(istMonthOf(Date.parse('2026-10-31T19:00:00Z')), '2026-11');
  assert.equal(taxYearOf(Date.parse('2027-03-31T10:00:00Z')), 2026);
  assert.equal(taxYearOf(Date.parse('2027-04-01T10:00:00Z')), 2027);
});

test('creators and artists are capped at Rs 10,000 a month; the cap resets next month', () => {
  let a = emptyAccount('C@x.com', 'creator', 'Asha');
  let r = addEarning(a, { id: 'e-001', amount: 7000, note: 'Reel for Binsar stay' }, NOV); a = r.account;
  assert.equal(r.ok, true);
  r = addEarning(a, { id: 'e-002', amount: 4000 }, NOV);
  assert.deepEqual([r.ok, r.code, r.capLeft], [false, 'monthly_cap', 3000]);
  r = addEarning(a, { id: 'e-003', amount: 3000 }, NOV); a = r.account;
  assert.equal(summary(a, NOV).capLeft, 0);
  assert.equal(addEarning(a, { id: 'e-004', amount: 9000 }, DEC).ok, true);
  assert.equal(addEarning(a, { id: 'e-001', amount: 7000 }, NOV).duplicate, true);
});

test('property partners are not capped, and the tax watch flag turns on at Rs 20,000 in a tax year', () => {
  const p = addEarning(emptyAccount('p@x.com', 'property', 'Stay'), { id: 'p-001', amount: 45000 }, NOV);
  assert.equal(p.ok, true); assert.equal(p.taxWatch, true);
  let a = emptyAccount('c@x.com', 'artist', 'N');
  a = addEarning(a, { id: 'a-001', amount: 10000 }, NOV).account;
  assert.equal(summary(a, NOV).taxWatch, false);
  const r = addEarning(a, { id: 'a-002', amount: 10000 }, DEC);
  assert.equal(r.taxWatch, true);
});

test('paying needs a bank reference and only touches unpaid entries', () => {
  let a = emptyAccount('c@x.com', 'creator', 'A');
  a = addEarning(a, { id: 'e-001', amount: 2000 }, NOV).account;
  a = addEarning(a, { id: 'e-002', amount: 1500 }, NOV).account;
  assert.equal(markPaid(a, { ref: '' }, NOV).code, 'reference_required');
  const one = markPaid(a, { ids: ['e-001'], ref: 'UPI123456' }, NOV);
  assert.equal(one.amount, 2000);
  const rest = markPaid(one.account, { ref: 'UPI999999' }, NOV);
  assert.equal(rest.amount, 1500);
  assert.equal(markPaid(rest.account, { ref: 'UPI000000' }, NOV).code, 'nothing_to_pay');
  const pub = publicEarnings(rest.account, NOV);
  assert.deepEqual([pub.summary.available, pub.summary.paid], [0, 3500]);
  assert.equal('id' in pub.entries[0], false);
});

test('unpaid earnings count as money held for others in the company ledger', () => {
  const a = addEarning(emptyAccount('c@x.com', 'creator', 'A'), { id: 'e-001', amount: 2000 }, NOV).account;
  const l = buildLedger({ wallets: [], orders: [], earnings: [a], nowMs: NOV });
  assert.deepEqual([l.accounts.earningsPayable, l.accounts.heldForOthers], [2000, 2000]);
});

function fakeEnv() {
  const m = new Map();
  return { m, RW_KV: { get: async (k, t) => (m.has(k) ? (t === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null), put: async (k, v) => { m.set(k, String(v)); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) } };
}
const admin = { requireAdmin: async () => ({ uid: 'u' }) };
const post = (path, body) => new Request('https://x/' + path, { method: 'POST', headers: { authorization: 'Bearer t' }, body: JSON.stringify(body) });

test('endpoints: admin adds and pays, the partner sees only their own earnings, strangers are refused', async () => {
  const env = fakeEnv();
  assert.ok([401, 501].includes((await handleEarnings(post('admin/earnings/add', {}), env, 'admin/earnings/add', NOV)).status));
  const add = (amount) => handleEarnings(post('admin/earnings/add', { email: 'Asha@x.com', role: 'creator', name: 'Asha', amount, note: 'Collab' }), env, 'admin/earnings/add', NOV, admin);
  assert.equal((await add(6000)).status, 200);
  const over = await add(5000); assert.equal(over.status, 422); assert.equal((await over.json()).capLeft, 4000);
  const me = (email, verified = true) => handleEarnings(new Request('https://x/earnings/me', { headers: { authorization: 'Bearer t' } }), env, 'earnings/me', NOV, { verifyIdToken: async () => ({ email, email_verified: verified }) });
  assert.equal((await (await me('asha@x.com')).json()).earnings.summary.available, 6000);
  assert.equal((await (await me('other@x.com')).json()).earnings, null);
  assert.equal((await (await me('asha@x.com', false)).json()).earnings, null);
  assert.equal((await handleEarnings(new Request('https://x/earnings/me'), env, 'earnings/me', NOV)).status, 401);
  assert.equal((await handleEarnings(post('admin/earnings/paid', { email: 'asha@x.com', ref: 'UPI12345' }), env, 'admin/earnings/paid', NOV, admin)).status, 200);
  const list = await (await handleEarnings(new Request('https://x/admin/earnings', { headers: { authorization: 'Bearer t' } }), env, 'admin/earnings', NOV, admin)).json();
  assert.deepEqual([list.accounts.length, list.accounts[0].summary.paid], [1, 6000]);
});
