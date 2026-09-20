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
   to Cashfree's Order Create API directly. Firebase authentication, the
   server-owned receipt and exact amount/currency checks also happen here;
   the Worker persists the account entitlement before reporting success.

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
   rupees"), so no unit conversion happens here.

   PRICE INTEGRITY: the `amount` this endpoint is asked to charge is
   validated against worker/lib/pricing.js's server-side price table for the
   request's `meta.planId` before Cashfree is ever called — see that file's
   header for the exact price-tampering exploit this closes. */
import { json } from '../lib/http.js';
import { cashfreeEntitlementForPlan, priceForPlan } from '../lib/pricing.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, updateDoc } from '../lib/firestore-rest.js';

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
    'x-api-version': env.CASHFREE_API_VERSION || '2026-01-01',
    'x-client-id': env.CASHFREE_APP_ID,
    'x-client-secret': env.CASHFREE_SECRET_KEY
  }, extra || {});
}

async function authenticatedContext(request, env){
  if(!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY || !env.FIREBASE_SERVICE_ACCOUNT_JSON){
    return { error: json({ error:'not_configured', message:'Cashfree checkout is not fully configured on this server yet.' }, 501) };
  }
  const auth = request.headers && request.headers.get ? request.headers.get('authorization') || '' : '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if(!match) return { error:json({ error:'unauthorized', message:'Sign in again before payment.' }, 401) };
  // A failed server-side Google OAuth exchange is NOT an expired user session.
  // Keep diagnostics categorical: never send private keys, access tokens or
  // raw Google responses to clients. Missing/malformed service credentials
  // and transient identity infrastructure failures must not prompt relogin.
  let sa;
  try{ sa = parseServiceAccount(env); }
  catch(_){
    return { error:json({ error:'server_auth_config_invalid', message:'Payment verification is temporarily unavailable. Please contact support; do not pay again.' }, 503) };
  }
  let claims;
  try{ claims = await verifyFirebaseIdToken(match[1], sa.project_id); }
  catch(e){
    if(/failed to fetch Firebase JWKS|unknown signing key/i.test(String(e && e.message || ''))){
      return { error:json({ error:'identity_service_unavailable', message:'Secure sign-in verification is temporarily unavailable. Please retry later.' }, 503) };
    }
    return { error:json({ error:'unauthorized', message:'Your session could not be verified. Please sign in again.' }, 401) };
  }
  try{
    const accessToken = await getServiceAccountAccessToken(env);
    return { claims, accessToken, projectId:sa.project_id };
  }catch(_){
    return { error:json({ error:'server_auth_unavailable', message:'Our payment verification service is unavailable. No payment was started; please contact support.' }, 503) };
  }
}

function paymentRecord(orderId, receipt, paidAt){
  return {
    uid:receipt.uid,
    email:receipt.email || '',
    amount:Math.round(Number(receipt.amountINR) * 100),
    amountINR:Number(receipt.amountINR),
    currency:'INR',
    provider:'cashfree',
    providerRef:orderId,
    planId:receipt.planId,
    status:'paid',
    created:receipt.createdAt || paidAt,
    receivedDate:String(paidAt).slice(0, 10),
    paidAt
  };
}

