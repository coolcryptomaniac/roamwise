'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assessHealth, assessAuthBoundary, runChecks } = require('../tools/ai-ops/payment-watch.cjs');

const HEALTH = { ok: true, service: 'roamwise-worker', configured: { cashfree: true }, paymentEnvironment: 'live' };
function response(status, body) { return { status, json: async () => body }; }

test('health requires an available live Worker and present payment configuration', () => {
  assert.equal(assessHealth(200, HEALTH), null);
  assert.match(assessHealth(200, { ...HEALTH, configured: { cashfree: false } }), /missing/);
  assert.match(assessHealth(200, { ...HEALTH, paymentEnvironment: 'sandbox' }), /live/);
  assert.match(assessHealth(503, HEALTH), /unavailable/);
});

test('auth boundary rejects unauthenticated status lookup', () => {
  assert.equal(assessAuthBoundary(401, { error: 'unauthorized' }), null);
  assert.match(assessAuthBoundary(200, { order_status: 'PAID' }), /not rejected/);
});

test('monitor makes only two unauthenticated GETs and never claims a real payment passed', async () => {
  const calls = [];
  const result = await runChecks(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/health')) return response(200, HEALTH);
    return response(401, { error: 'unauthorized', message: 'Sign in before payment.' });
  }, 'https://roamwise-api.founder-f53.workers.dev');
  assert.equal(result.ok, true);
  assert.equal(result.verifiesRealPayment, false);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.options.method, 'GET');
    assert.equal(Object.hasOwn(call.options, 'headers'), false);
  }
});

test('monitor fails closed on network errors without exposing exception data', async () => {
  const result = await runChecks(async () => { throw new Error('secret-token-must-not-leak'); }, 'https://roamwise-api.founder-f53.workers.dev');
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result).includes('secret-token'), false);
  assert.equal(result.findings.length, 2);
});

test('monitor refuses non-HTTPS or credential-bearing endpoints', async () => {
  let called = false;
  const result = await runChecks(async () => { called = true; }, 'http://user:pass@example.com');
  assert.equal(result.ok, false);
  assert.equal(called, false);
});
