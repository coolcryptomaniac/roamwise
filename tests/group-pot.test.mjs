import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitShares, potDeadline, freeSlot, publicPot, paidCount } from '../worker/lib/group-pot-core.js';
import { onMemberPaid, runGroupPots, handleGroup } from '../worker/handlers/group-pot.js';
import { refundStayToWallet } from '../worker/handlers/stay-lifecycle.js';
import { loadWallet } from '../worker/handlers/wallet.js';
import * as W from '../worker/lib/wallet-core.js';

const T0 = Date.parse('2026-11-14T06:00:00Z');
function kvStore(){
  const m = new Map();
  return { m, get: async (k, t) => { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    put: async (k, v) => { m.set(k, String(v)); }, delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }) };
}
const env = () => ({ RW_KV: kvStore(), WALLET_LINK_SECRET: 'x' });
const quote = { property: 'Big Bro Hotel', checkin: '2026-12-20', checkout: '2026-12-22', nights: 2, kind: 'full', amount: 10001, stay: 'bigbro' };
function pot(n = 3){
  return { id: 'rwpot_' + 'a'.repeat(24), status: 'collecting', quote, organiser: { name: 'Org One', first: 'Org', email: 'org@x.in', phone: '+919999900000' },
    deadline: new Date(T0 + 72 * 3600e3).toISOString(), slots: splitShares(quote.amount, n).map((amount) => ({ amount, paid: false })) };
}
const member = (p, slot, i) => ({ orderId: 'rwgrp_' + String(i).repeat(32).slice(0, 32), potId: p.id, slot, amount: p.slots[slot].amount, name: 'M' + i, first: 'M' + i, email: `m${i}@x.in`, phone: '+91999990000' + i, status: 'payment_pending' });

test('shares add up exactly and stay within 2..12 people', () => {
  assert.deepEqual(splitShares(10001, 3), [3334, 3334, 3333]);
  assert.equal(splitShares(99999, 7).reduce((a, b) => a + b), 99999);
  assert.throws(() => splitShares(1000, 1)); assert.throws(() => splitShares(1000, 13));
});

test('deadline is capped two days before check-in, and too-soon trips are refused', () => {
  const d = potDeadline('2026-11-20', 168, T0);
  assert.ok(Date.parse(d) <= Date.parse('2026-11-20T00:00:00+05:30') - 48 * 3600e3);
  assert.throws(() => potDeadline('2026-11-16', 72, T0), /too soon/);
});

test('a pending checkout holds a share for 30 minutes only; public view has no contacts', () => {
  const p = pot(); p.slots[0] = { ...p.slots[0], orderId: 'o', pendingUntil: new Date(T0 + 60e3).toISOString() };
  assert.equal(freeSlot(p, T0), 1);
  assert.equal(freeSlot(p, T0 + 31 * 60e3), 0);
  const pub = JSON.stringify(publicPot(p, T0));
  assert.doesNotMatch(pub, /@|\+91/);
});

test('booking is created only when every share is paid, and remembers each payer', async () => {
  const e = env(), p = pot(2);
  await e.RW_KV.put('pot:' + p.id, JSON.stringify(p));
  const a = member(p, 0, 1), b = member(p, 1, 2);
  for (const m of [a, b]) await e.RW_KV.put('grpm:' + m.orderId, JSON.stringify(m));
  const r1 = await onMemberPaid(e, a, T0);
  assert.equal(r1.booked, undefined);
  const r2 = await onMemberPaid(e, b, T0);
  assert.match(r2.booked, /^rwstay_/);
  const stay = await e.RW_KV.get('stayorder:' + r2.booked, 'json');
  assert.equal(stay.group, p.id); assert.equal(stay.groupMembers.length, 2);
  assert.equal(stay.status, 'paid_pending_confirmation');
  assert.equal((await e.RW_KV.get('pot:' + p.id, 'json')).status, 'complete');
  assert.deepEqual(await onMemberPaid(e, { ...a, status: 'paid' }, T0), { duplicate: true });

  /* host declines: each member's own share goes to their own wallet */
  await refundStayToWallet(e, stay, 'declined', T0, { sendMail: async () => ({ ok: true }) });
  const w1 = await loadWallet(e, await W.walletKey('m1@x.in')), w2 = await loadWallet(e, await W.walletKey('m2@x.in'));
  assert.equal(W.balance(w1), a.amount); assert.equal(W.balance(w2), b.amount);
  assert.equal(await loadWallet(e, await W.walletKey('org@x.in')), null, 'organiser does not receive the others\' money');
});

test('a payment on an already-paid share is refunded, never double-counted', async () => {
  const e = env(), p = pot(2);
  p.slots[0] = { ...p.slots[0], paid: true, orderId: 'rwgrp_' + 'f'.repeat(32), first: 'X' };
  await e.RW_KV.put('pot:' + p.id, JSON.stringify(p));
  const late = member(p, 0, 3);
  const r = await onMemberPaid(e, late, T0);
  assert.equal(r.refunded, true);
  assert.equal(W.balance(await loadWallet(e, await W.walletKey('m3@x.in'))), late.amount);
  assert.equal(paidCount(await e.RW_KV.get('pot:' + p.id, 'json')), 1);
});

test('deadline missed: every paid member is refunded and nothing is booked', async () => {
  const e = env(), p = pot(3);
  await e.RW_KV.put('pot:' + p.id, JSON.stringify(p)); await e.RW_KV.put('potdue:' + p.id, p.deadline);
  const a = member(p, 0, 4); await e.RW_KV.put('grpm:' + a.orderId, JSON.stringify(a));
  await onMemberPaid(e, a, T0);
  const r = await runGroupPots(e, T0 + 73 * 3600e3);
  assert.equal(r.refunded, 1);
  assert.equal((await e.RW_KV.get('pot:' + p.id, 'json')).status, 'expired_refunded');
  assert.equal(W.balance(await loadWallet(e, await W.walletKey('m4@x.in'))), a.amount);
  assert.equal([...e.RW_KV.m.keys()].some((k) => k.startsWith('stayorder:')), false);
});

test('create refuses missing contact; join refuses without terms', async () => {
  const e = { ...env(), CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 's' };
  const res = await handleGroup(new Request('https://x/group/create', { method: 'POST', body: JSON.stringify({ shares: 3 }) }), e, 'group/create', T0);
  assert.equal(res.status, 422);
  const p = pot(); await e.RW_KV.put('pot:' + p.id, JSON.stringify(p));
  const j = await handleGroup(new Request('https://x/', { method: 'POST', body: JSON.stringify({ name: 'Ab', email: 'a@b.in', phone: '+919999911111' }) }), e, 'group/' + p.id + '/join', T0);
  assert.equal(j.status, 422);
});