function expiryMillis(value){
  if(value == null || value === '') return 0;
  const numeric = Number(value);
  if(Number.isFinite(numeric)) return numeric;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/* Dependency injection keeps the production path on native Worker/Firebase
   helpers while allowing the payment boundary to be unit-tested without real
   credentials or a real Google signing key. */
export function createCashfreeHandlers(overrides){
  const deps = Object.assign({
    context:authenticatedContext,
    getDoc,
    updateDoc,
    request:fetch
  }, overrides || {});

async function requireSandboxAdmin(env, ctx){
  if(isLive(env)) return null;
  try{
    const admin = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `admins/${ctx.claims.uid}`);
    if(admin) return null;
  }catch(e){
    return json({ error:'sandbox_access_unavailable', message:'Could not verify sandbox access.' }, 502);
  }
  return json({ error:'sandbox_admin_only', message:'Cashfree sandbox is restricted to an administrator.' }, 403);
}

async function requireCheckoutEnabled(env, ctx){
  let config;
  try{ config = await deps.getDoc(env, ctx.accessToken, ctx.projectId, 'config/app'); }
  catch(e){ return json({ error:'payment_config_unavailable', message:'Could not verify payment configuration.' }, 502); }
  if(!config || config.PAYMENT_PROVIDER !== 'cashfree'){
    return json({ error:'checkout_disabled', message:'Cashfree checkout is currently disabled.' }, 503);
  }
  const expected = isLive(env) ? 'live' : 'sandbox';
  if(String(config.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase() !== expected){
    return json({ error:'environment_mismatch', message:'Admin and Worker Cashfree environments do not match.' }, 503);
  }
  return null;
}

async function handleCashfreeOrder(request, env){
  const ctx = await deps.context(request, env);
  if(ctx.error) return ctx.error;
  const sandboxError = await requireSandboxAdmin(env, ctx);
  if(sandboxError) return sandboxError;
  const configError = await requireCheckoutEnabled(env, ctx);
  if(configError) return configError;

  try{
    const currentUser = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `users/${ctx.claims.uid}`);
    const currentUntil = expiryMillis(currentUser && currentUser.proUntil);
    if(currentUser && currentUser.pro === true && (!currentUntil || currentUntil > Date.now())){
      return json({ error:'already_entitled', message:'This account already has an active paid plan. Contact support for an upgrade or extension.' }, 409);
    }
  }catch(e){
    return json({ error:'entitlement_check_failed', message:'Could not verify the current account plan.' }, 502);
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

  /* PRICE INTEGRITY (see this file's header + worker/lib/pricing.js): never
     trust the client-supplied `amount` — look up the real price for the
     claimed plan and reject anything that doesn't match exactly, BEFORE an
     order (and a real, chargeable payment_session_id) is ever created. */
  const knownPrice = priceForPlan(meta.planId);
  if(knownPrice == null){
    return json({ error: 'unknown_plan', message: 'Could not verify the price for this plan.' }, 400);
  }
  if(amount !== knownPrice){
    return json({ error: 'amount_mismatch', message: 'The submitted amount does not match this plan’s real price.' }, 400);
  }
  const entitlement = cashfreeEntitlementForPlan(meta.planId);
  if(!entitlement){
    return json({ error:'unsupported_plan', message:'Cashfree is currently available only for one-time plans.' }, 409);
  }

  const orderId = 'rw_' + safeId(Date.now() + '_' + Math.random().toString(36).slice(2, 8));

  const orderBody = {
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: safeId(ctx.claims.uid),
      customer_phone: phone.slice(0, 20)
    }
  };
  if(ctx.claims.email || customer.email) orderBody.customer_details.customer_email = String(ctx.claims.email || customer.email).slice(0, 160);
  if(env.PAYMENT_RETURN_URL) orderBody.order_meta = { return_url: env.PAYMENT_RETURN_URL };
  if(meta.planId || meta.label) orderBody.order_note = String(meta.label || meta.planId || '').slice(0, 200);

  let r, data;
  try{
    r = await deps.request(cashfreeBase(env) + '/pg/orders', {
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
  if(String(data.order_id || '') !== orderId || Number(data.order_amount) !== amount || data.order_currency !== 'INR'){
    return json({ error:'cashfree_order_mismatch', message:'Cashfree returned an order that did not match the requested purchase.' }, 502);
  }


  try{
    await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `cashfreeOrders/${data.order_id || orderId}`, {
      uid:ctx.claims.uid,
      email:String(ctx.claims.email || customer.email || '').slice(0, 160),
      cfOrderId:data.order_id,
      planId:String(meta.planId),
      amountINR:amount,
      currency:'INR',
      environment:isLive(env) ? 'live' : 'sandbox',
      status:'ACTIVE',
      fulfilled:false,
      createdAt:new Date().toISOString()
    });
  }catch(e){
    return json({ error:'payment_record_failed', message:'The payment session could not be recorded safely. Please try again.' }, 502);
  }

  return json({
    payment_session_id: data.payment_session_id,
    order_id: data.order_id,
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
   this before refreshing the local paid UI. */
async function handleCashfreeOrderStatus(request, env, orderId){
  const ctx = await deps.context(request, env);
  if(ctx.error) return ctx.error;
  const sandboxError = await requireSandboxAdmin(env, ctx);
  if(sandboxError) return sandboxError;
  const id = safeId(orderId);
  if(!id) return json({ error: 'invalid_order_id' }, 400);

  let receipt;
  try{ receipt = await deps.getDoc(env, ctx.accessToken, ctx.projectId, `cashfreeOrders/${id}`); }
  catch(e){ return json({ error:'payment_record_unavailable' }, 502); }
  if(!receipt) return json({ error:'payment_record_not_found' }, 404);
  if(receipt.uid !== ctx.claims.uid) return json({ error:'forbidden' }, 403);

  let r, data;
  try{
    r = await deps.request(cashfreeBase(env) + '/pg/orders/' + encodeURIComponent(id), {
      method: 'GET',
      headers: cfHeaders(env)
    });
    data = await r.json().catch(() => ({}));
  }catch(e){
    return json({ error: 'network_error' }, 502);
  }
  if(!r.ok) return json({ error: 'cashfree_status_failed', message: data.message || 'Could not fetch order status.' }, r.status >= 400 ? r.status : 502);

  if(String(data.order_id || '') !== id || data.order_currency !== 'INR' || Number(data.order_amount) !== Number(receipt.amountINR)){
    return json({ error:'payment_integrity_failed', message:'Cashfree returned an order that does not match the recorded purchase.' }, 409);
  }

  let persisted = receipt.fulfilled === true;
  let entitlement = cashfreeEntitlementForPlan(receipt.planId);
  if(data.order_status === 'PAID' && entitlement && !persisted){
    const paidAt = new Date().toISOString();
    const method = receipt.planId === 'founder' ? 'founder-cashfree' : 'cashfree';
    try{
      /* All writes are server-authenticated and idempotent by order id. A
         retry repairs any partial write; the browser never gets permission
         to set users/{uid}.pro. */
      await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `payments/${id}`, paymentRecord(id, receipt, paidAt));
      await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `users/${ctx.claims.uid}`, {
        pro:true,
        proTier:entitlement.tier,
        proMethod:method,
        proPayId:id,
        proPlanId:receipt.planId,
        proAmount:Number(receipt.amountINR),
        proVia:'cashfree',
        proAt:paidAt,
        proUntil:entitlement.until
      });
      await deps.updateDoc(env, ctx.accessToken, ctx.projectId, `cashfreeOrders/${id}`, {
        status:'PAID',
        fulfilled:true,
        paidAt,
        updatedAt:paidAt
      });
      persisted = true;
    }catch(e){
      return json({ error:'entitlement_persistence_failed', message:'Payment is confirmed, but account activation is still retrying. Check again shortly.' }, 503);
    }
  }

  return json({
    order_id:data.order_id || id,
    order_status:data.order_status || 'UNKNOWN',
    entitlement:entitlement ? { planId:entitlement.planId, tier:entitlement.tier, until:entitlement.until, persisted } : null
  });
}

  return { handleCashfreeOrder, handleCashfreeOrderStatus };
}

const handlers = createCashfreeHandlers();
export const handleCashfreeOrder = handlers.handleCashfreeOrder;
export const handleCashfreeOrderStatus = handlers.handleCashfreeOrderStatus;
