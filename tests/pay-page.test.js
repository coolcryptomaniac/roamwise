'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pay/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'pay/pay.js'), 'utf8');
const profile = require('../business-account.js').profile;
function page() { return new JSDOM(html, { url: 'https://www.roamwise.co.in/pay/', runScripts: 'outside-only' }); }

test('public pay page uses the operating UPI and exact joining routes without granting a plan', () => {
  const dom = page(), doc = dom.window.document;
  const pay = new URL(doc.getElementById('payUpi').href);
  assert.equal(pay.protocol, 'upi:');
  assert.equal(pay.hostname, 'pay');
  assert.equal(pay.searchParams.get('pa'), profile.upiId);
  assert.equal(pay.searchParams.get('pn'), profile.accountHolder);
  assert.equal(pay.searchParams.get('cu'), 'INR');
  assert.equal(pay.searchParams.has('am'), false, 'a business card must not invent an amount');
  for (const url of ['https://www.roamwise.co.in/partner/join/', 'https://www.roamwise.co.in/creators/']) {
    assert.ok([...doc.querySelectorAll('a')].some(a => a.href === url));
  }
  const share = new URL(doc.getElementById('sharePayment').href);
  assert.equal(share.hostname, 'wa.me');
  assert.match(share.searchParams.get('text'), /https:\/\/www\.roamwise\.co\.in\/pay\//);
  assert.match(share.searchParams.get('text'), /roamwisepay@ybl/);
  assert.match(doc.querySelector('.payment-context').textContent, /pay the host directly/);
  assert.match(doc.querySelector('.note').textContent, /does not confirm payment/);
  assert.equal(doc.querySelectorAll('form').length, 0);
  assert.doesNotMatch(js, /fetch\(|firestore|localStorage|sessionStorage|proUntil|entitlement/);
  for (const el of doc.querySelectorAll('img[src],script[src],link[rel="stylesheet"]')) {
    const value = el.getAttribute('src') || el.getAttribute('href');
    assert.ok(fs.existsSync(path.resolve(root, 'pay', value)), value);
  }
  assert.match(doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content, /connect-src 'none'/);
  dom.window.close();
});

test('copy buttons copy the exact UPI and shareable HTTPS payment page', async () => {
  const dom = page(), copied = [];
  Object.defineProperty(dom.window.navigator, 'clipboard', { value: { writeText: async s => copied.push(s) } });
  dom.window.eval(js);
  dom.window.document.getElementById('copyUpi').click();
  await Promise.resolve();
  dom.window.document.getElementById('copyPayment').click();
  await Promise.resolve();
  assert.deepEqual(copied, ['roamwisepay@ybl', 'https://www.roamwise.co.in/pay/']);
  assert.equal(dom.window.document.getElementById('copyStatus').textContent, 'Payment page link copied.');
  dom.window.close();
});

test('clipboard failure offers manual copying and never reports a payment success', async () => {
  const dom = page();
  Object.defineProperty(dom.window.navigator, 'clipboard', { value: { writeText: async () => { throw Error('blocked'); } } });
  dom.window.document.execCommand = () => false;
  dom.window.eval(js);
  dom.window.document.getElementById('copyUpi').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(dom.window.document.getElementById('copyStatus').textContent, /Copy was unavailable/);
  assert.equal(dom.window.document.querySelectorAll('textarea').length, 0);
  dom.window.close();
});
