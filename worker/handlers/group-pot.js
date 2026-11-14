/* ============================================================================
   worker/handlers/group-pot.js — "pay your share" for group and stranger trips
   ============================================================================
   POST /group/create            organiser: stay/package quote body + shares + contact -> pot + share link
   GET  /group/<potId>           public progress (no contacts)
   POST /group/<potId>/join      member: name/email/phone -> Cashfree order for ONE share
   GET  /group/order/<orderId>   return-page poll (verifies with Cashfree)
   POST /group/cashfree/webhook  signed Cashfree webhook
   runGroupPots(env)             hourly: refunds pots that missed their deadline

   Money rules (separate payments review, AI-ROLES rule 7):
   - Every amount is priced here (priceFull, same as /stays/checkout); the browser never sends one.
   - A member pays exactly one share. Nothing is booked until EVERY share is paid.
   - All paid -> one stay order (rwstay_) is created and runs the normal paid-stay flow
     (host confirms within 24 h, or the money is refunded). That order remembers each
     member's own payment, so a refund goes back to each member's own wallet.
   - Deadline missed -> each paid member's share goes to their own RoamWise wallet at once
     (and back to their original payment method after the usual hold, or they rebook with it).
   - A payment that lands on a share someone else already paid (rare race) is refunded the same way.
   Named exports only. */
import { json } from '../lib/http.js';
import { verifyCashfreeWorkerWebhook } from '../lib/cashfree-booking-webhook-verify.js';
import { cfBase as CF, cfHeaders as headers } from '../lib/cashfree-pg.js';
import { ensureAmorRates } from '../lib/amor-rates-store.js';
import { sendMail } from '../lib/mailer.js';
import { priceFull, isAmor, alertSupplier } from './stay-cashfree.js';
import { onStayPaid } from './stay-lifecycle.js';
import { creditWallet } from './wallet.js';
import { splitShares, potDeadline, freeSlot, paidCount, publicPot, PENDING_MS } from '../lib/group-pot-core.js';

const SITE = 'https://roamwise.co.in', API = 'https://roamwise-api.founder-f53.workers.dev';
const TTL = { expirationTtl: 60 * 60 * 24 * 180 };
const POT_RE = /^rwpot_[a-f0-9]{24}$/, ORDER_RE = /^rwgrp_[a-f0-9]{32}$/;
const hex = (n) => crypto.randomUUID().replace(/-/g, '').slice(0, n);
const rs = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-IN');
const first = (n) => String(n || '').trim().split(/\s+/)[0].slice(0, 20);
const contactOk = (c) => /^\+?\d{10,15}$/.test(String(c.phone || '').replace(/[\s()-]/g, '')) && /^\S+@\S+\.\S+$/.test(String(c.email || '').trim()) && String(c.name || '').trim().length >= 2;
const clean = (c) => ({ name: String(c.name).trim().slice(0, 60), first: first(c.name), email: String(c.email).trim().toLowerCase().slice(0, 120), phone: String(c.phone).replace(/[\s()-]/g, '') });
const getPot = (env, id) => env.RW_KV.get('pot:' + id, 'json');
const putPot = (env, pot) => env.RW_KV.put('pot:' + pot.id, JSON.stringify(pot), TTL);

export async function handleGroup(request, env, path, nowMs = Date.now()){
  if (!env.RW_KV) return json({ error: 'group_unavailable' }, 503);
  if (path === 'group/create' && request.method === 'POST') return createPot(request, env, nowMs);
  if (path === 'group/cashfree/webhook' && request.method === 'POST') return groupWebhook(request, env, nowMs);
  let m = /^group\/order\/(rwgrp_[a-f0-9]{32})$/.exec(path);
  if (m && request.method === 'GET') return orderStatus(env, m[1], nowMs);
  m = /^group\/(rwpot_[a-f0-9]{24})(\/join)?$/.exec(path);
  if (m && !m[2] && request.method === 'GET') { const pot = await getPot(env, m[1]); return pot ? json(publicPot(pot, nowMs)) : json({ error: 'not_found' }, 404); }
  if (m && m[2] && request.method === 'POST') return joinPot(request, env, m[1], nowMs);
  return json({ error: 'not_found' }, 404);
}

