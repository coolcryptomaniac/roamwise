'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.resolve(__dirname, '..'), read = p => fs.readFileSync(path.join(root, p), 'utf8');
test('admin digital rollout refuses an undeployed/mismatched Worker and changes only the dedicated switch with an audit record', async () => {
  const messages = [], writes = [], context = { window: null, document: { getElementById: () => ({ set textContent(v) { messages.push(v); } }) },
    CURRENT_ADMIN: { uid: 'admin', getIdToken: async () => 'test-token' }, FV: { serverTimestamp: () => 'stamp' },
    confirm: () => true, fetch: async () => ({ ok: false, status: 404 }),
    db: { collection: collection => ({ doc: id => ({ collection, id, get: async () => ({ exists: true, data: () => ({ PAYMENT_PROVIDER: 'cashfree', CASHFREE_ENVIRONMENT: 'live' }) }) }) }),
      batch: () => ({ set: (ref, data) => writes.push({ ref, data }), commit: async () => {} }) }
  }; context.window = context; vm.runInNewContext(read('admin/bhakti-operations.js'), context);
  await context.rwBhaktiSetEnabled(true); assert.equal(writes.length, 0); assert.match(messages.at(-1), /not ready/);
  const products = Object.fromEntries([['mantra', 10], ['aarti', 30], ['paath', 60], ['katha', 100], ['yajna', 200], ['parthiv', 300]].map(([id, price]) => ['bhakti_' + id, { price }]));
  context.fetch = async () => ({ ok: true, json: async () => ({ version: 1, uid: 'admin', environment: 'live', products }) });
  await context.rwBhaktiSetEnabled(true); assert.equal(writes.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(writes[0].data)), { BHAKTI_CHECKOUT_ENABLED: true });
  assert.equal(writes[1].ref.collection, 'adminAuditLog'); assert.equal(writes[1].data.action, 'bhakti.checkout-config');
  context.CURRENT_ADMIN = null; await context.rwBhaktiSetEnabled(true); assert.equal(writes.length, 2);
});
test('admin recovery separates digital orders from the membership grant path', () => {
  const text = read('admin/index.html'), source = text.split('\n').find(line => line.startsWith('function renderCashfreeQueue()'));
  const box = { innerHTML: '' }, context = { CASHFREE_ORDERS: [{ uid: 'u1', planId: 'bhakti_yajna', id: 'rw_one', amountINR: 200 }], USERS: [],
    $: () => box, money: String, esc: String, when: () => 'date' };
  vm.runInNewContext(source, context); context.renderCashfreeQueue();
  assert.doesNotMatch(box.innerHTML, /openPayment|dismissCashfreeOrder/); assert.match(box.innerHTML, /do not grant Pro/);
  context.CASHFREE_ORDERS[0].planId = 'founder'; context.renderCashfreeQueue(); assert.match(box.innerHTML, /openPayment/);
});
