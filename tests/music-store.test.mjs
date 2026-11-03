import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createMusicHandlers, musicMethods } from '../worker/handlers/music-order.js';
import { MUSIC_CATALOGUE } from '../worker/lib/music-catalogue.js';
import { LICENCE_TIERS, ORDER_ID_RE, priceItem, validateBuyer, signDownload, verifyDownload, newOrderId, upiIntent, safeFileName } from '../worker/lib/music-core.js';

const SECRET = 'm'.repeat(40);
const TRACK = MUSIC_CATALOGUE.releases[0];
const NOW_MS = new Date('2026-11-03T10:00:00Z').getTime();
const NOW = Math.floor(NOW_MS / 1000);

test('catalogue stays in sync with music/releases.json and prices are within Rs 10-20', () => {
  const rel = JSON.parse(readFileSync(new URL('../music/releases.json', import.meta.url), 'utf8')).releases;
  assert.deepEqual(MUSIC_CATALOGUE.releases.map((r) => r.id), rel.map((r) => r.id));
  assert.deepEqual(MUSIC_CATALOGUE.releases.map((r) => r.title), rel.map((r) => r.title));
  for (const r of MUSIC_CATALOGUE.releases) { const p = r.pricePaise || MUSIC_CATALOGUE.downloadPaise; assert.ok(p >= 1000 && p <= 2000, r.id); }
  const prices = Object.values(LICENCE_TIERS).map((t) => t.pricePaise);
  assert.deepEqual(prices, [100000, 500000, 2500000, 10000000]); // Rs 1,000 / 5,000 / 25,000 / 1,00,000
});

test('pricing is server-side; unknown tracks, kinds and tiers are refused', () => {
  assert.equal(priceItem({ releaseId: TRACK.id, kind: 'download' }).totalPaise, 2000);
  assert.equal(priceItem({ releaseId: TRACK.id, kind: 'licence', tier: 'feature' }).totalPaise, 10000000);
  assert.equal(priceItem({ releaseId: 'nope', kind: 'download' }).error, 'unknown_track');
  assert.equal(priceItem({ releaseId: TRACK.id, kind: 'licence', tier: 'free' }).error, 'unknown_tier');
  assert.equal(priceItem({ releaseId: TRACK.id, kind: 'licence', tier: 'constructor' }).error, 'unknown_tier');
  assert.equal(priceItem({ releaseId: TRACK.id, kind: 'gift' }).error, 'unknown_kind');
});

test('buyer validation: email required, licences need licensee and project', () => {
  const ok = { name: 'Asha Rawat', phone: '+91 98765 43210', email: 'a@example.com' };
  assert.equal(validateBuyer(ok, 'download').value.phone, '9876543210');
  assert.equal(validateBuyer({ ...ok, email: '' }, 'download').error, 'invalid_email');
  assert.equal(validateBuyer(ok, 'licence').error, 'invalid_licensee');
  assert.equal(validateBuyer({ ...ok, licensee: 'Dev Films' }, 'licence').error, 'invalid_project');
  assert.equal(validateBuyer({ ...ok, licensee: 'Dev <b>Films', project: 'Pahad' }, 'licence').value.licensee, 'Dev b Films');
});

