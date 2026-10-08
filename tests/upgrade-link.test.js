'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const code = fs.readFileSync(path.join(__dirname, '..', 'js/payments/upgrade-link.js'), 'utf8');

function run({ search = '?upgrade=1', uid = 'u1', authReady = true } = {}) {
  const calls = { pay: 0, toasts: [], replaced: [] };
  const timers = [];
  const listeners = {};
  const ctx = {
    console, URL, URLSearchParams,
    location: { search, href: 'https://www.roamwise.co.in/' + search + '#top' },
    history: { replaceState: (a, b, u) => calls.replaced.push(u) },
    firebase: { auth: () => ({ currentUser: uid ? { uid } : null }) },
    AUTH_READY: authReady,
    openPay: () => { calls.pay++; },
    showToast: (m) => calls.toasts.push(m),
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    addEventListener: (ev, fn) => { listeners[ev] = fn; },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const fire = () => { if (listeners.load) listeners.load(); let n = 0; while (timers.length && n++ < 80) timers.shift()(); };
  return { ctx, calls, fire, timers };
}

test('no ?upgrade param: does nothing', () => {
  const t = run({ search: '' });
  t.fire();
  assert.equal(t.calls.pay, 0);
  assert.equal(t.calls.replaced.length, 0);
});

test('?upgrade=1 + signed in: opens the paywall once and cleans the URL', () => {
  const t = run();
  t.fire();
  assert.equal(t.calls.pay, 1);
  assert.deepEqual(t.calls.replaced, ['/#top']);
});

test('?upgrade=1 + signed out: asks to sign in, never opens the paywall', () => {
  const t = run({ uid: null });
  t.fire();
  assert.equal(t.calls.pay, 0);
  assert.match(t.calls.toasts[0], /Sign in/);
  assert.equal(t.calls.replaced.length, 1);
});

test('waits for auth to be ready before deciding', () => {
  const t = run({ authReady: false });
  t.fire();
  assert.equal(t.calls.pay, 0, 'gives up quietly after the wait');
  assert.equal(t.calls.toasts.length, 0, 'no misleading sign-in toast while auth never became ready');
  assert.equal(t.calls.replaced.length, 1);
});

test('other query params are preserved', () => {
  const t = run({ search: '?upgrade=1&ref=ABC' });
  t.ctx.location.href = 'https://www.roamwise.co.in/?upgrade=1&ref=ABC';
  t.fire();
  assert.deepEqual(t.calls.replaced, ['/?ref=ABC']);
});
