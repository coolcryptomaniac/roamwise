/* RoamWise margin policy for Amor stays and packages (founder decision, 13 Nov 2026).
 * Margin m is RoamWise's commission K as a share of the pre-GST guest price: m = K / (cost + K).
 * Guest price = cost + K + 18% GST on K. The same definition as packages/amor-pricing-guardrails.mjs (PR #695):
 * at least 20% gross margin, at most a 200% markup on cost.
 *   - base 20%; demand adds a few points (weekends, peak/festive nights, curated bundles, honeymoon and wedding season)
 *   - the whole booking is then capped 1% under any known public price for the same thing (hotel's own published
 *     rate, OTA prices) so RoamWise is never the dearer option, and never goes below the 7% floor agreed with Amor.
 * The weekly market check (scheduled task) updates the public references and these knobs by pull request. */
export const POLICY = Object.freeze({
  baseMargin: 0.20,
  uplift: { weekend: 0.03, peak: 0.05, bundle: 0.03, season: 0.02 },
  maxMargin: 0.40,          // ceiling for demand uplifts
  maxMarkup: 2.0,           // price never above 3x cost
  floorCommission: 0.07,    // Amor-agreed minimum (7% of cost + GST on it)
  undercut: 0.01,           // stay 1% under a known public price
  extrasMargin: 0.20,
  weddingBudgetMargin: 0.20, // coordination fee on pass-through wedding budgets (founder floor: 20%)
  gst: 0.18,
});

const P = POLICY;
/* High-demand nights beyond the hotels' own peak lists: long weekends, festivals, school breaks (Indian calendar).
 * Treated like peak nights for margin only (cost is unchanged). The daily offers task may add dates by pull request. */
const range = (a, b) => { const o = []; for (let t = Date.parse(a + 'T00:00:00Z'); t <= Date.parse(b + 'T00:00:00Z'); t += 864e5) o.push(new Date(t).toISOString().slice(0, 10)); return o; };
export const DEMAND_DATES = new Set([
  ...range('2026-12-24', '2027-01-02'), // Christmas and New Year week
  ...range('2027-01-23', '2027-01-26'), // Republic Day long weekend
  ...range('2027-03-20', '2027-03-22'), // Holi long weekend
  ...range('2027-03-26', '2027-03-28'), // Good Friday long weekend
]);
/* Peak seasons by package type (month numbers, 1-12): honeymoon Dec-Mar after the wedding season, weddings Nov-Feb,
 * families late Dec and school holidays (May-Jun, Oct), Gir Nov-Feb. */
export const SEASON = { honeymoon: [12, 1, 2, 3], wedding: [11, 12, 1, 2], family: [12, 5, 6, 10], circuit: [12, 1, 2], festive: [12, 1] };

export function marginFor(date, { kind, group, peak } = {}) {
  const d = new Date(date + 'T00:00:00Z'), dow = d.getUTCDay(), month = d.getUTCMonth() + 1;
  let m = P.baseMargin;
  if (dow === 5 || dow === 6) m += P.uplift.weekend; // Friday and Saturday nights
  if (peak || DEMAND_DATES.has(date)) m += P.uplift.peak;
  if (kind === 'package') m += P.uplift.bundle;
  if (group && SEASON[group] && SEASON[group].includes(month)) m += P.uplift.season;
  return Math.min(m, P.maxMargin);
}
/* Price for a cost at margin m: K = cost*m/(1-m); guest pays cost + K*(1+GST). */
export const sellFor = (cost, m) => cost * (1 + (1 + P.gst) * m / (1 - m));
export const floorFor = (cost) => cost * (1 + P.floorCommission * (1 + P.gst));
/* What one quote earns: commission before GST and its margin. */
export function marginOf(total, cost) { const k = (total - cost) / (1 + P.gst); return { commission: Math.round(k), margin: k / (cost + k) }; }

/* Is a package in its high season on this date? Used to order homepage offers (no AI, no cost: it moves with the calendar). */
export function inSeason(group, date) { const m = new Date(date + 'T00:00:00Z').getUTCMonth() + 1; return !!(SEASON[group] && SEASON[group].includes(m)); }
