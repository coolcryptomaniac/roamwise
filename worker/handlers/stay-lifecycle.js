/* What happens to a paid stay, with nobody watching (founder decision, 8 Nov 2026):
 *   paid      -> the host (Amor's desk, or the founder for RoamWise stays) gets Confirm / Can't host / Need more time
 *                links, the founder gets Confirm / Refund links, and the guest is told what happens next.
 *   confirm   -> guest is told the stay is confirmed.
 *   can't host, founder refund, or no answer by the deadline (24 h, or 72 h after one "need more time")
 *             -> the full amount goes to the guest's RoamWise wallet at once; from there it goes back to the bank
 *                by itself (worker/handlers/wallet.js) unless the guest keeps it or books another stay.
 * Links are HMAC-signed with WALLET_LINK_SECRET and expire after 7 days. Orders live in RW_KV (stayorder:<id>);
 * open decisions are indexed as staydue:<id> so the hourly job only reads what it must. */
import { sendMail } from '../lib/mailer.js';
import { signLink, verifyLink } from '../lib/wallet-core.js';
import { creditWallet, walletLinkFor } from './wallet.js';

export const DECIDE_FIRST_MS = 24 * 3600 * 1000;
export const DECIDE_MAX_MS = 72 * 3600 * 1000;
const API = 'https://roamwise-api.founder-f53.workers.dev';
const SITE = 'https://roamwise.co.in';
const TTL = { expirationTtl: 60 * 60 * 24 * 180 };
const ACTIONS = { confirm: 'host', decline: 'host', extend: 'host', fconfirm: 'founder', refund: 'founder' };
const ORDER_RE = /^rwstay_[a-f0-9]{32}$/;
const FOUNDER = 'founder@roamwise.co.in';

const getOrder = (env, id) => env.RW_KV.get('stayorder:' + id, 'json');
const putOrder = (env, r) => env.RW_KV.put('stayorder:' + r.id, JSON.stringify(r), TTL);
const rs = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-IN');

async function link(env, id, action, nowMs) {
  const t = await signLink(env.WALLET_LINK_SECRET, 'decide', id + ':' + action, nowMs + 7 * 24 * 3600 * 1000);
  return API + '/stays/decide?o=' + id + '&a=' + action + '&t=' + t;
}

/* Called once when a stay order is verified PAID (webhook or status poll). Idempotent. */
export async function onStayPaid(env, record, nowMs = Date.now(), deps = {}) {
  if (record.decisionDue) return record;
  const send = deps.sendMail || sendMail;
  record.status = 'paid_pending_confirmation';
  record.paidAt = record.paidAt || new Date(nowMs).toISOString();
  record.decisionDue = new Date(nowMs + DECIDE_FIRST_MS).toISOString();
  await putOrder(env, record);
  await env.RW_KV.put('staydue:' + record.id, record.decisionDue, TTL);
  if (env.WALLET_LINK_SECRET) {
    const L = {};
    for (const a of Object.keys(ACTIONS)) L[a] = await link(env, record.id, a, nowMs);
    record.hostLinks = { confirm: L.confirm, decline: L.decline, extend: L.extend };
    await send(env, { to: FOUNDER, subject: 'Paid stay ' + record.id.slice(-6) + ': confirm or refund', text: [
      record.property + ' · ' + record.checkin + ' to ' + record.checkout + ' · ' + record.nights + ' night(s)',
      'Paid: ' + rs(record.amount) + (record.kind === 'advance' ? ' (booking advance)' : ''),
      'Guest: ' + record.email + ' · ' + record.phone,
      '', 'Confirm (room is booked): ' + L.fconfirm, 'Refund to guest wallet now: ' + L.refund,
      '', 'Links for the host (forward on WhatsApp if needed):', 'Confirm: ' + L.confirm, "Can't host: " + L.decline, 'Need more time (once, up to 72 h): ' + L.extend,
      '', 'If nobody answers by ' + record.decisionDue + ' the money goes to the guest wallet automatically.',
    ].join('\n') });
  }
  await send(env, { to: record.email, subject: 'Payment received: ' + record.property, text: [
    'Namaste! We have received ' + rs(record.amount) + ' for ' + record.property + ', ' + record.checkin + ' to ' + record.checkout + '.',
    'Your reference: ' + record.id, '',
    'We are confirming the room with the property now and will write to you within 24 hours.',
    ...(record.balance > 0 ? ['This was your advance. The balance of ' + rs(record.balance) + ' is due by ' + record.balanceDueBy + '; we send the payment link once the booking is confirmed.'] : []),
    ...(record.nonRefundable ? ['These festive dates are non-refundable at the property once confirmed.'] : []),
    'If the room cannot be confirmed, the full amount goes straight to your RoamWise wallet. You can book another stay with it, or it is sent back to your bank automatically after 24 hours.',
    '', 'Questions: reply to this email or write to support@roamwise.co.in.', '— RoamWise',
  ].join('\n') });
  await putOrder(env, record);
  return record;
}

