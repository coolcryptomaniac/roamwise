/* Referral rewards: rules only (pure, whole rupees). Storage and endpoints are in handlers/referrals.js.
 *
 * A friend opens a referral link, signs in with a verified email and claims the code. Nothing is
 * paid then. Both people get bonus coins only after the friend's FIRST paid stay is finished
 * (48 hours after check-out, not refunded). A real payment and a real stay are the identity
 * check: bots and duplicate accounts cannot fake them for free.
 *
 * Rewards start high and step down as more referrals are rewarded. Coins are bonus credit:
 * spendable on RoamWise, spent after cash, never paid out. */
export const TIERS = [
  { upTo: 100, coins: 300 },
  { upTo: 500, coins: 200 },
  { upTo: 2000, coins: 100 },
  { upTo: Infinity, coins: 50 },
];
export const MIN_ORDER = 1000;            // friend's first stay must be at least this much paid
export const REFERRER_MONTHLY_MAX = 10;   // rewarded referrals per referrer per month
export const CLAIM_TTL_DAYS = 180;        // a claim with no finished stay expires
export const COIN_VALID_DAYS = 180;
const DAY = 24 * 3600 * 1000;
const LIVE = new Set(['paid', 'paid_pending_confirmation', 'confirmed']);
const DISPOSABLE = new Set(['mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com',
  'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'mohmal.com', 'emailondeck.com']);

export function rewardFor(grantedSoFar) {
  const n = Math.max(0, Number(grantedSoFar) || 0);
  return TIERS.find((t) => n < t.upTo).coins;
}
export function nextStep(grantedSoFar) {
  const n = Math.max(0, Number(grantedSoFar) || 0), i = TIERS.findIndex((t) => n < t.upTo);
  return TIERS[i + 1] ? { left: TIERS[i].upTo - n, then: TIERS[i + 1].coins } : null;
}

/* One person, one address: Gmail ignores dots and +tags, most providers ignore +tags. */
export function canonEmail(email) {
  const e = String(email || '').trim().toLowerCase(), at = e.lastIndexOf('@');
  if (at < 1) return '';
  let user = e.slice(0, at).split('+')[0], host = e.slice(at + 1);
  if (host === 'googlemail.com') host = 'gmail.com';
  if (host === 'gmail.com') user = user.replace(/\./g, '');
  return user && host.includes('.') ? user + '@' + host : '';
}
export const isDisposable = (email) => DISPOSABLE.has(canonEmail(email).split('@')[1] || '');
export const phoneKey = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : ''; };
export const validCode = (c) => /^RW[A-Z2-7]{8}$/.test(String(c || ''));
export const validDevice = (d) => /^[A-Za-z0-9_-]{8,64}$/.test(String(d || ''));

/* May this signed-in person claim this code? */
export function checkClaim({ friendEmail, referrerEmail, emailVerified, existingClaim, device, referrerDevices = [] }) {
  const f = canonEmail(friendEmail), r = canonEmail(referrerEmail);
  if (!f || !emailVerified) return { ok: false, reason: 'verify_email' };
  if (isDisposable(friendEmail)) return { ok: false, reason: 'disposable_email' };
  if (!r) return { ok: false, reason: 'unknown_code' };
  if (f === r) return { ok: false, reason: 'self_referral' };
  if (existingClaim) return { ok: false, reason: 'already_claimed' };
  if (device && referrerDevices.includes(device)) return { ok: false, reason: 'same_device' };
  return { ok: true };
}

const outMs = (o) => Date.parse((o.checkout || '') + 'T06:30:00Z');

/* Decide one pending claim against the friend's stay orders. 'wait' keeps it pending. */
export function decideClaim({ claim, orders = [], referrerPhones = [], usedPhones = [], usedDevices = [], referrerMonthCount = 0, promoLeft = Infinity, granted = 0, nowMs }) {
  const claimedAt = Date.parse(claim.at);
  if (orders.some((o) => o.status !== 'payment_pending' && Date.parse(o.createdAt) < claimedAt)) return { action: 'reject', reason: 'existing_customer' };
  const live = orders.filter((o) => LIVE.has(o.status) && o.kind !== 'balance').sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const first = live[0];
  if (!first) return nowMs - claimedAt > CLAIM_TTL_DAYS * DAY ? { action: 'reject', reason: 'expired' } : { action: 'wait', reason: 'no_paid_stay' };
  if (!(Number(first.amount) >= MIN_ORDER)) return { action: 'wait', reason: 'below_minimum' };
  if (!(nowMs >= outMs(first) + 2 * DAY)) return { action: 'wait', reason: 'stay_not_finished' };
  const phone = phoneKey(first.phone);
  if (phone && referrerPhones.map(phoneKey).includes(phone)) return { action: 'reject', reason: 'same_phone_as_referrer' };
  if (phone && usedPhones.includes(phone)) return { action: 'reject', reason: 'phone_already_rewarded' };
  if (claim.device && usedDevices.includes(claim.device)) return { action: 'reject', reason: 'device_already_rewarded' };
  if (referrerMonthCount >= REFERRER_MONTHLY_MAX) return { action: 'wait', reason: 'referrer_monthly_limit' };
  const coins = rewardFor(granted);
  if (promoLeft < coins * 2) return { action: 'wait', reason: 'promo_budget_used' };
  return { action: 'grant', coins, orderId: first.id, phone };
}

/* Add bonus coins to a wallet. Idempotent per refId. */
export function addBonusCoins(w, { refId, coins, note }, nowMs) {
  if (!(coins > 0)) throw new Error('bad coin amount');
  if ((w.lots || []).some((l) => l.refId === refId)) return { wallet: w, duplicate: true };
  const at = new Date(nowMs).toISOString();
  const lot = { lotId: refId.slice(-24) + 'r', refId, orderId: null, method: 'bonus', amount: coins, remaining: coins, source: 'bonus', state: 'kept',
    createdAt: at, expiresAt: new Date(nowMs + COIN_VALID_DAYS * DAY).toISOString(), paidLot: null, note: String(note || 'Referral reward').slice(0, 120) };
  return { wallet: { ...w, lots: [...(w.lots || []), lot], log: [...(w.log || []), { at, kind: 'referral', amount: coins, refId }].slice(-100) }, duplicate: false };
}
