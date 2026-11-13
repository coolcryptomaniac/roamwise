import { test } from 'node:test';
import assert from 'node:assert/strict';
import { price, publicRates, RATE, STAY_ADVANCE } from '../worker/handlers/stay-cashfree.js';
import { sellFor } from '../worker/lib/amor-policy.js';
import { setAmorRates } from '../worker/lib/amor-rates.js';
import fs from 'node:fs';
const BOOK = JSON.parse(fs.readFileSync(new URL('./fixtures/amor-rates.sample.json', import.meta.url), 'utf8')); // made-up numbers
setAmorRates(BOOK);
const STUDIO = BOOK.properties.nanau.rooms.studio.rates.CP, SUP = BOOK.properties.nanau.peakSupplement;

const NOW = Date.parse('2026-11-08T00:00:00Z');
const q = (stay, checkin, checkout, paymentType = 'full') => price({ stay, checkin, checkout, paymentType }, NOW);

test('Amor stays: 20% base margin (commission + 18% GST on it), peak nights priced, not refused', () => {
  const n = q('nanau', '2026-11-20', '2026-11-22'); // Fri + Sat nights: weekend uplift
  assert.equal(n.total, Math.ceil(2 * sellFor(STUDIO, 0.23) / 10) * 10);
  assert.equal(q('nanau', '2026-11-20', '2026-11-22', 'advance').portion, 50); // 12 days out: Corbett needs 50%
  const far = q('nanau', '2027-02-08', '2027-02-10', 'advance'); // Mon + Tue nights
  assert.equal(far.total, Math.ceil(2 * sellFor(STUDIO, 0.20) / 10) * 10);
  assert.equal(far.portion, 30); assert.equal(far.balance, far.total - far.amount); assert.equal(far.balanceDueBy, '2027-01-31');
  const peak = q('nanau', '2026-12-30', '2027-01-01');
  assert.equal(peak.peakNights, 2); assert.equal(peak.total, Math.ceil(2 * sellFor(STUDIO + SUP, 0.25) / 10) * 10);
  assert.throws(() => q('nanau', '2026-11-20', '2026-12-10'), /up to 14 nights/);
});

test('Big Bro long-stay plans charge the plan price; other lengths take the refundable advance', () => {
  assert.equal(q('bigbro', '2026-12-01', '2026-12-16').amount, 30000);
  assert.equal(q('bigbro', '2026-12-01', '2026-12-31').amount, 50000);
  assert.equal(q('bigbro', '2026-12-01', '2027-03-01').amount, 150000);
  const short = q('bigbro', '2026-12-01', '2026-12-03');
  assert.equal(short.kind, 'advance'); assert.equal(short.amount, STAY_ADVANCE);
});

test('every other stay is reservable online with the fixed advance', () => {
  for (const s of ['milan', 'soulmate', 'woodbook', 'newhimank', 'corbett']) {
    const r = q(s, '2026-11-20', '2026-11-23');
    assert.equal(r.kind, 'advance'); assert.equal(r.amount, 1000); assert.equal(r.nights, 3);
  }
  assert.throws(() => q('milan', '2026-11-01', '2026-11-03'), /Choose check-in/); // in the past
  assert.throws(() => q('nowhere', '2026-11-20', '2026-11-21'), /Unknown property/);
});

test('public rates never expose supplier nets', () => {
  const pub = JSON.stringify(publicRates());
  assert.ok(!pub.includes('"rates"') && !pub.includes('"cost"'));
  assert.equal(publicRates().nanau.rooms.studio.perNight.CP, Math.ceil(sellFor(STUDIO, 0.20) / 10) * 10);
});

test('every stay the site offers for payment exists in the Worker price list', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync('js/booking/routes.js', 'utf8');
  const map = /var RW_PAY_STAYS = (\{[\s\S]*?\});/.exec(src)[1];
  for (const id of map.match(/: '([a-z]+)'/g).map((m) => m.slice(3, -1))) assert.ok(RATE[id], id);
});

test('stay checkout creates the Cashfree order (regression: helpers must be defined)', async () => {
  const { createStayOrder } = await import('../worker/handlers/stay-cashfree.js');
  const kv = new Map(); const calls = [];
  const env = { CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 's', CASHFREE_ENV: 'live', RW_KV: { put: async (k, v) => kv.set(k, v), get: async (k) => kv.get(k) } };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, o) => { calls.push(url); const b = JSON.parse(o.body); return { ok: true, json: async () => ({ payment_session_id: 'ps', order_id: b.order_id, order_amount: b.order_amount }) }; };
  try {
    const res = await createStayOrder(new Request('https://x/', { method: 'POST', body: JSON.stringify({ stay: 'milan', checkin: '2027-01-20', checkout: '2027-01-22', email: 'a@b.in', phone: '9876543210', paymentType: 'full' }) }), env);
    assert.equal(res.status, 200);
    assert.equal(calls[0], 'https://api.cashfree.com/pg/orders');
    assert.equal((await res.json()).quote.amount, 1000);
  } finally { globalThis.fetch = realFetch; }
});
