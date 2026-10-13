'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
function boot(pro = false) {
  const html = fs.readFileSync(path.join(root, 'bhakti/index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://roamwise.co.in/bhakti/#bhakti', runScripts: 'outside-only' });
  if (pro) dom.window.localStorage.setItem('rwPro', '1'); dom.window.print = () => {};
  for (const script of dom.window.document.querySelectorAll('script[src]')) dom.window.eval(fs.readFileSync(path.resolve(root, 'bhakti', script.getAttribute('src')), 'utf8'));
  return dom;
}
test('studio has all six INR tiers, full text preview, one-time disclosure and no payment collection', () => {
  const d = boot(), w = d.window, doc = w.document;
  assert.deepEqual(Array.from(w.RWBhakti.products, p => p.price), [10, 30, 60, 100, 200, 300]);
  assert.equal(doc.querySelectorAll('.studio-product').length, 6);
  assert.equal(doc.querySelector('[data-ritual-action=start]').disabled, true);
  assert.equal(doc.querySelector('#studio-player details').open, true);
  assert.match(doc.getElementById('studio-payment-note').textContent, /No payment/);
  assert.match(doc.querySelector('[data-i18n=studio_boundary]').textContent, /digital content/);
  doc.getElementById('studio-preview').click();
  assert.equal(doc.querySelector('[data-ritual-action=start]').disabled, false);
  assert.equal(doc.querySelectorAll('.ritual-script li').length, 1, 'free preview cannot expose paid progression');
  doc.querySelector('[data-product=bhakti_parthiv]').click();
  assert.equal(doc.querySelector('[data-ritual-action=start]').disabled, true, 'preview cannot unlock a paid programme');
  d.window.close();
});
test('Pro retains standard and custom aarti but does not automatically get a new paid premium programme', () => {
  const d = boot(true), doc = d.window.document;
  assert.equal(doc.querySelector('[data-ritual-action=start]').disabled, false);
  doc.getElementById('studio-name').value = '<img src=x onerror=alert(1)>';
  doc.getElementById('studio-people').value = 'Family';
  doc.getElementById('studio-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.match(doc.querySelectorAll('.ritual-script li')[1].textContent, /<img src=x/);
  assert.equal(doc.querySelector('img[src=x]'), null);
  assert.doesNotMatch(JSON.stringify(d.window.localStorage), /Family|onerror/);
  doc.querySelector('[data-product=bhakti_katha]').click();
  assert.equal(doc.querySelector('[data-ritual-action=start]').disabled, true);
  d.window.close();
});
test('programmes include exactly 40 Chalisa chaupais and dohas; bounded 108-ahuti and Parthiv sequences have distinct phases', () => {
  const d = boot(), api = d.window.RWBhakti;
  assert.equal(api.chalisa.length, 43);
  assert.match(api.chalisa[0], /श्रीगुरु/); assert.match(api.chalisa[42], /पवनतनय/);
  for (const p of api.products) {
    const script = api.script('hi', { productId: p.id, count: 999999999, name: 'मोहन', intent: 'peace' });
    assert.ok(script.length < 150); assert.ok(script.every(s => s.text && s.title && s.lang));
    assert.match(script[1].text, /मोहन/);
    if (p.programme === 'paath') assert.equal(script.filter(s => s.id === 'chalisa').length, 43);
    if (p.programme === 'katha') assert.equal(script.filter(s => s.id === 'katha').length, 8);
    if (p.programme === 'yajna') { assert.equal(script.filter(s => s.id === 'yajna').length, 108); assert.ok(script.some(s => s.id === 'purnahuti')); }
    if (p.programme === 'parthiv') { for (const id of ['parthiv', 'water', 'bilva', 'farewell']) assert.ok(script.some(s => s.id === id)); assert.equal(script.filter(s => s.id === 'mantra').length, 108); assert.equal(script.filter(s => s.id === 'aarti' && s.text.includes('ॐ जय शिव ओंकारा')).length, 12); }
  }
  d.window.close();
});
test('studio translates programmes and names safely, pause motion persists during selection and voice remains opt-in', () => {
  const d = boot(true), doc = d.window.document;
  doc.querySelector('[data-lang=hi]').click();
  assert.match(doc.querySelector('h1').textContent, /भक्ति/); assert.match(doc.querySelector('[data-product=bhakti_yajna]').parentNode.textContent, /यज्ञ/);
  assert.equal(doc.querySelector('[data-ritual-action=voice]').checked, false);
  doc.getElementById('studio-motion').click();
  assert.equal(doc.body.classList.contains('motion-paused'), true);
  doc.querySelector('[data-product=bhakti_mantra]').click();
  assert.equal(doc.body.classList.contains('motion-paused'), true);
  d.window.close();
});
