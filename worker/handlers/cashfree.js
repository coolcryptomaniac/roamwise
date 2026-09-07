/* ============================================================================
   worker/handlers/cashfree.js — POST /cashfree/order, GET /cashfree/order/:id/status
   ============================================================================
   Named exports only — see worker/lib/http.js header for why. Imported into
   worker/worker.js and dispatched from its fetch() router.

   Server-side half of the Cashfree payment-gateway adapter (see
   js/payments/providers/cashfree-adapter.js, gateway-adapter.js and
   PAYMENT-GATEWAY-ARCHITECTURE.md). This is the ONLY place Cashfree's App
   ID/Secret Key are ever used — they are Worker secrets
   (env.CASHFREE_APP_ID / env.CASHFREE_SECRET_KEY, set with
   `wrangler secret put`, never a plaintext value in wrangler.toml — see
   CASHFREE-INTEGRATION-SETUP.md), never shipped to the browser. The browser
   only ever receives a payment_session_id back from this endpoint, then
   hands that to Cashfree's own client-side Checkout JS SDK — it never talks
   to Cashfree's Order Create API directly.

   WHY THIS LIVES HERE AND NOT IN payments/ (the existing, separate,
   multi-provider payment router at the repo root): that Worker already has
   real, correct Cashfree Order Create logic (payments/worker.mjs's
   cashfree() function) — this handler's request/response shape (endpoint,
   header names, body fields, response field names) is ported from it. But
   that router is its own separate Cloudflare Worker (`roamwise-payments`)
   with no real (non-.example) wrangler.toml, no CI deploy step, and no
   client code anywhere in this app pointed at it. This app's ONE Worker
   with actual deployment tooling and a client-side call helper already
   wired up is this one (worker/, `roamwise-api`, called from the browser
   via rw-config.js's rwApi()) — adding the Cashfree route here means the
   owner deploys/maintains one Worker, not two, and the existing rwApi()
   convention just works. See the PR description for the fuller writeup.
   payments/ is left exactly as-is; it remains available for a future full
   multi-provider cutover if that's ever wanted.

   Cashfree order_amount is a decimal amount in the currency's major unit
   (rupees), not paise — matches this app's existing amount convention
   (js/payments/gateway-adapter.js: "this app has only ever dealt in plain
   rupees"), so no unit conversion happens here. */
import { json } from '../lib/http.js';

const SANDBOX_BASE = 'https://sandbox.cashfree.com';
const LIVE_BASE = 'https://api.cashfree.com';

function isLive(env){ return String(env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'live'; }
function cashfreeBase(env){ return isLive(env) ? LIVE_BASE : SANDBOX_BASE; }

/* Same allow-list safeId() used by payments/router-core.mjs — strips
   anything Cashfree's order_id/customer_id fields wouldn't accept. */
function safeId(v){ return String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 45); }

function cfHeaders(env, extra){
  return Object.assign({
    'content-type': 'application/json',
    'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01',
    'x-client-id': env.CASHFREE_APP_ID,
    'x-client-secret': env.CASHFREE_SECRET_KEY
  }, extra || {});
}

export async function handleCashfreeOrder(request, env){
  if(!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY){
    return json({ error: 'not_configured', message: 'Cashfree is not configured on this server yet.' }, 501);
  }

  let body;
  try{ body = await request.json(); }catch(e){ return json({ error: 'invalid_json' }, 400); }

  const amount = Math.round(Number(body && body.amount) * 100) / 100;
  if(!Number.isFinite(amount) || amount <= 0) return json({ error: 'invalid_amount' }, 400);

  const customer = (body && body.customer) || {};
  const phone = String(customer.phone || '').replace(/\s+/g, '');
  /* Cashfree's Create Order flow requires a customer phone number. There is
     no safe fake value to fall back to here — reject clearly instead of
     inventing one (same "never invent" principle CLAUDE.md and
     payments/README.md both call out for this exact field). */
  if(!/^\+?\d{7,15}$/.test(phone)){
    return json({ error: 'missing_customer_phone', message: 'Cashfree needs a valid phone number on your account to start checkout.' }, 422);
  }

  const meta = (body && body.meta) || {};
  const orderId = 'rw_' + safeId(Date.now() + '_' + Math.random().toString(36).slice(2, 8));

  const orderBody = {
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: safeId(customer.id || orderId),
      customer_phone: phone.slice(0, 20)
    }
  };
  if(customer.email) orderBody.customer_details.customer_email = String(customer.email).slice(0, 160);
  if(env.PAYMENT_RETURN_URL) orderBody.order_meta = { return_url: env.PAYMENT_RETURN_URL };
  if(meta.planId || meta.label) orderBody.order_note = String(meta.label || meta.planId || '').slice(0, 200);

  let r, data;
  try{
    r = await fetch(cashfreeBase(env) + '/pg/orders', {
      method: 'POST',
      headers: cfHeaders(env, { 'x-request-id': orderId, 'x-idempotency-key': orderId }),
      body: JSON.stringify(orderBody)
    });
    data = await r.json().catch(() => ({}));
  }catch(e){
    return json({ error: 'network_error', message: 'Could not reach Cashfree.' }, 502);
  }
  if(!r.ok || !data.payment_session_id){
    return json({ error: 'cashfree_order_failed', message: data.message || 'Cashfree order creation failed.' }, r.status >= 400 ? r.status : 502);
  }

  return json({
    payment_session_id: data.payment_session_id,
    order_id: data.order_id || orderId,
    order_amount: data.order_amount != null ? data.order_amount : amount,
    order_currency: data.order_currency || 'INR',
    environment: isLive(env) ? 'production' : 'sandbox'
  });
}

/* GET /cashfree/order/:orderId/status — lets the client confirm the order
   actually settled (order_status === 'PAID') with Cashfree itself before
   granting Pro, rather than trusting the checkout SDK's promise resolution
   alone (Cashfree's own docs note the SDK's success callback fires once
   payment is COMPLETE, "irrespective of transaction status" — it is not by
   itself proof of a successful charge). See js/payments/providers/
   cashfree-adapter.js's openCheckout() for the client-side poll that calls
   this before activatePro(). */
export async function handleCashfreeOrderStatus(env, orderId){
  if(!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) return json({ error: 'not_configured' }, 501);
  const id = safeId(orderId);
  if(!id) return json({ error: 'invalid_order_id' }, 400);

  let r, data;
  try{
    r = await fetch(cashfreeBase(env) + '/pg/orders/' + encodeURIComponent(id), {
      method: 'GET',
      headers: cfHeaders(env)
    });
    data = await r.json().catch(() => ({}));
  }catch(e){
    return json({ error: 'network_error' }, 502);
  }
  if(!r.ok) return json({ error: 'cashfree_status_failed', message: data.message || 'Could not fetch order status.' }, r.status >= 400 ? r.status : 502);

  return json({ order_id: data.order_id || id, order_status: data.order_status || 'UNKNOWN' });
}
