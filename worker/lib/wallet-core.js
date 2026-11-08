/* RoamWise wallet: pure logic, no network and no storage (tests run it directly).
 *
 * How money moves (founder decision, 8 Nov 2026):
 *   1. A refund lands in the guest's RoamWise wallet at once, as a "lot" tied to the Cashfree order it came from.
 *   2. The guest can keep it as credit or spend it on another stay. Otherwise it goes back to the bank by itself:
 *      after 24 hours, or after 7 days when the refund looks unusual (large amount or many refunds).
 *   3. A bank refund always goes to the ORIGINAL Cashfree order, so the wallet never pays out more than came in.
 * The wallet is closed-loop (spend only on RoamWise), which is why credit never becomes cash except as a refund
 * to the original payment. Lots are amounts in whole rupees. Credit from a direct UPI payment (no Cashfree order)
 * cannot be refunded by API: when its hold ends it is handed to the founder to send back by UPI. */

export const HOLD_NORMAL_MS = 24 * 3600 * 1000;
export const HOLD_REVIEW_MS = 7 * 24 * 3600 * 1000;
export const REVIEW_AMOUNT = 20000;      // refunds at or above this wait the full 7 days
export const REVIEW_REFUNDS_30D = 3;     // so does a third refund to the same wallet within 30 days
export const LINK_TTL_MS = 30 * 24 * 3600 * 1000;

const enc = new TextEncoder();
const hexOf = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const normPhone = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.length === 10) d = '91' + d; return d.length >= 11 && d.length <= 15 ? d : ''; };
export const validEmail = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(normEmail(e));

export async function sha256Hex(s) { return hexOf(await crypto.subtle.digest('SHA-256', enc.encode(String(s)))); }
export async function walletKey(email) { return 'w' + (await sha256Hex('rw-wallet:' + normEmail(email))).slice(0, 40); }

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
export async function hmacHex(secret, msg) { return hexOf(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(msg))); }
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

/* Signed links. purpose 'wallet' -> subject = wallet key; purpose 'decide' -> subject = order id + action. */
export async function signLink(secret, purpose, subject, expMs) {
  const exp = Math.floor(expMs / 1000).toString(36);
  const sig = (await hmacHex(secret, purpose + '|' + subject + '|' + exp)).slice(0, 32);
  return exp + '.' + sig;
}
export async function verifyLink(secret, purpose, subject, token, nowMs) {
  const m = /^([0-9a-z]{1,10})\.([0-9a-f]{32})$/.exec(String(token || ''));
  if (!m || !secret) return false;
  if (parseInt(m[1], 36) * 1000 < nowMs) return false;
  return safeEqual((await hmacHex(secret, purpose + '|' + subject + '|' + m[1])).slice(0, 32), m[2]);
}
/* Magic wallet link token carries the wallet key so the page needs nothing else. */
export async function walletLinkToken(secret, key, nowMs) { return key + '~' + await signLink(secret, 'wallet', key, nowMs + LINK_TTL_MS); }
export async function readWalletLinkToken(secret, token, nowMs) {
  const [key, rest] = String(token || '').split('~');
  if (!/^w[0-9a-f]{40}$/.test(key || '') || !rest) return null;
  return (await verifyLink(secret, 'wallet', key, rest, nowMs)) ? key : null;
}

export function emptyWallet(email) { return { email: normEmail(email), phones: [], lots: [], log: [] }; }
export const lotOpen = (l) => l.remaining > 0 && (l.state === 'credit' || l.state === 'kept');
export const balance = (w) => (w && w.lots || []).filter(lotOpen).reduce((s, l) => s + l.remaining, 0);

/* Hold length for a new refund: 24 h normally, 7 days for large or repeated refunds. */
export function holdFor(w, amount, nowMs) {
  const recent = (w.lots || []).filter((l) => l.source === 'refund' && nowMs - Date.parse(l.createdAt) < 30 * 24 * 3600 * 1000).length;
  const review = amount >= REVIEW_AMOUNT || recent + 1 >= REVIEW_REFUNDS_30D;
  return { review, ms: review ? HOLD_REVIEW_MS : HOLD_NORMAL_MS };
}

