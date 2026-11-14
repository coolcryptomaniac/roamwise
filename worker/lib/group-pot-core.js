/* ============================================================================
   worker/lib/group-pot-core.js — "pay your share" maths for group stays
   ============================================================================
   Pure, tested. A pot is one server-priced stay split into N shares. Each
   member pays exactly one share through Cashfree. The booking is created only
   when every share is paid; if the deadline passes first, every paid member
   gets their own share back in their own RoamWise wallet (which returns it to
   the original payment method after the normal hold). Named exports only. */
export const MIN_SHARES = 2, MAX_SHARES = 12;
export const PENDING_MS = 30 * 60 * 1000;          /* an unpaid checkout holds a share for 30 min */
export const MIN_LEAD_MS = 6 * 3600 * 1000;        /* at least 6 h to collect */
export const CHECKIN_GAP_MS = 48 * 3600 * 1000;    /* collection ends 2 days before check-in */
export const MAX_DEADLINE_MS = 7 * 24 * 3600 * 1000;

/** n whole-rupee shares that add up exactly to amount (the first shares carry the extra rupees). */
export function splitShares(amount, n){
  const total = Math.round(Number(amount)), k = Math.round(Number(n));
  if (!(total > 0) || !(k >= MIN_SHARES && k <= MAX_SHARES)) throw new Error('2 to 12 people can split a stay');
  const base = Math.floor(total / k), extra = total - base * k;
  if (base < 1) throw new Error('amount too small to split');
  return Array.from({ length: k }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Collection deadline: the organiser's choice, capped to 7 days and to 2 days before check-in. */
export function potDeadline(checkin, hours, nowMs){
  const want = nowMs + Math.max(6, Math.min(168, Number(hours) || 72)) * 3600 * 1000;
  const cin = Date.parse(String(checkin) + 'T00:00:00+05:30');
  const cap = Number.isFinite(cin) ? cin - CHECKIN_GAP_MS : nowMs + MAX_DEADLINE_MS;
  const d = Math.min(want, cap, nowMs + MAX_DEADLINE_MS);
  if (d - nowMs < MIN_LEAD_MS) throw new Error('Check-in is too soon to collect shares; book directly instead');
  return new Date(d).toISOString();
}

export const paidCount = (pot) => pot.slots.filter((s) => s.paid).length;

/** First share nobody has paid and nobody is paying right now (or -1). */
export function freeSlot(pot, nowMs){
  return pot.slots.findIndex((s) => !s.paid && !(s.orderId && Date.parse(s.pendingUntil || 0) > nowMs));
}

/** What anyone with the link may see: no emails, phones or full names. */
export function publicPot(pot, nowMs){
  return {
    id: pot.id, status: pot.status, property: pot.quote.property, checkin: pot.quote.checkin, checkout: pot.quote.checkout,
    nights: pot.quote.nights, kind: pot.quote.kind, total: pot.quote.amount, shares: pot.slots.length,
    shareAmounts: pot.slots.map((s) => s.amount), paid: paidCount(pot), deadline: pot.deadline,
    open: pot.status === 'collecting' && Date.parse(pot.deadline) > nowMs,
    members: pot.slots.map((s) => (s.paid ? (s.first || 'Paid') : '')),
    organiser: pot.organiser.first,
  };
}
