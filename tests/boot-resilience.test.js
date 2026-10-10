'use strict';
/* Guards the fixes for the "black screen / slow start" report:
   - nothing third-party blocks first paint
   - the opening film plays once per device
   - a failed boot is detected and repaired once, never in a loop
   - repeat visits are served from the service-worker cache */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html');

test('no script blocks the parser: every external-source script is deferred', () => {
  const tags = [...html.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1]);
  const blocking = tags.filter((a) => /\bsrc=/.test(a) && !/\b(defer|async)\b/.test(a) && !/type="module"/.test(a));
  assert.deepEqual(blocking, [], 'blocking <script src> found');
});

test('Firebase SDK and QR library are self-hosted, not fetched from third-party hosts in <head>', () => {
  const head = html.slice(0, html.indexOf('</head>'));
  assert.doesNotMatch(head, /gstatic\.com\/firebasejs|cdnjs\.cloudflare\.com/);
  for (const f of ['app', 'auth', 'firestore', 'app-check']) {
    assert.ok(fs.existsSync(path.join(root, `vendor/firebase/10.14.1/firebase-${f}-compat.js`)), f);
    assert.match(html, new RegExp(`vendor/firebase/10\\.14\\.1/firebase-${f}-compat\\.js`));
  }
  assert.ok(fs.existsSync(path.join(root, 'vendor/qrcodejs/1.0.0/qrcode.min.js')));
  /* firebase must run before the code that uses it: it comes first in document order */
  assert.ok(html.indexOf('firebase-app-compat.js') < html.indexOf('js/boot/auth-init.js'));
  assert.ok(html.indexOf('firebase-firestore-compat.js') < html.indexOf('app.js?v='));
});

test('Google Fonts stylesheet cannot block rendering', () => {
  assert.match(html, /fonts\.googleapis\.com\/css2[^>]*media="print" onload="this\.media='all'"/);
  assert.match(html, /<noscript><link[^>]*fonts\.googleapis\.com/);
});

test('opening film is once per device (localStorage), still skipped inside a session', () => {
  const cfg = read('rw-config.js');
  assert.match(cfg, /localStorage\.getItem\('rw_opening'\) === '1'/);
  assert.match(cfg, /sessionStorage\.getItem\('rw_intro'\)/);
  const run = (local, session) => {
    const dom = new JSDOM('<html><head></head><body></body></html>', { url: 'https://roamwise.co.in/', runScripts: 'outside-only' });
    if (local) dom.window.localStorage.setItem('rw_opening', '1');
    if (session) dom.window.sessionStorage.setItem('rw_intro', '1');
    const start = cfg.indexOf('(function(){\n  /* The cinematic opening');
    const end = cfg.indexOf('/* Platform modules stay individually switchable');
    dom.window.eval(cfg.slice(start, end));
    return { show: dom.window.__RW_INTRO_SHOULD_SHOW, skip: dom.window.document.documentElement.classList.contains('rw-opening-skip') };
  };
  assert.deepEqual(run(false, false), { show: true, skip: false }, 'first ever visit plays it');
  assert.deepEqual(run(true, false), { show: false, skip: true }, 'new session on a device that saw it skips it');
  assert.deepEqual(run(false, true), { show: false, skip: true }, 'reload within a session skips it');
});

function bootWatchdog({ booted, healedAgo }) {
  const script = html.match(/<script id="rw-watchdog">([\s\S]*?)<\/script>/)[1];
  const dom = new JSDOM('<html><head></head><body></body></html>', { url: 'https://roamwise.co.in/', runScripts: 'outside-only' });
  const w = dom.window, timers = [];
  w.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
  const calls = { reload: 0, unregistered: 0, cachesDeleted: 0 };
  w.localStorage.clear();
  if (healedAgo != null) w.localStorage.setItem('rw_heal_at', String(Date.now() - healedAgo));
  Object.defineProperty(w.navigator, 'serviceWorker', { value: { getRegistrations: async () => [{ unregister: async () => { calls.unregistered++; } }] } });
  w.caches = { keys: async () => ['a', 'b'], delete: async () => { calls.cachesDeleted++; return true; } };
  w.__reload = () => { calls.reload++; };
  w.eval(script.replace('w.location.reload()', 'w.__reload()'));
  if (booted) w.__RW_BOOTED = true;
  return { w, timers, calls };
}
const flush = () => new Promise((r) => setImmediate(r));

