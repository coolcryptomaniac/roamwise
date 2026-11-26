import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCT_TYPES, LIMITS, productFromDesign, mergeCatalogue, salesStats, lifecycle, rankProducts, adsPlan, promotionPlan } from '../worker/lib/shop-engine-core.js';
import { catalogueFor, recordShippedOrder, runShopEngineCron, _test } from '../worker/lib/shop-engine.js';
import { buildQikinkOrder } from '../worker/lib/qikink-core.js';
import { priceCart } from '../worker/lib/shop-core.js';
import { SHOP_CATALOGUE } from '../worker/lib/shop-catalogue.js';

const BLANKS = { 'oversized-tee': [{ id: 'black-m', label: 'Black · M', sku: 'BLANK-TEE-BK-M' }], hoodie: [], tote: [] };
const NOW = Date.parse('2026-12-01T06:00:00Z');
const row = (o = {}) => ({
  id: 'auto-20261127-paanch-sitaare', product_type: 'oversized-tee', title: 'Paanch Sitaare', tagline: 'Five stars, one road.',
  collection: 'trend', print_url: 'https://roamwise.co.in/media/r2/shop/designs/a/print.png',
  mockup_url: 'https://roamwise.co.in/media/r2/shop/designs/a/mockup.jpg', placement: 'back', print_w_in: 12, print_h_in: 14,
  status: 'live', qc_json: '{"passed":true}', created_at: '2026-11-27 05:00:00', live_at: '2026-11-27 05:30:00', ...o,
});

test('a live design on a configured blank becomes a product priced only by its type', () => {
  const p = productFromDesign(row({ price: 1 }), BLANKS);
  assert.equal(p.pricePaise, PRODUCT_TYPES['oversized-tee'].pricePaise);
  assert.equal(p.variants[0].qikinkSku, 'BLANK-TEE-BK-M');
  assert.equal(p.variants[0].design.link, row().print_url);
  assert.equal(p.auto, true);
});

test('nothing is sellable without blanks, with a bad id, non-https art or a non-live status', () => {
  assert.equal(productFromDesign(row(), { 'oversized-tee': [] }), null);
  assert.equal(productFromDesign(row({ id: 'almora-after-dark-hoodie' }), BLANKS), null);
  assert.equal(productFromDesign(row({ print_url: 'http://x.test/a.png' }), BLANKS), null);
  assert.equal(productFromDesign(row({ status: 'review' }), BLANKS), null);
  assert.equal(productFromDesign(row({ status: 'retired' }), BLANKS), null);
  assert.ok(productFromDesign(row({ status: 'retired' }), BLANKS, { includeRetired: true }));
});

test('merge keeps static products first and caps live auto designs', () => {
  const rows = Array.from({ length: LIMITS.maxLive + 5 }, (_, i) => row({ id: 'auto-20261127-d' + i }));
  const cat = mergeCatalogue(SHOP_CATALOGUE, rows, BLANKS);
  assert.equal(cat.products.length, SHOP_CATALOGUE.products.length + LIMITS.maxLive);
  assert.equal(mergeCatalogue(SHOP_CATALOGUE, [], BLANKS), SHOP_CATALOGUE);
  const priced = priceCart([{ id: 'auto-20261127-d0', variant: 'black-m', qty: 1 }], '263601', cat);
  assert.equal(priced.subtotalPaise, PRODUCT_TYPES['oversized-tee'].pricePaise);
});

test('Qikink line for an engine design prints the design on the blank', () => {
  const cat = mergeCatalogue(SHOP_CATALOGUE, [row()], BLANKS);
  const order = { orderId: 'RWS-ABCDEFGHJK', totalPaise: 98800, customer: { name: 'Asha Rawat', email: 'a@example.com', phone: '9999999999' },
    ship: { line1: 'Mall Road', city: 'Almora', pin: '263601', state: 'Uttarakhand' }, lines: [{ id: row().id, variant: 'black-m', qty: 1, unitPaise: 89900 }] };
  const skuFor = (l) => { const p = cat.products.find((x) => x.id === l.id); const v = p.variants.find((x) => x.id === l.variant); return v.design ? { sku: v.qikinkSku, design: v.design } : v.qikinkSku; };
  const { body, error } = buildQikinkOrder(order, skuFor);
  assert.equal(error, undefined);
  const li = body.line_items[0];
  assert.equal(li.search_from_my_products, 0);
  assert.equal(li.sku, 'BLANK-TEE-BK-M');
  assert.equal(li.designs[0].placement_sku, 'bk');
  assert.equal(li.designs[0].design_link, row().print_url);
  // static products are unchanged
  const st = buildQikinkOrder({ ...order, lines: [{ id: 'x', variant: 'y', qty: 1, unitPaise: 100 }] }, () => 'v-abc');
  assert.equal(st.body.line_items[0].search_from_my_products, 1);
});

