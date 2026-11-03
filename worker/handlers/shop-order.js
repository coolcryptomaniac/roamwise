/* Merchandise checkout (Qikink print-on-demand shop). SEPARATE from Pro, Bhakti and stay payments:
 * it never touches entitlements, users/{uid} or roomBookings.
 *
 * Trust model
 *  - The browser sends item ids, variant ids and quantities. Prices and shipping are computed here.
 *  - Guest checkout: each order gets a random token. Only its SHA-256 hash is stored; the buyer's
 *    browser keeps the token and presents it to read the order status.
 *  - An order becomes `paid` ONLY from a Cashfree lookup that matches order id, amount and INR
 *    (reached from the status poll or the signed webhook). Direct UPI orders stay
 *    `awaiting_upi_payment` until an authorised person reconciles the bank record and sets
 *    status to `paid` in Firestore. A screenshot, UTR or app return is never proof of payment.
 *  - Paid orders are queued (fulfilmentState: 'queued') and sent to Qikink by lib/shop-fulfil.js, but only when
 *    config/shop.qikinkEnabled is true and the Qikink Worker secrets exist; an hourly cron retries failures.
 *  - Checkout is OFF unless config/shop.enabled === true (admin-written, public-read, flags only). */
import { CORS, json } from '../lib/http.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { createDocIfAbsent, getDoc, queryEqualsString, updateDoc } from '../lib/firestore-rest.js';
import { createFulfilment } from '../lib/shop-fulfil.js';
import { verifyCashfreeWorkerWebhook } from '../lib/cashfree-booking-webhook-verify.js';
import { SHOP_CATALOGUE, publicCatalogue } from '../lib/shop-catalogue.js';
import {
  ORDER_ID_RE, hex, newOrderId, priceCart, sha256Hex, timingSafeEqualHex, upiIntent,
  validateCustomer, validateShipTo,
} from '../lib/shop-core.js';

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

const DEFAULT_WEBHOOK_URL = 'https://roamwise-api.founder-f53.workers.dev/shop/cashfree/webhook';
const RETURN_BASE = 'https://www.roamwise.co.in/shop/';

async function serviceContext(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) return { error: json({ error: 'not_configured', message: 'Shop checkout is not configured yet.' }, 501) };
  try {
    const sa = parseServiceAccount(env);
    if (sa.project_id !== 'roamwisepro') throw new Error('wrong project');
    return { accessToken: await getServiceAccountAccessToken(env), projectId: sa.project_id };
  } catch (_) {
    return { error: json({ error: 'shop_backend_unavailable', message: 'Checkout is temporarily unavailable. No payment was taken.' }, 503) };
  }
}

/* Which payment methods may be offered right now, from config/shop plus Worker secrets. */
export function paymentMethods(cfg, env) {
  const on = !!cfg && cfg.enabled === true;
  const envMatches = !!cfg && String(cfg.environment || 'sandbox').toLowerCase() === (isLive(env) ? 'live' : 'sandbox');
  return {
    enabled: on,
    cashfree: on && cfg.cashfreeEnabled === true && envMatches && !!env.CASHFREE_APP_ID && !!env.CASHFREE_SECRET_KEY,
    upi: on && cfg.upiEnabled === true,
  };
}

const readJson = async (request) => { try { return await request.json(); } catch (_) { return null; } };
const bearer = (request) => { const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || ''); return m ? m[1] : ''; };