/* Full amount back to the guest's wallet. origins keep the money tied to the Cashfree payments it came from. */
export async function refundStayToWallet(env, record, reason, nowMs = Date.now(), deps = {}) {
  if (record.status === 'refunded_to_wallet') return { ok: true, duplicate: true };
  const origins = Array.isArray(record.paidFromLots) && record.paidFromLots.length
    ? record.paidFromLots.map((l) => ({ orderId: l.orderId, amount: l.amount, method: l.method, source: l.source, expiresAt: l.expiresAt, paidLot: l.paidLot, paidAt: l.paidAt }))
    : [{ orderId: record.id, amount: record.amount }];
  const r = await creditWallet(env, { email: record.email, phone: record.phone, refId: record.id, origins,
    note: 'Refund: ' + record.property + ' ' + record.checkin }, nowMs);
  record.status = 'refunded_to_wallet'; record.refundedAt = new Date(nowMs).toISOString(); record.refundReason = reason;
  await putOrder(env, record);
  await env.RW_KV.delete('staydue:' + record.id);
  const send = deps.sendMail || sendMail;
  const wl = await walletLinkFor(env, record.email, nowMs);
  await send(env, { to: record.email, subject: rs(record.amount) + ' is in your RoamWise wallet', text: [
    'We could not confirm ' + record.property + ' for ' + record.checkin + '. Sorry about that.',
    rs(record.amount) + ' is in your RoamWise wallet right now.', '',
    'Book another stay with it: ' + SITE + '/packages/amor-checkout.html' + (wl ? '?wallet=' + encodeURIComponent(wl.token) : ''),
    'Or do nothing: it goes back to your original payment method automatically on ' + (r.releaseAt || '').slice(0, 10) + '.',
    wl ? 'Your wallet: ' + wl.url : '', '', '— RoamWise',
  ].filter((x) => x !== null).join('\n') });
  return { ok: true, releaseAt: r.releaseAt };
}

async function confirmStay(env, record, by, nowMs, deps = {}) {
  if (record.status !== 'paid_pending_confirmation') return false;
  record.status = 'confirmed'; record.confirmedAt = new Date(nowMs).toISOString(); record.confirmedBy = by;
  await putOrder(env, record);
  await env.RW_KV.delete('staydue:' + record.id);
  await (deps.sendMail || sendMail)(env, { to: record.email, subject: 'Confirmed: ' + record.property, text: [
    'Your stay at ' + record.property + ' is confirmed: ' + record.checkin + ' to ' + record.checkout + '.',
    'Reference: ' + record.id + (record.kind === 'advance' ? '. Your ' + rs(record.amount) + ' advance is adjusted in the final bill.' : '.'),
    ...(record.balance > 0 ? ['Balance ' + rs(record.balance) + ' is due by ' + record.balanceDueBy + '. Pay it here (use the email you booked with): ' + SITE + '/packages/amor-checkout.html?balance=' + record.id] : []),
    '', 'Have a lovely trip! — RoamWise',
  ].join('\n') });
  return true;
}

const page = (title, msg) => new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title
  + '</title><body style="font:17px system-ui;background:#100c1c;color:#fff0dc;padding:28px;max-width:560px;margin:auto"><h1 style="color:#f8c985">' + title + '</h1><p>' + msg + '</p><p><a style="color:#ffd08a" href="' + SITE + '">RoamWise</a></p>',
{ status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

/* GET /stays/decide?o=&a=&t= (signed link from the paid-booking email). */
export async function handleStayDecide(request, env, nowMs = Date.now(), deps = {}) {
  const u = new URL(request.url), id = u.searchParams.get('o') || '', a = u.searchParams.get('a') || '', t = u.searchParams.get('t') || '';
  if (!ORDER_RE.test(id) || !ACTIONS[a] || !env.RW_KV || !(await verifyLink(env.WALLET_LINK_SECRET, 'decide', id + ':' + a, t, nowMs))) return page('Link not valid', 'This link has expired or is not valid. Write to support@roamwise.co.in.');
  const record = await getOrder(env, id);
  if (!record) return page('Booking not found', 'We could not find this booking.');
  if (record.status === 'confirmed') return page('Already confirmed', record.property + ' is confirmed for ' + record.checkin + '.');
  if (record.status === 'refunded_to_wallet') return page('Already refunded', 'This booking was refunded to the guest wallet.');
  if (record.status !== 'paid_pending_confirmation') return page('Not paid yet', 'This booking has no verified payment.');
  if (a === 'confirm' || a === 'fconfirm') { await confirmStay(env, record, a === 'confirm' ? 'host' : 'founder', nowMs, deps); return page('Confirmed. Thank you!', record.property + ', ' + record.checkin + ' to ' + record.checkout + '. The guest has been told.'); }
  if (a === 'extend') {
    if (record.extended) return page('Already extended', 'More time was already given. Please confirm or decline before ' + record.decisionDue + '.');
    record.extended = true;
    record.decisionDue = new Date(Math.min(Date.parse(record.paidAt) + DECIDE_MAX_MS, nowMs + 48 * 3600 * 1000)).toISOString();
    await putOrder(env, record); await env.RW_KV.put('staydue:' + id, record.decisionDue, TTL);
    return page('More time given', 'Please confirm or decline before ' + record.decisionDue.replace('T', ' ').slice(0, 16) + ' UTC.');
  }
  await refundStayToWallet(env, record, a === 'decline' ? 'host_declined' : 'founder_refund', nowMs, deps);
  return page('Refunded', 'The guest has the full amount in their RoamWise wallet and has been told.');
}

/* Hourly: decisions past their deadline go to the guest wallet. */
export async function runStayDeadlines(env, nowMs = Date.now(), deps = {}) {
  if (!env.RW_KV) return { checked: 0, refunded: 0 };
  let cursor, checked = 0, refunded = 0;
  do {
    const page = await env.RW_KV.list({ prefix: 'staydue:', cursor });
    for (const k of page.keys) {
      checked++;
      const id = k.name.slice(8), record = await getOrder(env, id);
      if (!record || record.status !== 'paid_pending_confirmation') { await env.RW_KV.delete(k.name); continue; }
      if (Date.parse(record.decisionDue) <= nowMs) { await refundStayToWallet(env, record, 'no_answer', nowMs, deps); refunded++; }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return { checked, refunded };
}

