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
  const lots = origins.filter((o) => o.amount > 0).map((o, i) => {
    const base = { lotId: refId.slice(-24) + 'x' + i, refId, orderId: o.orderId, method: o.method === 'upi' ? 'upi' : 'cashfree', amount: o.amount, remaining: o.amount,
      createdAt: at, note: String(note || '').slice(0, 120) };
    /* Money that came from a Founding Traveller Credit pack goes back into the pack, with the pack's own expiry. */
    if (o.source === 'bonus') return { ...base, orderId: null, source: 'bonus', state: 'kept', expiresAt: o.expiresAt, paidLot: o.paidLot || null };
    if (o.source === 'prepaid') return { ...base, source: 'prepaid', state: 'kept', expiresAt: o.expiresAt, paidAt: o.paidAt || at };
    return { ...base, source: 'refund', state: 'credit', review: hold.review, releaseAt };
  });
  const p = normPhone(phone);
  const next = { ...w, phones: p && !(w.phones || []).includes(p) ? [...(w.phones || []), p] : (w.phones || []), lots: [...(w.lots || []), ...lots],
    log: [...(w.log || []), { at, kind: 'credit', amount: total, refId }].slice(-100) };
  return { wallet: next, lots, duplicate: false, review: hold.review, releaseAt };
}

/* Spend credit. Order: refund and prepaid (paid) credit oldest first, bonus credit last, so a guest's own money is
   always used before RoamWise's bonus. Returns the lots used as origins for the new order: a later refund of that
   order goes back to the same Cashfree payments, and prepaid or bonus money goes back to the wallet as credit. */
export function spend(w, amount, refId, nowMs) {
  if (!(amount > 0) || balance(w) < amount) throw new Error('not enough credit');
  let left = amount; const used = [];
  const lots = (w.lots || []).map((l) => ({ ...l }));
  lots.filter(lotOpen).sort((a, b) => ((a.source === 'bonus') - (b.source === 'bonus')) || a.createdAt.localeCompare(b.createdAt)).forEach((l) => {
    if (!left) return;
    const take = Math.min(left, l.remaining);
    l.remaining -= take; left -= take; if (!l.remaining) l.state = 'used';
    used.push({ orderId: l.orderId, amount: take, lotId: l.lotId, method: l.method || 'cashfree',
      ...(l.source === 'prepaid' || l.source === 'bonus' ? { source: l.source, expiresAt: l.expiresAt, paidLot: l.paidLot, paidAt: l.paidAt } : {}) });
  });
  return { wallet: { ...w, lots, log: [...(w.log || []), { at: new Date(nowMs).toISOString(), kind: 'spend', amount, refId }].slice(-100) }, used };
}

/* Guest choices on one lot. */
export function keepLot(w, lotId) {
  return { ...w, lots: w.lots.map((l) => (l.lotId === lotId && l.state === 'credit' ? { ...l, state: 'kept' } : l)) };
}
export function bankSoon(w, lotId, nowMs) {
  const lot = (w.lots || []).find((l) => l.lotId === lotId && l.state === 'kept');
  if (!lot || lot.source === 'bonus') return w;   // bonus credit is RoamWise's gift: it can be spent, never paid out
  let lots = w.lots.map((l) => (l === lot
    ? { ...l, state: 'credit', releaseAt: new Date(Math.max(nowMs, Date.parse(l.createdAt) + (l.review ? HOLD_REVIEW_MS : HOLD_NORMAL_MS))).toISOString() } : l));
  /* Taking pack money back gives up the matching share of that pack's bonus. */
  if (lot.source === 'prepaid') lots = lots.map((l) => {
    if (l.source !== 'bonus' || l.paidLot !== lot.lotId || !(l.remaining > 0) || !lotOpen(l)) return l;
    const forfeit = Math.min(l.remaining, Math.round(l.amount * lot.remaining / lot.amount));
    return { ...l, remaining: l.remaining - forfeit, forfeited: (l.forfeited || 0) + forfeit, state: l.remaining - forfeit > 0 ? l.state : 'lapsed' };
  });
  return { ...w, lots };
}

/* ---- Founding Traveller Credit (prepaid packs) --------------------------------------------------------------
   Legal shape (see claude/founding-traveller-credit.md): an advance for future RoamWise services, not a deposit or
   an investment. Paid credit must be used within CREDIT_VALID_DAYS; whatever is left is REALLY refunded to the
   original payment (the 365-day rule in the Companies (Acceptance of Deposits) Rules 2014 and BUDS Act 2019).
   It is never rolled over on paper. Bonus credit is RoamWise's own gift: spent last, never cashed, lapses at expiry. */