export function createShopHandlers(overrides) {
  const deps = Object.assign({
    catalogue: SHOP_CATALOGUE, context: serviceContext, getDoc, createDocIfAbsent, updateDoc, queryEqualsString,
    qikinkFetch: (...a) => fetch(...a),
    fetchImpl: (...a) => fetch(...a),
    now: () => new Date(),
    randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
  }, overrides || {});

  const fulfil = createFulfilment({
    getDoc: (...a) => deps.getDoc(...a), updateDoc: (...a) => deps.updateDoc(...a), queryEqualsString: (...a) => deps.queryEqualsString(...a),
    fetchImpl: (...a) => deps.qikinkFetch(...a), now: () => deps.now(), catalogue: deps.catalogue,
  });

  async function loadMethods(env, ctx) {
    let cfg;
    try { cfg = await deps.getDoc(env, ctx.accessToken, ctx.projectId, 'config/shop'); }
    catch (_) { return { error: json({ error: 'shop_config_unavailable', message: 'Checkout is temporarily unavailable. No payment was taken.' }, 503) }; }
    const methods = paymentMethods(cfg, env);
    if (!methods.enabled) return { error: json({ error: 'checkout_disabled', message: 'Online checkout is not open yet. Please order on WhatsApp.' }, 503) };
    return { cfg, methods };
  }

  async function cfGetOrder(env, cashfreeOrderId) {
    const res = await deps.fetchImpl(`${cfBase(env)}/pg/orders/${encodeURIComponent(cashfreeOrderId)}`, { headers: cfHeaders(env) });
    return { res, data: await res.json().catch(() => ({})) };
  }

  /* Looks the order up at Cashfree and marks it paid only if id, amount and currency all match. */
  async function verifyAndMarkPaid(env, ctx, id, order) {
    let got;
    try { got = await cfGetOrder(env, order.cashfreeOrderId); }
    catch (_) { return { state: 'unverified' }; }
    if (!got.res.ok) return { state: 'unverified' };
    const d = got.data;
    const amountMatches = Math.round(Number(d.order_amount) * 100) === order.totalPaise;
    if (d.order_id !== order.cashfreeOrderId || d.order_currency !== 'INR' || !amountMatches) {
      try { await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `shopOrders/${id}`, { integrityFlag: true, updatedAt: deps.now().toISOString() }); } catch (_) { /* best effort */ }
      return { state: 'integrity_failed' };
    }
    if (d.order_status !== 'PAID') return { state: String(d.order_status || 'UNKNOWN') };
    const at = deps.now().toISOString();
    await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `shopOrders/${id}`, {
      status: 'paid', paidAt: at, updatedAt: at, paymentProvider: 'cashfree', cashfreeStatus: 'PAID', fulfilmentState: 'queued',
    });
    /* Never throws; when Qikink is off or fails the order simply stays queued for the hourly retry. */
    await fulfil.fulfilOrder(env, ctx, id, { ...order, status: 'paid', fulfilmentState: 'queued' });
    return { state: 'paid' };
  }

  /* GET /shop/catalogue: public, no prices from the client are ever trusted. `checkoutOpen` lets the page
   * show the order form only when config/shop and the Worker secrets can actually take an order. */
  async function handleShopCatalogue(request, env) {
    let checkoutOpen = false;
    try {
      const ctx = await deps.context(env);
      if (!ctx.error) {
        const m = paymentMethods(await deps.getDoc(env, ctx.accessToken, ctx.projectId, 'config/shop'), env);
        checkoutOpen = m.cashfree || m.upi;
      }
    } catch (_) { checkoutOpen = false; }
    return new Response(JSON.stringify({ ...publicCatalogue(deps.catalogue), checkoutOpen }), {
      status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...CORS },
    });
  }

  /* POST /shop/quote {items, pin}: price + delivery for a PIN, and which methods are open. */
  async function handleShopQuote(request, env) {
    const body = await readJson(request);
    if (!body) return json({ error: 'invalid_json' }, 400);
    const ctx = await deps.context(env);
    if (ctx.error) return ctx.error;
    const state = await loadMethods(env, ctx);
    if (state.error) return state.error;
    const priced = priceCart(body.items, body.pin, deps.catalogue);
    if (priced.error) return json({ error: priced.error, message: priced.message }, 422);
    return json({ ok: true, currency: 'INR', ...priced, methods: { cashfree: state.methods.cashfree, upi: state.methods.upi } });
  }

  /* POST /shop/order {items, customer, ship, method}: writes the order, then starts payment. */
  async function handleShopOrder(request, env) {
    const body = await readJson(request);
    if (!body) return json({ error: 'invalid_json' }, 400);
    const ctx = await deps.context(env);
    if (ctx.error) return ctx.error;
    const state = await loadMethods(env, ctx);
    if (state.error) return state.error;
    const method = body.method === 'upi' ? 'upi' : body.method === 'cashfree' ? 'cashfree' : null;
    if (!method || !state.methods[method]) return json({ error: 'method_unavailable', message: 'That payment method is not available right now.' }, 409);
    const customer = validateCustomer(body.customer);
    if (customer.error) return json({ error: customer.error, message: customer.message }, 422);
    const ship = validateShipTo(body.ship);
    if (ship.error) return json({ error: ship.error, message: ship.message }, 422);
    const priced = priceCart(body.items, ship.value.pin, deps.catalogue);
    if (priced.error) return json({ error: priced.error, message: priced.message }, 422);

    const id = newOrderId(deps.randomBytes(10));
    const token = hex(deps.randomBytes(24));
    const at = deps.now().toISOString();
    const order = {
      orderId: id, status: method === 'upi' ? 'awaiting_upi_payment' : 'awaiting_payment', method, currency: 'INR',
      lines: priced.lines, subtotalPaise: priced.subtotalPaise, shippingPaise: priced.shippingPaise, totalPaise: priced.totalPaise,
      customer: customer.value, ship: ship.value, tokenHash: await sha256Hex(token),
      environment: isLive(env) ? 'live' : 'sandbox', fulfilmentState: 'not_started', createdAt: at, updatedAt: at,
    };
    let created;
    try { created = await deps.createDocIfAbsent(env, ctx.accessToken, ctx.projectId, 'shopOrders', id, order); }
    catch (_) { return json({ error: 'order_not_saved', message: 'Could not save your order. No payment was taken.' }, 503); }
    if (!created) return json({ error: 'order_not_saved', message: 'Please try again. No payment was taken.' }, 503);

    const summary = { orderId: id, token, method, status: order.status, subtotalPaise: priced.subtotalPaise, shippingPaise: priced.shippingPaise, totalPaise: priced.totalPaise };
    if (method === 'upi') return json({ ...summary, upi: upiIntent(id, priced.totalPaise) });

    const notifyUrl = String(env.SHOP_WEBHOOK_URL || DEFAULT_WEBHOOK_URL);
    const cfBody = {
      order_id: id, order_amount: priced.totalPaise / 100, order_currency: 'INR',
      customer_details: { customer_id: id, customer_name: customer.value.name.slice(0, 100), customer_phone: customer.value.phone, ...(customer.value.email ? { customer_email: customer.value.email } : {}) },
      order_meta: { return_url: `${RETURN_BASE}?order_id=${encodeURIComponent(id)}`, ...(/^https:\/\//.test(notifyUrl) ? { notify_url: notifyUrl } : {}) },
      order_note: `RoamWise shop ${id}`,
    };
    let res; let data;
    try {
      res = await deps.fetchImpl(`${cfBase(env)}/pg/orders`, { method: 'POST', headers: cfHeaders(env, { 'x-request-id': id, 'x-idempotency-key': id }), body: JSON.stringify(cfBody) });
      data = await res.json().catch(() => ({}));
    } catch (_) { res = null; data = {}; }
    if (!res || !res.ok || !data.payment_session_id) {
      try { await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `shopOrders/${id}`, { status: 'payment_setup_failed', updatedAt: deps.now().toISOString() }); } catch (_) { /* best effort */ }
      return json({ error: 'cashfree_order_failed', message: 'Could not start the payment. No money was taken. Please try again or pay by UPI.' }, 502);
    }
    try { await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `shopOrders/${id}`, { cashfreeOrderId: data.order_id || id, updatedAt: deps.now().toISOString() }); }
    catch (_) { return json({ error: 'order_not_saved', message: 'Could not record the payment. Please do not pay; contact support.' }, 503); }
    return json({ ...summary, payment_session_id: data.payment_session_id, environment: isLive(env) ? 'production' : 'sandbox' });
  }

  /* GET /shop/order/:id/status, Authorization: Bearer <order token>. */
  async function handleShopStatus(request, env, orderId) {
    if (!ORDER_ID_RE.test(String(orderId))) return json({ error: 'not_found' }, 404);
    const token = bearer(request);
    if (!token) return json({ error: 'unauthorized' }, 401);
    const ctx = await deps.context(env);
    if (ctx.error) return ctx.error;
    let order;
    try { order = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `shopOrders/${orderId}`); }
    catch (_) { return json({ error: 'status_unavailable' }, 503); }
    if (!order || !timingSafeEqualHex(await sha256Hex(token), order.tokenHash || '')) return json({ error: 'not_found' }, 404);
    let status = order.status;
    if (status === 'awaiting_payment' && order.method === 'cashfree' && order.cashfreeOrderId && env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY) {
      const r = await verifyAndMarkPaid(env, ctx, orderId, order);
      if (r.state === 'paid') status = 'paid';
      if (r.state === 'integrity_failed') return json({ error: 'payment_integrity_failed', message: 'We could not match this payment to your order. Please contact support with your order ID.' }, 409);
    }
    return json({
      orderId, status, method: order.method, subtotalPaise: order.subtotalPaise, shippingPaise: order.shippingPaise, totalPaise: order.totalPaise,
      items: (order.lines || []).map((l) => ({ name: l.name, variant: l.variantLabel, qty: l.qty })), createdAt: order.createdAt,
      ...(order.paidAt ? { paidAt: order.paidAt } : {}),
    });
  }

  /* POST /shop/cashfree/webhook: signature-checked, then the order is re-verified with Cashfree. */
  async function handleShopWebhook(request, env) {
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
    if (!event || event.type !== 'PAYMENT_SUCCESS_WEBHOOK' || typeof orderId !== 'string' || !ORDER_ID_RE.test(orderId)) {
      return Response.json({ ok: true, ignored: 'not_a_shop_payment' });
    }
    const ctx = await deps.context(env);
    if (ctx.error) return Response.json({ ok: false, reason: 'backend_unavailable' }, { status: 503 });
    let order;
    try { order = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `shopOrders/${orderId}`); }
    catch (_) { return Response.json({ ok: false, reason: 'backend_unavailable' }, { status: 503 }); }
    if (!order) return Response.json({ ok: true, ignored: 'unknown_order' });
    if (order.status === 'paid') return Response.json({ ok: true, duplicate: true });
    if (order.method !== 'cashfree' || !order.cashfreeOrderId) return Response.json({ ok: true, ignored: 'not_a_cashfree_order' });
    let result;
    try { result = await verifyAndMarkPaid(env, ctx, orderId, order); }
    catch (_) { return Response.json({ ok: false, reason: 'backend_unavailable' }, { status: 503 }); }
    if (result.state === 'unverified') return Response.json({ ok: false, reason: 'verification_unavailable' }, { status: 503 });
    if (result.state === 'integrity_failed') return Response.json({ ok: false, reason: 'payment_integrity_failed' }, { status: 409 });
    return Response.json({ ok: true, state: result.state });
  }

  /* Hourly cron entry (worker.js): retry queued paid orders. No-op without the service account. */
  async function runShopFulfilmentCron(env) {
    const ctx = await deps.context(env);
    if (ctx.error) return { skipped: 'backend_unavailable' };
    return fulfil.runFulfilmentCron(env, ctx);
  }

  return { handleShopCatalogue, handleShopQuote, handleShopOrder, handleShopStatus, handleShopWebhook, runShopFulfilmentCron };
}

const defaults = createShopHandlers();
export const handleShopCatalogue = defaults.handleShopCatalogue;
export const handleShopQuote = defaults.handleShopQuote;
export const handleShopOrder = defaults.handleShopOrder;
export const handleShopStatus = defaults.handleShopStatus;
export const handleShopWebhook = defaults.handleShopWebhook;
export const runShopFulfilmentCron = defaults.runShopFulfilmentCron;
