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
   handleCashfreeOrderStatus() reports it PAID, the client-side adapter
   (js/payments/providers/cashfree-adapter.js) calls
   grantPurchase(orderId, 'cashfree', 'elite_y10') — which derives the
   granted tier from the plan id, not the amount actually charged — handing
   out a ₹24,999 Elite 10-year pass for ₹1. Validating server-side, against
   a price table the client never controls, is the only place this can
   actually be enforced (Cashfree is a real gateway confirming a real
   payment_session_id/order_status, so the failure mode isn't "fake it never
   happened", it's "really pay ₹1 and really get the ₹24,999 product").

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

/**
 * @param {string} planId
 * @returns {number|null} the real price in rupees, or null if planId is
 *   missing/unrecognized.
 */
export function priceForPlan(planId){
  const id = String(planId || '');
  return Object.prototype.hasOwnProperty.call(PLAN_PRICES, id) ? PLAN_PRICES[id] : null;
}
