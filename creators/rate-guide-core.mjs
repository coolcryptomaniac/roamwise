/* ============================================================================
   creators/rate-guide-core.mjs — a fair price both sides can accept in one tap
   ============================================================================
   Most creator deals stall on "what is fair?". This file answers it with public
   India benchmarks (2026), adjusted for the creator's real quality grade, and
   compares that with what a hosted stay is actually worth. The result is ONE
   suggested deal (barter, barter + small top-up, or a lighter brief) shown to
   both sides with the reasoning, so a yes needs no back-and-forth.

   Bands are per Instagram Reel, India, organic posting only. Sources (Oct 2026):
     dazzlerr.com/influencer-rates-india-2026      nano ₹500–5k · micro ₹5k–25k · mid ₹25k–1L · macro ₹1L–3L
     upgrowth.in/influencer-marketing-pricing-india-2026  nano ₹2k–8k · micro ₹8k–80k · mid ₹50k–3.5L
     kofluence.com (tier ROI article)              nano ₹1k–12k · micro ₹2k–80k
   We use the conservative overlap, because hill-town and regional creators price
   below national averages (upGrowth: regional-language channels run 40–60% lower).
   Everything here is a default the founder can edit; nothing is charged.
   ========================================================================= */

const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const round500 = (v) => Math.round(v / 500) * 500;

export const RATE_BANDS = Object.freeze([
  { tier: 'nano', from: 1000, to: 10000, reel: [1000, 5000] },
  { tier: 'micro', from: 10000, to: 50000, reel: [5000, 15000] },
  { tier: 'micro+', from: 50000, to: 100000, reel: [12000, 30000] },
  { tier: 'mid', from: 100000, to: 500000, reel: [25000, 100000] },
  { tier: 'macro', from: 500000, to: 1000000, reel: [100000, 300000] },
  { tier: 'mega', from: 1000000, to: Infinity, reel: [300000, 1000000] },
]);
export const RATE_SOURCES = Object.freeze([
  'https://www.dazzlerr.com/influencer-rates-india-2026/',
  'https://upgrowth.in/influencer-marketing-pricing-india-2026/',
  'https://www.kofluence.com/?p=68787',
]);

/* Standard briefs: the same three packages every time, so nobody drafts a brief from scratch. */
export const PACKAGES = Object.freeze({
  stories: { id: 'stories', label: 'Story drop', deliverables: '5 Stories with location tag and link, during the stay', reelEquivalent: 0.5 },
  standard: { id: 'standard', label: 'Stay story', deliverables: '1 Reel + 3 Stories, tagged, within 7 days of checkout', reelEquivalent: 1.3 },
  feature: { id: 'feature', label: 'Full feature', deliverables: '1 Reel + 5 Stories + 10 edited photos the property may reuse on its own pages', reelEquivalent: 2 },
});

/* What the hosted part is worth to the creator, in rupees. Food defaults are editable. */
export const FOOD_PER_PERSON_DAY = Object.freeze({ none: 0, breakfast: 150, all: 600 });

export function bandFor(followers) {
  const f = num(followers);
  if (f < 1000) return { tier: 'starter', from: 0, to: 1000, reel: [0, 1000] };
  return RATE_BANDS.find((b) => f >= b.from && f < b.to) || RATE_BANDS[RATE_BANDS.length - 1];
}

/** Fair cash for one package, narrowed to where this creator's grade sits inside the band. */
export function fairCash(followers, grade = 'C', pkg = 'standard') {
  const b = bandFor(followers), [lo, hi] = b.reel, span = hi - lo;
  const win = { A: [0.75, 1], B: [0.5, 0.75], C: [0.2, 0.5], D: [0, 0.2] }[grade] || [0.2, 0.5];
  const mult = (PACKAGES[pkg] || PACKAGES.standard).reelEquivalent;
  return { tier: b.tier, low: round500((lo + span * win[0]) * mult), high: round500((lo + span * win[1]) * mult), basis: `₹${lo.toLocaleString('en-IN')}–₹${hi.toLocaleString('en-IN')} per Reel for ${b.tier} creators (India 2026)` };
}

export function barterValue(offer = {}, roomRate = 0) {
  const nights = Math.max(1, num(offer.nights) || 1), guests = Math.max(1, num(offer.guests) || 2);
  const stay = nights * num(roomRate);
  const food = nights * guests * (FOOD_PER_PERSON_DAY[offer.food] ?? 0);
  const travel = offer.travel === 'full' ? num(offer.travelUpTo) || 0 : 0;
  return { stay, food, travel, total: stay + food + travel };
}

/**
 * One suggested deal. verdict:
 *   barter      the stay already covers fair value: accept as offered
 *   hybrid      stay + a small cash top-up within the property's budget
 *   lighter     the stay covers a smaller brief (Stories), so offer that instead of haggling
 *   negotiate   the gap is too big for this property; talk or pass
 */
export function recommendDeal({ followers, grade, pkg = 'standard', offer = {}, roomRate = 0, cashBudget = 0 } = {}) {
  const fair = fairCash(followers, grade, pkg);
  const value = barterValue(offer, roomRate);
  const budget = num(cashBudget);
  const base = { fair, value, package: PACKAGES[pkg] || PACKAGES.standard, topUp: 0 };
  if (!num(roomRate)) return { ...base, verdict: 'barter', why: 'Room rate not set, so the stay value is unknown: offer the standard brief as a barter.' };
  if (value.total >= fair.low) return { ...base, verdict: 'barter', why: `The stay is worth about ₹${value.total.toLocaleString('en-IN')}, at or above a fair ₹${fair.low.toLocaleString('en-IN')}–₹${fair.high.toLocaleString('en-IN')} for this creator.` };
  const gap = round500(fair.low - value.total);
  if (gap > 0 && gap <= budget) return { ...base, verdict: 'hybrid', topUp: gap, why: `The stay (≈₹${value.total.toLocaleString('en-IN')}) is ₹${gap.toLocaleString('en-IN')} short of fair value; a top-up of that size closes it.` };
  if (pkg !== 'stories') {
    const light = fairCash(followers, grade, 'stories');
    if (value.total >= light.low) return { ...base, verdict: 'lighter', package: PACKAGES.stories, fair: light, why: `The stay covers a Story drop (fair ₹${light.low.toLocaleString('en-IN')}–₹${light.high.toLocaleString('en-IN')}) but not a Reel package.` };
  }
  return { ...base, verdict: 'negotiate', topUp: gap, why: `Fair value is about ₹${fair.low.toLocaleString('en-IN')}+; the stay covers ₹${value.total.toLocaleString('en-IN')}. Needs cash this property has not offered.` };
}

/* Speed rules shown to both sides. Short clocks and one counter keep deals from drifting. */
export const SPEED_RULES = Object.freeze({
  offerExpiresHours: 48,          // no reply in 48 h: the offer moves to the next creator on the list
  countersAllowed: 1,             // one structured counter (dates, guests, food, top-up), then yes or no
  postWithinDays: 7,
  cancelBeforeHours: 48,
});

/** Section 194R: a business giving a benefit over ₹20,000 to one person in a financial year deducts 10% TDS. Flag it; a CA confirms. */
export function tdsCheck(benefitsThisYear = []) {
  const total = (Array.isArray(benefitsThisYear) ? benefitsThisYear : []).reduce((s, v) => s + num(v), 0);
  return { total, over: total > 20000, note: total > 20000 ? 'Benefits to this creator pass ₹20,000 this financial year: the property may need to deduct 10% TDS under Section 194R. Check with a CA.' : '' };
}
