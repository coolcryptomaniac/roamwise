/* Trip Wallet top-ups and RoamWise gift vouchers: a closed-loop wallet (founder decision 26 Nov 2026).
 *
 * Why this is closed-loop (RBI PPI Master Directions): the money can buy only what RoamWise itself sells and invoices
 * (wallet-core PRINCIPAL_PRODUCTS), it can never be withdrawn as cash or sent to another person, and any unused amount
 * goes back only to the payment it came from. Loads are valid 360 days (inside the 365-day advance rule of the
 * Companies (Acceptance of Deposits) Rules), the balance is capped at TOPUP_MAX_BALANCE, and vouchers are single-use,
 * fixed value, at most Rs 10,000. Loading money or buying a voucher is not a supply for GST (CBIC Circular
 * 243/37/2024); GST is charged on the invoice for what it is spent on.
 *
 * Routes: POST /wallet/topup · POST /vouchers/buy · POST /vouchers/redeem. Orders share creditorder:<id> and the
 * credit webhook/status routes (handlers/credit-packs.js), which hand paid top-ups and vouchers to onTripPaid.
 * Storage (RW_KV): voucher:<code> = { code, orderId, amount, buyer, buyerPhone, giftTo, expiresAt, status } (400 days)
 *                  vtry:<ip> = failed redeem attempts this hour · creditexp:<walletKey> while loaded money can expire */
import { json } from '../lib/http.js';
import { sendMail } from '../lib/mailer.js';
import { cfBase as CF, cfHeaders as headers } from '../lib/cashfree-pg.js';
import { PRINCIPAL_PRODUCTS, TOPUP_MIN, TOPUP_MAX_BALANCE, VOUCHER_DENOMS, CREDIT_VALID_DAYS, lotOpen, walletKey, emptyWallet,
  creditPrepaid, normEmail, normPhone, validEmail } from '../lib/wallet-core.js';
import { loadWallet, saveWallet, walletLinkFor, creditWallet } from './wallet.js';

const SITE = 'https://roamwise.co.in';
const API = 'https://roamwise-api.founder-f53.workers.dev';
const FOUNDER = 'founder@roamwise.co.in';
const DAY = 864e5;
const MAX_VOUCHERS = 20, MAX_TRIES = 10;
const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const rs = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-IN');
const where = () => Object.keys(PRINCIPAL_PRODUCTS).filter((k) => PRINCIPAL_PRODUCTS[k]).map((k) => ({ shop: 'the RoamWise shop', membership: 'RoamWise memberships', stay: 'RoamWise stays', package: 'RoamWise packages' }[k])).join(', ');
const RULES = () => ['How it works:', '- Spend it on ' + where() + '.',
  '- It cannot be withdrawn as cash or sent to anyone else.',
  '- Anything unused when it ends is refunded to the payment it came from, automatically.'];

/* Loaded money a wallet holds now (lot.scope 'roamwise'). */
export const tripMoney = (w) => (w && w.lots || []).filter((l) => lotOpen(l) && l.scope === 'roamwise').reduce((t, l) => t + l.remaining, 0);

export function newVoucherCode(rand = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  const b = rand(12); let s = '';
  for (let i = 0; i < 12; i++) s += CODE_ABC[b[i] % CODE_ABC.length];
  return 'RWG-' + s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8);
}
export const normCode = (c) => { const s = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return /^RWG[A-Z0-9]{12}$/.test(s) ? 'RWG-' + s.slice(3, 7) + '-' + s.slice(7, 11) + '-' + s.slice(11) : ''; };

