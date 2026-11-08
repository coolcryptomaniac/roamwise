/* RoamWise wallet: storage, guest endpoints and the hourly bank-refund job. Rules are in lib/wallet-core.js.
 *
 * Storage (RW_KV, no expiry): wallet:<key> = the wallet; walletphone:<digits> = <key>; walletdue:<key> = '1'
 * while the wallet has credit that may go back to the bank. <key> is a hash of the email, never the email itself.
 *
 * Guests reach their wallet three ways, whichever is easiest:
 *   - the private link in every refund email (?t=<signed token>, 30 days),
 *   - signing in with Google or phone OTP (Firebase ID token in Authorization: Bearer ...): email or phone must match,
 *   - asking for a fresh link by email (POST /wallet/link; the reply never says whether a wallet exists).
 * Bank refunds go to the ORIGINAL Cashfree order (lib/cashfree-pg.js cfRefund), idempotent per lot. */
import { json } from '../lib/http.js';
import { sendMail } from '../lib/mailer.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { cfRefund, cfConfigured } from '../lib/cashfree-pg.js';
import {
  walletKey, emptyWallet, creditRefund, spend, keepLot, bankSoon, dueLots, markBank, publicWallet, balance,
  walletLinkToken, readWalletLinkToken, normEmail, normPhone, validEmail,
} from '../lib/wallet-core.js';

const SITE = 'https://roamwise.co.in';
const FIREBASE_PROJECT = 'roamwisepro';
const load = async (env, key) => (await env.RW_KV.get('wallet:' + key, 'json')) || null;
async function save(env, key, w) {
  await env.RW_KV.put('wallet:' + key, JSON.stringify(w));
  if ((w.lots || []).some((l) => l.state === 'credit' && l.remaining > 0)) await env.RW_KV.put('walletdue:' + key, '1');
  else await env.RW_KV.delete('walletdue:' + key);
}

export async function walletLinkFor(env, email, nowMs = Date.now()) {
  if (!env.WALLET_LINK_SECRET || !validEmail(email)) return null;
  const token = await walletLinkToken(env.WALLET_LINK_SECRET, await walletKey(email), nowMs);
  return { token, url: SITE + '/wallet/?t=' + encodeURIComponent(token) };
}

/* Credit a refund (used by stay-lifecycle). Idempotent per refId. */
export async function creditWallet(env, { email, phone, refId, origins, note }, nowMs = Date.now()) {
  const key = await walletKey(email);
  const w = (await load(env, key)) || emptyWallet(email);
  const r = creditRefund(w, { refId, origins, phone, note }, nowMs);
  if (!r.duplicate) {
    await save(env, key, r.wallet);
    const p = normPhone(phone); if (p) await env.RW_KV.put('walletphone:' + p, key);
  }
  return r;
}

/* Spend credit on a new order (called by stay checkout before any Cashfree order is made). */
export async function spendWallet(env, key, amount, refId, nowMs = Date.now()) {
  const w = await load(env, key);
  if (!w) throw new Error('no wallet');
  const r = spend(w, amount, refId, nowMs);
  await save(env, key, r.wallet);
  return r.used;
}

/* Who is asking? Returns the wallet key or null. */
export async function walletKeyFromRequest(request, env, token, nowMs = Date.now(), deps = {}) {
  if (token) return readWalletLinkToken(env.WALLET_LINK_SECRET, token, nowMs);
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!m) return null;
  let claims;
  try { claims = await (deps.verifyIdToken || verifyFirebaseIdToken)(m[1], FIREBASE_PROJECT); } catch (_) { return null; }
  if (claims.email && claims.email_verified) {
    const key = await walletKey(claims.email);
    if (await load(env, key)) return key;
  }
  const phone = normPhone(claims.phone_number);
  if (phone) return (await env.RW_KV.get('walletphone:' + phone)) || null;
  return null;
}

async function body(request) { try { return await request.json(); } catch (_) { return {}; } }

