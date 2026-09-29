const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(__dirname + '/../js/misc/ad-attribution.js', 'utf8');

function run(url, stored) {
  const calls = [];
  const ls = {}; if (stored) ls.rw_ad_attrib = JSON.stringify(stored);
  const ss = {};
  const timers = [];
  const win = { track: (ev) => calls.push(ev) };
  const ctx = {
    window: win, URLSearchParams,
    location: { search: url },
    localStorage: { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = v; } },
    sessionStorage: { getItem: k => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = v; } },
    setTimeout: (f) => timers.push(f), Date, JSON,
  };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  timers.forEach(f => f());
  return { calls, win, ls };
}

test('paid landing records attribution and one ad_visits', () => {
  const r = run('?utm_source=chatgpt&utm_medium=cpc&utm_campaign=t1');
  assert.deepStrictEqual(r.calls, ['ad_visits']);
  assert.ok(JSON.parse(r.ls.rw_ad_attrib).s === 'chatgpt');
});

test('organic or non-paid medium is ignored', () => {
  assert.deepStrictEqual(run('?utm_source=newsletter&utm_medium=email').calls, []);
  assert.deepStrictEqual(run('').calls, []);
});

test('utm_content (referral code) is never stored', () => {
  const r = run('?utm_source=chatgpt&utm_medium=cpc&utm_content=ABC123');
  assert.ok(!('c' in JSON.parse(r.ls.rw_ad_attrib)) || !/ABC123/.test(r.ls.rw_ad_attrib));
});

test('signup and purchase events bump ad counters only while attributed', () => {
  const fresh = { s: 'chatgpt', m: 'cpc', c: '', t: Date.now() };
  const a = run('', fresh);
  a.win.track('signups'); a.win.track('cashfree_paid'); a.win.track('searches');
  assert.deepStrictEqual(a.calls, ['signups', 'ad_signups', 'cashfree_paid', 'ad_purchases', 'searches']);
  const stale = run('', { s: 'x', m: 'cpc', c: '', t: Date.now() - 40 * 864e5 });
  stale.win.track('signups');
  assert.deepStrictEqual(stale.calls, ['signups']);
});

test('firestore rules whitelist the three ad counters', () => {
  const rules = fs.readFileSync(__dirname + '/../firestore.rules', 'utf8');
  for (const k of ['ad_visits', 'ad_signups', 'ad_purchases']) assert.ok(rules.includes("statsBump('" + k + "')"));
});
