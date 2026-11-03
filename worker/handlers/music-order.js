/* Music store: paid MP3 downloads (Rs 10-20) and film / video licences (Rs 1,000 to Rs 1,00,000).
 * SEPARATE from Pro, Bhakti, stay and shop payments: it never touches entitlements, users/{uid} or other orders.
 *
 * Trust model (same as the shop checkout)
 *  - The browser sends a track id, kind and tier. Prices come from lib/music-core.js and lib/music-catalogue.js.
 *  - Guest checkout: random order token; only its SHA-256 hash is stored.
 *  - `paid` happens ONLY after a Cashfree lookup matches order id, amount and INR (status poll or signed webhook).
 *    Direct UPI orders stay `awaiting_upi_payment` until a person reconciles the bank record and sets status `paid`.
 *  - Audio lives in private R2 (binding RW_BUCKET, keys tracks/<id>.mp3 and optional tracks/<id>.wav), never in the repo.
 *    A paid order gets a 15-minute signed link (MUSIC_LINK_SECRET), at most 10 downloads per order.
 *  - Everything is OFF unless config/music.enabled === true (admin-written, public-read, flags only). */
import { CORS, json } from '../lib/http.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { createDocIfAbsent, getDoc, updateDoc } from '../lib/firestore-rest.js';
import { verifyCashfreeWorkerWebhook } from '../lib/cashfree-booking-webhook-verify.js';
import { MUSIC_CATALOGUE } from '../lib/music-catalogue.js';
import {
  CREDIT_LINE, DOWNLOAD_USE, LICENCE_TERMS, LICENCE_TIERS, LINK_TTL_SEC, MAX_DOWNLOADS, ORDER_ID_RE, TERMS_VERSION, UPI_MAX_PAISE,
  hex, linkSecretOk, newOrderId, priceItem, safeFileName, sha256Hex, signDownload, timingSafeEqualHex, upiIntent, validateBuyer, verifyDownload,
} from '../lib/music-core.js';

const SANDBOX_BASE = 'https://sandbox.cashfree.com';
const LIVE_BASE = 'https://api.cashfree.com';
const isLive = (env) => String(env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'live';
const cfBase = (env) => (isLive(env) ? LIVE_BASE : SANDBOX_BASE);
const cfHeaders = (env, extra) => Object.assign({
  'content-type': 'application/json',
  'x-api-version': env.CASHFREE_API_VERSION || '2026-01-01',
  'x-client-id': env.CASHFREE_APP_ID,
  'x-client-secret': env.CASHFREE_SECRET_KEY,
}, extra || {});

const API_BASE = 'https://roamwise-api.founder-f53.workers.dev';
const DEFAULT_WEBHOOK_URL = API_BASE + '/music/cashfree/webhook';
const RETURN_BASE = 'https://www.roamwise.co.in/music/store/';

async function serviceContext(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) return { error: json({ error: 'not_configured', message: 'The music store is not configured yet.' }, 501) };
  try {
    const sa = parseServiceAccount(env);
    if (sa.project_id !== 'roamwisepro') throw new Error('wrong project');
    return { accessToken: await getServiceAccountAccessToken(env), projectId: sa.project_id };
  } catch (_) {
    return { error: json({ error: 'store_backend_unavailable', message: 'The store is temporarily unavailable. No payment was taken.' }, 503) };
  }
}

/* Methods that may be offered now, from config/music plus Worker secrets. Downloads also need the link secret and a bucket. */
export function musicMethods(cfg, env) {
  const on = !!cfg && cfg.enabled === true && linkSecretOk(env.MUSIC_LINK_SECRET) && !!env.RW_BUCKET;
  const envMatches = !!cfg && String(cfg.environment || 'sandbox').toLowerCase() === (isLive(env) ? 'live' : 'sandbox');
  return {
    enabled: on,
    cashfree: on && cfg.cashfreeEnabled === true && envMatches && !!env.CASHFREE_APP_ID && !!env.CASHFREE_SECRET_KEY,
    upi: on && cfg.upiEnabled === true,
  };
}

const readJson = async (request) => { try { return await request.json(); } catch (_) { return null; } };
const bearer = (request) => { const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || ''); return m ? m[1] : ''; };

