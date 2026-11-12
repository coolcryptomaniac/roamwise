/* Pioneer Circle: transparent, budget-limited, non-transferable membership logic.
   Advisory only: actual seats, entitlements and rewards must be awarded atomically by
   an authenticated server against verified payment and contribution events. */
export const COHORTS = Object.freeze([
  { id:'origin', label:'Origin Circle', first:1, last:100 },
  { id:'pioneer', label:'Pioneer Circle', first:101, last:1000 },
  { id:'explorer', label:'Explorer', first:1001, last:Number.MAX_SAFE_INTEGER }
]);
export function cohortForSeat(seat) {
  if (!Number.isSafeInteger(seat) || seat < 1) return null;
  return COHORTS.find(c => seat >= c.first && seat <= c.last) || null;
}
export function isQualifiedReferral(input = {}) {
  return input.identityVerified === true &&
    input.paymentSettled === true &&
    input.refunded !== true &&
    input.chargeback !== true &&
    input.uniquePurchase === true &&
    input.referrerId && input.buyerId &&
    input.referrerId !== input.buyerId;
}
/* Margin-funded rewards are never promises or tokens. Inputs in integer paise.
   No verified contribution, budget approval, or available pool => no reward.
   Actual redemption requires a separate server-side atomic transaction. */
export function suggestedRewardPaise(input = {}) {
  const valid = v => Number.isSafeInteger(v) && v >= 0;
  if (input.approved !== true || input.settled !== true ||
      input.refunded === true || input.chargeback === true ||
      !valid(input.netRealizedMarginPaise) ||
      !valid(input.remainingApprovedPoolPaise) ||
      !valid(input.maxBenefitPerOrderPaise)) return 0;
  // No inflation: an early cohort receives a larger share of the SAME approved
  // maximum, never an additional liability. A missing seat uses the default.
  const cohort = cohortForSeat(input.seat);
  const boostBps = cohort?.id === 'origin' ? 10000 : cohort?.id === 'pioneer' ? 8000 : cohort?.id === 'explorer' ? 6000 : 10000;
  const sourceShare = Math.floor(input.netRealizedMarginPaise * 0.10 * boostBps / 10000);
  return Math.min(sourceShare, input.remainingApprovedPoolPaise,
                  input.maxBenefitPerOrderPaise);
}
export function proposedRuleCanPass({eligibleSigners = [], approvals = [], vetoed = false} = {}) {
  const eligible = new Set(eligibleSigners);
  const valid = new Set(approvals.filter(a => eligible.has(a)));
  return !vetoed && eligible.size >= 3 && valid.size >= Math.ceil(eligible.size * 2 / 3);
}
export const PRINCIPLES = Object.freeze({
  nonTransferable: true,
  investmentReturn: false,
  guaranteedDiscount: false,
  foreverServicePromise: false,
  profitShare: false,
  referralPayments: false,
  serverAuthorityRequired: true
});
