'use strict';
/* A specific route placed after a broader prefix route is never reached.
   POST /stay/lead sat below the stay/ prefix for a month and every stay
   request was answered "not found". */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'worker/worker.js'), 'utf8');

test('stay/lead is routed before the stay/ prefix', () => {
  const lead = src.indexOf("path === 'stay/lead'");
  const prefix = src.indexOf("path.indexOf('stay/') === 0");
  assert.ok(lead > -1 && prefix > -1);
  assert.ok(lead < prefix, 'stay/lead must come first');
});

test('no exact route sits below a prefix route that swallows it', () => {
  const lines = src.split('\n');
  const prefixes = [];
  lines.forEach((l, i) => {
    let m = /if\(path\.indexOf\('([^']+)'\) === 0\) return/.exec(l) || /if\(path\.startsWith\('([^']+)'\)\) return/.exec(l);
    if (m) prefixes.push({ p: m[1], i });
  });
  assert.ok(prefixes.length >= 3);
  const bad = [];
  lines.forEach((l, i) => {
    const re = /path === '([^']+)'/g; let m;
    while ((m = re.exec(l))) prefixes.forEach((x) => { if (x.i < i && m[1].indexOf(x.p) === 0) bad.push(m[1] + ' (line ' + (i + 1) + ') is below prefix ' + x.p); });
  });
  assert.deepEqual(bad, []);
});

test('events/refresh is closed when no token is configured', () => {
  const ev = fs.readFileSync(path.join(__dirname, '..', 'worker/handlers/events.js'), 'utf8');
  assert.match(ev, /if\(!env\.REFRESH_TOKEN \|\| url\.searchParams\.get\('token'\) !== env\.REFRESH_TOKEN\)/);
});