test('lifecycle retires unsold and cold designs and promotes QC-passed reviews only in autopublish', () => {
  const designs = [
    row({ id: 'auto-20261001-old', live_at: '2026-10-01 00:00:00' }),
    row({ id: 'auto-20261127-new' }),
    row({ id: 'auto-20261128-rev', status: 'review', live_at: null }),
    row({ id: 'auto-20261128-bad', status: 'review', live_at: null, qc_json: '{"passed":false}' }),
  ];
  const stats = salesStats([{ product_id: 'auto-20261127-new', units: 1, revenue_paise: 89900, day: '2026-11-30' }], NOW);
  const off = lifecycle(designs, stats, NOW, {});
  assert.deepEqual(off.retire.map((r) => r.id), ['auto-20261001-old']);
  assert.deepEqual(off.promote, []);
  assert.deepEqual(lifecycle(designs, stats, NOW, { autopublish: true }).promote, ['auto-20261128-rev']);
});

test('ads follow sales and never exceed the cap; cap 0 means no paid ads', () => {
  assert.deepEqual(adsPlan([{ id: 'a', recentUnits: 9 }], 0).boosts, []);
  const plan = adsPlan([{ id: 'a', recentUnits: 5 }, { id: 'b', recentUnits: 2 }, { id: 'c', recentUnits: 1 }], 500);
  assert.deepEqual(plan.boosts.map((b) => b.id), ['a', 'b']);
  assert.ok(plan.boosts.reduce((s, b) => s + b.dailyInr, 0) <= 500);
});

test('promotion plan publishes ranks and links, never counts or revenue', () => {
  const cat = mergeCatalogue(SHOP_CATALOGUE, [row()], BLANKS);
  const stats = salesStats([{ product_id: 'almora-after-dark-hoodie', units: 3, revenue_paise: 599700, day: '2026-11-30' }], NOW);
  const ranked = rankProducts(cat.products, stats, { [row().id]: row() }, NOW);
  const plan = promotionPlan(cat, ranked, NOW, 0);
  assert.equal(plan.featured[0].id, 'almora-after-dark-hoodie');
  assert.ok(!JSON.stringify(plan).match(/revenue|units|599700/));
});

function fakeDb(designs, lines = []) {
  const runs = [];
  const prepare = (sql) => ({
    sql, args: [],
    bind(...a) { this.args = a; return this; },
    async all() {
      if (/FROM shop_sales_lines/.test(sql)) return { results: lines };
      if (/status = 'live'/.test(sql)) return { results: designs.filter((d) => d.status === 'live') };
      if (/IN \('live','retired'\)/.test(sql)) return { results: designs.filter((d) => d.status === 'live' || d.status === 'retired') };
      return { results: designs };
    },
  });
  return { prepare, runs, async batch(s) { runs.push(...s.map((x) => [x.sql, x.args])); return []; } };
}

test('storage glue is inert until SHOP_ENGINE_ENABLED is true', async () => {
  _test.reset();
  const env = { DB: fakeDb([row()]) };
  assert.equal(await catalogueFor(env, SHOP_CATALOGUE), SHOP_CATALOGUE);
  assert.deepEqual(await runShopEngineCron(env, SHOP_CATALOGUE), { skipped: 'engine_off' });
});

test('cron retires, writes the plan to MEDIA; shipped orders are recorded once per line', async () => {
  _test.reset();
  const puts = {};
  const env = { SHOP_ENGINE_ENABLED: 'true', DB: fakeDb([row({ id: 'auto-20261001-old', live_at: '2026-10-01 00:00:00' })]), MEDIA: { put: async (k, v) => { puts[k] = v; } } };
  const r = await runShopEngineCron(env, SHOP_CATALOGUE, NOW);
  assert.equal(r.retired, 1);
  assert.ok(JSON.parse(puts['shop/engine/promo.json']).featured.length >= 1);
  assert.ok(await recordShippedOrder(env, { orderId: 'RWS-X', lines: [{ id: 'a', qty: 1, linePaise: 100 }] }, NOW));
  assert.match(env.DB.runs.at(-1)[0], /INSERT OR IGNORE INTO shop_sales_lines/);
});
