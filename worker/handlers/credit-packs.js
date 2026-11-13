/* Founding Traveller Credit: buy a credit pack with Cashfree, the credit lands in the buyer's (or a gift
 * recipient's) RoamWise wallet, and a daily job reminds members before expiry and REALLY refunds unused paid
 * credit at expiry. Pack logic: lib/credit-packs.js. Wallet rules: lib/wallet-core.js.
 *
 * Routes: GET /credit/packs · POST /credit/checkout · GET /credit/order/<id> · POST /credit/cashfree/webhook
 * Storage (RW_KV): creditorder:<id> (180 days) · credit:counts = { members, sold:{pack:n} } · credit:wall = [{n,name,pack}]
 *                  creditmember:<walletKey> = { n, packs:[...] } · creditexp:<walletKey> = '1' while the wallet holds pack credit
 * Amounts are always set here, never by the browser. Pack orders are not Pro entitlements: Pro perks are granted by
 * the founder from the email this sends (separately reviewed entitlement code is not touched). */
import { json } from '../lib/http.js';
import { sendMail } from '../lib/mailer.js';
import { verifyCashfreeWorkerWebhook } from '../lib/cashfree-booking-webhook-verify.js';
import { cfBase as CF, cfHeaders as headers } from '../lib/cashfree-pg.js';
import { priceCreditPack, publicPacks, REJOIN_WINDOW_DAYS } from '../lib/credit-packs.js';
import { walletKey, emptyWallet, creditPrepaid, expireCredit, expiringSoon, refundedAtExpiryWithin, normEmail, normPhone, validEmail } from '../lib/wallet-core.js';
import { loadWallet, saveWallet, walletLinkFor } from './wallet.js';

const SITE = 'https://roamwise.co.in';
const API = 'https://roamwise-api.founder-f53.workers.dev';
const ID_RE = /^rwcred_[a-f0-9]{32}$/;
const rs = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-IN');
const clean = (s, n) => String(s || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);

async function counts(env) { return (await env.RW_KV.get('credit:counts', 'json')) || { members: 0, sold: {} }; }
async function wall(env) { return (await env.RW_KV.get('credit:wall', 'json')) || []; }

export async function creditPacks(request, env) {
  if (!env.RW_KV) return json({ error: 'credit_unavailable' }, 503);
  const c = await counts(env);
  return json({ ok: true, ...publicPacks(c), members: c.members || 0, wall: (await wall(env)).slice(-60).reverse() });
}

export async function createCreditOrder(request, env, nowMs = Date.now(), deps = {}) {
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY || !env.RW_KV) return json({ error: 'credit_unavailable' }, 503);
  let b; try { b = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  const email = normEmail(b.email), phone = String(b.phone || '').replace(/[\s()-]/g, '');
  if (!validEmail(email) || !/^\+?\d{10,15}$/.test(phone)) return json({ error: 'contact_required', message: 'Enter your email and phone.' }, 422);
  const giftTo = b.giftTo ? normEmail(b.giftTo) : '';
  if (giftTo && !validEmail(giftTo)) return json({ error: 'gift_email', message: 'Check the gift email address.' }, 422);
  if (b.acceptTerms !== true) return json({ error: 'terms_required', message: 'Please accept the credit terms.' }, 422);
  const holder = giftTo || email;
  const w = await loadWallet(env, await walletKey(holder));
  let quote; try { quote = priceCreditPack(String(b.pack || ''), await counts(env), { rejoin: refundedAtExpiryWithin(w, nowMs, REJOIN_WINDOW_DAYS) }); }
  catch (e) { return json({ error: 'invalid_pack', message: e.message }, 422); }
  const id = 'rwcred_' + crypto.randomUUID().replace(/-/g, '');
  const record = { id, kind: 'credit_pack', ...quote, amount: quote.pay, email, phone, giftTo, holder,
    wallName: b.showOnWall === true ? clean(b.wallName, 40) : '', status: 'payment_pending', createdAt: new Date(nowMs).toISOString() };
  await env.RW_KV.put('creditorder:' + id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 180 });
  const body = { order_id: id, order_amount: quote.pay, order_currency: 'INR',
    customer_details: { customer_id: id, customer_phone: phone, customer_email: email },
    order_meta: { return_url: SITE + '/credit/?order_id=' + id, notify_url: API + '/credit/cashfree/webhook' },
    order_note: ('RoamWise ' + quote.name + ' travel credit').slice(0, 200) };
  let r, data;
  try { r = await (deps.fetch || fetch)(CF(env) + '/pg/orders', { method: 'POST', headers: { ...headers(env), 'x-idempotency-key': id }, body: JSON.stringify(body) }); data = await r.json(); }
  catch (_) { return json({ error: 'cashfree_unreachable' }, 502); }
  if (!r.ok || !data.payment_session_id || data.order_id !== id || Number(data.order_amount) !== quote.pay) return json({ error: 'cashfree_order_failed' }, 502);
  return json({ paymentSessionId: data.payment_session_id, orderId: id, environment: CF(env).includes('sandbox') ? 'sandbox' : 'production', quote });
}

