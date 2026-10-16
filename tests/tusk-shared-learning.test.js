'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const load = () => import(path.join(root, 'worker/handlers/tusk-learned.js'));

function fakeKV(){
  const m = new Map();
  return { m, get: async k => (m.has(k) ? JSON.parse(m.get(k)) : null), put: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); } };
}
function fakeCache(){
  const m = new Map();
  return { match: async r => (m.has(r.url) ? new Response(m.get(r.url)) : undefined), put: async (r, res) => { m.set(r.url, await res.text()); } };
}
const GOOD = 'Kasar Devi is best between March and June and again October to November, when skies are clear and the Himalayan view is sharp.';
const post = (p, body, ip) => new Request('https://w.test/' + p, { method: 'POST', headers: { 'CF-Connecting-IP': ip || '1.1.1.1' }, body: JSON.stringify(body) });

test('worker: stores plain text once (first writer wins) and serves it back', async () => {
  const h = await load(), kv = fakeKV(), c = fakeCache(), env = { AI_USAGE: kv };
  const r = await h.handleTuskLearnedPost(post('tusk/learned', { k: 'abc123', text: '<b>' + GOOD + '</b><script>x</script>' }), env, c);
  assert.deepEqual(await r.json(), { ok: true, stored: true });
  const rec = JSON.parse([...kv.m.values()][0]);
  assert.equal(rec.v, 1);
  assert.ok(!/[<>]/.test(rec.text), 'no HTML is ever stored');
  const again = await h.handleTuskLearnedPost(post('tusk/learned', { k: 'abc123', text: GOOD.replace('March', 'May') + ' more words here' }), env, c);
  assert.equal((await again.json()).stored, false, 'no overwrite');
  const got = await (await h.handleTuskLearnedGet(new Request('https://w.test/tusk/learned?k=abc123'), env, c)).json();
  assert.equal(got.hit, true);
  assert.match(got.text, /Kasar Devi is best/);
});

test('worker: refuses links, emails, phone numbers, short text, bad keys, and caps writes per IP', async () => {
  const h = await load(), kv = fakeKV(), c = fakeCache(), env = { AI_USAGE: kv };
  for(const bad of [GOOD + ' see https://evil.example', GOOD + ' mail a@b.co', GOOD + ' call 98765 43210', 'too short']){
    assert.equal((await h.handleTuskLearnedPost(post('tusk/learned', { k: 'abc123', text: bad }), env, c)).status, 400, bad);
  }
  assert.equal((await h.handleTuskLearnedPost(post('tusk/learned', { k: '../etc', text: GOOD }), env, c)).status, 400);
  assert.equal(kv.m.size, 0);
  let last;
  for(let i = 0; i < 8; i++) last = await h.handleTuskLearnedPost(post('tusk/learned', { k: 'a' + i + 'zzz', text: GOOD }, '9.9.9.9'), env, c);
  assert.equal(last.status, 429);
  assert.ok(kv.m.size <= 6);
});

test('worker: a thumbs-down drop deletes the shared answer; missing storage never breaks chat', async () => {
  const h = await load(), kv = fakeKV(), c = fakeCache(), env = { AI_USAGE: kv };
  await h.handleTuskLearnedPost(post('tusk/learned', { k: 'abc123', text: GOOD }), env, c);
  await h.handleTuskLearnedDrop(post('tusk/learned/drop', { k: 'abc123' }), env, c);
  assert.equal(kv.m.size, 0);
  const none = await h.handleTuskLearnedGet(new Request('https://w.test/tusk/learned?k=abc123'), {}, c);
  assert.deepEqual(await none.json(), { hit: false });
});

function clientSandbox(extra){
  const calls = [];
  const store = new Map();
  const s = Object.assign({ console, calls, setTimeout, clearTimeout, localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
    navigator: { onLine: true }, rwApi: p => 'https://w.test/' + p,
    fetch: (u, o) => { calls.push({ u, o }); return Promise.resolve({ ok: true, json: async () => ({ hit: false }) }); } }, extra || {});
  s.window = s;
  vm.runInNewContext(read('js/copilot/shared-learning.js'), s, { filename: 'shared-learning.js' });
  return s;
}

