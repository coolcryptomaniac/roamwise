/* Authenticated Cashfree checkout for a confirmed direct-stay booking.
   Amount, customer and partner state are read from Firestore server-side. */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, updateDoc } from '../lib/firestore-rest.js';

const SANDBOX_BASE = 'https://sandbox.cashfree.com';
const LIVE_BASE = 'https://api.cashfree.com';
const safeId = (v) => String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 45);
const base = (env) => String(env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'live' ? LIVE_BASE : SANDBOX_BASE;
const headers = (env, extra = {}) => ({
  'content-type': 'application/json',
  'x-api-version': env.CASHFREE_API_VERSION || '2026-01-01',
  'x-client-id': env.CASHFREE_APP_ID,
  'x-client-secret': env.CASHFREE_SECRET_KEY,
  ...extra,
});

async function context(request, env) {
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY || !env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return { error: json({ error: 'not_configured', message: 'Partner checkout is not fully configured.' }, 501) };
  }
  const auth = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if (!match) return { error: json({ error: 'unauthorized', message: 'Sign in again before payment.' }, 401) };
  let sa, claims, accessToken;
  try {
    sa = parseServiceAccount(env);
    claims = await verifyFirebaseIdToken(match[1], sa.project_id);
    accessToken = await getServiceAccountAccessToken(env);
  } catch (_) {
    return { error: json({ error: 'unauthorized', message: 'Your sign-in expired. Sign in again.' }, 401) };
  }
  if (base(env) !== LIVE_BASE) {
    try {
      const admin = await getDoc(env, accessToken, sa.project_id, `admins/${claims.uid}`);
      if (!admin) return { error: json({ error: 'sandbox_admin_only', message: 'Cashfree sandbox is restricted to an administrator.' }, 403) };
    } catch (_) {
      return { error: json({ error: 'sandbox_access_unavailable', message: 'Could not verify sandbox access.' }, 502) };
    }
  }
  return { claims, accessToken, projectId: sa.project_id };
}