async function createPot(request, env, nowMs){
  let b; try { b = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  if (!contactOk(b.organiser || {})) return json({ error: 'contact_required', message: 'Add your name, email and mobile number.' }, 422);
  await ensureAmorRates(env);
  let quote, supplierNet, amounts, deadline;
  try {
    ({ quote, supplierNet } = priceFull(b, nowMs));
    amounts = splitShares(quote.amount, b.shares);
    deadline = potDeadline(quote.checkin, b.deadlineHours, nowMs);
  } catch (e) { return json({ error: 'invalid_group', message: e.message }, 422); }
  const id = 'rwpot_' + hex(24);
  const pot = { id, status: 'collecting', quote, ...(supplierNet ? { supplierNet } : {}), organiser: clean(b.organiser),
    shareWithSupplier: b.shareWithSupplier === true, deadline, createdAt: new Date(nowMs).toISOString(),
    slots: amounts.map((amount) => ({ amount, paid: false })) };
  await putPot(env, pot);
  await env.RW_KV.put('potdue:' + id, deadline, TTL);
  const url = SITE + '/group/?pot=' + id;
  await sendMail(env, { to: pot.organiser.email, subject: 'Your group link: ' + quote.property, text: [
    'Namaste ' + pot.organiser.first + '! Your group payment for ' + quote.property + ' (' + quote.checkin + ' to ' + quote.checkout + ') is open.',
    'Total ' + rs(quote.amount) + ', split into ' + amounts.length + ' shares of about ' + rs(amounts[amounts.length - 1]) + '.',
    'Share this link with your group (you pay your own share from it too): ' + url,
    'Everyone must pay by ' + deadline.slice(0, 16).replace('T', ' ') + ' UTC. If the group is not complete by then, everyone who paid gets their share back in their RoamWise wallet straight away.',
    '', '— RoamWise',
  ].join('\n') }).catch(() => null);
  return json({ ok: true, potId: id, url, shareAmounts: amounts, deadline, quote });
}

async function joinPot(request, env, potId, nowMs){
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) return json({ error: 'group_checkout_unavailable' }, 503);
  let b; try { b = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  if (!contactOk(b) || b.acceptTerms !== true) return json({ error: 'contact_required', message: 'Add your name, email and mobile, and accept the terms.' }, 422);
  const pot = await getPot(env, potId);
  if (!pot) return json({ error: 'not_found' }, 404);
  if (pot.status !== 'collecting' || Date.parse(pot.deadline) <= nowMs) return json({ error: 'closed', message: 'This group payment is closed.' }, 409);
  const slot = freeSlot(pot, nowMs);
  if (slot < 0) return json({ error: 'full', message: 'Every share is paid or being paid right now. Try again in 30 minutes.' }, 409);
  const who = clean(b), orderId = 'rwgrp_' + hex(32), amount = pot.slots[slot].amount;
  const member = { orderId, potId, slot, amount, ...who, status: 'payment_pending', createdAt: new Date(nowMs).toISOString() };
  await env.RW_KV.put('grpm:' + orderId, JSON.stringify(member), TTL);
  pot.slots[slot] = { ...pot.slots[slot], orderId, pendingUntil: new Date(nowMs + PENDING_MS).toISOString() };
  await putPot(env, pot);
  const body = { order_id: orderId, order_amount: amount, order_currency: 'INR',
    customer_details: { customer_id: orderId, customer_phone: who.phone, customer_email: who.email, customer_name: who.name },
    order_meta: { return_url: SITE + '/group/?pot=' + potId + '&order_id=' + orderId, notify_url: API + '/group/cashfree/webhook' },
    order_note: ('Group share ' + (slot + 1) + '/' + pot.slots.length + ' ' + pot.quote.property).slice(0, 190) };
  let r, data;
  try { r = await fetch(CF(env) + '/pg/orders', { method: 'POST', headers: { ...headers(env), 'x-idempotency-key': orderId }, body: JSON.stringify(body) }); data = await r.json(); }
  catch (_) { return json({ error: 'cashfree_unreachable' }, 502); }
  if (!r.ok || !data.payment_session_id || data.order_id !== orderId || Number(data.order_amount) !== amount) return json({ error: 'cashfree_order_failed' }, 502);
  return json({ paymentSessionId: data.payment_session_id, orderId, amount, environment: CF(env).includes('sandbox') ? 'sandbox' : 'production' });
}

async function verifiedPaid(env, member){
  const r = await fetch(CF(env) + '/pg/orders/' + member.orderId, { headers: headers(env) });
  if (!r.ok) throw new Error('cashfree_lookup_failed');
  const o = await r.json();
  if (o.order_id !== member.orderId || o.order_currency !== 'INR' || Number(o.order_amount) !== member.amount) throw new Error('payment_integrity_failed');
  return o.order_status === 'PAID';
}

async function refundMember(env, member, pot, reason, nowMs){
  const r = await creditWallet(env, { email: member.email, phone: member.phone, refId: member.orderId,
    origins: [{ orderId: member.orderId, amount: member.amount }], note: 'Group share refund: ' + pot.quote.property }, nowMs);
  member.status = 'refunded_to_wallet'; member.refundReason = reason;
  await env.RW_KV.put('grpm:' + member.orderId, JSON.stringify(member), TTL);
  await sendMail(env, { to: member.email, subject: rs(member.amount) + ' is back in your RoamWise wallet', text: [
    'Hi ' + member.first + ', ' + reason, rs(member.amount) + ' is in your RoamWise wallet now. Use it for any RoamWise stay, or do nothing and it goes back to your original payment method automatically' + (r && r.releaseAt ? ' on ' + r.releaseAt.slice(0, 10) : '') + '.',
    '', '— RoamWise',
  ].join('\n') }).catch(() => null);
}

/* Idempotent: called by the webhook and by the return-page poll. */
export async function onMemberPaid(env, member, nowMs = Date.now()){
  if (member.status !== 'payment_pending') return { duplicate: true };
  const pot = await getPot(env, member.potId);
  member.status = 'paid'; member.paidAt = new Date(nowMs).toISOString();
  await env.RW_KV.put('grpm:' + member.orderId, JSON.stringify(member), TTL);
  const slot = pot && pot.slots[member.slot];
  if (!pot || pot.status !== 'collecting' || !slot || (slot.paid && slot.orderId !== member.orderId)) {
    await refundMember(env, member, pot || { quote: { property: 'your group stay' } }, 'your payment reached a group share that was already paid or closed, so it was not used.', nowMs);
    return { refunded: true };
  }
  pot.slots[member.slot] = { amount: slot.amount, orderId: member.orderId, paid: true, first: member.first, email: member.email, phone: member.phone };
  const done = paidCount(pot) === pot.slots.length;
  await sendMail(env, { to: member.email, subject: 'Share received: ' + pot.quote.property, text: [
    'Thanks ' + member.first + '! We received your share of ' + rs(member.amount) + ' for ' + pot.quote.property + ' (' + pot.quote.checkin + ' to ' + pot.quote.checkout + ').',
    done ? 'Everyone has paid, so we are confirming the booking with the property now.' : paidCount(pot) + ' of ' + pot.slots.length + ' shares are paid. The stay is booked only when everyone has paid by ' + pot.deadline.slice(0, 16).replace('T', ' ') + ' UTC; otherwise your share comes back to your RoamWise wallet.',
    'Group page: ' + SITE + '/group/?pot=' + pot.id, '', '— RoamWise',
  ].join('\n') }).catch(() => null);
  if (!done) { await putPot(env, pot); return { paid: true }; }
  /* Everyone paid: one stay order in the normal paid-stay flow, remembering each member's payment. */
  const id = 'rwstay_' + crypto.randomUUID().replace(/-/g, '');
  const members = pot.slots.map((s) => ({ orderId: s.orderId, amount: s.amount, email: s.email, phone: s.phone, first: s.first }));
  const record = { ...pot.quote, id, email: pot.organiser.email, phone: pot.organiser.phone, shareWithSupplier: pot.shareWithSupplier,
    status: 'payment_pending', confirmed: false, createdAt: new Date(nowMs).toISOString(), group: pot.id, groupMembers: members,
    paidWith: 'group', ...(pot.supplierNet ? { supplierNet: pot.supplierNet } : {}) };
  pot.status = 'complete'; pot.stayOrderId = id;
  await putPot(env, pot);
  await env.RW_KV.delete('potdue:' + pot.id);
  await env.RW_KV.put('stayorder:' + id, JSON.stringify(record), TTL);
  await onStayPaid(env, record, nowMs);
  if (isAmor(record)) await alertSupplier(env, record).catch(() => null);
  return { paid: true, booked: id };
}

async function orderStatus(env, orderId, nowMs){
  const member = await env.RW_KV.get('grpm:' + orderId, 'json');
  if (!member) return json({ error: 'not_found' }, 404);
  if (member.status === 'payment_pending') {
    let paid; try { paid = await verifiedPaid(env, member); } catch (e) { return json({ error: String(e.message) }, 409); }
    if (paid) await onMemberPaid(env, member, nowMs);
  }
  const pot = await getPot(env, member.potId);
  return json({ orderId, status: member.status, pot: pot ? publicPot(pot, nowMs) : null });
}

async function groupWebhook(request, env, nowMs){
  if (!env.CASHFREE_SECRET_KEY) return json({ error: 'not_configured' }, 503);
  const raw = new Uint8Array(await request.arrayBuffer());
  if (!raw.length || raw.length > 65536) return json({ error: 'invalid_payload' }, 400);
  let valid = false;
  try { valid = await verifyCashfreeWorkerWebhook({ rawBody: raw, headers: request.headers, secret: env.CASHFREE_SECRET_KEY, now: () => Date.now() }); } catch (_) { return json({ error: 'signature_check_failed' }, 503); }
  if (!valid) return json({ error: 'invalid_signature' }, 401);
  let event; try { event = JSON.parse(new TextDecoder().decode(raw)); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  const id = event && event.data && event.data.order && event.data.order.order_id;
  if (event.type !== 'PAYMENT_SUCCESS_WEBHOOK' || !ORDER_RE.test(String(id))) return json({ ok: true, ignored: true });
  const member = await env.RW_KV.get('grpm:' + id, 'json');
  if (!member) return json({ ok: true, ignored: 'unknown_order' });
  let paid; try { paid = await verifiedPaid(env, member); } catch (e) { return json({ error: String(e.message) }, 409); }
  if (!paid) return json({ ok: true, ignored: 'not_paid' });
  return json({ ok: true, ...(await onMemberPaid(env, member, nowMs)) });
}

/* Hourly: pots that missed their deadline give every paid member their share back. */
export async function runGroupPots(env, nowMs = Date.now()){
  if (!env.RW_KV || typeof env.RW_KV.list !== 'function') return { skipped: true };
  const list = await env.RW_KV.list({ prefix: 'potdue:', limit: 200 });
  let refunded = 0;
  for (const k of list.keys || []) {
    const potId = k.name.slice('potdue:'.length), due = await env.RW_KV.get(k.name);
    if (!POT_RE.test(potId) || !due || Date.parse(due) > nowMs) continue;
    const pot = await getPot(env, potId);
    if (!pot || pot.status !== 'collecting') { await env.RW_KV.delete(k.name); continue; }
    pot.status = 'expired'; await putPot(env, pot);
    for (const s of pot.slots.filter((x) => x.paid)) {
      const member = await env.RW_KV.get('grpm:' + s.orderId, 'json');
      if (member && member.status === 'paid') { await refundMember(env, member, pot, 'the group did not complete payment for ' + pot.quote.property + ' in time, so nothing was booked.', nowMs); refunded++; }
    }
    pot.status = 'expired_refunded'; await putPot(env, pot);
    await env.RW_KV.delete(k.name);
    await sendMail(env, { to: pot.organiser.email, subject: 'Group payment closed: ' + pot.quote.property, text: 'Only ' + paidCount(pot) + ' of ' + pot.slots.length + ' shares were paid by the deadline, so nothing was booked. Everyone who paid has their share back in their RoamWise wallet. You can start a new group any time.\n\n— RoamWise' }).catch(() => null);
  }
  return { refunded };
}