/* POST /wallet/topup { amount, email, phone, acceptTerms } and POST /vouchers/buy { value, qty, email, phone, giftTo, message, acceptTerms } */
export async function createTripOrder(request, env, kind, nowMs = Date.now(), deps = {}) {
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY || !env.RW_KV) return json({ error: 'wallet_unavailable' }, 503);
  let b; try { b = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  const email = normEmail(b.email), phone = String(b.phone || '').replace(/[\s()-]/g, '');
  if (!validEmail(email) || !/^\+?\d{10,15}$/.test(phone)) return json({ error: 'contact_required', message: 'Enter your email and phone.' }, 422);
  if (b.acceptTerms !== true) return json({ error: 'terms_required', message: 'Please accept the wallet terms.' }, 422);
  let amount, extra = {};
  if (kind === 'topup') {
    amount = Math.floor(Number(b.amount));
    if (!(amount >= TOPUP_MIN && amount <= TOPUP_MAX_BALANCE)) return json({ error: 'invalid_amount', message: 'Add between ' + rs(TOPUP_MIN) + ' and ' + rs(TOPUP_MAX_BALANCE) + '.' }, 422);
    const have = tripMoney(await loadWallet(env, await walletKey(email)));
    if (have + amount > TOPUP_MAX_BALANCE) return json({ error: 'over_cap', message: 'Your Trip Wallet can hold up to ' + rs(TOPUP_MAX_BALANCE) + '. You can add ' + rs(Math.max(0, TOPUP_MAX_BALANCE - have)) + ' more.' }, 422);
    extra = { holder: email, name: 'Trip Wallet top-up' };
  } else if (kind === 'voucher') {
    const value = Number(b.value), qty = Math.floor(Number(b.qty || 1));
    if (!VOUCHER_DENOMS.includes(value)) return json({ error: 'invalid_value', message: 'Choose a voucher value.' }, 422);
    if (!(qty >= 1 && qty <= MAX_VOUCHERS)) return json({ error: 'invalid_qty', message: 'Buy 1 to ' + MAX_VOUCHERS + ' vouchers at a time.' }, 422);
    const giftTo = b.giftTo ? normEmail(b.giftTo) : '';
    if (giftTo && (!validEmail(giftTo) || qty !== 1)) return json({ error: 'gift_email', message: 'Send one voucher to one email, or buy several to share yourself.' }, 422);
    amount = value * qty;
    extra = { value, qty, giftTo, message: String(b.message || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 200), holder: giftTo || email, name: 'RoamWise gift voucher' };
  } else return json({ error: 'not_found' }, 404);
  const id = 'rwcred_' + crypto.randomUUID().replace(/-/g, '');
  const record = { id, kind, mode: kind, amount, pay: amount, email, phone, ...extra, status: 'payment_pending', createdAt: new Date(nowMs).toISOString() };
  await env.RW_KV.put('creditorder:' + id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 180 });
  const body = { order_id: id, order_amount: amount, order_currency: 'INR',
    customer_details: { customer_id: id, customer_phone: phone, customer_email: email },
    order_meta: { return_url: SITE + '/gift/?order_id=' + id, notify_url: API + '/credit/cashfree/webhook' },
    order_note: (kind === 'topup' ? 'RoamWise Trip Wallet top-up' : 'RoamWise gift voucher x' + extra.qty) };
  let r, data;
  try { r = await (deps.fetch || fetch)(CF(env) + '/pg/orders', { method: 'POST', headers: { ...headers(env), 'x-idempotency-key': id }, body: JSON.stringify(body) }); data = await r.json(); }
  catch (_) { return json({ error: 'cashfree_unreachable' }, 502); }
  if (!r.ok || !data.payment_session_id || data.order_id !== id || Number(data.order_amount) !== amount) return json({ error: 'cashfree_order_failed' }, 502);
  return json({ paymentSessionId: data.payment_session_id, orderId: id, environment: CF(env).includes('sandbox') ? 'sandbox' : 'production', amount });
}