async function eligibleBooking(ctx, env, bookingId) {
  const id = safeId(bookingId);
  if (!id) return { error: json({ error: 'invalid_booking' }, 400) };
  const [booking, payConfig] = await Promise.all([
    getDoc(env, ctx.accessToken, ctx.projectId, `roomBookings/${id}`),
    getDoc(env, ctx.accessToken, ctx.projectId, 'config/partnerPayments'),
  ]);
  if (!booking) return { error: json({ error: 'not_found', message: 'Booking not found.' }, 404) };
  if (booking.guestUid !== ctx.claims.uid) return { error: json({ error: 'forbidden' }, 403) };
  if (booking.status !== 'confirmed') return { error: json({ error: 'host_confirmation_required', message: 'The host must confirm before payment.' }, 409) };
  if (booking.paymentMethod !== 'roamwise_cashfree_after_confirmation') return { error: json({ error: 'wrong_payment_method' }, 409) };
  if (!payConfig || payConfig.cashfreeEnabled !== true) return { error: json({ error: 'checkout_disabled' }, 503) };
  const workerEnvironment = base(env) === LIVE_BASE ? 'live' : 'sandbox';
  if (String(payConfig.environment || 'sandbox') !== workerEnvironment) {
    return { error: json({ error: 'environment_mismatch', message: 'Admin and Worker Cashfree environments do not match.' }, 503) };
  }
  const amount = Math.round(Number(booking.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 500000) return { error: json({ error: 'invalid_booking_amount' }, 409) };
  const partner = await getDoc(env, ctx.accessToken, ctx.projectId, `partners/${safeId(booking.partnerUid)}`);
  if (!partner || partner.verified !== true || partner.status !== 'active') return { error: json({ error: 'partner_not_active' }, 409) };
  return { id, booking, amount, payConfig };
}

async function getCashfreeOrder(env, orderId) {
  const res = await fetch(`${base(env)}/pg/orders/${encodeURIComponent(orderId)}`, { headers: headers(env) });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function handlePartnerCashfreeOrder(request, env) {
  const ctx = await context(request, env);
  if (ctx.error) return ctx.error;
  let body;
  try { body = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  const found = await eligibleBooking(ctx, env, body && body.bookingId);
  if (found.error) return found.error;
  const { id, booking, amount, payConfig } = found;

  if (booking.cashfreeOrderId) {
    const existing = await getCashfreeOrder(env, safeId(booking.cashfreeOrderId));
    if (existing.res.ok && existing.data.payment_session_id) {
      return json({
        payment_session_id: existing.data.payment_session_id,
        order_id: existing.data.order_id,
        order_amount: existing.data.order_amount,
        order_currency: existing.data.order_currency || 'INR',
        environment: base(env) === LIVE_BASE ? 'production' : 'sandbox',
        reused: true,
      });
    }
  }

  const phone = String(booking.guestPhone || '').replace(/[^+\d]/g, '');
  if (!/^\+?\d{7,15}$/.test(phone)) return json({ error: 'missing_customer_phone', message: 'Add a valid phone number to this booking.' }, 422);
  const orderId = safeId(`rwp_${id}`);
  const returnBase = String(payConfig.returnUrl || env.PAYMENT_RETURN_URL || 'https://roamwise.co.in/partner/');
  const returnUrl = /^https:\/\//.test(returnBase) ? returnBase + (returnBase.includes('?') ? '&' : '?') + 'booking=' + encodeURIComponent(id) : undefined;
  const orderBody = {
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: safeId(ctx.claims.uid),
      customer_phone: phone.slice(0, 20),
      ...(booking.guestEmail ? { customer_email: String(booking.guestEmail).slice(0, 160) } : {}),
    },
    ...(returnUrl ? { order_meta: { return_url: returnUrl } } : {}),
    order_note: String(`RoamWise stay ${booking.ref || id}`).slice(0, 200),
  };
  let res, data;
  try {
    res = await fetch(`${base(env)}/pg/orders`, {
      method: 'POST',
      headers: headers(env, { 'x-request-id': orderId, 'x-idempotency-key': orderId }),
      body: JSON.stringify(orderBody),
    });
    data = await res.json().catch(() => ({}));
  } catch (_) {
    return json({ error: 'network_error', message: 'Could not reach Cashfree.' }, 502);
  }
  if (!res.ok || !data.payment_session_id) return json({ error: 'cashfree_order_failed', message: data.message || 'Cashfree order creation failed.' }, res.status >= 400 ? res.status : 502);
  await updateDoc(env, ctx.accessToken, ctx.projectId, `roomBookings/${id}`, {
    cashfreeOrderId: data.order_id || orderId,
    paymentProvider: 'cashfree',
    paymentStatus: 'pending_payment',
    paymentOrderCreatedAt: new Date().toISOString(),
  });
  return json({
    payment_session_id: data.payment_session_id,
    order_id: data.order_id || orderId,
    order_amount: data.order_amount != null ? data.order_amount : amount,
    order_currency: data.order_currency || 'INR',
    environment: base(env) === LIVE_BASE ? 'production' : 'sandbox',
  });
}

export async function handlePartnerCashfreeStatus(request, env, bookingId) {
  const ctx = await context(request, env);
  if (ctx.error) return ctx.error;
  const found = await eligibleBooking(ctx, env, bookingId);
  if (found.error) return found.error;
  const orderId = safeId(found.booking.cashfreeOrderId);
  if (!orderId) return json({ error: 'order_not_started' }, 409);
  const { res, data } = await getCashfreeOrder(env, orderId);
  if (!res.ok) return json({ error: 'cashfree_status_failed', message: data.message || 'Could not confirm payment.' }, res.status >= 400 ? res.status : 502);
  if (String(data.order_id || '') !== orderId || Number(data.order_amount) !== found.amount || data.order_currency !== 'INR') return json({ error: 'payment_integrity_failed' }, 409);
  if (data.order_status === 'PAID') {
    await updateDoc(env, ctx.accessToken, ctx.projectId, `roomBookings/${found.id}`, {
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      paidAmount: found.amount,
      paymentProvider: 'cashfree',
    });
  }
  return json({ order_id: orderId, order_status: data.order_status || 'UNKNOWN', booking_id: found.id });
}