test('client: only generic questions with generic answers are contributed, as a hash plus plain text', () => {
  const s = clientSandbox();
  s.rwSharedContribute('abc123', 'best time to visit Kasar Devi', '<b>' + GOOD + '</b>');
  assert.equal(s.calls.length, 1);
  const body = JSON.parse(s.calls[0].o.body);
  assert.deepEqual(Object.keys(body).sort(), ['k', 'text']);
  assert.ok(!/[<>]/.test(body.text));
  s.rwSharedContribute('abc123', 'best time to visit Kasar Devi', GOOD);
  assert.equal(s.calls.length, 1, 'same key is sent once');
  s.rwSharedContribute('def456', 'plan my trip to Kasar Devi', GOOD);
  s.rwSharedContribute('ghi789', 'best time for Kasar Devi, mail a@b.co', GOOD);
  s.rwSharedContribute('jkl012', 'best time to visit Kasar Devi', GOOD + ' call 98765 43210');
  assert.equal(s.calls.length, 1, 'first-person, email and phone content is never shared');
});

test('client: memory-personalised answers and the off switch stop sharing', () => {
  const s = clientSandbox({ rwUmGet: () => ({ home: 'Almora' }) });
  s.rwSharedContribute('abc123', 'best time to visit Kasar Devi', GOOD + ' You are close to Almora so it is an easy trip.');
  assert.equal(s.calls.length, 0);
  assert.match(s.rwShCommand('stop sharing learnings'), /stop sharing/);
  assert.equal(s.rwShOn(), false);
  s.rwSharedContribute('zzz999', 'best time to visit Kasar Devi', GOOD);
  assert.equal(s.calls.length, 0);
  assert.match(s.rwShCommand('share learnings'), /back on/);
  assert.equal(s.rwShOn(), true);
});

test('client: a shared hit is shown escaped; a miss runs the normal AI path', async () => {
  let shown = '';
  const hit = clientSandbox({
    rwAnsRelevant: () => true, rwAnsPut: () => {}, escHtml: x => String(x).replace(/</g, '&lt;'),
    cpFinish: (b, html) => { shown = html; },
    fetch: () => Promise.resolve({ ok: true, json: async () => ({ hit: true, text: GOOD + ' <img src=x onerror=alert(1)>' }) })
  });
  const r = await hit.rwSharedFirst('abc123', {}, {}, 'best time to visit Kasar Devi', () => Promise.resolve('NEXT'));
  assert.equal(r._shared, true);
  assert.ok(!/<img/.test(shown), 'no raw HTML from the network');
  const miss = clientSandbox();
  assert.equal(await miss.rwSharedFirst('abc123', {}, {}, 'best time to visit Kasar Devi', () => Promise.resolve('NEXT')), 'NEXT');
  const first = clientSandbox();
  assert.equal(await first.rwSharedFirst('abc123', {}, {}, 'plan my trip', () => Promise.resolve('NEXT')), 'NEXT');
  assert.equal(first.calls.length, 0, 'first-person questions never touch the network');
});

test('typing effect: instant for fast mode, reduced motion, bookings, saved answers and slow phones', () => {
  const s = { console, window: null, localStorage: { getItem: () => null, setItem() {} } }; s.window = s;
  vm.runInNewContext(read('js/copilot/typing-fx.js'), s, { filename: 'typing-fx.js' });
  const ok = { reduced: false, hidden: false, lowEnd: false };
  assert.equal(s.rwFxDecide('auto', ok, {}, 'best time for goa', '<div>x</div>'), true);
  assert.equal(s.rwFxDecide('fast', ok, {}, 'best time for goa', ''), false);
  assert.equal(s.rwFxDecide('fun', { ...ok, reduced: true }, {}, 'x', ''), false, 'reduced motion beats Fun mode');
  assert.equal(s.rwFxDecide('auto', { ...ok, lowEnd: true }, {}, 'x', ''), false);
  assert.equal(s.rwFxDecide('fun', { ...ok, lowEnd: true }, {}, 'x', ''), true);
  assert.equal(s.rwFxDecide('auto', ok, { _stayDesk: true }, 'x', ''), false);
  assert.equal(s.rwFxDecide('auto', ok, {}, 'book a room in Almora', ''), false);
  assert.equal(s.rwFxDecide('auto', ok, {}, 'best time', 'Saved answer'), false);
  assert.match(s.rwFxCommand('fast mode'), /Fast mode on/);
  assert.match(s.rwFxCommand('fun mode'), /Fun mode on/);
  assert.equal(s.rwFxCommand('plan 3 days in goa'), null);
});