test('signed download links expire and cannot be tampered with', async () => {
  const sig = await signDownload(SECRET, 'RWM-ABCDEFGHJK', NOW + 900);
  assert.equal(await verifyDownload(SECRET, 'RWM-ABCDEFGHJK', NOW + 900, sig, NOW), true);
  assert.equal(await verifyDownload(SECRET, 'RWM-ABCDEFGHJK', NOW + 900, sig, NOW + 901), false);
  assert.equal(await verifyDownload(SECRET, 'RWM-ABCDEFGHJM', NOW + 900, sig, NOW), false);
  assert.equal(await verifyDownload(SECRET, 'RWM-ABCDEFGHJK', NOW + 9999, sig, NOW), false);
  assert.equal(await verifyDownload('short', 'RWM-ABCDEFGHJK', NOW + 900, sig, NOW), false);
  assert.match(newOrderId(new Uint8Array(10).map((_, i) => i * 7)), ORDER_ID_RE);
  assert.equal(upiIntent('RWM-ABCDEFGHJK', 2000).amount, '20.00');
  assert.doesNotMatch(safeFileName('GHAAM (घाम) ONE LIGHT/../x'), /[/\\"]/);
});

/* ---- handler harness: in-memory Firestore, scripted Cashfree, fake R2 bucket ---- */
function harness({ cfg, env: envX, files = [TRACK.id], cashfree = {} } = {}) {
  const docs = new Map();
  if (cfg !== null) docs.set('config/music', cfg || { enabled: true, environment: 'sandbox', cashfreeEnabled: true, upiEnabled: true });
  const objects = new Map(files.map((id) => [`tracks/${id}.mp3`, 'MP3DATA']));
  const bucket = {
    list: async () => ({ objects: [...objects.keys()].map((key) => ({ key })), truncated: false }),
    head: async (k) => (objects.has(k) ? { key: k } : null),
    get: async (k) => (objects.has(k) ? { body: objects.get(k) } : null),
  };
  const env = { CASHFREE_APP_ID: 'app', CASHFREE_SECRET_KEY: 'x'.repeat(32), CASHFREE_ENV: 'sandbox', FIREBASE_SERVICE_ACCOUNT_JSON: '{}', MUSIC_LINK_SECRET: SECRET, RW_BUCKET: bucket, ...envX };
  let seq = 0; let clock = NOW_MS;
  const h = createMusicHandlers({
    context: async () => ({ accessToken: 't', projectId: 'roamwisepro' }),
    getDoc: async (_e, _t, _p, path) => docs.get(path) ?? null,
    createDocIfAbsent: async (_e, _t, _p, col, id, v) => { const k = `${col}/${id}`; if (docs.has(k)) return false; docs.set(k, v); return true; },
    updateDoc: async (_e, _t, _p, path, v) => { docs.set(path, { ...docs.get(path), ...v }); },
    fetchImpl: async (url, opts = {}) => {
      if (opts.method === 'POST') return { ok: true, status: 200, json: async () => ({ payment_session_id: 'sess', order_id: JSON.parse(opts.body).order_id }) };
      const id = decodeURIComponent(url.split('/pg/orders/')[1]); const o = [...docs.values()].find((d) => d.orderId === id);
      return { ok: true, status: 200, json: async () => ({ order_id: id, order_amount: cashfree.amount ?? o.totalPaise / 100, order_currency: 'INR', order_status: cashfree.status || 'PAID' }) };
    },
    now: () => new Date(clock),
    randomBytes: (n) => { seq += 1; return new Uint8Array(n).map((_, i) => (i * 11 + seq * 17 + 3) % 251); },
  });
  return { h, docs, env, objects, advance: (s) => { clock += s * 1000; } };
}
const req = (body, headers = {}, method = 'POST', url = 'https://w.test/x') => new Request(url, { method, headers: { 'content-type': 'application/json', ...headers }, body: body == null ? undefined : JSON.stringify(body) });
const buyer = { name: 'Asha Rawat', phone: '9876543210', email: 'a@example.com', licensee: 'Dev Films LLP', project: 'Pahad Ki Raat' };
const dlOrder = (method = 'cashfree', extra = {}) => ({ method, item: { releaseId: TRACK.id, kind: 'download' }, buyer, ...extra });
const licOrder = (tier, method = 'cashfree') => ({ method, item: { releaseId: TRACK.id, kind: 'licence', tier }, buyer });
const statusOf = (s, id, token) => s.h.handleMusicStatus(req(null, { authorization: 'Bearer ' + token }, 'GET'), s.env, id);

test('store is closed unless config/music is enabled AND the link secret and bucket exist', async () => {
  for (const [label, o] of [['no config', { cfg: null }], ['disabled', { cfg: { enabled: false } }], ['no secret', { env: { MUSIC_LINK_SECRET: '' } }], ['no bucket', { env: { RW_BUCKET: undefined } }]]) {
    const s = harness(o);
    assert.equal((await s.h.handleMusicOrder(req(dlOrder()), s.env)).status, 503, label);
    assert.equal((await (await s.h.handleMusicCatalogue(req(null, {}, 'GET'), s.env)).json()).checkoutOpen, false, label);
  }
  assert.deepEqual(musicMethods({ enabled: true, environment: 'live', cashfreeEnabled: true, upiEnabled: true }, { CASHFREE_ENV: 'sandbox', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 'b', MUSIC_LINK_SECRET: SECRET, RW_BUCKET: {} }), { enabled: true, cashfree: false, upi: true });
});

test('catalogue lists every track, marks which have audio, and exposes prices and terms', async () => {
  const s = harness();
  const c = await (await s.h.handleMusicCatalogue(req(null, {}, 'GET'), s.env)).json();
  assert.equal(c.checkoutOpen, true);
  assert.equal(c.releases.length, MUSIC_CATALOGUE.releases.length);
  assert.equal(c.releases.filter((r) => r.available).length, 1);
  assert.deepEqual(c.tiers.map((t) => t.pricePaise), [100000, 500000, 2500000, 10000000]);
  assert.ok(c.terms.length >= 5 && c.downloadUse);
  assert.doesNotMatch(JSON.stringify(c), /tracks\/|MUSIC_LINK|secret/i);
});

test('paid download: server price, token-protected status, signed link, streamed file, counted and capped', async () => {
  const s = harness();
  const o = await (await s.h.handleMusicOrder(req({ ...dlOrder(), price: 1, totalPaise: 1 }), s.env)).json();
  assert.equal(o.totalPaise, 2000);
  assert.equal(s.docs.get('musicOrders/' + o.orderId).totalPaise, 2000);
  assert.notEqual(s.docs.get('musicOrders/' + o.orderId).tokenHash, o.token);
  assert.equal((await statusOf(s, o.orderId, 'wrong')).status, 404);
  const st = await (await statusOf(s, o.orderId, o.token)).json();
  assert.equal(st.status, 'paid');
  assert.ok(!st.certificate);
  const u = new URL(st.download.url);
  const get = (url) => s.h.handleMusicDownload(req(null, {}, 'GET', url), s.env, o.orderId);
  const res = await get(st.download.url);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-disposition'), /attachment; filename=".*\.mp3"/);
  assert.equal(res.headers.get('content-type'), 'audio/mpeg');
  assert.equal(s.docs.get('musicOrders/' + o.orderId).downloadCount, 1);
  assert.equal((await get(u.origin + u.pathname + '?exp=' + u.searchParams.get('exp') + '&sig=' + '0'.repeat(64))).status, 403);
  s.docs.set('musicOrders/' + o.orderId, { ...s.docs.get('musicOrders/' + o.orderId), downloadCount: 10 });
  assert.equal((await get(st.download.url)).status, 429);
  s.advance(16 * 60);
  s.docs.set('musicOrders/' + o.orderId, { ...s.docs.get('musicOrders/' + o.orderId), downloadCount: 0 });
  assert.equal((await get(st.download.url)).status, 403); // expired
});

test('unpaid orders never download, even with a valid-looking link', async () => {
  const s = harness();
  const o = await (await s.h.handleMusicOrder(req(dlOrder('upi')), s.env)).json();
  assert.equal(o.status, 'awaiting_upi_payment');
  const st = await (await statusOf(s, o.orderId, o.token)).json();
  assert.equal(st.status, 'awaiting_upi_payment');
  assert.ok(!st.download);
  const exp = NOW + 900; const sig = await signDownload(SECRET, o.orderId, exp);
  assert.equal((await s.h.handleMusicDownload(req(null, {}, 'GET', `https://w.test/d?exp=${exp}&sig=${sig}`), s.env, o.orderId)).status, 404);
  s.docs.set('musicOrders/' + o.orderId, { ...s.docs.get('musicOrders/' + o.orderId), status: 'paid' }); // manual bank reconciliation
  assert.ok((await (await statusOf(s, o.orderId, o.token)).json()).download);
});

test('payment integrity: wrong amount or unpaid at Cashfree never unlocks anything', async () => {
  for (const cashfree of [{ amount: 1 }, { status: 'ACTIVE' }]) {
    const s = harness({ cashfree });
    const o = await (await s.h.handleMusicOrder(req(dlOrder()), s.env)).json();
    const r = await statusOf(s, o.orderId, o.token);
    const b = await r.json();
    assert.notEqual(b.status, 'paid');
    assert.ok(!b.download);
    assert.notEqual(s.docs.get('musicOrders/' + o.orderId).status, 'paid');
  }
});

test('licence: certificate on payment, public check shows no contact details', async () => {
  const s = harness();
  const o = await (await s.h.handleMusicOrder(req(licOrder('indie')), s.env)).json();
  assert.equal(o.totalPaise, 500000);
  const st = await (await statusOf(s, o.orderId, o.token)).json();
  assert.equal(st.certificate.licenceNo, o.orderId);
  assert.equal(st.certificate.licensee, 'Dev Films LLP');
  assert.equal(st.certificate.project, 'Pahad Ki Raat');
  assert.match(st.certificate.credit, /Mohit Pandey/);
  const pub = await (await s.h.handleMusicLicence(req(null, {}, 'GET'), s.env, o.orderId)).json();
  assert.equal(pub.valid, true);
  assert.equal(pub.licensee, 'Dev Films LLP');
  assert.doesNotMatch(JSON.stringify(pub), /9876543210|a@example|Pahad Ki Raat/);
  const dl = await (await s.h.handleMusicOrder(req(dlOrder()), s.env)).json();
  await statusOf(s, dl.orderId, dl.token);
  assert.equal((await s.h.handleMusicLicence(req(null, {}, 'GET'), s.env, dl.orderId)).status, 404); // a download is not a licence
});

test('an unpaid licence is not valid; licence orders need licensee and project', async () => {
  const s = harness({ cashfree: { status: 'ACTIVE' } });
  const o = await (await s.h.handleMusicOrder(req(licOrder('feature')), s.env)).json();
  assert.equal(o.totalPaise, 10000000);
  assert.equal((await s.h.handleMusicLicence(req(null, {}, 'GET'), s.env, o.orderId)).status, 404);
  const bad = await s.h.handleMusicOrder(req(licOrder('indie', 'cashfree') && { ...licOrder('indie'), buyer: { ...buyer, project: '' } }), s.env);
  assert.equal(bad.status, 422);
});

test('direct UPI is capped at Rs 25,000; tracks without audio and unknown input are refused', async () => {
  const s = harness();
  assert.equal((await s.h.handleMusicOrder(req(licOrder('commercial', 'upi')), s.env)).status, 200); // exactly Rs 25,000
  const big = await s.h.handleMusicOrder(req(licOrder('feature', 'upi')), s.env);
  assert.equal(big.status, 422); assert.equal((await big.json()).error, 'upi_limit');
  const other = MUSIC_CATALOGUE.releases[1].id;
  const nr = await s.h.handleMusicOrder(req({ ...dlOrder(), item: { releaseId: other, kind: 'download' } }), s.env);
  assert.equal(nr.status, 409); assert.equal((await nr.json()).error, 'track_not_ready');
  assert.equal((await s.h.handleMusicOrder(req({ ...dlOrder(), method: 'card' }), s.env)).status, 409);
  assert.equal((await s.h.handleMusicOrder(req({ ...dlOrder(), item: { releaseId: 'x', kind: 'download' } }), s.env)).status, 422);
});

test('licence delivery prefers the WAV master when one is stored', async () => {
  const s = harness();
  s.objects.set(`tracks/${TRACK.id}.wav`, 'WAVDATA');
  const o = await (await s.h.handleMusicOrder(req(licOrder('creator')), s.env)).json();
  const st = await (await statusOf(s, o.orderId, o.token)).json();
  const res = await s.h.handleMusicDownload(req(null, {}, 'GET', st.download.url), s.env, o.orderId);
  assert.equal(res.headers.get('content-type'), 'audio/wav');
});

const sign = (env, bodyObj) => {
  const raw = JSON.stringify(bodyObj); const ts = String(NOW);
  return new Request('https://w.test/music/cashfree/webhook', { method: 'POST', headers: { 'x-webhook-timestamp': ts, 'x-webhook-signature': createHmac('sha256', env.CASHFREE_SECRET_KEY).update(ts + raw).digest('base64') }, body: raw });
};
test('webhook: signed success is re-verified and marks paid; forged or shop-style ids are ignored', async () => {
  const s = harness();
  const o = await (await s.h.handleMusicOrder(req(dlOrder()), s.env)).json();
  const ev = { type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: o.orderId } } };
  assert.equal((await s.h.handleMusicWebhook(new Request('https://w.test/w', { method: 'POST', headers: { 'x-webhook-timestamp': String(NOW), 'x-webhook-signature': 'bad' }, body: JSON.stringify(ev) }), s.env)).status, 401);
  assert.equal(s.docs.get('musicOrders/' + o.orderId).status, 'awaiting_payment');
  assert.equal((await s.h.handleMusicWebhook(sign(s.env, ev), s.env)).status, 200);
  assert.equal(s.docs.get('musicOrders/' + o.orderId).status, 'paid');
  assert.equal((await (await s.h.handleMusicWebhook(sign(s.env, ev), s.env)).json()).duplicate, true);
  const shopLike = await (await s.h.handleMusicWebhook(sign(s.env, { type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'RWS-ABCDEFGHJK' } } }), s.env)).json();
  assert.equal(shopLike.ignored, 'not_a_music_payment');
});
