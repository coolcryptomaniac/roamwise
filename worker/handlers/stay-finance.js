/* Stay money after payment, with RoamWise as principal seller (founder decision 26 Nov 2026):
 *   1. GST invoice: every verified stay payment becomes a `payments/stay_<order>_<part>` Firestore record carrying its
 *      tax lines (lib/principal-tax.js). The daily invoice sweep (lib/invoice-sweep.js) turns it into a numbered,
 *      hash-chained RoamWise tax invoice. Agent-model bookings are invoiced for RoamWise's fee only.
 *   2. Partner payout: once the partner accepts the booking (stay-lifecycle confirm), the partner's net rate for what
 *      the guest has paid so far is queued and paid the same day (PAYOUT_WHEN=checkin pays on the check-in day).
 *      Founder decision 26 Nov 2026: pay by hand. If RoamWise has no bank/UPI for the partner yet, the partner gets a
 *      signed link to send its details (and its invoice for the booking); the payout waits for them.
 *      With Cashfree Payouts configured (CF_PAYOUT_CLIENT_ID / CF_PAYOUT_CLIENT_SECRET / CF_PAYOUT_PUBLIC_KEY and
 *      PAYOUTS_AUTO=true) the transfer goes out automatically; otherwise the founder gets the details and a signed
 *      "mark paid" link. Partner bank/UPI details live only in KV (payee:<supplier>), never in the repository.
 * Storage (RW_KV): payout:<stayId>:<n> · payee:<supplier> · invoiceq:<docId> (invoice records waiting for Firestore). */
import { json } from '../lib/http.js';
import { sendMail } from '../lib/mailer.js';
import { taxForPart, inclusiveTax, SAC, SELLER_STATE, stateCode } from '../lib/principal-tax.js';
import { createDocIfAbsent } from '../lib/firestore-rest.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { bookEntry } from './stay-books.js';

const SITE = 'https://roamwise.co.in';
const SUPPLIER_INBOX = { amor: 'sales@amorhospitality.in' };

const FOUNDER = 'founder@roamwise.co.in';
const API = 'https://roamwise-api.founder-f53.workers.dev';
const r2 = (n) => Math.round(n * 100) / 100;
const rs = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const TTL = 60 * 60 * 24 * 400;

/* Partner's net for the whole booking (tax included as they invoice it): Amor sheet costs, or a net the founder set. */
export function partnerNet(record) {
  if (Array.isArray(record.supplierNet) && record.supplierNet.length) return r2(record.supplierNet.reduce((t, l) => t + (Number(l.cost) || 0), 0));
  return Number.isFinite(record.partnerNet) ? record.partnerNet : null;
}
/* Coins are RoamWise's own discount, so they lower the invoice value; Trip Wallet money is a payment, not a discount. */
export function coinsDiscount(record) {
  if (Number.isFinite(record.coinsUsed)) return record.coinsUsed;
  return (record.paidFromLots || []).filter((l) => l.source === 'bonus' && !l.paidLot).reduce((t, l) => t + (Number(l.amount) || 0), 0);
}

/* The payment record the invoice sweep reads. part: 'first' (advance or full) or 'balance'. */
export function invoiceRecord(record, part, amount, nowMs = Date.now()) {
  const discount = part === 'first' ? Math.min(coinsDiscount(record), amount) : 0;
  const value = r2(amount - discount);
  let tax, invoiced = value, label = record.property + ' · ' + record.checkin + ' to ' + record.checkout;
  if (record.tax && record.tax.model === 'agent') {
    const net = partnerNet(record), fee = record.total && net != null ? Math.max(0, record.total - net) : 0;
    invoiced = r2(fee * value / (record.total || value));
    tax = inclusiveTax(invoiced, { rate: 0.18, sac: SAC.agent, service: 'agent_fee', pos: stateCode(record.guestState) || SELLER_STATE, label: 'Booking service fee (RoamWise as agent for ' + record.property + ')' });
    label = 'Booking service fee: ' + label;
  } else if (record.tax && record.tax.lines) {
    tax = taxForPart(record.tax, record.total || record.amount, value);
  }
  return { id: 'stay_' + record.id + '_' + part, provider: record.paidWith === 'wallet' ? 'roamwise-wallet' : 'cashfree', providerRef: part === 'balance' ? (record.balancePaidOrder || record.id + '_bal') : record.id,
    amountINR: invoiced, paidAt: new Date(nowMs).toISOString(), status: 'paid', currency: 'INR', email: record.email, customerName: record.guestName || '',
    customerState: stateCode(record.guestState) || (tax && tax.pos) || '', planId: 'stay', planLabel: label, stayId: record.id, part,
    seller: record.seller || 'RoamWise', coinsDiscount: discount, ...(tax ? { tax } : {}) };
}

