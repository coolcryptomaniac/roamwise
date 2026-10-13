'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..'), read = p => fs.readFileSync(path.join(root, p), 'utf8');
async function tick() { await new Promise(resolve => setTimeout(resolve, 10)); }
function client() {
  const d = new JSDOM('<!doctype html>', { url: 'https://roamwise.co.in/bhakti/', runScripts: 'outside-only' }), w = d.window;
  let state;
  w.firebase = { apps: [{}], auth: Object.assign(() => ({ onAuthStateChanged: fn => { state = fn; } }), { GoogleAuthProvider: function () {} }) };
  w.eval(read('features/digital-bhakti/catalog.js')); w.eval(read('features/digital-bhakti/access.js'));
  return { d, w, state: u => state(u) };
}
function response(uid = 'u1', changes = {}) { return { version: 1, uid, level: 6, environment: 'live', checkoutEnabled: true, products: { bhakti_mantra: { price: 10, level: 1 }, bhakti_aarti: { price: 30, level: 2 }, bhakti_paath: { price: 60, level: 3 }, bhakti_katha: { price: 100, level: 4 }, bhakti_yajna: { price: 200, level: 5 }, bhakti_parthiv: { price: 300, level: 6 } }, ...changes }; }
test('studio and checkout have valid local assets, explicit CSP and a bounded download including auth SDKs', () => {
  const { gzipSync } = require('node:zlib');
  for (const page of ['bhakti/index.html', 'bhakti/checkout.html']) {
    const html = read(page), files = new Set(), dir = path.dirname(page);
    assert.match(html, /Content-Security-Policy/); assert.doesNotMatch(html, /on(?:click|submit|load)=|<script>\s*\S/);
    for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|#|mailto:)/.test(m[1])) continue;
      const target = path.resolve(root, dir, m[1].split(/[?#]/)[0]); assert.ok(fs.existsSync(target), m[1]);
      if (/\.(?:js|css)$/.test(target)) files.add(target);
    }
    const bytes = gzipSync(html).length + [...files].reduce((n, f) => n + gzipSync(fs.readFileSync(f)).length, 0);
    assert.ok(bytes < 128 * 1024, `${page}: ${bytes} gzip bytes`);
  }
});
test('paid access requires authenticated server response; account change and stale/error responses cannot revive it', async () => {
  const c = client(), api = c.w.RWBhaktiAccess, u = { uid: 'u1', getIdToken: async () => 'token' }; let finish;
  c.w.localStorage.setItem('rw_bhakti_level', '6'); assert.equal(api.allowed(6), false);
  c.w.fetch = () => new Promise(resolve => { finish = resolve; }); c.state(u); await tick();
  c.state(null); finish({ ok: true, text: async () => JSON.stringify(response()) }); await tick();
  assert.equal(api.allowed(6), false);
  c.w.fetch = async () => ({ ok: true, text: async () => JSON.stringify(response()) }); c.state(u); await tick(); assert.equal(api.allowed(6), true);
  c.w.fetch = async () => { throw Error('offline'); }; await api.refresh(); assert.equal(api.allowed(6), false); assert.equal(api.checkoutEnabled, false);
  c.d.window.close();
});
test('price drift or a response for another uid fails closed and never transmits dedication names', async () => {
  const c = client(), calls = [], u = { uid: 'u1', getIdToken: async () => 'token' };
  c.w.localStorage.setItem('rwPro', '1');
  c.w.fetch = async (url, init) => { calls.push({ url, init }); return { ok: true, text: async () => JSON.stringify(response('other')) }; };
  c.state(u); await tick(); assert.equal(c.w.RWBhaktiAccess.allowed(6), false);
  c.w.fetch = async () => ({ ok: true, text: async () => JSON.stringify(response('u1', { products: {} })) }); await c.w.RWBhaktiAccess.refresh();
  assert.equal(c.w.RWBhaktiAccess.checkoutEnabled, false);
  assert.match(calls[0].url, /\/bhakti\/access$/); assert.equal(calls[0].init.headers.Authorization, 'Bearer token'); assert.equal(calls[0].init.body, undefined);
  c.d.window.close();
});
function checkout() {
  const d = new JSDOM(read('bhakti/checkout.html'), { url: 'https://roamwise.co.in/bhakti/checkout.html?product=bhakti_paath', runScripts: 'outside-only' }), w = d.window;
  w.eval(read('features/digital-bhakti/catalog.js'));
  const calls = [], access = w.RWBhaktiAccess = { user: { uid: 'u1', email: 'devotee@example.com' }, level: 0, ready: true, error: '', checkoutEnabled: true, environment: 'live',
    allowed: level => access.level >= level,
    refresh: async () => {},
    request: async (p, options) => { calls.push({ p, options }); return { order_id: 'rw_test', payment_session_id: 'session', environment: 'production', order_status: 'ACTIVE', fulfilled: false }; }
  };
  w.Cashfree = settings => ({ checkout: async options => { calls.push({ settings, options }); } });
  w.eval(read('features/digital-bhakti/checkout.js')); return { d, w, calls, access };
}
test('checkout is user initiated, charges the selected exact price, omits names and blocks a second order while confirmation is pending', async () => {
  const c = checkout(), doc = c.w.document; assert.equal(c.calls.length, 0);
  doc.getElementById('checkout-phone').value = '9999999999'; doc.getElementById('checkout-consent').checked = true;
  doc.getElementById('checkout-pay-form').dispatchEvent(new c.w.Event('submit', { cancelable: true })); await tick();
  assert.equal(c.calls[0].p, 'bhakti/order');
  assert.deepEqual(JSON.parse(c.calls[0].options.body), { amount: 60, customer: { phone: '9999999999' }, meta: { planId: 'bhakti_paath' } });
  assert.equal(c.calls[1].options.redirectTarget, '_self'); assert.equal(c.access.level, 0, 'SDK completion is not proof of payment');
  assert.equal(doc.getElementById('checkout-pay').disabled, true);
  doc.getElementById('checkout-pay-form').dispatchEvent(new c.w.Event('submit', { cancelable: true })); await tick(); assert.equal(c.calls.length, 2);
  const saved = JSON.parse(c.w.localStorage.getItem('rw_bhakti_pending_v1')); assert.equal(saved.id, 'rw_test'); assert.equal(saved.phone, undefined);
  c.d.window.close();
});
test('checkout failure remains visible; user/provider cancellation never grants paid playback', async () => {
  const c = checkout(), doc = c.w.document; c.access.request = async () => { throw Error('Payment service is temporarily unavailable.'); };
  doc.getElementById('checkout-phone').value = '9999999999'; doc.getElementById('checkout-consent').checked = true;
  doc.getElementById('checkout-pay-form').dispatchEvent(new c.w.Event('submit', { cancelable: true })); await tick();
  assert.match(doc.getElementById('checkout-status').textContent, /temporarily unavailable/); assert.equal(c.access.level, 0);
  c.d.window.close();
});