/* Verified payment (from credit-packs onCreditPaid). Idempotent per order. */
export async function onTripPaid(env, record, nowMs = Date.now(), deps = {}) {
  const send = deps.sendMail || sendMail;
  const until = new Date(nowMs + CREDIT_VALID_DAYS * DAY).toISOString();
  if (record.kind === 'topup') {
    const key = await walletKey(record.email);
    const w = (await loadWallet(env, key)) || emptyWallet(record.email);
    const r = creditPrepaid(w, { refId: record.id, orderId: record.id, paid: record.amount, bonus: 0, phone: record.phone, note: 'Added to Trip Wallet', scope: 'roamwise', kind: 'topup' }, nowMs);
    if (!r.duplicate) { await saveWallet(env, key, r.wallet); await env.RW_KV.put('creditexp:' + key, '1'); }
    const p = normPhone(record.phone); if (p) await env.RW_KV.put('walletphone:' + p, key);
    const wl = await walletLinkFor(env, record.email, nowMs);
    await send(env, { to: record.email, subject: rs(record.amount) + ' added to your RoamWise Trip Wallet', text: [
      rs(record.amount) + ' is in your Trip Wallet, valid until ' + until.slice(0, 10) + '.', '', ...RULES(), '', wl ? 'Your wallet: ' + wl.url : '', '', '— RoamWise'].join('\n') });
  } else if (record.kind === 'voucher') {
    const codes = record.codes && record.codes.length ? record.codes : Array.from({ length: record.qty }, () => (deps.code || newVoucherCode)());
    record.codes = codes;
    for (const code of codes) {
      if (await env.RW_KV.get('voucher:' + code)) continue;
      await env.RW_KV.put('voucher:' + code, JSON.stringify({ code, orderId: record.id, amount: record.value, buyer: record.email, buyerPhone: record.phone,
        giftTo: record.giftTo, expiresAt: until, status: 'active', createdAt: new Date(nowMs).toISOString() }), { expirationTtl: 60 * 60 * 24 * 400 });
    }
    const how = ['Redeem: ' + SITE + '/gift/#redeem (enter the code with your email).', 'Valid until ' + until.slice(0, 10) + '. Single use, ' + rs(record.value) + ' each.', '', ...RULES()];
    if (record.giftTo) await send(env, { to: record.giftTo, subject: record.email + ' sent you a ' + rs(record.value) + ' RoamWise gift voucher', text: [
      record.message ? '"' + record.message + '"' : 'A gift for your next RoamWise trip.', '', 'Your code: ' + codes[0], ...how, '', '— RoamWise'].join('\n') });
    await send(env, { to: record.email, subject: 'Your RoamWise gift voucher' + (codes.length > 1 ? 's' : ''), text: [
      record.giftTo ? 'We sent your voucher to ' + record.giftTo + '. Its code, for your records: ' + codes[0] : 'Your codes:\n' + codes.join('\n'), '', ...how,
      'If a voucher is not redeemed by then, its value is refunded to your payment.', '', '— RoamWise'].join('\n') });
  } else return record;
  record.status = 'paid'; record.paidAt = new Date(nowMs).toISOString(); record.expiresAt = until;
  await env.RW_KV.put('creditorder:' + record.id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 400 });
  await send(env, { to: FOUNDER, subject: (record.kind === 'topup' ? 'Wallet top-up ' : 'Gift vouchers ') + rs(record.amount), text:
    'Order ' + record.id + ' by ' + record.email + ', ' + rs(record.amount) + (record.kind === 'voucher' ? ' (' + record.qty + ' x ' + rs(record.value) + ')' : '') + '. Not a GST supply until spent.' });
  return record;
}

/* POST /vouchers/redeem { code, email, phone }: the value lands in that email's Trip Wallet, keeping the voucher's
   expiry and its payment as the refund route. The wallet link goes to that email, so only its owner can spend it. */
