/* Cashfree PG basics shared by stay checkout and the wallet (base URL, headers, order lookup, refunds).
   CASHFREE_ENV = "live" uses production; anything else uses sandbox. */
export const cfBase = (env) => (String(env.CASHFREE_ENV || 'sandbox') === 'live' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com');
export const cfHeaders = (env, extra) => ({
  'content-type': 'application/json', 'x-api-version': env.CASHFREE_API_VERSION || '2025-01-01',
  'x-client-id': env.CASHFREE_APP_ID, 'x-client-secret': env.CASHFREE_SECRET_KEY, ...(extra || {}),
});
export const cfConfigured = (env) => !!(env && env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY);

/* Refund (part of) a PAID order to the original payment method. refundId must be 3-40 chars and is the
   idempotency key: retrying the same refundId can never pay out twice. Never throws. */
export async function cfRefund(env, { orderId, amount, refundId, note }, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(cfBase(env) + '/pg/orders/' + encodeURIComponent(orderId) + '/refunds', {
      method: 'POST', headers: cfHeaders(env, { 'x-idempotency-key': refundId }),
      body: JSON.stringify({ refund_amount: amount, refund_id: refundId, refund_note: String(note || 'RoamWise refund').slice(0, 100) }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, refundId, status: String(d.refund_status || 'PENDING') };
    /* Already created with this id (a retry): treat as done. */
    if (res.status === 409 || /already exists/i.test(String(d.message || ''))) return { ok: true, refundId, status: 'DUPLICATE' };
    return { ok: false, error: String(d.message || d.code || ('http ' + res.status)) };
  } catch (e) { return { ok: false, error: 'cashfree_unreachable' }; }
}
