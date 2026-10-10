'use strict';
/* The low-data version: tiny, self-contained, in step with the full app's data, and only
   ever offered/forced where it is safe to do so. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const lite = read('lite/index.html');
const { compact, render } = require('../tools/build-lite.cjs');

test('lite page is tiny and has no external requests apart from the NMIMS flag read', () => {
  assert.ok(Buffer.byteLength(lite) < 40000, 'under 40 KB raw');
  assert.doesNotMatch(lite, /<script[^>]+src=/i);
  assert.doesNotMatch(lite, /<link[^>]+(stylesheet|fonts)/i);
  assert.doesNotMatch(lite, /<img\b/i);
  const hosts = [...lite.matchAll(/https?:\/\/([^/'"\s)]+)/g)].map((m) => m[1]).filter((h) => !/^(roamwise\.co\.in|www\.w3\.org)$/.test(h));
  assert.deepEqual([...new Set(hosts)], ['firestore.googleapis.com']);
  assert.match(lite, /<meta name="robots" content="noindex">/);
});

test('embedded destination data is generated from js/data/destinations.js and is current', () => {
  assert.equal(render(lite), lite, 'run: node tools/build-lite.cjs');
  const d = compact();
  assert.ok(d.length >= 20);
  for (const x of d) {
    assert.ok(x.n && x.b.length && x.q.length === 3 && x.c.length === 3, x.n);
    assert.ok(x.c[0] < x.c[1] && x.c[1] < x.c[2], x.n + ' budget < mid < luxury');
  }
});

test('lite page works without the network: search, pick a place, see months and budgets', () => {
  const dom = new JSDOM(lite, { runScripts: 'dangerously', url: 'https://roamwise.co.in/lite/', beforeParse(w) { w.fetch = () => Promise.resolve({ ok: false }); } });
  const doc = dom.window.document;
  const chips = () => [...doc.querySelectorAll('#list .chip')];
  assert.equal(chips().length, compact().length);
  const q = doc.getElementById('q'); q.value = 'manali'; q.dispatchEvent(new dom.window.Event('input'));
  assert.equal(chips().length, 1);
  chips()[0].click();
  const det = doc.getElementById('det');
  assert.equal(det.hidden, false);
  assert.match(det.textContent, /Manali/);
  assert.match(det.textContent, /Best weather/);
  assert.match(det.textContent, /Quietest months/);
  assert.match(det.textContent, /₹/);
  assert.equal(doc.getElementById('nm').hidden, true, 'NMIMS card stays hidden unless the Firestore flag is on');
  assert.match(doc.querySelector('a[href="tel:112"]').textContent, /112/);
  dom.window.close();
});

test('"Open full app" remembers the choice for the session and keeps a query so no redirect loop', () => {
  assert.match(lite, /href="\/\?full=1"/);
  assert.match(lite, /sessionStorage\.setItem\('rw_full','1'\)/);
});

test('home page sends only first-visit 2G/GPRS users on the bare URL to /lite/', () => {
  const html = read('index.html');
  const script = html.match(/<script id="rw-net">([\s\S]*?)<\/script>/)[1];
  const dom = new JSDOM('<html><head></head><body></body></html>', { url: 'https://roamwise.co.in/', runScripts: 'outside-only' });
  dom.window.eval(script);
  const f = dom.window.__RW_NET.wantsLite;
  assert.equal(f('2g', '', '', '/', false, false, false), true);
  assert.equal(f('slow-2g', '', '', '/index.html', false, false, false), true);
  assert.equal(f('3g', '', '', '/', false, false, false), false, '3G is offered, not forced');
  assert.equal(f('4g', '', '', '/', false, false, false), false);
  assert.equal(f('2g', '?ref=NMIMS2026', '', '/', false, false, false), false, 'referral links keep working');
  assert.equal(f('2g', '?redeem=NMIMS-STU-1', '', '/', false, false, false), false, 'pass links keep working');
  assert.equal(f('2g', '?full=1', '', '/', false, false, false), false);
  assert.equal(f('2g', '', '#plan', '/', false, false, false), false);
  assert.equal(f('2g', '', '', '/blog/x.html', false, false, false), false, 'only the home page');
  assert.equal(f('2g', '', '', '/', true, false, false), false, 'chose the full app this session');
  assert.equal(f('2g', '', '', '/', false, true, false), false, 'returning user with the app cached');
  assert.equal(f('2g', '', '', '/', false, false, true), false, 'never inside the native app');
  dom.window.close();
  assert.match(html, /Taking long\? Open the light version/);
  assert.match(read('sw.js'), /'\/lite\/',/);
});