/* Verified payment -> credit in the wallet, member number, counts, emails. Idempotent per order. */
export async function onCreditPaid(env, record, nowMs = Date.now(), deps = {}) {
  if (record.status !== 'payment_pending') return record;
  const send = deps.sendMail || sendMail;
  const key = await walletKey(record.holder);
  const w = (await loadWallet(env, key)) || emptyWallet(record.holder);
  const r = creditPrepaid(w, { refId: record.id, orderId: record.id, paid: record.pay, bonus: record.bonus,
    phone: record.giftTo ? '' : record.phone, note: record.name + ' pack' + (record.giftTo ? ' (gift from ' + record.email + ')' : '') }, nowMs);
  if (!r.duplicate) await saveWallet(env, key, r.wallet);
  if (!record.giftTo && normPhone(record.phone)) await env.RW_KV.put('walletphone:' + normPhone(record.phone), key);
  await env.RW_KV.put('creditexp:' + key, '1');
  const c = await counts(env);
  let member = await env.RW_KV.get('creditmember:' + key, 'json');
  if (!member) { c.members = (c.members || 0) + 1; member = { n: c.members, packs: [] }; }
  member.packs = [...member.packs, record.packId].slice(-20);
  c.sold = { ...(c.sold || {}), [record.packId]: ((c.sold || {})[record.packId] || 0) + 1 };
  await env.RW_KV.put('credit:counts', JSON.stringify(c));
  await env.RW_KV.put('creditmember:' + key, JSON.stringify(member));
  if (record.wallName) { const list = await wall(env); list.push({ n: member.n, name: record.wallName, pack: record.name }); await env.RW_KV.put('credit:wall', JSON.stringify(list.slice(-500))); }
  record.status = 'paid'; record.paidAt = new Date(nowMs).toISOString(); record.memberNo = member.n; record.expiresAt = r.expiresAt;
  await env.RW_KV.put('creditorder:' + record.id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 400 });
  const wl = await walletLinkFor(env, record.holder, nowMs);
  const until = (r.expiresAt || '').slice(0, 10);
  const terms = [
    'How your credit works:',
    '- Spend it on any RoamWise stay, package or wedding until ' + until + '. Your own ' + rs(record.pay) + ' is used first, the bonus last.',
    '- Changed your mind? Ask for your unused money back any time from your wallet; it goes to your original payment method. The matching share of the bonus is then given up.',
    '- Anything of your ' + rs(record.pay) + ' still unused on ' + until + ' is refunded automatically to your original payment method. Unused bonus credit ends that day.',
    '- This is prepaid travel credit, not an investment: it earns no interest or returns and gives no shares.',
  ];
  await send(env, { to: record.holder, subject: 'Welcome, Founding Traveller #' + member.n + ': ' + rs(record.credit) + ' travel credit', text: [
    record.giftTo ? record.email + ' has gifted you RoamWise travel credit.' : 'Thank you for backing RoamWise early.',
    '', 'Pack: ' + record.name + ' · paid ' + rs(record.pay) + ' · bonus ' + rs(record.bonus) + ' (' + record.bonusPct + '%) · credit ' + rs(record.credit),
    'Founding member number: #' + member.n, 'Your perks: ' + record.perks.join('; ') + '.',
    '', ...terms, '', wl ? 'Your wallet: ' + wl.url : '', 'Book: ' + SITE + '/#rwSalesPackages', '', '— Mohit Pandey, Founder, RoamWise',
  ].join('\n') });
  if (record.giftTo) await send(env, { to: record.email, subject: 'Your RoamWise gift is delivered', text: 'Your ' + record.name + ' pack (' + rs(record.credit) + ' travel credit) is now in ' + record.giftTo + "'s RoamWise wallet. They have been emailed.\n\nReference: " + record.id + '\n— RoamWise' });
  await send(env, { to: 'founder@roamwise.co.in', subject: 'Credit pack sold: ' + record.name + ' ' + rs(record.pay) + ' (#' + member.n + ')', text: [
    'Order ' + record.id + ', paid ' + rs(record.pay) + ', bonus ' + rs(record.bonus) + ', holder ' + record.holder + (record.giftTo ? ' (gift from ' + record.email + ')' : '') + ', phone ' + record.phone + '.',
    'Grant these perks by hand: ' + record.perks.join('; ') + '.', 'Paid credit expires ' + until + '; unused paid credit is refunded automatically that day.',
  ].join('\n') });
  return record;
}

async function verifyPaid(env, id, record, deps) {
  const r = await (deps.fetch || fetch)(CF(env) + '/pg/orders/' + id, { headers: headers(env) });
  if (!r.ok) return { error: 'cashfree_lookup_failed', status: 503 };
  const o = await r.json();
  if (o.order_id !== id || o.order_currency !== 'INR' || Number(o.order_amount) !== record.amount) return { error: 'payment_integrity_failed', status: 409 };
  return { paid: o.order_status === 'PAID', status: o.order_status };
}

