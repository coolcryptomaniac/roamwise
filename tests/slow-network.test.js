'use strict';
/* Slow-network provisions: optional weight (opening film + sound, ads, photos, service-worker
   install) must stay off the critical path unless the link is fast, and the fast path must
   behave exactly as before. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html');
const netScript = html.match(/<script id="rw-net">([\s\S]*?)<\/script>/)[1];

function tierFor(conn) {
  const dom = new JSDOM('<html><head></head><body></body></html>', { url: 'https://roamwise.co.in/', runScripts: 'outside-only' });
  if (conn) Object.defineProperty(dom.window.navigator, 'connection', { value: Object.assign({ addEventListener() {} }, conn) });
  dom.window.eval(netScript);
  const out = { tier: dom.window.__RW_NET.tier, cls: dom.window.document.documentElement.className };
  dom.window.close(); /* stops the veil-progress interval */
  return out;
}

test('network tier: GPRS/2G and Data Saver are vslow, 3G and sub-0.6 Mbps are slow, ~1 Mbps is medium, 4G/5G is fast', () => {
  assert.equal(tierFor({ effectiveType: 'slow-2g', downlink: 0.05, rtt: 2000 }).tier, 'vslow');
  assert.equal(tierFor({ effectiveType: '2g', downlink: 0.07, rtt: 1500 }).tier, 'vslow');
  assert.equal(tierFor({ effectiveType: '4g', downlink: 8, rtt: 50, saveData: true }).tier, 'vslow');
  assert.equal(tierFor({ effectiveType: '3g', downlink: 0.2, rtt: 400 }).tier, 'slow');
  assert.equal(tierFor({ effectiveType: '4g', downlink: 0.5, rtt: 120 }).tier, 'slow');
  assert.equal(tierFor({ effectiveType: '4g', downlink: 1.0, rtt: 100 }).tier, 'medium');
  const fast = tierFor({ effectiveType: '4g', downlink: 10, rtt: 50 });
  assert.equal(fast.tier, 'fast');
  assert.match(fast.cls, /rw-net-fast/);
});

test('network tier: browsers without the API are treated as fast (never degrade by guessing)', () => {
  assert.equal(tierFor(null).tier, 'fast');
});

test('a connection that gets worse mid-visit downgrades the tier, one that improves does not re-enable heavy loads', () => {
  const dom = new JSDOM('<html><head></head><body></body></html>', { url: 'https://roamwise.co.in/', runScripts: 'outside-only' });
  let onChange; const conn = { effectiveType: '4g', downlink: 10, rtt: 50, addEventListener: (e, fn) => { onChange = fn; } };
  Object.defineProperty(dom.window.navigator, 'connection', { value: conn });
  dom.window.eval(netScript);
  assert.equal(dom.window.__RW_NET.tier, 'fast');
  Object.assign(conn, { effectiveType: '3g', downlink: 0.2, rtt: 400 }); onChange();
  assert.equal(dom.window.__RW_NET.tier, 'slow');
  Object.assign(conn, { effectiveType: '4g', downlink: 10, rtt: 50 }); onChange();
  assert.equal(dom.window.__RW_NET.tier, 'slow');
  dom.window.close();
});

test('opening film + sound are skipped off the fast tier, without persisting "seen"', () => {
  const cfg = read('rw-config.js');
  assert.match(cfg, /window\.__RW_NET\.tier !== 'fast'\) seen = true;/);
  /* the skip must come before the flag is read and must not write rw_opening */
  assert.ok(cfg.indexOf("tier !== 'fast') seen = true") < cfg.indexOf('window.__RW_INTRO_SHOULD_SHOW = !seen'));
  assert.doesNotMatch(cfg.slice(cfg.indexOf('tier !== \'fast\') seen'), cfg.indexOf('window.__RW_INTRO_SHOULD_SHOW')), /setItem\('rw_opening'/);
  assert.match(read('platform-v5/audio-only.js'), /el\.preload = \(window\.__RW_NET && window\.__RW_NET\.tier !== 'fast'\) \? 'none' : 'auto'/);
  assert.match(read('js/audio/cues.js'), /node\.preload = \(rwNet && rwNet\.tier !== 'fast'\) \? 'none' : 'auto'/);
});

test('ads never load on slow links and otherwise wait for the app to start', () => {
  const ads = read('js/misc/adsense-whatsapp.js');
  assert.match(ads, /net\.tier==='slow'\|\|net\.tier==='vslow'\) return;/);
  assert.match(ads, /rw:booted/);
  assert.doesNotMatch(ads, /addEventListener\('DOMContentLoaded', loadAds\);/);
});

test('photos wait for boot on slow links, are capped, and are requested smaller', () => {
  const cp = read('js/ui/card-painter.js');
  assert.match(cp, /if\(!window\.__RW_BOOTED\)\{[\s\S]*?rw:booted/);
  assert.match(cp, /net\.tier === 'vslow' \? 0 : net\.tier === 'slow' \? 4 : 8/);
  assert.match(cp, /w=240&h=330[^']*q=60/);
  assert.match(cp, /w=340&h=460&fit=cover&output=jpg&q=80/, 'fast tier keeps the original size');
});

test('service worker registration waits until the app has started', () => {
  const f = read('js/runtime/freshness.js');
  assert.match(f, /function afterBoot\(fn\)/);
  assert.match(f, /afterBoot\(function \(\) \{\s*navigator\.serviceWorker\.register\('sw\.js', \{ updateViaCache: 'none' \}\)/);
  assert.match(f, /updateViaCache: 'none'/);
});

test('the loading veil tells slow-link users what is happening', () => {
  assert.match(netScript, /Slow connection\. /);
  assert.match(netScript, /Loading the essentials/);
});