/* Credit a refund. origins: [{orderId, amount}] - the Cashfree orders the money originally came from. */
export function creditRefund(w, { refId, origins, phone, note }, nowMs) {
  const total = origins.reduce((s, o) => s + o.amount, 0);
  if (!(total > 0)) throw new Error('nothing to refund');
  if ((w.lots || []).some((l) => l.refId === refId)) return { wallet: w, lots: [], duplicate: true };
  const hold = holdFor(w, total, nowMs);
  const at = new Date(nowMs).toISOString(), releaseAt = new Date(nowMs + hold.ms).toISOString();
  const lots = origins.filter((o) => o.amount > 0).map((o, i) => ({
    lotId: refId.slice(-24) + 'x' + i, refId, orderId: o.orderId, method: o.method === 'upi' ? 'upi' : 'cashfree', amount: o.amount, remaining: o.amount,
    source: 'refund', state: 'credit', review: hold.review, createdAt: at, releaseAt, note: String(note || '').slice(0, 120),
  }));
  const p = normPhone(phone);
  const next = { ...w, phones: p && !(w.phones || []).includes(p) ? [...(w.phones || []), p] : (w.phones || []), lots: [...(w.lots || []), ...lots],
    log: [...(w.log || []), { at, kind: 'credit', amount: total, refId }].slice(-100) };
  return { wallet: next, lots, duplicate: false, review: hold.review, releaseAt };
}

/* Spend credit (oldest lots first). Returns the lots used as origins for the new order, so a later refund of
   that order goes back to the same Cashfree payments. */
export function spend(w, amount, refId, nowMs) {
  if (!(amount > 0) || balance(w) < amount) throw new Error('not enough credit');
  let left = amount; const used = [];
  const lots = (w.lots || []).map((l) => ({ ...l }));
  lots.filter(lotOpen).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((l) => {
    if (!left) return;
    const take = Math.min(left, l.remaining);
    l.remaining -= take; left -= take; if (!l.remaining) l.state = 'used';
    used.push({ orderId: l.orderId, amount: take, lotId: l.lotId, method: l.method || 'cashfree' });
  });
  return { wallet: { ...w, lots, log: [...(w.log || []), { at: new Date(nowMs).toISOString(), kind: 'spend', amount, refId }].slice(-100) }, used };
}

/* Guest choices on one lot. */
export function keepLot(w, lotId) {
  return { ...w, lots: w.lots.map((l) => (l.lotId === lotId && l.state === 'credit' ? { ...l, state: 'kept' } : l)) };
}
export function bankSoon(w, lotId, nowMs) {
  return { ...w, lots: w.lots.map((l) => (l.lotId === lotId && l.state === 'kept'
    ? { ...l, state: 'credit', releaseAt: new Date(Math.max(nowMs, Date.parse(l.createdAt) + (l.review ? HOLD_REVIEW_MS : HOLD_NORMAL_MS))).toISOString() } : l)) };
}
/* Lots the hourly job should send back to the bank now. */
export const dueLots = (w, nowMs) => (w.lots || []).filter((l) => l.state === 'credit' && l.remaining > 0 && Date.parse(l.releaseAt) <= nowMs);
export const BANK_MAX_FAILURES = 3;
export function markBank(w, lotId, result, nowMs) {
  return { ...w, lots: w.lots.map((l) => (l.lotId === lotId ? { ...l, state: result.ok ? 'bank' : ((l.bankFailures || 0) + 1 >= BANK_MAX_FAILURES ? 'attention' : 'credit'),
    bankFailures: result.ok ? (l.bankFailures || 0) : (l.bankFailures || 0) + 1, bankRefundId: result.refundId || l.bankRefundId,
    bankStatus: result.status || '', bankAt: new Date(nowMs).toISOString(), bankError: result.ok ? '' : String(result.error || '').slice(0, 120),
    releaseAt: result.ok ? l.releaseAt : new Date(nowMs + 6 * 3600 * 1000).toISOString(), remaining: result.ok ? 0 : l.remaining, bankAmount: result.ok ? l.remaining : 0 } : l)) };
}

/* What the guest sees: no order ids, no internal notes. */
export function publicWallet(w, nowMs) {
  const mask = (e) => { const [u, d] = String(e || '').split('@'); return u ? u.slice(0, 2) + '***@' + (d || '') : ''; };
  return {
    email: mask(w.email), balance: balance(w),
    lots: (w.lots || []).filter((l) => l.state !== 'used' || l.remaining).map((l) => ({
      lotId: l.lotId, amount: l.amount, remaining: l.remaining, state: l.state, note: l.note,
      bankOn: l.state === 'credit' ? l.releaseAt : null, review: !!l.review, bankStatus: l.bankStatus || '',
      credited: l.createdAt,
    })).reverse(),
    now: new Date(nowMs).toISOString(),
  };
}