export async function creditOrderStatus(request, env, id, nowMs = Date.now(), deps = {}) {
  if (!ID_RE.test(id) || !env.RW_KV) return json({ error: 'invalid_order' }, 404);
  const record = await env.RW_KV.get('creditorder:' + id, 'json');
  if (!record) return json({ error: 'not_found' }, 404);
  if (record.status === 'payment_pending') {
    const v = await verifyPaid(env, id, record, deps);
    if (v.error) return json({ error: v.error }, v.status);
    if (v.paid) await onCreditPaid(env, record, nowMs, deps);
    else return json({ orderId: id, status: v.status });
  }
  return json({ orderId: id, status: record.status, memberNo: record.memberNo, credit: record.credit, pack: record.name, expiresAt: record.expiresAt, gift: !!record.giftTo });
}

export async function handleCreditWebhook(request, env, nowMs = Date.now(), deps = {}) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!env.CASHFREE_SECRET_KEY || !env.RW_KV) return json({ error: 'not_configured' }, 503);
  const raw = new Uint8Array(await request.arrayBuffer());
  if (!raw.length || raw.length > 65536) return json({ error: 'invalid_payload' }, 400);
  let valid = false;
  try { valid = await (deps.verify || verifyCashfreeWorkerWebhook)({ rawBody: raw, headers: request.headers, secret: env.CASHFREE_SECRET_KEY, now: () => nowMs }); }
  catch (_) { return json({ error: 'signature_check_failed' }, 503); }
  if (!valid) return json({ error: 'invalid_signature' }, 401);
  let event; try { event = JSON.parse(new TextDecoder().decode(raw)); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  const id = event?.data?.order?.order_id;
  if (event.type !== 'PAYMENT_SUCCESS_WEBHOOK' || typeof id !== 'string' || !ID_RE.test(id)) return json({ ok: true, ignored: true });
  const record = await env.RW_KV.get('creditorder:' + id, 'json');
  if (!record) return json({ ok: true, ignored: 'unknown_order' });
  if (record.status !== 'payment_pending') return json({ ok: true, duplicate: true });
  const v = await verifyPaid(env, id, record, deps);
  if (v.error) return json({ error: v.error }, v.status);
  if (!v.paid) return json({ ok: true, status: v.status });
  await onCreditPaid(env, record, nowMs, deps);
  return json({ ok: true, status: 'paid' });
}

/* Daily: reminders 30 and 7 days before expiry, then expiry (paid credit -> real refund via the hourly wallet job,
   bonus lapses). The refund email comes from runWalletReleases; this one explains why and offers to rejoin. */
export async function runCreditExpiry(env, nowMs = Date.now(), deps = {}) {
  if (!env.RW_KV) return { wallets: 0 };
  const send = deps.sendMail || sendMail;
  let cursor, wallets = 0, reminded = 0, expired = 0;
  do {
    const page = await env.RW_KV.list({ prefix: 'creditexp:', cursor });
    for (const k of page.keys) {
      const key = k.name.slice(10); let w = await loadWallet(env, key); wallets++;
      if (!w) { await env.RW_KV.delete(k.name); continue; }
      const wl = await walletLinkFor(env, w.email, nowMs);
      for (const days of [30, 7]) {
        const r = expiringSoon(w, nowMs, days);
        if (!r.amount) continue;
        w = r.wallet; reminded++;
        await send(env, { to: w.email, subject: rs(r.amount) + ' of RoamWise credit ends on ' + r.expiresAt.slice(0, 10), text: [
          'You have ' + rs(r.amount) + ' of RoamWise travel credit that ends on ' + r.expiresAt.slice(0, 10) + '.',
          'Book a stay, package or wedding with it: ' + SITE + '/#rwSalesPackages' + (wl ? '\nYour wallet: ' + wl.url : ''),
          'If you do not use it, your own unused money is refunded to your original payment method automatically on that day. Unused bonus credit ends then.',
          '', '— RoamWise'].join('\n') });
      }
      const e = expireCredit(w, nowMs);
      w = e.wallet;
      if (e.refunding || e.lapsed) {
        expired++;
        await send(env, { to: w.email, subject: 'Your RoamWise credit year has ended', text: [
          e.refunding ? rs(e.refunding) + ' of your unused money is being refunded to your original payment method now (it usually shows in 5 to 7 working days).' : '',
          e.lapsed ? rs(e.lapsed) + ' of unused bonus credit has ended.' : '',
          'Thank you for travelling with RoamWise. If you would like to start a new credit year, you get an extra welcome-back bonus within ' + REJOIN_WINDOW_DAYS + ' days of your refund: ' + SITE + '/credit/',
          '', '— RoamWise'].filter(Boolean).join('\n') });
      }
      await saveWallet(env, key, w);
      if (!(w.lots || []).some((l) => l.expiresAt && l.remaining > 0 && (l.state === 'kept' || l.state === 'credit'))) await env.RW_KV.delete(k.name);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return { wallets, reminded, expired };
}

