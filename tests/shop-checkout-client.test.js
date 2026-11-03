const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const ID = 'RWS-ABCDEFGHJK';

function setup({open = true, url = 'https://www.roamwise.co.in/shop/', routes = {}} = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'shop/index.html'), 'utf8'), {url, runScripts: 'outside-only'});
  const w = dom.window; const calls = [];
  w.HTMLElement.prototype.scrollIntoView = function() {};
  w.fetch = async (u, o = {}) => {
    const p = u.replace('https://roamwise-api.founder-f53.workers.dev', '');
    calls.push({path: p, method: o.method || 'GET', headers: o.headers || {}, body: o.body ? JSON.parse(o.body) : null});
    const r = routes[p] ? routes[p](o) : {status: 404, body: {}};
    return {ok: r.status < 400, status: r.status, json: async () => r.body};
  };
  const catalogue = {status: 200, body: {checkoutOpen: open, products: [{id: 'almora-after-dark-hoodie', pricePaise: 199900, maxQty: 5, variants: [{id: 'black-s', label: 'Black · Size S'}]}]}};
  routes['/shop/catalogue'] = routes['/shop/catalogue'] || (() => catalogue);
  vm.runInContext(fs.readFileSync(path.join(root, 'shop/checkout.js'), 'utf8'), dom.getInternalVMContext());
  return {dom, d: w.document, calls, w};
}
const tick = () => new Promise((r) => setTimeout(r, 20));
function fill(d) {
  const set = (id, v) => { d.getElementById(id).value = v; };
  set('buy-name', 'Asha Rawat'); set('buy-phone', '9876543210'); set('buy-email', 'asha@example.com'); set('buy-line1', '12 Mall Road'); set('buy-city', 'Almora'); set('buy-state', 'Uttarakhand'); set('buy-pin', '263601');
}

test('order form stays hidden while checkout is closed; WhatsApp ordering remains', async () => {
  const {dom, d} = setup({open: false}); await tick();
  assert.equal(d.getElementById('buy').hidden, true);
  assert.match(d.querySelector('#almora-after-dark a.button').href, /wa\.me\/919987379730/);
  dom.window.close();
});

test('open checkout: quote shows server totals, UPI order shows exact amount, and no price is sent', async () => {
  const routes = {
    '/shop/quote': () => ({status: 200, body: {ok: true, subtotalPaise: 199900, shippingPaise: 9900, totalPaise: 209800, methods: {cashfree: true, upi: true}}}),
    '/shop/order': () => ({status: 200, body: {orderId: ID, token: 'tok', method: 'upi', totalPaise: 209800, upi: {pa: 'roamwisepay@ybl', amount: '2098.00', uri: 'upi://pay?pa=roamwisepay%40ybl&am=2098.00'}}}),
  };
  const {dom, d, calls} = setup({routes}); await tick();
  assert.equal(d.getElementById('buy').hidden, false);
  assert.equal(d.getElementById('buy-variant').options.length, 1);
  fill(d);
  d.getElementById('buy-quote').click(); await tick();
  assert.match(d.getElementById('buy-summary').textContent, /₹1,999 \+ delivery ₹99 = ₹2,098/);
  assert.equal(d.getElementById('buy-methods').hidden, false);
  d.querySelector('input[name="payMethod"][value="upi"]').checked = true;
  d.getElementById('buy-form').requestSubmit(); await tick();
  const order = calls.find((c) => c.path === '/shop/order').body;
  assert.equal(order.method, 'upi');
  assert.deepEqual(Object.keys(order).sort(), ['customer', 'items', 'method', 'ship']); // no price or total ever sent
  assert.equal(d.getElementById('buy-upi').hidden, false);
  assert.equal(d.getElementById('buy-upi-amount').textContent, '₹2098.00');
  assert.equal(d.getElementById('buy-upi-ref').textContent, ID);
  assert.match(d.getElementById('buy-upi-open').href, /^upi:\/\/pay\?/);
  assert.equal(dom.window.localStorage.getItem('rwShopOrder.' + ID), 'tok');
  dom.window.close();
});

test('a refused quote (for example unconfigured delivery) shows the server message and no pay button', async () => {
  const routes = {'/shop/quote': () => ({status: 422, body: {error: 'shipping_not_available', message: 'We will confirm delivery to this PIN code on WhatsApp before you pay.'}})};
  const {dom, d} = setup({routes}); await tick();
  fill(d); d.getElementById('buy-quote').click(); await tick();
  assert.match(d.getElementById('buy-summary').textContent, /confirm delivery to this PIN code on WhatsApp/);
  assert.equal(d.getElementById('buy-pay').hidden, true);
  dom.window.close();
});

test('returning from Cashfree checks status with the stored order token', async () => {
  const routes = {['/shop/order/' + ID + '/status']: () => ({status: 200, body: {orderId: ID, status: 'paid', totalPaise: 209800}})};
  const {dom, d, calls} = setup({url: 'https://www.roamwise.co.in/shop/?order_id=' + ID, routes});
  // init has already run once without a token; store it and run the script again, as a returning visit would
  dom.window.localStorage.setItem('rwShopOrder.' + ID, 'tok');
  vm.runInContext(fs.readFileSync(path.join(root, 'shop/checkout.js'), 'utf8'), dom.getInternalVMContext());
  await tick();
  const status = calls.find((c) => c.path === '/shop/order/' + ID + '/status');
  assert.equal(status.headers.Authorization, 'Bearer tok');
  assert.match(d.getElementById('buy-status').textContent, /Payment received/);
  dom.window.close();
});