async function writePayment(env, doc, deps) {
  if (deps.writePayment) return deps.writePayment(doc);
  const sa = parseServiceAccount(env), token = await getServiceAccountAccessToken(env);
  return createDocIfAbsent(env, token, sa.project_id, 'payments', doc.id, doc);
}
export async function recordStayInvoice(env, record, part, amount, nowMs = Date.now(), deps = {}) {
  if (!(amount > 0)) return null;
  const doc = invoiceRecord(record, part, amount, nowMs);
  if (!(doc.amountINR > 0)) return doc;
  try { await writePayment(env, doc, deps); }
  catch (_) { await env.RW_KV.put('invoiceq:' + doc.id, JSON.stringify(doc), { expirationTtl: TTL }); }
  try { await bookEntry(env, doc, record); } catch (_) { /* the invoice record is the source of truth */ }
  return doc;
}

/* Queue the partner's net for what the guest has paid so far (called on accept, and when a balance is paid). */
export async function queuePayout(env, record, nowMs = Date.now(), deps = {}) {
  const net = partnerNet(record), send = deps.sendMail || sendMail;
  if (record.status !== 'confirmed') return null;
  if (net == null) {
    if (!record.netAsked) { record.netAsked = true; await env.RW_KV.put('stayorder:' + record.id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 180 });
      await send(env, { to: FOUNDER, subject: 'Set the partner net for ' + record.property + ' (' + record.id.slice(-6) + ')', text: 'This booking has no partner net rate on file, so no payout was queued. Set it in RW Admin (POST /admin/stays/net) and the payout goes out the same day.' }); }
    return null;
  }
  const total = record.total || record.amount, paid = record.total ? record.total - (record.balance || 0) : record.amount;
  const target = Math.round(net * Math.min(1, paid / total)), already = record.payoutQueued || 0, due = target - already;
  if (due < 1) return null;
  const n = (record.payouts || 0) + 1, key = 'payout:' + record.id + ':' + n;
  const when = env.PAYOUT_WHEN === 'checkin' ? Math.max(nowMs, Date.parse(record.checkin + 'T00:30:00Z')) : nowMs;
  const po = { key, transferId: ('rwpo_' + record.id.slice(-20) + '_' + n).slice(0, 40), stayId: record.id, supplier: record.supplier === 'amor' ? 'amor' : (record.stay || record.supplier), property: record.property,
    amount: due, dueAt: new Date(when).toISOString(), status: 'queued', createdAt: new Date(nowMs).toISOString(), checkin: record.checkin };
  const payee = await env.RW_KV.get('payee:' + po.supplier, 'json');
  if (!payee) po.status = 'awaiting_details';
  await env.RW_KV.put(key, JSON.stringify(po), { expirationTtl: TTL });
  if (!payee) await askPayeeDetails(env, record, po, deps);
  record.payoutQueued = already + due; record.payouts = n;
  await env.RW_KV.put('stayorder:' + record.id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 180 });
  return po;
}

/* A refund after acceptance: unsent payouts are cancelled; anything already paid is flagged for recovery. */
export async function onStayRefunded(env, record, nowMs = Date.now(), deps = {}) {
  let cancelled = 0, sentAmt = 0;
  for (let n = 1; n <= (record.payouts || 0); n++) {
    const key = 'payout:' + record.id + ':' + n, po = await env.RW_KV.get(key, 'json');
    if (!po) continue;
    if (po.status === 'queued' || po.status === 'manual' || po.status === 'awaiting_details') { await env.RW_KV.put(key, JSON.stringify({ ...po, status: 'cancelled', cancelledAt: new Date(nowMs).toISOString() }), { expirationTtl: TTL }); cancelled += po.amount; }
    else if (po.status === 'sent' || po.status === 'paid') sentAmt += po.amount;
  }
  await (deps.sendMail || sendMail)(env, { to: FOUNDER, subject: 'Credit note for refunded stay ' + record.id.slice(-8), text: 'Booking ' + record.id + ' (' + record.property + ') was refunded. Issue a credit note against its RoamWise invoice(s) (payments/stay_' + record.id + '_first' + (record.balancePaidAt ? ' and _balance' : '') + ') in the GST return for this month.' });
  if (sentAmt > 0) await (deps.sendMail || sendMail)(env, { to: FOUNDER, subject: 'Recover ' + rs(sentAmt) + ' from ' + record.property, text: 'Booking ' + record.id + ' was refunded after the partner was paid ' + rs(sentAmt) + '. Recover it under their cancellation terms (or offset against the next payout).' });
  return { cancelled, sentAmt };
}

