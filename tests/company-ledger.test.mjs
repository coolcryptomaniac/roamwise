import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLedger, walletTotals, stayTotals, stayPhase } from '../worker/lib/company-ledger.js';
import { runCompanyLedger, handleCompanyLedger } from '../worker/handlers/company-ledger.js';

const NOW = Date.parse('2026-11-14T06:00:00Z');
const wallets = [
  { lots: [
    { source: 'refund', state: 'credit', amount: 1000, remaining: 1000, createdAt: '2026-11-13T00:00:00Z' },
    { source: 'prepaid', state: 'kept', amount: 500, remaining: 200, createdAt: '2026-11-01T00:00:00Z' },
    { source: 'bonus', state: 'kept', amount: 300, remaining: 300, createdAt: '2026-11-02T00:00:00Z' },
    { source: 'bonus', state: 'lapsed', amount: 100, remaining: 0, createdAt: '2026-10-02T00:00:00Z' },
    { source: 'refund', state: 'bank', amount: 700, remaining: 0, createdAt: '2026-11-03T00:00:00Z' } ] },
  null,
];
const orders = [
  { status: 'confirmed', property: 'Nanau', amount: 20000, checkout: '2026-11-10', supplierNet: [{ cost: 15000 }, { cost: 1000 }] },
  { status: 'paid_pending_confirmation', property: 'Nanau', amount: 10000, checkout: '2026-12-01', supplierNet: [{ cost: 8000 }] },
  { status: 'confirmed', property: 'Milan Heights', amount: 500, checkout: '2026-12-05' },
  { status: 'refunded_to_wallet', property: 'Padma', amount: 9000, checkout: '2026-11-01', supplierNet: [{ cost: 7000 }] },
  { status: 'payment_pending', property: 'Padma', amount: 9000, checkout: '2026-12-01' },
  { status: 'paid', kind: 'balance', property: 'Big Bro', amount: 4000 },
];

test('wallet totals split real cash from bonus coins', () => {
  const t = walletTotals(wallets, NOW);
  assert.equal(t.wallets, 1);
  assert.equal(t.guestCash, 1200);
  assert.equal(t.refundInTransit, 1000);
  assert.equal(t.bonusLiability, 300);
  assert.equal(t.bonusIssuedThisMonth, 300);
});

test('a stay is earned only 48 hours after check-out', () => {
  assert.equal(stayPhase({ checkout: '2026-11-10' }, NOW), 'earned');
  assert.equal(stayPhase({ checkout: '2026-11-13' }, NOW), 'booked');
  assert.equal(stayPhase({}, NOW), 'booked');
});

test('stay totals count only live paid stays and never refunds or unpaid orders', () => {
  const { totals, earnings } = stayTotals(orders, NOW);
  assert.equal(totals.stays, 3);
  assert.equal(totals.collected, 30500);
  assert.equal(totals.partnerPayable, 24000);
  assert.equal(totals.marginEarned, 4000);
  assert.equal(totals.marginBooked, 2000);
  assert.equal(totals.unknownNet, 1);
  assert.deepEqual(earnings[0], { property: 'Nanau', stays: 2, collected: 30000, booked: 8000, earned: 16000, netKnown: true });
});

test('ledger raises alerts for the promo cap and unknown partner amounts', () => {
  const l = buildLedger({ wallets, orders, nowMs: NOW, promoCap: 200 });
  assert.equal(l.accounts.heldForOthers, 1200 + 24000);
  assert.deepEqual(l.alerts.map((a) => a.code), ['promo_cap_exceeded', 'partner_amount_unknown']);
  assert.equal(buildLedger({ wallets: [], orders: [], nowMs: NOW }).ok, true);
});

function fakeEnv() {
  const m = new Map([['wallet:a', wallets[0]], ['walletdue:a', 1], ['stayorder:1', orders[0]]]);
  return { m, RW_KV: {
    get: async (k) => (m.has(k) ? JSON.parse(JSON.stringify(m.get(k))) : null),
    put: async (k, v) => { m.set(k, JSON.parse(v)); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
  } };
}

test('cron writes only ledger keys and leaves wallets and orders untouched', async () => {
  const env = fakeEnv(), before = JSON.stringify([env.m.get('wallet:a'), env.m.get('stayorder:1')]);
  const l = await runCompanyLedger(env, { nowMs: NOW });
  assert.equal(l.accounts.guestCash, 1200);
  assert.equal(JSON.stringify([env.m.get('wallet:a'), env.m.get('stayorder:1')]), before);
  assert.deepEqual([...env.m.keys()].filter((k) => !/^(wallet|walletdue|stayorder):/.test(k)).sort(), ['ledger:day:2026-11-14', 'ledger:last']);
});

test('ledger endpoint is admin only', async () => {
  const env = fakeEnv(), req = (method) => new Request('https://x/admin/ledger', { method });
  const denied = await handleCompanyLedger(req('GET'), env, 'admin/ledger');
  assert.ok([401, 501].includes(denied.status));
  const ok = await handleCompanyLedger(req('GET'), env, 'admin/ledger', { requireAdmin: async () => ({ uid: 'u' }), nowMs: NOW });
  assert.equal((await ok.json()).ledger.accounts.partnerPayable, 16000);
});
