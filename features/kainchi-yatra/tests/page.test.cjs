const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const repo = path.resolve(__dirname, '../../..');
const base = path.join(repo, 'kainchi/');
const html = fs.readFileSync(base + 'index.html', 'utf8');
function boot(opts = {}) {
  const dom = new JSDOM(html, { url: 'https://roamwise.co.in/kainchi/', runScripts: 'outside-only' });
  const w = dom.window;
  Object.defineProperty(w.navigator, 'language', { value: opts.lang || 'en-IN' });
  w.fetch = () => { throw new Error('Unexpected network request'); };
  w.print = () => {};
  if (opts.saved) w.localStorage.setItem('rw_kainchi_passes_v1', opts.saved);
  if (opts.blocked) Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
  for (const tag of w.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.resolve(base, tag.getAttribute('src')), 'utf8'));
  return dom;
}
const $ = (d, id) => d.window.document.getElementById(id);
test('page has strict CSP and no inline script/style', () => {
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)/);
  assert.doesNotMatch(html, /\sstyle=|\sonclick=/);
});
test('renders English, honest empty states, nearby places', () => {
  const d = boot();
  assert.ok($(d, 'plan-level').textContent.length > 0);
  assert.match($(d, 'rate-list').textContent, /./);
  assert.equal($(d, 'rate-list').querySelectorAll('.rate').length, 0);
  assert.ok($(d, 'alt-list').children.length >= 5);
  assert.equal($(d, 'emerg-amb').getAttribute('href'), 'tel:108');
});
test('Hindi toggle translates and persists', () => {
  const d = boot();
  d.window.document.querySelector('[data-lang="hi"]').click();
  assert.equal(d.window.document.documentElement.lang, 'hi');
  assert.match($(d, 'h1' ) ? '' : d.window.document.querySelector('h1').textContent, /[ऀ-ॿ]/);
  assert.equal(d.window.localStorage.getItem('rw_kainchi_lang_v1'), 'hi');
  assert.equal(boot({ lang: 'hi-IN' }).window.document.documentElement.lang, 'hi');
});
test('pass is made, not saved unless opted in, and can be deleted', () => {
  const d = boot(), doc = d.window.document;
  $(d, 'pass-leader').value = 'Asha'; $(d, 'pass-size').value = '3';
  $(d, 'pass-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.equal(doc.querySelectorAll('#pass-list .pass').length, 1);
  assert.equal(d.window.localStorage.getItem('rw_kainchi_passes_v1'), null);
  $(d, 'pass-remember').checked = true; $(d, 'pass-remember').dispatchEvent(new d.window.Event('change'));
  assert.match(d.window.localStorage.getItem('rw_kainchi_passes_v1'), /KDY-/);
  doc.querySelector('#pass-list .pass button.quiet').click();
  assert.equal(doc.querySelectorAll('#pass-list .pass').length, 0);
});
test('invalid pass shows a localised error', () => {
  const d = boot();
  $(d, 'pass-leader').value = ''; $(d, 'pass-size').value = '3';
  $(d, 'pass-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.match($(d, 'pass-message').className, /bad/);
});
test('report builds a mailto link; ambulance shows emergency call-out', () => {
  const d = boot();
  $(d, 'rep-place').value = 'Bhowali'; $(d, 'rep-amount').value = '3000'; $(d, 'rep-official').value = '2000';
  $(d, 'rep-text').value = 'Driver demanded far more than the posted fare.';
  $(d, 'report-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.equal($(d, 'report-out').hidden, false);
  assert.match($(d, 'report-mail').getAttribute('href'), /^mailto:support@roamwise\.co\.in/);
  $(d, 'rep-cat').value = 'ambulance'; $(d, 'rep-cat').dispatchEvent(new d.window.Event('change'));
  assert.equal($(d, 'report-emergency').hidden, false);
});
test('works with storage blocked and ignores corrupt stored passes', () => {
  assert.ok(boot({ blocked: true }).window.document.getElementById('plan-level').textContent);
  const d = boot({ saved: '{{bad' });
  assert.equal(d.window.document.querySelectorAll('#pass-list .pass').length, 0);
});
