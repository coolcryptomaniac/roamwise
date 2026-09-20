const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('invalid server-side Firebase service account is 503, never an expired user session', async () => {
  const { createCashfreeHandlers } = await import(path.join(root, 'worker/handlers/cashfree.js'));
  const handlers = createCashfreeHandlers();
  const env = {
    CASHFREE_APP_ID: 'configured-app-id', CASHFREE_SECRET_KEY: 'configured-secret',
    FIREBASE_SERVICE_ACCOUNT_JSON: '{invalid-json', CASHFREE_ENV: 'live'
  };
  const req = bearer => ({
    headers: new Headers(bearer ? { authorization: 'Bearer '+bearer } : {}),
    json: async () => ({ amount: 100, meta: { planId: 'founder' }, customer: { phone: '9999999999' } })
  });
  const serverError = await handlers.handleCashfreeOrder(req('fake-token'), env);
  const details = await serverError.json();
  assert.equal(serverError.status, 503);
  assert.equal(details.error, 'server_auth_config_invalid');
  assert.doesNotMatch(JSON.stringify(details), /configured-secret|invalid-json|sign.in.expired/i);
  const noBearer = await handlers.handleCashfreeOrder(req(''), env);
  assert.equal(noBearer.status, 401);
  assert.equal((await noBearer.json()).error, 'unauthorized');
});

test('Smart Amritsar itinerary includes real named places without an AI key or preset request', () => {
  const code = fs.readFileSync(path.join(root, 'js/itinerary/build.js'), 'utf8');
  const ph = { innerHTML: '', style: {} };
  const cnt = { innerHTML: '', style: {} };
  const state = {
    isPro: true, itinBuilt: {}, activeProv: 'smart', user: null,
    window: {}, swTab: () => {}, lsGet: () => '',
    el: id => id==='amritsar-iph' ? ph : id==='amritsar-ict' ? cnt : null,
    esc2: s => String(s), rwGreenNudge: () => '', travelLinksHTML: () => '', badgeBump: () => {}
  };
  vm.runInNewContext(code, state);
  state.buildItin('amritsar','Amritsar',4000,3);
  assert.equal(state.itinBuilt.amritsar,true);
  assert.match(cnt.innerHTML,/Harmandir Sahib|Golden Temple/);
  assert.match(cnt.innerHTML,/Jallianwala Bagh/);
  assert.match(cnt.innerHTML,/Partition Museum/);
  assert.doesNotMatch(cnt.innerHTML,/Main historical site or museum/);
  assert.match(cnt.innerHTML,/not live availability, prices, events or crowd counts/);
  assert.equal(state.window._lastItin.days.length, 3);
});
