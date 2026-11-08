/* Shop orders and the RoamWise wallet (same rules as stays, see stay-lifecycle.js and wallet.js):
 *   paid      -> founder gets the order with a one-tap "Refund to wallet" link; the guest gets an order email.
 *   refund    -> founder link, or Qikink could not take the order for 24 hours (fulfilmentState needs_attention):
 *                the full amount goes to the guest's wallet at once, then back to the original payment by itself.
 *   wallet    -> a signed-in guest with enough credit can pay for a shop order with it.
 * Shop orders live in Firestore shopOrders/<id>; money in the wallet is whole rupees, shop totals are paise. */
import { sendMail } from '../lib/mailer.js';
import { signLink, verifyLink } from '../lib/wallet-core.js';
import { creditWallet, walletLinkFor } from './wallet.js';

const API = 'https://roamwise-api.founder-f53.workers.dev';
const FOUNDER = 'founder@roamwise.co.in';
const AUTO_REFUND_AFTER_MS = 24 * 3600 * 1000;
const ORDER_RE = /^RWS-[A-HJKMNP-Z2-9]{10}$/;
const rs = (paise) => 'Rs ' + (paise / 100).toLocaleString('en-IN');
const itemsText = (o) => (o.lines || []).map((l) => l.qty + ' x ' + l.name + ' (' + l.variantLabel + ')').join(', ');

