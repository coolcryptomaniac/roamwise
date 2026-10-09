'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'agent/daily.js'), 'utf8');

// Exercise the real agent without network, Firebase credentials or disk writes.
async function report(overrides = {}) {
  const files = new Map();
  const logs = [];
  const context = {
    require: name => {
      assert.equal(name, 'fs');
      return { writeFileSync: (name, content) => files.set(name, content) };
    },
    process: { env: {} },
    console: { log: message => logs.push(message) },
    fetch: async url => {
      const route = new URL(url).pathname;
      const override = overrides[route];
      if (override instanceof Error) throw override;
      const rel = route === '/' ? 'index.html' : route.endsWith('/') ? route.slice(1) + 'index.html' : route.slice(1);
      return {
        status: override?.status ?? 200,
        text: async () => override?.body ?? fs.readFileSync(path.join(ROOT, rel), 'utf8'),
      };
    },
  };
  await vm.runInNewContext(source, context, { filename: 'agent/daily.js' });
  return { text: files.get('report.md'), down: files.has('DOWN'), log: logs.join('\n') };
}

test('current repository pages pass all five health checks', async () => {
  const result = await report();
  assert.equal((result.text.match(/\| ✅ 200 \|/g) || []).length, 5);
  assert.match(result.text, /Health: all green\./);
  assert.equal(result.down, false);
  assert.match(result.log, /✅ healthy/);
});

test('a wrong page served with HTTP 200 fails content checks and the summary', async () => {
  const result = await report({ '/guides/': { body: 'RoamWise homepage' }, '/blog/': { body: 'RoamWise homepage' } });
  assert.match(result.text, /\| \/guides\/ \| 🔴 200/);
  assert.match(result.text, /\| \/blog\/ \| 🔴 200/);
  assert.match(result.text, /Missing expected content: <h1>Travel guides you can audit<\/h1>/);
  assert.match(result.text, /HTTP 200; content check failed/);
  assert.match(result.text, /Health: checks failing: \/guides\/, \/blog\/\./);
  assert.doesNotMatch(result.text, /all green|THE SITE IS DOWN/);
  assert.equal(result.down, false);
  assert.doesNotMatch(result.log, /healthy/);
});

test('non-200 secondary page fails even with its expected heading', async () => {
  const result = await report({ '/blog/': { status: 503, body: '<h1>Travel planning notes</h1>' } });
  assert.match(result.text, /\/blog\/: HTTP 503/);
  assert.match(result.text, /Health: checks failing: \/blog\/\./);
  assert.equal(result.down, false);
});

test('a secondary request error is reported without claiming the homepage is down', async () => {
  const result = await report({ '/guides/': new Error('network unavailable') });
  assert.match(result.text, /\| \/guides\/ \| 🔴 ERR/);
  assert.match(result.text, /\/guides\/: Request failed/);
  assert.match(result.text, /Health: checks failing: \/guides\/\./);
  assert.equal(result.down, false);
});

test('homepage failure retains the workflow DOWN flag and outage summary', async () => {
  const result = await report({ '/': { status: 503 } });
  assert.equal(result.down, true);
  assert.match(result.text, /Health: SITE DOWN\./);
  assert.match(result.log, /🔴 DOWN/);
});
