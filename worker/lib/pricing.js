/* ============================================================================
   worker/lib/pricing.js — canonical SERVER-SIDE prices for every plan
   Cashfree is allowed to charge.
   ============================================================================
   SECURITY: worker/handlers/cashfree.js uses priceForPlan() to reject a
   POST /cashfree/order whose client-supplied `amount` does not match the
   real price of the claimed `meta.planId`, closing a price-tampering
   vulnerability — without this check, a client could call the endpoint
   directly (bypassing the UI entirely) with e.g.
   `{ amount: 1, meta: { planId: 'elite_y10' } }`, get a real Cashfree
   payment_session_id for that ₹1 order, pay the ₹1, and once
   handleCashfreeOrderStatus() reports it PAID, the Worker derives and stores
   the entitlement from the plan id — which would hand out a ₹24,999 Elite
   10-year pass for ₹1 without this check. Validating server-side, against a
   price table the client never controls, is the only place this can actually
   be enforced.

   MUST STAY IN SYNC with the client-side canonical source of truth:
     - js/pricing/subscription-plans.js  (CONFIG.TIERS)
     - js/pricing/one-off-plans.js       (CONFIG.FOUNDER_OFFER / LONG_TERM /
       SHORT_TERM)
   Those are browser-global classic-script files (no bundler/ES modules in
   this app — see CLAUDE.md) and can't be imported directly into this
   ES-module Worker, so the prices are mirrored here by hand.
   tests/cashfree-price-validation.test.js parses those two files' literal
   source and asserts every price here matches, so a future price change
   that forgets to update this file fails CI loudly instead of silently
   reopening the vulnerability above.

   Every plan id below is exactly the id renderPlanGrid() (js/payments/
   plan-picker.js) hands to pickPlan()/createOrder() for that button — see
   that file's onclick= strings for the ground truth this list is derived
   from. Prices are plain rupee integers, matching this app's "no paise"
   convention (see gateway-adapter.js's header).
   ========================================================================= */

export const PLAN_PRICES = {
  /* Founder offer — js/pricing/one-off-plans.js CONFIG.FOUNDER_OFFER */
  founder: 100,

  /* Recurring subscription tiers — js/pricing/subscription-plans.js
     CONFIG.TIERS (Free excluded: it's never a purchasable plan id) */
  plus_m: 99,   plus_y: 999,
  pro_m: 299,   pro_y: 2499,
  elite_m: 499, elite_y: 4999,

  /* Long-term one-time passes — js/pricing/one-off-plans.js CONFIG.LONG_TERM */
  plus_y3: 2499,  plus_y5: 3499,  plus_y10: 4999,
  pro_y3: 7499,   pro_y5: 9999,   pro_life: 14999,
  elite_y3: 12499, elite_y5: 17499, elite_y10: 24999,

  /* Short-term micro-passes — js/pricing/one-off-plans.js CONFIG.SHORT_TERM */
  day: 19, week: 99, quarter: 749
};

/* Cashfree is currently approved for one-time purchases only. Keeping the
   allow-list server-side is important: hiding subscription buttons in the
   browser is UX, not an authorization boundary. */
export const CASHFREE_ONE_OFF_PLANS = Object.freeze({
  founder:   { tier:'elite', lifetime:true },
  plus_y3:   { tier:'plus',  years:3 },
  plus_y5:   { tier:'plus',  years:5 },
  plus_y10:  { tier:'plus',  years:10 },
  pro_y3:    { tier:'pro',   years:3 },
  pro_y5:    { tier:'pro',   years:5 },
  pro_life:  { tier:'pro',   lifetime:true },
  elite_y3:  { tier:'elite', years:3 },
  elite_y5:  { tier:'elite', years:5 },
  elite_y10: { tier:'elite', years:10 },
  day:       { tier:'pro',   days:1 },
  week:      { tier:'pro',   days:7 },
  quarter:   { tier:'pro',   days:90 }
});

/**
 * @param {string} planId
 * @returns {number|null} the real price in rupees, or null if planId is
 *   missing/unrecognized.
 */
export function priceForPlan(planId){
  const id = String(planId || '');
  return Object.prototype.hasOwnProperty.call(PLAN_PRICES, id) ? PLAN_PRICES[id] : null;
}

export function cashfreeEntitlementForPlan(planId, nowMs){
  const id = String(planId || '');
  const plan = CASHFREE_ONE_OFF_PLANS[id];
  if(!plan) return null;
  const startedAt = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  let until = 0;
  if(plan.days) until = startedAt + plan.days * 86400000;
  if(plan.years){
    const d = new Date(startedAt);
    d.setUTCFullYear(d.getUTCFullYear() + plan.years);
    until = d.getTime();
  }
  return { planId:id, tier:plan.tier, lifetime:plan.lifetime === true, until };
}