export function createShopWallet(deps) {
  const send = (env, m) => (deps.sendMail || sendMail)(env, m);
  const patch = (env, ctx, id, v) => deps.updateDoc(env, ctx.accessToken, ctx.projectId, 'shopOrders/' + id, { ...v, updatedAt: deps.now().toISOString() });

  /* Called right after an order becomes paid (Cashfree verified, or paid from the wallet). Never throws. */
  async function notifyPaid(env, id, order) {
    try {
      const refund = env.WALLET_LINK_SECRET ? API + '/shop/decide?o=' + id + '&a=refund&t=' + await signLink(env.WALLET_LINK_SECRET, 'shop', id + ':refund', deps.now().getTime() + 14 * 24 * 3600 * 1000) : '';
      await send(env, { to: FOUNDER, subject: 'Shop order paid: ' + id + ' · ' + rs(order.totalPaise), text: [
        itemsText(order), 'Paid: ' + rs(order.totalPaise) + ' by ' + (order.method === 'wallet' ? 'wallet credit' : order.method),
        'Buyer: ' + (order.customer && order.customer.name) + ' · ' + (order.customer && order.customer.email) + ' · ' + (order.customer && order.customer.phone),
        'Ships to PIN ' + (order.ship && order.ship.pin) + '. It goes to Qikink automatically.',
        refund ? '\nRefund to the buyer\'s wallet (cancel): ' + refund : '',
        'If Qikink cannot take the order for 24 hours, the buyer is refunded to the wallet automatically.',
      ].join('\n') });
      if (order.customer && order.customer.email) await send(env, { to: order.customer.email, subject: 'Order received: ' + id, text: [
        'Thank you! We have received ' + rs(order.totalPaise) + ' for ' + itemsText(order) + '.',
        'Your order ID: ' + id + '. It is made on demand and usually dispatched in 3 to 5 working days; we will share tracking.',
        'If we cannot fulfil it, the full amount goes straight to your RoamWise wallet and back to your bank automatically.',
        '', '— RoamWise',
      ].join('\n') });
    } catch (_) { /* email is best effort */ }
  }

  /* Full amount to the buyer's wallet. Idempotent (wallet refId = order id). */
  async function refundToWallet(env, ctx, id, order, reason) {
    if (order.status === 'refunded_to_wallet') return { ok: true, duplicate: true };
    if (order.status !== 'paid') return { ok: false, error: 'not_paid' };
    const email = order.customer && order.customer.email;
    if (!email) return { ok: false, error: 'no_email' };
    const origins = Array.isArray(order.paidFromLots) && order.paidFromLots.length
      ? order.paidFromLots.map((l) => ({ orderId: l.orderId, amount: l.amount, method: l.method || 'cashfree' }))
      : [{ orderId: order.cashfreeOrderId || id, amount: Math.round(order.totalPaise / 100), method: order.method === 'upi' ? 'upi' : 'cashfree' }];
    const nowMs = deps.now().getTime();
    const r = await creditWallet(env, { email, phone: order.customer.phone, refId: id, origins, note: 'Refund: shop order ' + id }, nowMs);
    const shipped = order.fulfilmentState === 'submitted';
    await patch(env, ctx, id, { status: 'refunded_to_wallet', refundReason: reason, refundedAt: new Date(nowMs).toISOString(), fulfilmentState: shipped ? 'submitted' : 'cancelled' });
    const wl = await walletLinkFor(env, email, nowMs);
    await send(env, { to: email, subject: rs(order.totalPaise) + ' is in your RoamWise wallet', text: [
      'We could not complete your shop order ' + id + '. Sorry about that.', rs(order.totalPaise) + ' is in your RoamWise wallet right now.',
      'Use it for another order or a stay, or do nothing: it goes back to your original payment on ' + String(r.releaseAt || '').slice(0, 10) + '.',
      wl ? 'Your wallet: ' + wl.url : '', '— RoamWise'].join('\n') });
    if (shipped) await send(env, { to: FOUNDER, subject: 'Cancel at Qikink: ' + id, text: 'Order ' + id + ' was refunded to the buyer wallet but had already been sent to Qikink (' + (order.qikinkOrderId || '') + '). Cancel it in the Qikink dashboard if it has not shipped.' });
    return { ok: true, releaseAt: r.releaseAt };
  }

  /* GET /shop/decide?o=&a=refund&t= */
  async function handleShopDecide(request, env) {
    const u = new URL(request.url), id = u.searchParams.get('o') || '', t = u.searchParams.get('t') || '';
    const html = (title, msg) => new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:17px system-ui;background:#100c1c;color:#fff0dc;padding:28px;max-width:560px;margin:auto"><h1 style="color:#f8c985">' + title + '</h1><p>' + msg + '</p>', { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    if (!ORDER_RE.test(id) || u.searchParams.get('a') !== 'refund' || !(await verifyLink(env.WALLET_LINK_SECRET, 'shop', id + ':refund', t, deps.now().getTime()))) return html('Link not valid', 'This link has expired or is not valid.');
    const ctx = await deps.context(env);
    if (ctx.error) return html('Try again', 'The shop is unavailable for a moment. Try the link again shortly.');
    const order = await deps.getDoc(env, ctx.accessToken, ctx.projectId, 'shopOrders/' + id);
    if (!order) return html('Not found', 'No such order.');
    const r = await refundToWallet(env, ctx, id, order, 'founder_refund');
    return r.ok ? html('Refunded', rs(order.totalPaise) + ' is in the buyer\'s RoamWise wallet and they have been told.') : html('Not refunded', 'This order is ' + order.status + '.');
  }

  /* Hourly: paid orders Qikink could not take for 24 hours go to the buyer's wallet. */
  async function runShopRefundCron(env) {
    const ctx = await deps.context(env);
    if (ctx.error) return { skipped: 'backend_unavailable' };
    let rows = [];
    try { rows = await deps.queryEqualsString(env, ctx.accessToken, ctx.projectId, 'shopOrders', 'fulfilmentState', 'needs_attention', 100); } catch (_) { return { skipped: 'query_failed' }; }
    let refunded = 0;
    for (const row of rows) {
      const o = row.data || row, id = row.id || o.orderId;
      if (o.status !== 'paid' || deps.now().getTime() - Date.parse(o.paidAt || o.updatedAt) < AUTO_REFUND_AFTER_MS) continue;
      const r = await refundToWallet(env, ctx, id, o, 'not_fulfilled');
      if (r.ok && !r.duplicate) refunded++;
    }
    return { refunded };
  }

  return { notifyPaid, refundToWallet, handleShopDecide, runShopRefundCron };
}