export function createMusicHandlers(overrides) {
  const deps = Object.assign({
    catalogue: MUSIC_CATALOGUE, context: serviceContext, getDoc, createDocIfAbsent, updateDoc,
    fetchImpl: (...a) => fetch(...a),
    now: () => new Date(),
    randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
  }, overrides || {});

  async function loadMethods(env, ctx) {
    let cfg;
    try { cfg = await deps.getDoc(env, ctx.accessToken, ctx.projectId, 'config/music'); }
    catch (_) { return { error: json({ error: 'music_config_unavailable', message: 'The store is temporarily unavailable. No payment was taken.' }, 503) }; }
    const methods = musicMethods(cfg, env);
    if (!methods.enabled) return { error: json({ error: 'store_closed', message: 'The music store is not open yet.' }, 503) };
    return { cfg, methods };
  }

  /* Release ids that have an MP3 in private storage. */
  async function availableIds(env) {
    if (!env.RW_BUCKET) return new Set();
    try {
      const out = new Set(); let cursor;
      for (let i = 0; i < 5; i++) {
        const page = await env.RW_BUCKET.list({ prefix: 'tracks/', cursor });
        for (const o of page.objects || []) { const m = /^tracks\/([^/]+)\.mp3$/.exec(o.key); if (m) out.add(m[1]); }
        if (!page.truncated) break;
        cursor = page.cursor;
      }
      return out;
    } catch (_) { return new Set(); }
  }

  async function cfGetOrder(env, id) {
    const res = await deps.fetchImpl(`${cfBase(env)}/pg/orders/${encodeURIComponent(id)}`, { headers: cfHeaders(env) });
    return { res, data: await res.json().catch(() => ({})) };
  }

  async function verifyAndMarkPaid(env, ctx, id, order) {
    let got;
    try { got = await cfGetOrder(env, order.cashfreeOrderId); } catch (_) { return { state: 'unverified' }; }
    if (!got.res.ok) return { state: 'unverified' };
    const d = got.data;
    const amountMatches = Math.round(Number(d.order_amount) * 100) === order.totalPaise;
    if (d.order_id !== order.cashfreeOrderId || d.order_currency !== 'INR' || !amountMatches) {
      try { await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${id}`, { integrityFlag: true, updatedAt: deps.now().toISOString() }); } catch (_) { /* best effort */ }
      return { state: 'integrity_failed' };
    }
    if (d.order_status !== 'PAID') return { state: String(d.order_status || 'UNKNOWN') };
    const at = deps.now().toISOString();
    await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${id}`, { status: 'paid', paidAt: at, updatedAt: at, paymentProvider: 'cashfree', cashfreeStatus: 'PAID' });
    return { state: 'paid' };
  }

  /* GET /music/catalogue: public. Titles, which tracks can be sold now, prices and licence tiers. */
  async function handleMusicCatalogue(request, env) {
    let methods = { enabled: false, cashfree: false, upi: false };
    try {
      const ctx = await deps.context(env);
      if (!ctx.error) methods = musicMethods(await deps.getDoc(env, ctx.accessToken, ctx.projectId, 'config/music'), env);
    } catch (_) { /* closed */ }
    const open = methods.cashfree || methods.upi;
    const have = open ? await availableIds(env) : new Set();
    const body = {
      version: deps.catalogue.version, currency: 'INR', checkoutOpen: open, methods: { cashfree: methods.cashfree, upi: methods.upi },
      downloadPaise: deps.catalogue.downloadPaise, downloadUse: DOWNLOAD_USE, termsVersion: TERMS_VERSION, terms: LICENCE_TERMS, upiMaxPaise: UPI_MAX_PAISE,
      tiers: Object.entries(LICENCE_TIERS).map(([id, t]) => ({ id, label: t.label, pricePaise: t.pricePaise, use: t.use })),
      releases: deps.catalogue.releases.map((r) => ({ id: r.id, title: r.title, pricePaise: r.pricePaise || deps.catalogue.downloadPaise, available: have.has(r.id) })),
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...CORS } });
  }

  /* POST /music/order {item:{releaseId,kind,tier?}, buyer, method} */
  async function handleMusicOrder(request, env) {
    const body = await readJson(request);
    if (!body) return json({ error: 'invalid_json' }, 400);
    const ctx = await deps.context(env);
    if (ctx.error) return ctx.error;
    const state = await loadMethods(env, ctx);
    if (state.error) return state.error;
    const method = body.method === 'upi' ? 'upi' : body.method === 'cashfree' ? 'cashfree' : null;
    if (!method || !state.methods[method]) return json({ error: 'method_unavailable', message: 'That payment method is not available right now.' }, 409);
    const kind = body.item && body.item.kind;
    const priced = priceItem(body.item, deps.catalogue);
    if (priced.error) return json({ error: priced.error, message: priced.message }, 422);
    const buyer = validateBuyer(body.buyer, kind);
    if (buyer.error) return json({ error: buyer.error, message: buyer.message }, 422);
    if (method === 'upi' && priced.totalPaise > UPI_MAX_PAISE) return json({ error: 'upi_limit', message: 'Please pay this licence by card or netbanking.' }, 422);
    if (!(await availableIds(env)).has(priced.item.releaseId)) return json({ error: 'track_not_ready', message: 'This track is not ready for sale yet.' }, 409);

    const id = newOrderId(deps.randomBytes(10));
    const token = hex(deps.randomBytes(24));
    const at = deps.now().toISOString();
    const order = {
      orderId: id, status: method === 'upi' ? 'awaiting_upi_payment' : 'awaiting_payment', method, currency: 'INR',
      kind: priced.item.kind, releaseId: priced.item.releaseId, releaseTitle: priced.item.releaseTitle, tier: priced.item.tier || '', label: priced.item.label,
      totalPaise: priced.totalPaise, buyer: buyer.value, tokenHash: await sha256Hex(token), termsVersion: TERMS_VERSION,
      environment: isLive(env) ? 'live' : 'sandbox', downloadCount: 0, createdAt: at, updatedAt: at,
    };
    let created;
    try { created = await deps.createDocIfAbsent(env, ctx.accessToken, ctx.projectId, 'musicOrders', id, order); }
    catch (_) { return json({ error: 'order_not_saved', message: 'Could not save your order. No payment was taken.' }, 503); }
    if (!created) return json({ error: 'order_not_saved', message: 'Please try again. No payment was taken.' }, 503);

    const summary = { orderId: id, token, method, status: order.status, totalPaise: priced.totalPaise };
    if (method === 'upi') return json({ ...summary, upi: upiIntent(id, priced.totalPaise) });

    const notifyUrl = String(env.MUSIC_WEBHOOK_URL || DEFAULT_WEBHOOK_URL);
    const cfBody = {
      order_id: id, order_amount: priced.totalPaise / 100, order_currency: 'INR',
      customer_details: { customer_id: id, customer_name: buyer.value.name.slice(0, 100), customer_phone: buyer.value.phone, customer_email: buyer.value.email },
      order_meta: { return_url: `${RETURN_BASE}?order_id=${encodeURIComponent(id)}`, ...(/^https:\/\//.test(notifyUrl) ? { notify_url: notifyUrl } : {}) },
      order_note: `RoamWise music ${id}`,
    };
    let res; let data;
    try {
      res = await deps.fetchImpl(`${cfBase(env)}/pg/orders`, { method: 'POST', headers: cfHeaders(env, { 'x-request-id': id, 'x-idempotency-key': id }), body: JSON.stringify(cfBody) });
      data = await res.json().catch(() => ({}));
    } catch (_) { res = null; data = {}; }
    if (!res || !res.ok || !data.payment_session_id) {
      try { await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${id}`, { status: 'payment_setup_failed', updatedAt: deps.now().toISOString() }); } catch (_) { /* best effort */ }
      return json({ error: 'cashfree_order_failed', message: 'Could not start the payment. No money was taken. Please try again or pay by UPI.' }, 502);
    }
    try { await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${id}`, { cashfreeOrderId: data.order_id || id, updatedAt: deps.now().toISOString() }); }
    catch (_) { return json({ error: 'order_not_saved', message: 'Could not record the payment. Please do not pay; contact support.' }, 503); }
    return json({ ...summary, payment_session_id: data.payment_session_id, environment: isLive(env) ? 'production' : 'sandbox' });
  }

  /* GET /music/order/:id/status, Authorization: Bearer <order token>. Paid orders get a signed download link and, for licences, the certificate. */
  async function handleMusicStatus(request, env, orderId) {
    if (!ORDER_ID_RE.test(String(orderId))) return json({ error: 'not_found' }, 404);
    const token = bearer(request);
    if (!token) return json({ error: 'unauthorized' }, 401);
    const ctx = await deps.context(env);
    if (ctx.error) return ctx.error;
    let order;
    try { order = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${orderId}`); } catch (_) { return json({ error: 'status_unavailable' }, 503); }
    if (!order || !timingSafeEqualHex(await sha256Hex(token), order.tokenHash || '')) return json({ error: 'not_found' }, 404);
    let status = order.status;
    if (status === 'awaiting_payment' && order.method === 'cashfree' && order.cashfreeOrderId && env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY) {
      const r = await verifyAndMarkPaid(env, ctx, orderId, order);
      if (r.state === 'paid') { status = 'paid'; order = { ...order, status: 'paid', paidAt: deps.now().toISOString() }; }
      if (r.state === 'integrity_failed') return json({ error: 'payment_integrity_failed', message: 'We could not match this payment to your order. Please contact support with your order ID.' }, 409);
    }
    const out = { orderId, status, kind: order.kind, label: order.label, releaseTitle: order.releaseTitle, totalPaise: order.totalPaise, method: order.method, createdAt: order.createdAt };
    if (status === 'paid') {
      out.paidAt = order.paidAt;
      if (linkSecretOk(env.MUSIC_LINK_SECRET)) {
        const exp = Math.floor(deps.now().getTime() / 1000) + LINK_TTL_SEC;
        out.download = { url: `${API_BASE}/music/download/${orderId}?exp=${exp}&sig=${await signDownload(env.MUSIC_LINK_SECRET, orderId, exp)}`, expiresInSec: LINK_TTL_SEC, remaining: Math.max(0, MAX_DOWNLOADS - (Number(order.downloadCount) || 0)) };
      }
      if (order.kind === 'licence') {
        const tier = LICENCE_TIERS[order.tier];
        out.certificate = {
          licenceNo: orderId, tier: order.tier, tierLabel: tier ? tier.label : order.label, use: tier ? tier.use : '', track: order.releaseTitle,
          licensee: order.buyer.licensee, project: order.buyer.project, issuedAt: order.paidAt || order.updatedAt, termsVersion: order.termsVersion || TERMS_VERSION,
          credit: CREDIT_LINE(order.releaseTitle), terms: LICENCE_TERMS, licensor: 'Mohit Pandey (RoamWise Music)',
        };
      }
    }
    return json(out);
  }

  /* GET /music/download/:id?exp&sig: streams the private file when the signed link is valid and the order is paid. */
  async function handleMusicDownload(request, env, orderId) {
    if (!ORDER_ID_RE.test(String(orderId)) || !env.RW_BUCKET) return json({ error: 'not_found' }, 404);
    const url = new URL(request.url);
    const nowSec = Math.floor(deps.now().getTime() / 1000);
    if (!(await verifyDownload(env.MUSIC_LINK_SECRET, orderId, url.searchParams.get('exp'), url.searchParams.get('sig'), nowSec))) return json({ error: 'link_invalid_or_expired', message: 'This download link has expired. Open your order page to get a new one.' }, 403);
    const ctx = await deps.context(env);
    if (ctx.error) return ctx.error;
    let order;
    try { order = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${orderId}`); } catch (_) { return json({ error: 'status_unavailable' }, 503); }
    if (!order || order.status !== 'paid') return json({ error: 'not_found' }, 404);
    if ((Number(order.downloadCount) || 0) >= MAX_DOWNLOADS) return json({ error: 'download_limit', message: 'The download limit for this order is reached. Contact support.' }, 429);
    let key = `tracks/${order.releaseId}.mp3`; let type = 'audio/mpeg'; let ext = 'mp3';
    if (order.kind === 'licence') {
      const wav = await env.RW_BUCKET.head(`tracks/${order.releaseId}.wav`).catch(() => null);
      if (wav) { key = `tracks/${order.releaseId}.wav`; type = 'audio/wav'; ext = 'wav'; }
    }
    const obj = await env.RW_BUCKET.get(key).catch(() => null);
    if (!obj) return json({ error: 'file_missing', message: 'The file is not available right now. Please contact support.' }, 404);
    try { await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${orderId}`, { downloadCount: (Number(order.downloadCount) || 0) + 1, updatedAt: deps.now().toISOString() }); } catch (_) { /* never block a paid download on a counter */ }
    return new Response(obj.body, { status: 200, headers: { 'Content-Type': type, 'Content-Disposition': `attachment; filename="${safeFileName(order.releaseTitle)}.${ext}"`, 'Cache-Control': 'private, no-store', ...CORS } });
  }

  /* GET /music/licence/:id: public verification. Shows only what a film's legal team needs; no contact details. */
  async function handleMusicLicence(request, env, orderId) {
    if (!ORDER_ID_RE.test(String(orderId))) return json({ valid: false }, 404);
    const ctx = await deps.context(env);
    if (ctx.error) return ctx.error;
    let order;
    try { order = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${orderId}`); } catch (_) { return json({ error: 'status_unavailable' }, 503); }
    if (!order || order.kind !== 'licence' || order.status !== 'paid') return json({ valid: false }, 404);
    const tier = LICENCE_TIERS[order.tier];
    return json({ valid: true, licenceNo: orderId, tier: tier ? tier.label : order.label, track: order.releaseTitle, licensee: order.buyer.licensee, issuedAt: order.paidAt || order.updatedAt, termsVersion: order.termsVersion });
  }

  /* POST /music/cashfree/webhook: signature-checked, then re-verified with Cashfree. */
  async function handleMusicWebhook(request, env) {
    if (request.method !== 'POST') return Response.json({ ok: false, reason: 'method_not_allowed' }, { status: 405 });
    const secret = env.CASHFREE_SECRET_KEY;
    if (typeof secret !== 'string' || secret.length < 16 || !env.CASHFREE_APP_ID) return Response.json({ ok: false, reason: 'webhook_not_configured' }, { status: 503 });
    let raw;
    try { raw = new Uint8Array(await request.arrayBuffer()); } catch (_) { return Response.json({ ok: false, reason: 'invalid_body' }, { status: 400 }); }
    if (raw.length === 0 || raw.length > 65536) return Response.json({ ok: false, reason: 'invalid_body' }, { status: 400 });
    let valid = false;
    try { valid = await verifyCashfreeWorkerWebhook({ rawBody: raw, headers: request.headers, secret, now: () => deps.now().getTime() }); }
    catch (_) { return Response.json({ ok: false, reason: 'verification_unavailable' }, { status: 503 }); }
    if (!valid) return Response.json({ ok: false, reason: 'invalid_signature' }, { status: 401 });
    let event;
    try { event = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)); } catch (_) { return Response.json({ ok: false, reason: 'invalid_json' }, { status: 400 }); }
    const orderId = event && event.data && event.data.order && event.data.order.order_id;
    if (!event || event.type !== 'PAYMENT_SUCCESS_WEBHOOK' || typeof orderId !== 'string' || !ORDER_ID_RE.test(orderId)) return Response.json({ ok: true, ignored: 'not_a_music_payment' });
    const ctx = await deps.context(env);
    if (ctx.error) return Response.json({ ok: false, reason: 'backend_unavailable' }, { status: 503 });
    let order;
    try { order = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `musicOrders/${orderId}`); } catch (_) { return Response.json({ ok: false, reason: 'backend_unavailable' }, { status: 503 }); }
    if (!order) return Response.json({ ok: true, ignored: 'unknown_order' });
    if (order.status === 'paid') return Response.json({ ok: true, duplicate: true });
    if (order.method !== 'cashfree' || !order.cashfreeOrderId) return Response.json({ ok: true, ignored: 'not_a_cashfree_order' });
    let result;
    try { result = await verifyAndMarkPaid(env, ctx, orderId, order); } catch (_) { return Response.json({ ok: false, reason: 'backend_unavailable' }, { status: 503 }); }
    if (result.state === 'unverified') return Response.json({ ok: false, reason: 'verification_unavailable' }, { status: 503 });
    if (result.state === 'integrity_failed') return Response.json({ ok: false, reason: 'payment_integrity_failed' }, { status: 409 });
    return Response.json({ ok: true, state: result.state });
  }

  return { handleMusicCatalogue, handleMusicOrder, handleMusicStatus, handleMusicDownload, handleMusicLicence, handleMusicWebhook };
}

const defaults = createMusicHandlers();
export const handleMusicCatalogue = defaults.handleMusicCatalogue;
export const handleMusicOrder = defaults.handleMusicOrder;
export const handleMusicStatus = defaults.handleMusicStatus;
export const handleMusicDownload = defaults.handleMusicDownload;
export const handleMusicLicence = defaults.handleMusicLicence;
export const handleMusicWebhook = defaults.handleMusicWebhook;
