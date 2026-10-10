'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const repo = path.resolve(__dirname, '..');
const ids = ['pilgrimage', 'char-dham', 'panch-kedar', 'kumbh', 'vaishno-devi', 'kashi', 'tirupati', 'ayodhya', 'dwarka-somnath', 'puri-konark', 'amarnath', 'shirdi', 'bodh-gaya', 'rameswaram-madurai'];
function boot(id, pro = false, speech) {
  const base = path.join(repo, id), html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  const d = new JSDOM(html, { url: 'https://roamwise.co.in/' + id + '/', runScripts: 'outside-only' }), w = d.window;
  if (pro) w.localStorage.setItem('rwPro', '1');
  w.print = () => {}; w.fetch = () => { throw Error('No network expected'); };
  if (speech) { w.SpeechSynthesisUtterance = function (text) { this.text = text; }; w.speechSynthesis = speech; }
  for (const tag of w.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.resolve(base, tag.getAttribute('src')), 'utf8'));
  return d;
}
test('all pilgrimage entries load with strict CSP, valid local assets and no invented live claims', () => {
  for (const id of ids) {
    const d = boot(id), doc = d.window.document, base = path.join(repo, id), html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
    assert.match(html, /connect-src 'none'/); assert.doesNotMatch(html, /<script(?![^>]*src=)|\sstyle=|\sonclick=/);
    for (const node of doc.querySelectorAll('script[src],link[rel="stylesheet"]')) assert.ok(fs.existsSync(path.resolve(base, node.getAttribute('src') || node.getAttribute('href'))));
    assert.equal(doc.querySelectorAll('.journey-card').length, 14);
    if (id !== 'pilgrimage') { assert.match(doc.getElementById('source-age').textContent, /not an imported live feed/); assert.equal(doc.getElementById('standard-begin').disabled, true); assert.ok(doc.querySelector('a[href="tel:112"]')); }
    d.window.close();
  }
});
test('routes, dates, group limits and share draft use selected shrine without personal details', () => {
  const d = boot('char-dham'), w = d.window, doc = w.document;
  const shrine = doc.getElementById('visit-shrine'); shrine.value = '2'; shrine.dispatchEvent(new w.Event('input'));
  const map = new URL(doc.getElementById('visit-map').href); assert.equal(map.searchParams.get('destination'), 'Kedarnath, Uttarakhand');
  doc.getElementById('custom-name').value = 'Private Name'; doc.getElementById('visit-origin').value = 'Private Origin'; doc.getElementById('visit-origin').dispatchEvent(new w.Event('input'));
  assert.doesNotMatch(decodeURIComponent(doc.getElementById('visit-share').href), /Private Name|Private Origin/);
  doc.getElementById('visit-group').value = '61'; doc.getElementById('visit-group').dispatchEvent(new w.Event('input')); assert.equal(doc.getElementById('visit-share').hidden, true);
  doc.getElementById('visit-group').value = '1'; doc.getElementById('visit-date').value = '2025-01-01'; doc.getElementById('visit-date').dispatchEvent(new w.Event('input')); assert.equal(doc.getElementById('visit-share').hidden, true);
  w.close();
});
test('Hindi translates every destination and preserves checked tasks', () => {
  for (const id of ids.slice(1)) {
    const d = boot(id), doc = d.window.document; doc.querySelector('#visit-checks input').checked = true;
    doc.querySelector('[data-lang="hi"]').click(); assert.equal(doc.documentElement.lang, 'hi'); assert.match(doc.querySelector('h1').textContent, /[ऀ-ॿ]/);
    assert.equal(doc.querySelector('#visit-checks input').checked, true); assert.equal(doc.querySelector('#visit-checks').children.length, 8);
    assert.equal(doc.getElementById('visit-shrine').options.length, d.window.RWPilgrimage.sites.find(s => s.id === id).places.length); d.window.close();
  }
});
test('Pro standard and custom sessions share the gesture player with appropriate shrine mantras', () => {
  const voice = { spoken: [], getVoices() { return [{ lang: 'hi-IN', localService: true }, { lang: 'en-IN', localService: true }]; }, speak(u) { this.spoken.push(u); }, cancel() {} };
  const d = boot('char-dham', true, voice), w = d.window, doc = w.document;
  const shrine = doc.getElementById('visit-shrine'); shrine.value = '3'; shrine.dispatchEvent(new w.Event('input'));
  doc.getElementById('standard-begin').click(); assert.equal(doc.querySelector('#standard-ritual .ritual-script').children.length, 11);
  assert.match(doc.querySelector('#standard-ritual .ritual-script').textContent, /ॐ नमो नारायणाय/); assert.doesNotMatch(doc.querySelector('#standard-ritual .ritual-script').textContent, /हनुमान लला/);
  doc.getElementById('custom-name').value = '<img src=x onerror=alert(1)>'; doc.getElementById('custom-people').value = 'My family';
  doc.getElementById('custom-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
  assert.equal(doc.querySelector('#standard-ritual [data-ritual-action="pause"]').disabled, true); assert.ok(doc.querySelector('#custom-ritual .pandit-figure'));
  assert.equal(doc.querySelector('img[src=x]'), null); assert.match(doc.querySelector('#custom-ritual .ritual-script').textContent, /My family/); assert.equal(voice.spoken.length, 0);
  assert.doesNotMatch(JSON.stringify(w.localStorage), /My family|onerror/); w.close();
});
test('source links remain https and directory has matching bilingual keys', () => {
  const d = boot('pilgrimage'), data = d.window.RWPilgrimage;
  assert.deepEqual(Object.keys(data.strings.en).sort(), Object.keys(data.strings.hi).sort());
  for (const site of data.sites) { for (const source of site.sources) assert.equal(new URL(source[1]).protocol, 'https:'); for (const place of site.places) assert.ok(data.mantras[place.mantra]); }
  d.window.close();
});