test('watchdog: a healthy boot never shows anything', async () => {
  const { w, timers } = bootWatchdog({ booted: true });
  timers.forEach((t) => t.fn());
  w.dispatchEvent(new w.Event('load')); timers.forEach((t) => t.fn());
  assert.equal(w.document.getElementById('rwStall'), null);
});

test('watchdog: slow but alive shows a Reload banner at 15 s and removes it when the app boots', () => {
  const { w, timers } = bootWatchdog({ booted: false });
  const t15 = timers.find((t) => t.ms === 15000); assert.ok(t15);
  t15.fn();
  assert.ok(w.document.getElementById('rwStall'));
  w.__RW_BOOTED = true; w.dispatchEvent(new w.Event('rw:booted'));
  assert.equal(w.document.getElementById('rwStall'), null);
});

test('watchdog: finished loading but app dead -> repairs once (drops SW + caches, keeps user data), then only a banner', async () => {
  const first = bootWatchdog({ booted: false, healedAgo: null });
  first.w.localStorage.setItem('rw_userdata_probe', 'keep');
  first.w.dispatchEvent(new first.w.Event('load'));
  first.timers.find((t) => t.ms === 4000).fn();
  await flush(); await flush();
  assert.equal(first.calls.unregistered, 1);
  assert.equal(first.calls.cachesDeleted, 2);
  assert.equal(first.calls.reload >= 1, true);
  assert.equal(first.w.localStorage.getItem('rw_userdata_probe'), 'keep');
  assert.ok(first.w.localStorage.getItem('rw_heal_at'));
  const again = bootWatchdog({ booted: false, healedAgo: 60000 });   // repaired a minute ago
  again.w.dispatchEvent(new again.w.Event('load'));
  again.timers.find((t) => t.ms === 4000).fn();
  await flush();
  assert.equal(again.calls.reload, 0, 'no reload loop');
  assert.ok(again.w.document.getElementById('rwStall'), 'falls back to the banner');
});

test('boot signal script is last and gated on real entry points', () => {
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(scripts[scripts.length - 1], 'js/boot/boot-ok.js');
  assert.match(read('js/boot/boot-ok.js'), /NEEDED = \['tabGo','shareApp','rwApi'\]/);
});

test('service worker: first install does not reload the page; repeat visits are cache-first with background refresh', () => {
  const fresh = read('js/runtime/freshness.js');
  assert.match(fresh, /var hadController = !!navigator\.serviceWorker\.controller/);
  assert.match(fresh, /if \(!hadController\) \{ hadController = true; return; \}/);
  const sw = read('sw.js');
  assert.match(sw, /STALE-WHILE-REVALIDATE/);
  assert.doesNotMatch(sw, /cache: 'no-store' \}\)\.then\(function \(res\) \{\s*var copy/);
  assert.match(sw, /!res\.redirected/);
  assert.match(sw, /vendor\/webllm\//);
});

test('loading veil: first child of <body>, covers the unfinished page, always lifts', () => {
  const body = html.slice(html.indexOf('<body'));
  assert.match(body.slice(0, 200), /<body[^>]*>\s*<div id="rwVeil"/);
  assert.match(html, /<noscript><style>#rwVeil\{display:none\}<\/style><\/noscript>/);
  /* sits under the opening film (2147483000) and the stall banner (2147483647) */
  const z = +html.match(/#rwVeil\{[^}]*z-index:(\d+)/)[1];
  assert.ok(z < 2147483000);

  const { w, timers } = bootWatchdog({ booted: false });
  w.document.body.innerHTML = '<div id="rwVeil"></div>';
  /* 1) lifts when the app boots */
  w.__RW_BOOTED = true; w.dispatchEvent(new w.Event('rw:booted'));
  assert.equal(w.document.getElementById('rwVeil').className, 'rw-veil-off');
  timers.filter((t) => t.ms === 300).forEach((t) => t.fn());
  assert.equal(w.document.getElementById('rwVeil'), null);

  /* 2) lifts after 20 s even if the app never booted, so a broken page is never trapped */
  const stuck = bootWatchdog({ booted: false });
  stuck.w.document.body.innerHTML = '<div id="rwVeil"></div>';
  stuck.timers.find((t) => t.ms === 20000).fn();
  assert.equal(stuck.w.document.getElementById('rwVeil').className, 'rw-veil-off');
});
