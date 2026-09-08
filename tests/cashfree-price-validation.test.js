// tests/cashfree-price-validation.test.js
// ----------------------------------------------------------------------------
// Guards against server/client price drift for worker/lib/pricing.js — the
// canonical SERVER-SIDE price table worker/handlers/cashfree.js validates a
// client-submitted `amount` against before ever creating a real, chargeable
// Cashfree order (see that file's header for the price-tampering exploit
// this closes).
//
// Because worker/lib/pricing.js's prices are hand-mirrored from the real
// client-side source of truth (js/pricing/subscription-plans.js's
// CONFIG.TIERS and js/pricing/one-off-plans.js's CONFIG.FOUNDER_OFFER/
// LONG_TERM/SHORT_TERM — see PAYMENT-GATEWAY-ARCHITECTURE.md for why those
// can't be `import`ed directly into this ES-module Worker), a future price
// change to one side that forgets the other would either overcharge buyers
// (client shows a price the server rejects) or silently reopen the
// price-tampering hole (server table stale-low). This test loads BOTH sides
// for real and asserts every id/price matches exactly.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadClientPricingConfig(){
  const context = {};
  vm.createContext(context);
  vm.runInContext(read('js/pricing/subscription-plans.js'), context);
  vm.runInContext(read('js/pricing/one-off-plans.js'), context);
  return context.RWPricing.CONFIG;
}

async function loadServerPrices(){
  const { PLAN_PRICES } = await import(path.join(root, 'worker/lib/pricing.js'));
  return PLAN_PRICES;
}

test('worker/lib/pricing.js: every subscription tier (monthly + yearly) matches js/pricing/subscription-plans.js exactly', async () => {
  const CONFIG = loadClientPricingConfig();
  const server = await loadServerPrices();
  CONFIG.TIERS.filter(t => t.id !== 'free').forEach(t => {
    assert.equal(server[t.id + '_m'], t.priceMonthly, `${t.id}_m price drifted`);
    assert.equal(server[t.id + '_y'], t.priceYearly, `${t.id}_y price drifted`);
  });
});

test('worker/lib/pricing.js: the Founder offer price matches js/pricing/one-off-plans.js exactly', async () => {
  const CONFIG = loadClientPricingConfig();
  const server = await loadServerPrices();
  assert.equal(server.founder, CONFIG.FOUNDER_OFFER.priceINR);
});

test('worker/lib/pricing.js: every long-term one-time pass matches js/pricing/one-off-plans.js exactly', async () => {
  const CONFIG = loadClientPricingConfig();
  const server = await loadServerPrices();
  CONFIG.LONG_TERM.forEach(group => {
    group.options.forEach(p => {
      assert.equal(server[p.id], p.priceINR, `${p.id} price drifted`);
    });
  });
});

test('worker/lib/pricing.js: every short-term micro-pass matches js/pricing/one-off-plans.js exactly', async () => {
  const CONFIG = loadClientPricingConfig();
  const server = await loadServerPrices();
  CONFIG.SHORT_TERM.forEach(p => {
    assert.equal(server[p.id], p.priceINR, `${p.id} price drifted`);
  });
});

test('worker/lib/pricing.js: has no stale/extra plan ids the client no longer sells', async () => {
  const CONFIG = loadClientPricingConfig();
  const server = await loadServerPrices();
  const realIds = new Set(['founder']);
  CONFIG.TIERS.filter(t => t.id !== 'free').forEach(t => { realIds.add(t.id + '_m'); realIds.add(t.id + '_y'); });
  CONFIG.LONG_TERM.forEach(group => group.options.forEach(p => realIds.add(p.id)));
  CONFIG.SHORT_TERM.forEach(p => realIds.add(p.id));
  Object.keys(server).forEach(id => {
    assert.ok(realIds.has(id), `worker/lib/pricing.js has a stale plan id "${id}" no longer sold client-side`);
  });
});
