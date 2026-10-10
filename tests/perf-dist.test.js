'use strict';
/* Device tier, old-browser notice and the optimised-site build. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const netScript = html.match(/<script id="rw-net">([\s\S]*?)<\/script>/)[1];
const oldScript = html.match(/<script id="rw-oldbrowser">([\s\S]*?)<\/script>/)[1];

function net(conn, dev) {
  const dom = new JSDOM('<html><head></head><body></body></html>', { url: 'https://roamwise.co.in/', runScripts: 'outside-only' });
  if (conn) Object.defineProperty(dom.window.navigator, 'connection', { value: Object.assign({ addEventListener() {} }, conn) });
  Object.keys(dev || {}).forEach((k) => Object.defineProperty(dom.window.navigator, k, { value: dev[k] }));
  dom.window.eval(netScript);
  const out = Object.assign({}, dom.window.__RW_NET); dom.window.close(); return out;
}

test('weak phones (<=2 GB RAM or <=2 cores) on a fast link are lowered to medium; capable phones stay fast', () => {
  const fastConn = { effectiveType: '4g', downlink: 10, rtt: 50 };
  assert.equal(net(fastConn, { deviceMemory: 2, hardwareConcurrency: 8 }).tier, 'medium');
  assert.equal(net(fastConn, { deviceMemory: 8, hardwareConcurrency: 2 }).tier, 'medium');
  assert.equal(net(fastConn, { deviceMemory: 8, hardwareConcurrency: 8 }).tier, 'fast');
  assert.equal(net(fastConn, { deviceMemory: undefined, hardwareConcurrency: undefined }).tier, 'fast', 'unknown hardware (Safari, Firefox) is never guessed');
  assert.equal(net(fastConn, { deviceMemory: 2 }).lowEnd, true);
});

test('a weak phone on a slow link keeps the slower tier (never upgraded)', () => {
  assert.equal(net({ effectiveType: '2g', downlink: 0.07, rtt: 1500 }, { deviceMemory: 1 }).tier, 'vslow');
  assert.equal(net({ effectiveType: '3g', downlink: 0.2, rtt: 400 }, { deviceMemory: 1 }).tier, 'slow');
});

function oldBrowserOutput(strip) {
  const dom = new JSDOM('<html><head></head><body></body></html>', { runScripts: 'outside-only' });
  strip.forEach((k) => { dom.window[k] = undefined; });
  dom.window.eval(oldScript);
  const r = { old: !!dom.window.__RW_OLD, body: dom.window.document.body.innerHTML };
  dom.window.close(); return r;
}

test('old browsers (no Promise/fetch) get a plain notice and a link to the light page; modern ones see nothing', () => {
  const modern = new JSDOM('<html><head></head><body></body></html>', { runScripts: 'outside-only' });
  modern.window.fetch = function () {};
  modern.window.eval(oldScript);
  assert.equal(!!modern.window.__RW_OLD, false);
  assert.equal(modern.window.document.body.innerHTML, '');
  modern.window.close();
  const old = oldBrowserOutput(['fetch']);
  assert.equal(old.old, true);
  assert.match(old.body, /Please update your browser/);
  assert.match(old.body, /href="\/lite\/"/);
});

test('the old-browser check is ES5-only (it must itself run in Internet Explorer)', () => {
  assert.doesNotMatch(oldScript, /=>|\blet\b|\bconst\b|`|\?\./);
});

let esbuild = null; try { esbuild = require('esbuild'); } catch (e) { /* installed in the deploy workflow only */ }
test('dist build: minifies scripts, keeps top-level names, skips vendor/ and sw.js, copies everything else', { skip: !esbuild && 'esbuild not installed' }, () => {
  const { buildDist } = require('../tools/build-dist.cjs');
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-src-')), out = path.join(os.tmpdir(), 'rw-out-' + process.pid);
  fs.mkdirSync(path.join(src, 'js'), { recursive: true }); fs.mkdirSync(path.join(src, 'vendor'), { recursive: true });
  fs.writeFileSync(path.join(src, 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(src, 'js/a.js'), '/* comment */\nfunction openThing(name){\n  var longLocalName = name + 1;\n  return longLocalName;\n}\nvar topLevelState = { a: 1 };\nwindow.x = openThing?.(1);\n');
  fs.writeFileSync(path.join(src, 'js/bad.js'), 'export const y = 1;\n');
  fs.writeFileSync(path.join(src, 'vendor/v.js'), '/* keep */ var   v = 1 ;\n');
  fs.writeFileSync(path.join(src, 'sw.js'), '/* keep */ var   s = 1 ;\n');
  const s = buildDist({ src, out });
  const a = fs.readFileSync(path.join(out, 'js/a.js'), 'utf8');
  assert.ok(a.length < fs.readFileSync(path.join(src, 'js/a.js'), 'utf8').length);
  assert.match(a, /function openThing\(/);
  assert.match(a, /topLevelState/);
  assert.doesNotMatch(a, /longLocalName/);
  assert.match(a, /\?\./, 'modern syntax is not lowered (lowering leaks helper globals)');
  assert.equal(fs.readFileSync(path.join(out, 'js/bad.js'), 'utf8'), 'export const y = 1;\n');
  assert.equal(fs.readFileSync(path.join(out, 'vendor/v.js'), 'utf8'), '/* keep */ var   v = 1 ;\n');
  assert.equal(fs.readFileSync(path.join(out, 'sw.js'), 'utf8'), '/* keep */ var   s = 1 ;\n');
  assert.ok(fs.existsSync(path.join(out, 'index.html')));
  assert.equal(s.minified, 1);
  fs.rmSync(src, { recursive: true, force: true }); fs.rmSync(out, { recursive: true, force: true });
});

test('the Pages workflow publishes the optimised copy and checks it before upload', () => {
  const wf = fs.readFileSync(path.join(root, '.github/workflows/static.yml'), 'utf8');
  assert.match(wf, /node tools\/build-dist\.cjs _site/);
  assert.match(wf, /path: '_site'/);
  assert.ok(wf.indexOf('build-dist.cjs') < wf.indexOf('upload-pages-artifact'));
});