/* ---- Cashfree Payouts v2 (signature auth: Cloudflare has no fixed IP) ---- */
const pBase = (env) => (env.CF_PAYOUT_ENV === 'sandbox' ? 'https://sandbox.cashfree.com/payout' : 'https://api.cashfree.com/payout');
export const payoutsReady = (env) => !!(env.CF_PAYOUT_CLIENT_ID && env.CF_PAYOUT_CLIENT_SECRET && env.CF_PAYOUT_PUBLIC_KEY && env.PAYOUTS_AUTO === 'true');
export async function payoutSignature(clientId, pem, nowMs = Date.now()) {
  const der = Uint8Array.from(atob(String(pem).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('spki', der, { name: 'RSA-OAEP', hash: 'SHA-1' }, false, ['encrypt']);
  const enc = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(clientId + '.' + Math.floor(nowMs / 1000)));
  return btoa(String.fromCharCode(...new Uint8Array(enc)));
}
async function pHeaders(env, nowMs) {
  return { 'content-type': 'application/json', 'x-api-version': '2024-01-01', 'x-client-id': env.CF_PAYOUT_CLIENT_ID, 'x-client-secret': env.CF_PAYOUT_CLIENT_SECRET,
    'x-cf-signature': await payoutSignature(env.CF_PAYOUT_CLIENT_ID, env.CF_PAYOUT_PUBLIC_KEY, nowMs) };
}
export function transferBody(po, payee) {
  const inst = payee.vpa ? { vpa: payee.vpa } : { bank_account_number: payee.account, bank_ifsc: payee.ifsc };
  return { transfer_id: po.transferId, transfer_amount: po.amount, transfer_currency: 'INR', transfer_mode: payee.vpa ? 'upi' : 'imps',
    transfer_remarks: ('RoamWise ' + po.stayId.slice(-8) + ' ' + po.checkin).replace(/[^A-Za-z0-9 ]/g, '').slice(0, 70),
    beneficiary_details: { beneficiary_name: String(payee.name || '').replace(/[^A-Za-z ]/g, '').slice(0, 100), beneficiary_instrument_details: inst,
      ...(payee.email ? { beneficiary_contact_details: { beneficiary_email: payee.email } } : {}) } };
}

/* Signed "mark paid" link for manual payouts (founder pays by UPI/bank, then taps the link with the UTR). */
async function hmac(secret, text) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(text)))].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
export const markLink = async (env, key) => API + '/payouts/mark?k=' + encodeURIComponent(key) + '&t=' + (await hmac(env.WALLET_LINK_SECRET || 'x', 'payout|' + key));