export async function redeemVoucher(request, env, nowMs = Date.now(), deps = {}) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!env.RW_KV) return json({ error: 'wallet_unavailable' }, 503);
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const tries = Number(await env.RW_KV.get('vtry:' + ip)) || 0;
  if (tries >= MAX_TRIES) return json({ error: 'too_many_tries', message: 'Too many tries. Please wait an hour.' }, 429);
  let b; try { b = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  const email = normEmail(b.email), phone = String(b.phone || '').replace(/[\s()-]/g, ''), code = normCode(b.code);
  if (!validEmail(email)) return json({ error: 'contact_required', message: 'Enter your email.' }, 422);
  const v = code ? await env.RW_KV.get('voucher:' + code, 'json') : null;
  if (!v || v.status !== 'active' || Date.parse(v.expiresAt) <= nowMs) {
    await env.RW_KV.put('vtry:' + ip, String(tries + 1), { expirationTtl: 3600 });
    return json({ error: 'invalid_code', message: v && v.status === 'redeemed' ? 'This voucher has already been used.' : 'That code is not valid or has ended.' }, 404);
  }
  const key = await walletKey(email);
  const w = (await loadWallet(env, key)) || emptyWallet(email);
  if (tripMoney(w) + v.amount > TOPUP_MAX_BALANCE) return json({ error: 'over_cap', message: 'Your Trip Wallet can hold up to ' + rs(TOPUP_MAX_BALANCE) + '. Spend some first, then redeem.' }, 409);
  await env.RW_KV.put('voucher:' + code, JSON.stringify({ ...v, status: 'redeemed', redeemedBy: key, redeemedAt: new Date(nowMs).toISOString() }), { expirationTtl: 60 * 60 * 24 * 400 });
  const r = creditPrepaid(w, { refId: 'v' + code.replace(/-/g, ''), orderId: v.orderId, paid: v.amount, bonus: 0, phone, note: 'Gift voucher', scope: 'roamwise', expiresAt: v.expiresAt, kind: 'voucher' }, nowMs);
  if (!r.duplicate) { await saveWallet(env, key, r.wallet); await env.RW_KV.put('creditexp:' + key, '1'); }
  const p = normPhone(phone); if (p) await env.RW_KV.put('walletphone:' + p, key);
  const send = deps.sendMail || sendMail, wl = await walletLinkFor(env, email, nowMs);
  await send(env, { to: email, subject: rs(v.amount) + ' gift voucher added to your RoamWise Trip Wallet', text: [
    rs(v.amount) + ' is in your Trip Wallet, valid until ' + v.expiresAt.slice(0, 10) + '.', '', ...RULES(), '', wl ? 'Open your wallet: ' + wl.url : '', '', '— RoamWise'].join('\n') });
  if (v.buyer !== email) await send(env, { to: v.buyer, subject: 'Your RoamWise gift voucher was used', text: 'The ' + rs(v.amount) + ' voucher ' + code + ' was redeemed. Thank you!\n\n— RoamWise' });
  return json({ ok: true, amount: v.amount, expiresAt: v.expiresAt, sentTo: email.replace(/^(.{2}).*@/, '$1***@') });
}

/* Daily (from runCreditExpiry): remind 30 days before, refund unredeemed vouchers to the buyer's payment at expiry. */
export async function runVoucherExpiry(env, nowMs = Date.now(), deps = {}) {
  const send = deps.sendMail || sendMail;
  let cursor, refunded = 0, reminded = 0;
  do {
    const page = await env.RW_KV.list({ prefix: 'voucher:', cursor });
    for (const k of page.keys) {
      const v = await env.RW_KV.get(k.name, 'json');
      if (!v || v.status !== 'active') continue;
      const end = Date.parse(v.expiresAt);
      if (end <= nowMs) {
        await creditWallet(env, { email: v.buyer, phone: v.buyerPhone, refId: 'vexp' + v.code.replace(/-/g, ''), origins: [{ orderId: v.orderId, amount: v.amount }], note: 'Unused gift voucher ' + v.code }, nowMs);
        await env.RW_KV.put(k.name, JSON.stringify({ ...v, status: 'refunded', refundedAt: new Date(nowMs).toISOString() }), { expirationTtl: 60 * 60 * 24 * 400 });
        refunded++;
        await send(env, { to: v.buyer, subject: 'Unused RoamWise voucher refunded: ' + rs(v.amount), text: 'Voucher ' + v.code + ' was not used before it ended, so ' + rs(v.amount) + ' is on its way back to your original payment.\n\n— RoamWise' });
      } else if (end - nowMs <= 30 * DAY && !v.reminded) {
        await env.RW_KV.put(k.name, JSON.stringify({ ...v, reminded: true }), { expirationTtl: 60 * 60 * 24 * 400 });
        reminded++;
        await send(env, { to: v.giftTo || v.buyer, subject: 'Your ' + rs(v.amount) + ' RoamWise voucher ends on ' + v.expiresAt.slice(0, 10), text: 'Code ' + v.code + ' ends on ' + v.expiresAt.slice(0, 10) + '. Redeem it at ' + SITE + '/gift/#redeem.\n\n— RoamWise' });
      }
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return { refunded, reminded };
}
