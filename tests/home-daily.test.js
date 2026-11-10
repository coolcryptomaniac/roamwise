'use strict';
/* Daily home feed: selection rules (worker/lib/home-daily-core.js), the handler and the page wiring. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const core = () => import(path.join(root, 'worker/lib/home-daily-core.js'));
const handler = () => import(path.join(root, 'worker/handlers/home-daily.js'));
const PROMO = JSON.parse(read('data/home-promo.json')), COND = JSON.parse(read('data/conditions.json'));
function kv(){ const m = new Map(); return { m, get: async (k, t) => (m.has(k) ? (t === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null), put: async (k, v) => { m.set(k, v); } }; }
const site = async (url) => new Response(JSON.stringify(/home-promo/.test(url) ? PROMO : COND), { status: 200 });

test('India date rolls over at 18:30 UTC', async () => {
  const c = await core();
  assert.equal(c.indiaDate(new Date('2026-11-10T18:29:00Z')), '2026-11-10');
  assert.equal(c.indiaDate(new Date('2026-11-10T18:30:00Z')), '2026-11-11');
});

test('rotation keeps every stay, changes the leader daily and gives each a turn', async () => {
  const c = await core(), ids = ['a_1', 'b_2', 'c_3'];
  const leaders = new Set();
  for (let d = 10; d < 13; d++) { const r = c.rotate(ids, '2026-11-' + d); assert.deepEqual([...r].sort(), ids); leaders.add(r[0]); }
  assert.equal(leaders.size, 3);
  assert.notEqual(c.rotate(ids, '2026-11-10')[0], c.rotate(ids, '2026-11-11')[0]);
  assert.deepEqual(c.rotate(ids, 'nonsense'), ids); assert.deepEqual(c.rotate([], '2026-11-10'), []);
});

test('the snapshot keeps only real curated ids and sourced advisories from the live site files', async () => {
  const c = await core(), s = c.snapshot(PROMO, COND, '2026-11-10T05:30:00Z');
  assert.deepEqual(s.stays, PROMO.stays.map(x => x.partnerId));
  assert.equal(s.advisories.length, COND.advisories.length);
  assert.ok(JSON.stringify(s).length < 20000, 'small enough for one KV value');
  const dirty = c.snapshot({ stays: [{ partnerId: '<script>' }, { partnerId: 'p_ok' }, { partnerId: 'p_ok' }, null] }, { checked: 'x', advisories: [{ id: 'a', title: 'T', from: 'soon' }, { id: 'b', title: '<b>Road</b> shut', from: '2026-11-01', sourceUrl: 'javascript:alert(1)' }] });
  assert.deepEqual(dirty.stays, ['p_ok']);
  assert.equal(dirty.advisories.length, 1); assert.equal(dirty.advisories[0].sourceUrl, ''); assert.ok(!/[<>]/.test(dirty.advisories[0].title));
});

test('only advisories in force today are shown, official first, and never from stale data', async () => {
  const c = await core();
  const adv = [
    { id: 'old', title: 'Ended', from: '2026-10-01', until: '2026-10-20', official: true },
    { id: 'future', title: 'Not yet', from: '2026-12-01', until: '2026-12-05', official: true },
    { id: 'rumour', title: 'Unofficial', from: '2026-11-05', until: '2026-11-12', official: false },
    { id: 'close', title: 'Temple closes', from: '2026-10-20', until: '2026-11-16', official: true },
    { id: 'open-ended-old', title: 'No end date', from: '2026-10-01', until: '', official: true },
  ];
  const act = c.activeAdvisories(adv, '2026-11-10');
  assert.deepEqual(act.map(a => a.id), ['close', 'rumour']);
  assert.equal(act[0].daysLeft, 6);
  const snap = { stays: ['a_1', 'b_2'], advisories: adv, checked: '2026-11-09' };
  assert.equal(c.buildFeed(snap, '2026-11-10').advisories.length, 2);
  assert.equal(c.buildFeed({ ...snap, checked: '2026-11-01' }, '2026-11-10').advisories.length, 0, 'advisory data older than 4 days is not shown as today');
  assert.equal(c.buildFeed({ ...snap, checked: '2026-11-01' }, '2026-11-10').stayOrder.length, 2, 'stays still rotate');
  assert.deepEqual(c.buildFeed(null, '2026-11-10').stayOrder, []);
});

test('the cron writes KV once; the GET never writes and serves today by India date', async () => {
  const h = await handler(), store = kv(), env = { RW_KV: store };
  const out = await h.refreshHomeDaily(env, site);
  assert.equal(out.stays, PROMO.stays.length); assert.equal(store.m.size, 1);
  globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
  const before = store.m.get('home-daily-src');
  const res = await h.handleHomeDaily(new Request('https://w.test/home/daily'), env, null, async () => { throw new Error('GET must use KV, not the network'); }, () => new Date('2026-11-10T19:00:00Z'));
  const feed = await res.json();
  assert.equal(feed.date, '2026-11-11'); assert.equal(feed.v, 1);
  assert.deepEqual([...feed.stayOrder].sort(), PROMO.stays.map(x => x.partnerId).sort());
  assert.match(res.headers.get('Cache-Control'), /max-age=900/);
  assert.equal(store.m.get('home-daily-src'), before);
});

test('a failed site fetch keeps the previous snapshot; an empty Worker still answers', async () => {
  const h = await handler(), store = kv();
  await h.refreshHomeDaily({ RW_KV: store }, site);
  const kept = store.m.get('home-daily-src');
  assert.ok((await h.refreshHomeDaily({ RW_KV: store }, async () => new Response('down', { status: 503 }))).error);
  assert.equal(store.m.get('home-daily-src'), kept);
  assert.ok((await h.refreshHomeDaily({}, site)).skipped);
  globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
  const cold = await (await h.handleHomeDaily(new Request('https://w.test/home/daily'), {}, null, site, () => new Date('2026-11-10T06:00:00Z'))).json();
  assert.equal(cold.stayOrder.length, PROMO.stays.length, 'first deploy: reads the site once, no KV needed');
  const dead = await (await h.handleHomeDaily(new Request('https://w.test/home/daily'), {}, null, async () => { throw new Error('offline'); }, () => new Date('2026-11-10T06:00:00Z'))).json();
  assert.deepEqual(dead.stayOrder, []); assert.equal(dead.source, 'none');
  assert.equal((await h.handleHomeDaily(new Request('https://w.test/home/daily', { method: 'POST' }), {}, null, site)).status, 404);
});

test('wiring: cron refreshes it, the route is public and unthrottled, the page loads the reader before the promo', async () => {
  const worker = read('worker/worker.js');
  assert.ok(worker.includes('await refreshHomeDaily(env)') && worker.includes("path === 'home/daily'"));
  const rl = await import(path.join(root, 'worker/lib/rate-limit.js'));
  assert.equal(await rl.abuseGuard(new Request('https://w.test/home/daily'), 'home/daily', { match: async () => { throw new Error('must not count'); }, put: async () => {} }), null);
  assert.equal(rl.routeKey('b2b/mou-signed', 'POST'), 'b2b-mou');
  const html = read('index.html');
  assert.ok(html.includes('/js/ui/home-daily.js') && html.indexOf('/js/ui/home-daily.js') < html.indexOf('/js/ui/home-promo.js'));
  const promo = read('js/ui/home-promo.js');
  assert.ok(promo.includes('__rwDaily') && promo.includes('daily(cfg.stays'));
  const daily = read('js/ui/home-daily.js');
  assert.ok(!/innerHTML/.test(daily), 'the strip is built with textContent only');
  assert.ok(fs.existsSync(path.join(root, 'uttarakhand-road-status/index.html')));
});