/* Hourly: send due payouts, check sent ones, retry invoice records that could not reach Firestore. */
export async function runPartnerPayouts(env, nowMs = Date.now(), deps = {}) {
  if (!env.RW_KV) return {};
  const send = deps.sendMail || sendMail, f = deps.fetch || fetch, out = { sent: 0, manual: 0, paid: 0, failed: 0, invoices: 0 };
  let cursor;
  do {
    const page = await env.RW_KV.list({ prefix: 'payout:', cursor });
    for (const k of page.keys) {
      const po = await env.RW_KV.get(k.name, 'json'); if (!po) continue;
      const save = (p) => env.RW_KV.put(k.name, JSON.stringify(p), { expirationTtl: TTL });
      if (po.status === 'queued' && Date.parse(po.dueAt) <= nowMs) {
        const payee = await env.RW_KV.get('payee:' + po.supplier, 'json');
        if (payoutsReady(env) && payee && (payee.vpa || (payee.account && payee.ifsc))) {
          try {
            const r = await f(pBase(env) + '/transfers', { method: 'POST', headers: await pHeaders(env, nowMs), body: JSON.stringify(transferBody(po, payee)) });
            const d = await r.json().catch(() => ({}));
            if (r.ok && d.status !== 'FAILED' && d.status !== 'REJECTED') { await save({ ...po, status: 'sent', sentAt: new Date(nowMs).toISOString(), cfStatus: d.status || '', cfRef: d.cf_transfer_id || '' }); out.sent++; continue; }
            if (r.status >= 500) continue; // do not retry blindly: status is checked next hour
            po.error = String(d.message || d.status_code || r.status).slice(0, 120);
          } catch (_) { continue; }
        }
        if (!payee) { await save({ ...po, status: 'awaiting_details' }); continue; }
        await save({ ...po, status: 'manual', manualAt: new Date(nowMs).toISOString(), payeeName: payee.name, partnerGstin: payee.gstin || po.partnerGstin || '' }); out.manual++;
        await send(env, { to: FOUNDER, subject: 'Pay ' + po.property + ' ' + rs(po.amount) + ' today', text: [
          'Partner payout for booking ' + po.stayId + ' (check-in ' + po.checkin + ').', 'Amount: ' + rs(po.amount),
          'Pay to: ' + payee.name + (payee.vpa ? ' · UPI ' + payee.vpa : ' · A/c ' + payee.account + ' · IFSC ' + payee.ifsc) + (payee.verified ? '' : ' (first payment to these details: confirm them by phone with the property first)'),
          po.partnerInvoice ? 'Their invoice: ' + po.partnerInvoice + (po.partnerInvoiceGst ? ', GST ' + rs(po.partnerInvoiceGst) : '') : 'No partner invoice yet: ask for one in RoamWise\'s name (with our GSTIN) for this amount.',
          po.error ? 'Automatic transfer failed: ' + po.error : (payoutsReady(env) ? '' : 'Automatic payouts are off (set the Cashfree Payouts keys and PAYOUTS_AUTO=true).'),
          '', 'After paying, mark it paid (add &utr=YOUR_UTR): ' + await markLink(env, k.name)].filter(Boolean).join('\n') });
      } else if (po.status === 'sent' && payoutsReady(env)) {
        try {
          const r = await f(pBase(env) + '/transfers?transfer_id=' + encodeURIComponent(po.transferId), { headers: await pHeaders(env, nowMs) });
          const d = await r.json().catch(() => ({}));
          if (d.status === 'SUCCESS') { await save({ ...po, status: 'paid', paidAt: new Date(nowMs).toISOString(), utr: d.transfer_utr || '' }); out.paid++; await remit(env, po, d.transfer_utr, send); }
          else if (['FAILED', 'REJECTED', 'REVERSED', 'MANUALLY_REJECTED'].includes(d.status)) { await save({ ...po, status: 'queued', dueAt: new Date(nowMs + 864e5).toISOString(), error: d.status_code || d.status, transferId: (po.transferId.slice(0, 36) + '_r' + Math.floor(nowMs / 1e3) % 100) }); out.failed++; }
        } catch (_) { /* next hour */ }
      }
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  const iq = await env.RW_KV.list({ prefix: 'invoiceq:' });
  for (const k of iq.keys) { const doc = await env.RW_KV.get(k.name, 'json'); try { if (doc) await writePayment(env, doc, deps); await env.RW_KV.delete(k.name); out.invoices++; } catch (_) { /* next hour */ } }
  return out;
}
async function remit(env, po, utr, send) {
  const payee = await env.RW_KV.get('payee:' + po.supplier, 'json');
  if (payee && payee.email) await send(env, { to: payee.email, subject: 'RoamWise payment ' + rs(po.amount) + ' for booking ' + po.stayId.slice(-8), text: 'We have paid ' + rs(po.amount) + ' for the stay starting ' + po.checkin + (utr ? ' (UTR ' + utr + ')' : '') + '. Please send your GST invoice to RoamWise for this amount.\n\n— RoamWise' });
}

/* GET /payouts/mark?k=&t=&utr= (signed link from the founder email). */
export async function handlePayoutMark(request, env, nowMs = Date.now(), deps = {}) {
  const u = new URL(request.url), key = u.searchParams.get('k') || '', t = u.searchParams.get('t') || '', utr = (u.searchParams.get('utr') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 30);
  if (!/^payout:rwstay_[a-f0-9]{32}:\d+$/.test(key) || t !== await hmac(env.WALLET_LINK_SECRET || 'x', 'payout|' + key)) return json({ error: 'invalid_link' }, 403);
  const po = await env.RW_KV.get(key, 'json'); if (!po) return json({ error: 'not_found' }, 404);
  if (po.status === 'paid') return json({ ok: true, already: true });
  if (po.status === 'cancelled') return json({ error: 'cancelled', message: 'This payout was cancelled (booking refunded).' }, 409);
  await env.RW_KV.put(key, JSON.stringify({ ...po, status: 'paid', paidAt: new Date(nowMs).toISOString(), utr, manual: true }), { expirationTtl: TTL });
  const payee = await env.RW_KV.get('payee:' + po.supplier, 'json');
  if (payee && !payee.verified) await env.RW_KV.put('payee:' + po.supplier, JSON.stringify({ ...payee, verified: true, verifiedAt: new Date(nowMs).toISOString() }));
  await remit(env, po, utr, deps.sendMail || sendMail);
  return json({ ok: true, paid: po.amount });
}

/* Founder-only admin: payee details, partner nets for non-sheet stays, payout list. `isFounder` comes from the router. */
export async function handlePayoutAdmin(request, env, path, isFounder) {
  if (!(await isFounder(request, env))) return json({ error: 'forbidden' }, 403);
  if (path === 'admin/payees' && request.method === 'POST') {
    let b; try { b = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
    const id = String(b.supplier || '').toLowerCase(); if (!/^[a-z0-9_-]{2,40}$/.test(id)) return json({ error: 'supplier_required' }, 422);
    const vpa = /^[\w.-]{2,}@[a-z]{2,}$/i.test(String(b.vpa || '')) ? String(b.vpa) : '', acct = String(b.account || '').replace(/\D/g, ''), ifsc = String(b.ifsc || '').toUpperCase();
    if (!vpa && !(/^\d{9,18}$/.test(acct) && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))) return json({ error: 'bank_or_upi_required' }, 422);
    await env.RW_KV.put('payee:' + id, JSON.stringify({ name: String(b.name || '').slice(0, 100), vpa, account: vpa ? '' : acct, ifsc: vpa ? '' : ifsc, email: String(b.email || '').slice(0, 120), gstin: String(b.gstin || '').toUpperCase().slice(0, 15), state: stateCode(b.state) }));
    return json({ ok: true, supplier: id });
  }
  if (path === 'admin/stays/net' && request.method === 'POST') {
    let b; try { b = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
    const rec = /^rwstay_[a-f0-9]{32}$/.test(String(b.stayId)) ? await env.RW_KV.get('stayorder:' + b.stayId, 'json') : null;
    if (!rec || !(Number(b.net) > 0)) return json({ error: 'invalid' }, 422);
    rec.partnerNet = Number(b.net); await env.RW_KV.put('stayorder:' + rec.id, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 180 });
    return json({ ok: true, queued: await queuePayout(env, rec) });
  }
  if (path === 'admin/payouts' && request.method === 'GET') {
    const page = await env.RW_KV.list({ prefix: 'payout:' }), items = [];
    for (const k of page.keys.slice(-200)) { const po = await env.RW_KV.get(k.name, 'json'); if (po) items.push(po); }
    return json({ ok: true, payouts: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), auto: payoutsReady(env) });
  }
  return json({ error: 'not_found' }, 404);
}

/* ---- Partner bank/UPI details, asked once per partner when its first booking is accepted ---- */
export const payeeToken = (env, supplier, stayId) => hmac(env.WALLET_LINK_SECRET || 'x', 'payee|' + supplier + '|' + stayId);
export async function payeeLink(env, supplier, stayId) {
  return SITE + '/partners/payout-details.html?s=' + encodeURIComponent(supplier) + '&b=' + stayId + '&t=' + await payeeToken(env, supplier, stayId);
}
async function askPayeeDetails(env, record, po, deps = {}) {
  const send = deps.sendMail || sendMail, link = await payeeLink(env, po.supplier, record.id), inbox = SUPPLIER_INBOX[po.supplier];
  const text = ['RoamWise booking ' + record.id.slice(-8) + ' at ' + record.property + ' (' + record.checkin + ' to ' + record.checkout + ') is accepted.',
    'Please send the bank account or UPI ID where RoamWise should pay you ' + rs(po.amount) + ' for it, and your invoice for this amount in RoamWise\'s name:', link,
    'We pay the same day we receive them. Your details are kept only for paying you.', '', '— RoamWise'].join('\n');
  if (inbox) await send(env, { to: inbox, subject: 'Where should RoamWise pay you? (booking ' + record.id.slice(-8) + ')', text });
  await send(env, { to: FOUNDER, subject: 'Bank details needed: ' + record.property + ' ' + rs(po.amount), text: (inbox ? 'Sent to ' + inbox + '. ' : '') + 'Forward this to the property on WhatsApp if needed:\n\n' + text });
}

/* POST /payees/submit { s, b, t, name, vpa | account+ifsc, gstin, state, email, phone, invoiceNo, invoiceGst } */
export async function handlePayeeSubmit(request, env, nowMs = Date.now(), deps = {}) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let b; try { b = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  const s = String(b.s || '').toLowerCase(), stayId = String(b.b || '');
  if (!/^[a-z0-9_-]{2,40}$/.test(s) || !/^rwstay_[a-f0-9]{32}$/.test(stayId) || String(b.t || '') !== await payeeToken(env, s, stayId)) return json({ error: 'invalid_link', message: 'This link is not valid. Ask RoamWise for a new one.' }, 403);
  const vpa = /^[\w.-]{2,}@[a-z]{2,}$/i.test(String(b.vpa || '').trim()) ? String(b.vpa).trim() : '', acct = String(b.account || '').replace(/\D/g, ''), ifsc = String(b.ifsc || '').trim().toUpperCase();
  const name = String(b.name || '').replace(/[^A-Za-z .&'-]/g, '').trim().slice(0, 100);
  if (name.length < 2) return json({ error: 'name_required', message: 'Enter the account holder name.' }, 422);
  if (!vpa && !(/^\d{9,18}$/.test(acct) && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))) return json({ error: 'bank_or_upi_required', message: 'Enter a UPI ID, or an account number with its IFSC.' }, 422);
  const gstin = String(b.gstin || '').trim().toUpperCase();
  if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return json({ error: 'gstin_invalid', message: 'That GSTIN does not look right.' }, 422);
  const old = await env.RW_KV.get('payee:' + s, 'json');
  const changed = !!old && (old.vpa !== vpa || old.account !== (vpa ? '' : acct));
  await env.RW_KV.put('payee:' + s, JSON.stringify({ name, vpa, account: vpa ? '' : acct, ifsc: vpa ? '' : ifsc, gstin, state: stateCode(b.state), email: String(b.email || '').slice(0, 120),
    phone: String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 15), verified: changed ? false : !!(old && old.verified), submittedAt: new Date(nowMs).toISOString(), viaBooking: stayId }));
  const inv = String(b.invoiceNo || '').replace(/[^A-Za-z0-9/-]/g, '').slice(0, 16), invGst = Number(b.invoiceGst) >= 0 ? r2(Number(b.invoiceGst)) : null;
  const rec = await env.RW_KV.get('stayorder:' + stayId, 'json');
  for (let n = 1; rec && n <= (rec.payouts || 0); n++) {
    const key = 'payout:' + stayId + ':' + n, po = await env.RW_KV.get(key, 'json'); if (!po) continue;
    const upd = { ...po, payeeName: name, partnerGstin: gstin, ...(inv ? { partnerInvoice: inv } : {}), ...(invGst != null && inv ? { partnerInvoiceGst: invGst } : {}) };
    if (po.status === 'awaiting_details') { upd.status = 'queued'; upd.dueAt = new Date(nowMs).toISOString(); }
    await env.RW_KV.put(key, JSON.stringify(upd), { expirationTtl: TTL });
  }
  /* Other bookings of the same partner that were waiting for these details. */
  const page = await env.RW_KV.list({ prefix: 'payout:' });
  for (const k of page.keys) { const po = await env.RW_KV.get(k.name, 'json'); if (po && po.supplier === s && po.status === 'awaiting_details') await env.RW_KV.put(k.name, JSON.stringify({ ...po, status: 'queued', dueAt: new Date(nowMs).toISOString(), payeeName: name }), { expirationTtl: TTL }); }
  await (deps.sendMail || sendMail)(env, { to: FOUNDER, subject: (changed ? 'CHANGED bank details from ' : 'Bank details received from ') + name, text: (changed ? 'The payout details for "' + s + '" were changed. Call the property on a number you already have before paying.\n\n' : '') + 'Partner "' + s + '", booking ' + stayId + '. The payout email follows within the hour.' });
  return json({ ok: true });
}