/* GET /wallet?t=  ·  POST /wallet/keep {t, lotId}  ·  POST /wallet/bank {t, lotId}  ·  POST /wallet/link {email} */
export async function handleWallet(request, env, path, nowMs = Date.now(), deps = {}) {
  if (!env.RW_KV || !env.WALLET_LINK_SECRET) return json({ error: 'wallet_unavailable' }, 503);
  if (path === 'wallet/link' && request.method === 'POST') {
    const b = await body(request), email = normEmail(b.email);
    if (validEmail(email) && await load(env, await walletKey(email))) {
      const wl = await walletLinkFor(env, email, nowMs);
      await (deps.sendMail || sendMail)(env, { to: email, subject: 'Your RoamWise wallet', text: 'Open your RoamWise wallet: ' + wl.url + '\n\nThis private link works for 30 days. If you did not ask for it, ignore this email.\n— RoamWise' });
    }
    return json({ ok: true, message: 'If this email has a RoamWise wallet, a private link is on its way.' });
  }
  const b = request.method === 'POST' ? await body(request) : {};
  const t = b.t || new URL(request.url).searchParams.get('t') || '';
  const key = await walletKeyFromRequest(request, env, t, nowMs, deps);
  if (!key) return json({ error: 'not_signed_in', message: 'This wallet link has expired. Ask for a new link with your email.' }, 401);
  let w = await load(env, key);
  if (!w) return json({ error: 'no_wallet', message: 'No RoamWise wallet for this account yet.' }, 404);
  if (path === 'wallet/keep' && request.method === 'POST') { w = keepLot(w, String(b.lotId || '')); await save(env, key, w); }
  else if (path === 'wallet/bank' && request.method === 'POST') { w = bankSoon(w, String(b.lotId || ''), nowMs); await save(env, key, w); }
  else if (path !== 'wallet' || request.method !== 'GET') return json({ error: 'not_found' }, 404);
  return json({ ok: true, wallet: publicWallet(w, nowMs) });
}

/* Hourly: credit whose hold has ended goes back to the original payment. */
export async function runWalletReleases(env, nowMs = Date.now(), deps = {}) {
  if (!env.RW_KV || !cfConfigured(env)) return { wallets: 0, refunded: 0, failed: 0 };
  let cursor, wallets = 0, refunded = 0, failed = 0;
  do {
    const page = await env.RW_KV.list({ prefix: 'walletdue:', cursor });
    for (const k of page.keys) {
      const key = k.name.slice(10); let w = await load(env, key); wallets++;
      if (!w) { await env.RW_KV.delete(k.name); continue; }
      const sent = [];
      for (const lot of dueLots(w, nowMs)) {
        const r = await (deps.cfRefund || cfRefund)(env, { orderId: lot.orderId, amount: lot.remaining, refundId: 'rwr' + lot.lotId.slice(-30), note: 'RoamWise wallet refund' });
        w = markBank(w, lot.lotId, r, nowMs);
        if (r.ok) { refunded++; sent.push(lot.remaining); }
        else {
          failed++;
          if (w.lots.find((l) => l.lotId === lot.lotId).state === 'attention') await (deps.sendMail || sendMail)(env, { to: 'founder@roamwise.co.in',
            subject: 'Wallet refund needs you: Rs ' + lot.remaining, text: 'Cashfree refused 3 times to refund Rs ' + lot.remaining + ' for order ' + lot.orderId + ' (' + (r.error || '') + ').\nGuest: ' + w.email + '\nRefund it from the Cashfree dashboard, then tell the guest.' });
        }
      }
      await save(env, key, w);
      if (sent.length) {
        const total = sent.reduce((s, a) => s + a, 0);
        await (deps.sendMail || sendMail)(env, { to: w.email, subject: 'Refund on its way: Rs ' + total.toLocaleString('en-IN'), text:
          'Rs ' + total.toLocaleString('en-IN') + ' from your RoamWise wallet is on its way back to your original payment method. Banks usually show it within 5 to 7 working days.\n\nRemaining wallet balance: Rs ' + balance(w).toLocaleString('en-IN') + '\n— RoamWise' });
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return { wallets, refunded, failed };
}