export const CREDIT_VALID_DAYS = 360;   // 5 days inside 365 so the refund itself lands within the year
const DAY_MS = 24 * 3600 * 1000;
export function creditPrepaid(w, { refId, orderId, paid, bonus, phone, note }, nowMs) {
  if (!(paid > 0) || !(bonus >= 0)) throw new Error('bad pack amounts');
  if ((w.lots || []).some((l) => l.refId === refId)) return { wallet: w, lots: [], duplicate: true };
  const at = new Date(nowMs).toISOString(), expiresAt = new Date(nowMs + CREDIT_VALID_DAYS * DAY_MS).toISOString();
  const paidLot = { lotId: refId.slice(-24) + 'p', refId, orderId, method: 'cashfree', amount: paid, remaining: paid, source: 'prepaid',
    state: 'kept', createdAt: at, paidAt: at, expiresAt, note: String(note || '').slice(0, 120) };
  const lots = [paidLot];
  if (bonus > 0) lots.push({ lotId: refId.slice(-24) + 'b', refId, orderId: null, method: 'bonus', amount: bonus, remaining: bonus, source: 'bonus',
    state: 'kept', createdAt: at, expiresAt, paidLot: paidLot.lotId, note: 'Bonus credit from RoamWise' });
  const p = normPhone(phone);
  const next = { ...w, phones: p && !(w.phones || []).includes(p) ? [...(w.phones || []), p] : (w.phones || []), lots: [...(w.lots || []), ...lots],
    log: [...(w.log || []), { at, kind: 'pack', amount: paid + bonus, refId }].slice(-100) };
  return { wallet: next, lots, duplicate: false, expiresAt };
}
/* Daily: pack credit past its expiry. Paid credit is queued for a real bank refund now; bonus credit lapses. */
export function expireCredit(w, nowMs) {
  const refunding = [], lapsed = [];
  const lots = (w.lots || []).map((l) => {
    if (!l.expiresAt || !(l.remaining > 0) || !lotOpen(l) || Date.parse(l.expiresAt) > nowMs) return l;
    if (l.source === 'bonus') { lapsed.push(l.remaining); return { ...l, state: 'lapsed', lapsedAmount: l.remaining, remaining: 0 }; }
    refunding.push(l.remaining); return { ...l, state: 'credit', releaseAt: new Date(nowMs).toISOString(), expired: true };
  });
  return { wallet: { ...w, lots }, refunding: refunding.reduce((s, a) => s + a, 0), lapsed: lapsed.reduce((s, a) => s + a, 0) };
}
/* Pack credit expiring within `days` that has not had this reminder yet. */
export function expiringSoon(w, nowMs, days) {
  const tag = 'r' + days;
  const due = (w.lots || []).filter((l) => l.expiresAt && l.remaining > 0 && lotOpen(l) && !(l.reminded || []).includes(tag)
    && Date.parse(l.expiresAt) - nowMs <= days * DAY_MS && Date.parse(l.expiresAt) > nowMs);
  if (!due.length) return { wallet: w, amount: 0, expiresAt: null };
  const ids = new Set(due.map((l) => l.lotId));
  return { wallet: { ...w, lots: w.lots.map((l) => (ids.has(l.lotId) ? { ...l, reminded: [...(l.reminded || []), tag] } : l)) },
    amount: due.reduce((s, l) => s + l.remaining, 0), expiresAt: due.map((l) => l.expiresAt).sort()[0] };
}
/* Was pack money refunded at expiry within the last `days`? (Rejoin bonus.) */
export const refundedAtExpiryWithin = (w, nowMs, days) => (w && w.lots || []).some((l) => l.expired && l.state === 'bank' && nowMs - Date.parse(l.bankAt || 0) <= days * DAY_MS);
/* Lots the hourly job should send back to the bank now. */
export const dueLots = (w, nowMs) => (w.lots || []).filter((l) => l.state === 'credit' && l.remaining > 0 && Date.parse(l.releaseAt) <= nowMs);
export const BANK_MAX_FAILURES = 3;
/* Cashfree refunds a payment only within six months of it (docs: "You can initiate refunds only within six months of
   the original successful transaction"). Pack money older than this is paid back by RoamWise directly (UPI or bank
   transfer), never left waiting on a refund the gateway will refuse. 175 days leaves margin for retries. */
export const GATEWAY_REFUND_DAYS = 175;
export const pastGatewayWindow = (l, nowMs) => l.method !== 'upi' && l.source === 'prepaid' && nowMs - Date.parse(l.paidAt || l.createdAt) > GATEWAY_REFUND_DAYS * 24 * 3600 * 1000;
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
    bonusBalance: (w.lots || []).filter((l) => lotOpen(l) && l.source === 'bonus').reduce((s, l) => s + l.remaining, 0),
    lots: (w.lots || []).filter((l) => l.state !== 'used' || l.remaining).map((l) => ({
      lotId: l.lotId, amount: l.amount, remaining: l.remaining, state: l.state, note: l.note, source: l.source || 'refund', expiresAt: l.expiresAt || null,
      bankOn: l.state === 'credit' ? l.releaseAt : null, review: !!l.review, bankStatus: l.bankStatus || '',
      credited: l.createdAt,
    })).reverse(),
    stats: walletStats(w, nowMs),
    activity: (w.log || []).slice(-15).reverse().map((e) => ({ at: e.at, kind: e.kind, amount: e.amount })),
    now: new Date(nowMs).toISOString(),
  };
}

/* Read-only account summary for the wallet page ("virtual bank" view). Whole rupees. */
export function walletStats(w, nowMs) {
  const lots = (w && w.lots) || [], log = (w && w.log) || [], soon = nowMs + 30 * 24 * 3600 * 1000;
  const sum = (xs, f) => xs.reduce((t, x) => t + (Number(f(x)) || 0), 0);
  return {
    cashIn: sum(lots.filter((l) => l.source !== 'bonus'), (l) => l.amount),
    coinsEarned: sum(lots.filter((l) => l.source === 'bonus'), (l) => l.amount),
    spent: sum(log.filter((e) => e.kind === 'spend'), (e) => e.amount),
    sentToBank: sum(lots, (l) => l.bankAmount),
    onWayToBank: sum(lots.filter((l) => l.state === 'credit' && l.remaining > 0), (l) => l.remaining),
    expiringSoon: sum(lots.filter((l) => lotOpen(l) && l.expiresAt && Date.parse(l.expiresAt) <= soon), (l) => l.remaining),
  };
}
