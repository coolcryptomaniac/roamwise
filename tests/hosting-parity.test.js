'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { baseUrl, probe, checkHosting } = require('../tools/ai-ops/hosting-parity.cjs');

test('host URLs must be clean HTTPS origins', () => {
  assert.equal(baseUrl('https://roamwise-web.pages.dev').hostname, 'roamwise-web.pages.dev');
  assert.throws(() => baseUrl('http://example.org'), /HTTPS/);
  assert.throws(() => baseUrl('https://example.org/payment?token=abc'), /HTTPS/);
});

test('static content tests do not send payment requests', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return { status: 200, url, text: async () => 'RoamWise content' };
  };
  const r = await checkHosting(fetcher, [{ name: 'staging', url: 'https://stage.example' }],
    [{ path: '/', marker: /RoamWise/ }]);
  assert.equal(r.ok, true);
  assert.equal(r.googleSignInVerified, false);
  assert.equal(r.cashfreePaymentVerified, false);
  assert.equal(r.automaticFailoverConfigured, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(new URL(calls[0].url).pathname, '/');
});

test('missing required asset is an unhealthy result', async () => {
  const r = await probe(async url => ({
    status: 200, url, text: async () => 'unexpected text'
  }), { name: 'preview', url: 'https://preview.example' },
  { path: '/rw-config.js', marker: /RW_CONFIG/ });
  assert.equal(r.ok, false);
  assert.equal(r.detail, 'expected content not found');
});

test('HTTP errors do not automatically alter DNS or checkout', async () => {
  const r = await probe(async url => ({
    status: 503, url, text: async () => 'offline'
  }), { name: 'backup', url: 'https://backup.example' },
  { path: '/', marker: /RoamWise/ });
  assert.equal(r.ok, false);
  assert.equal(r.detail, 'HTTP 503');
});
