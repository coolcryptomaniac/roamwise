import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { handleShopCatalog } from '../worker/handlers/shop-catalog-admin.js';
import { handleSupport } from '../worker/handlers/support.js';
import { liveProducts, mergeCatalogue, _resetCache } from '../worker/lib/shop-d1-catalogue.js';

/* Minimal D1 over node:sqlite, with the real migrations applied. */
function d1(...migrations) {
  const db = new DatabaseSync(':memory:');
  for (const m of migrations) db.exec(readFileSync(new URL('../worker/migrations/' + m, import.meta.url), 'utf8'));
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    async run() { db.prepare(sql).run(...args); return { success: true }; },
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async all() { return { results: db.prepare(sql).all(...args) }; },
  });
  return { raw: db, prepare: (sql) => stmt(sql) };
}
const req = (method, body) => new Request('https://x/', { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
const read = async (r) => ({ status: r.status, body: await r.json() });

test('seeded Road Heist concepts are public vote cards with original artwork', async () => {
  const env = { DB: d1('0003_shop.sql', '0005_merch_concepts.sql') };
  const { body } = await read(await handleShopCatalog(req('GET'), env, 'shop/concepts'));
  assert.equal(body.concepts.length, 6);
  for (const c of body.concepts) {
    assert.match(c.image, /^https:\/\/www\.roamwise\.co\.in\/media\/merch\/[a-z0-9-]+\.svg$/);
    assert.doesNotMatch(c.name + c.description, /\bGTA\b|grand theft|rockstar|lamborghini|lambo|ferrari|porsche/i);
    assert.ok(readFileSync(new URL('../' + c.image.replace('https://www.roamwise.co.in/', ''), import.meta.url)).length > 500);
  }
});

test('voting counts each voter once and rejects unknown products', async () => {
  const env = { DB: d1('0003_shop.sql', '0005_merch_concepts.sql') };
  const v = (id, voter) => handleShopCatalog(req('POST', { id, voter }), env, 'shop/vote').then(read);
  assert.equal((await v('rh-hairpin-47-tee', 'voterAAAA1111')).body.votes, 1);
  assert.equal((await v('rh-hairpin-47-tee', 'voterAAAA1111')).body.votes, 1);
  assert.equal((await v('rh-hairpin-47-tee', 'voterBBBB2222')).body.votes, 2);
  assert.equal((await v('nope', 'voterBBBB2222')).status, 404);
  assert.equal((await v('rh-hairpin-47-tee', 'x')).status, 400);
});

test('admin routes need an admin; going live needs a SKU; live products join the catalogue', async () => {
  _resetCache();
  const env = { DB: d1('0003_shop.sql') };
  assert.equal((await handleShopCatalog(req('GET'), env, 'shop/admin/products', { isAdmin: async () => false })).status, 403);
  const admin = { isAdmin: async () => true };
  const base = { name: 'Test tee', image: 'https://www.roamwise.co.in/media/merch/crew-of-four.svg', price_rupees: 799, status: 'live', variants: [{ label: 'Black · L' }] };
  assert.equal((await read(await handleShopCatalog(req('POST', base), env, 'shop/admin/product', admin))).body.error, 'needs_sku');
  assert.equal((await handleShopCatalog(req('POST', { ...base, variants: [{ label: 'Black · L', sku: 'QK-1' }] }), env, 'shop/admin/product', admin)).status, 200);
  const live = await liveProducts(env, Date.now());
  assert.equal(live.length, 1); assert.equal(live[0].pricePaise, 79900);
  const merged = mergeCatalogue({ version: 1, currency: 'INR', products: [{ id: 'x', variants: [] }] }, live);
  assert.equal(merged.products.length, 2);
});

test('support is off by default and never calls the gateway', async () => {
  const env = { DB: d1('0004_support.sql') };
  let called = false;
  const r = await read(await handleSupport(req('POST', { amount: 101 }), env, 'support/order', { fetchImpl: async () => { called = true; } }));
  assert.equal(r.status, 503); assert.equal(called, false);
  assert.equal((await read(await handleSupport(req('GET'), env, 'support/wall'))).body.open, false);
});

test('support order validates amount and confirmations, and status only trusts a matching PAID order', async () => {
  const env = { DB: d1('0004_support.sql'), SUPPORT_CHECKOUT: 'true', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 'b' };
  let paidAmount = 101;
  const fetchImpl = async (url, init) => {
    if (init && init.method === 'POST') return new Response(JSON.stringify({ payment_session_id: 'sess' }), { status: 200 });
    const id = url.split('/').pop();
    return new Response(JSON.stringify({ order_id: id, order_currency: 'INR', order_amount: paidAmount, order_status: 'PAID' }), { status: 200 });
  };
  const ok = { amount: 101, phone: '+91 98765 43210', name: 'Asha Rawat', showName: true, confirmNothingInReturn: true, confirmIndian: true };
  assert.equal((await handleSupport(req('POST', { ...ok, amount: 10001 }), env, 'support/order', { fetchImpl })).status, 400);
  assert.equal((await handleSupport(req('POST', { ...ok, amount: 0 }), env, 'support/order', { fetchImpl })).status, 400);
  assert.equal((await handleSupport(req('POST', { ...ok, confirmIndian: false }), env, 'support/order', { fetchImpl })).status, 400);
  assert.equal((await handleSupport(req('POST', { ...ok, phone: '12345' }), env, 'support/order', { fetchImpl })).status, 400);
  const o = await read(await handleSupport(req('POST', ok), env, 'support/order', { fetchImpl }));
  assert.equal(o.status, 200); assert.match(o.body.id, /^RWSUP-[A-Z0-9]{14}$/);
  paidAmount = 1; /* tampered amount: must not be marked paid */
  assert.notEqual((await read(await handleSupport(req('GET'), env, 'support/status/' + o.body.id, { fetchImpl }))).body.status, 'paid');
  paidAmount = 101;
  assert.equal((await read(await handleSupport(req('GET'), env, 'support/status/' + o.body.id, { fetchImpl }))).body.status, 'paid');
  const wall = (await read(await handleSupport(req('GET'), env, 'support/wall'))).body;
  assert.equal(wall.supporters, 1); assert.deepEqual(wall.names, ['Asha']);
});
