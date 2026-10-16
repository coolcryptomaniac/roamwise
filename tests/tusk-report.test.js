'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = () => import(path.join(root, 'worker/handlers/tusk-report.js'));

function fakeKV(){
  const m = new Map();
  return {
    m,
    put: async (k, v, o) => { m.set(k, { v, metadata: o && o.metadata }); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).metadata })), list_complete: true })
  };
}
/* in-memory stand-in for the Cache API used by the rate limiter */
function fakeCache(){
  const m = new Map();
  return { match: async r => (m.has(r.url) ? new Response(m.get(r.url)) : undefined), put: async (r, res) => { m.set(r.url, await res.text()); } };
}
const post = (body, headers) => new Request('https://w.test/tusk/report', { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '1.2.3.4', ...(headers || {}) }, body: JSON.stringify(body) });

test('a report stores the question only, with emails and long numbers removed', async () => {
  const h = await load();
  const kv = fakeKV();
  const res = await h.handleTuskReport(post({ q: 'Plan DGTL trip, mail me at a.b@x.com or 9876543210, thanks', kind: 'picks', dest: 'Mumbai' }), { AI_USAGE: kv }, fakeCache());
  assert.equal(res.status, 200);
  const [{ metadata }] = [...kv.m.values()];
  assert.equal(metadata.kind, 'picks');
  assert.equal(metadata.dest, 'Mumbai');
  assert.ok(!/@|9876543210/.test(metadata.q), metadata.q);
  assert.ok(/\[email\]/.test(metadata.q) && /\[number\]/.test(metadata.q));
  assert.deepEqual(Object.keys(metadata).sort(), ['dest', 'kind', 'q', 't']);
});

test('bad or empty reports are refused and an unknown kind becomes text', async () => {
  const h = await load();
  const kv = fakeKV();
  assert.equal((await h.handleTuskReport(post({ q: 'a' }), { AI_USAGE: kv }, fakeCache())).status, 400);
  assert.equal((await h.handleTuskReport(new Request('https://w.test/tusk/report', { method: 'POST', body: 'nope' }), { AI_USAGE: kv }, fakeCache())).status, 400);
  await h.handleTuskReport(post({ q: 'hello world', kind: '<script>' }), { AI_USAGE: kv }, fakeCache());
  assert.equal([...kv.m.values()][0].metadata.kind, 'text');
  assert.equal((await h.handleTuskReport(post({ q: 'hello there' }), {}, fakeCache())).status, 503);
});

test('one address can send only 10 reports per 10 minutes', async () => {
  const h = await load();
  const kv = fakeKV(), cache = fakeCache();
  let last;
  for(let i = 0; i < 11; i++) last = await h.handleTuskReport(post({ q: 'wrong answer number ' + i }), { AI_USAGE: kv }, cache);
  assert.equal(last.status, 429);
  assert.equal(kv.m.size, 10);
});

test('reading reports needs the bot token', async () => {
  const h = await load();
  const kv = fakeKV();
  await h.handleTuskReport(post({ q: 'a wrong answer about Goa', kind: 'card' }), { AI_USAGE: kv }, fakeCache());
  const env = { AI_USAGE: kv, TUSK_REPORT_TOKEN: 's3cret-token' };
  const get = t => new Request('https://w.test/tusk/reports', { headers: t ? { authorization: 'Bearer ' + t } : {} });
  assert.equal((await h.handleTuskReports(get(null), env)).status, 401);
  assert.equal((await h.handleTuskReports(get('wrong'), env)).status, 401);
  assert.equal((await h.handleTuskReports(get('s3cret-token'), { AI_USAGE: kv })).status, 503, 'no token configured: closed');
  const ok = await h.handleTuskReports(get('s3cret-token'), env);
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.equal(body.count, 1);
  assert.equal(body.reports[0].q, 'a wrong answer about Goa');
});
