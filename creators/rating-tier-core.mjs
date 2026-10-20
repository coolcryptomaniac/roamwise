/* creators/rating-tier-core.mjs - RoamWise creator tiers: Mirage, Base Camp, Trail, Ridge, Summit.
   Built on creatorQuality() (local-barter-core.mjs), which already resists bought followers. This layer turns the score and
   its red flags into one plain name a property owner understands, says WHY, and says what would move the creator up.
   Pure functions, no network. Self-reported numbers can never reach Summit: it needs checked numbers AND real bookings.
     Mirage    numbers do not hold up (inflated followers, suspicious or very low engagement, reels nobody watches)
     Base Camp new or too little data to judge fairly; not a bad sign
     Trail     healthy and real; small to medium reach, conversion not proven yet
     Ridge     strong engagement and reach for their size, steady posting, no red flags
     Summit    large reach AND real engagement AND proven bookings with checked numbers (the "celebrity" tier) */
import { creatorQuality, expectedEngagementPct } from './local-barter-core.mjs';

const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
export const TIERS = Object.freeze(['mirage', 'basecamp', 'trail', 'ridge', 'summit']);
export const TIER_INFO = Object.freeze({
  mirage: { name: 'Mirage', icon: '🌫️', blurb: 'Numbers do not hold up' },
  basecamp: { name: 'Base Camp', icon: '⛺', blurb: 'New or not enough data yet' },
  trail: { name: 'Trail', icon: '🥾', blurb: 'Real and healthy audience' },
  ridge: { name: 'Ridge', icon: '🏔️', blurb: 'Strong engagement and reach' },
  summit: { name: 'Summit', icon: '🚩', blurb: 'Proven reach and bookings' },
});
export const SUMMIT = Object.freeze({ minFollowers: 50000, minBookings: 2, minViewRatio: 0.2 });

/** { tier, name, icon, blurb, reasons[], next, evidence, score, overridden } for a creator's numbers. */
export function rateTier(m = {}, opts = {}) {
  const q = opts.quality || creatorQuality(m);
  const followers = num(m.followers), views = num(m.avgViews), er = q.engagementPct || 0;
  const bookings = num(m.verifiedBookings), clicks = num(m.verifiedClicks);
  const verified = m.metricsVerified === true;
  const vpf = followers && views ? views / followers : 0;
  const reasons = [];
  let tier;

  const redFlags = q.flags.filter((f) => ['likely_inflated', 'audience_growth_anomaly', 'engagement_suspicious'].includes(f));
  if (q.flags.includes('likely_inflated')) reasons.push('very low engagement for this many followers');
  if (q.flags.includes('audience_growth_anomaly')) reasons.push('large audience on a very new account');
  if (q.flags.includes('engagement_suspicious')) reasons.push('engagement is unusually high for the follower count');
  if (followers >= 10000 && views && vpf < 0.02) { redFlags.push('dead_reach'); reasons.push('reels reach under 2% of followers'); }
  if (followers >= 20000 && er && er < expectedEngagementPct(followers) / 4) { if (!redFlags.includes('low_engagement')) redFlags.push('low_engagement'); reasons.push('engagement is a quarter of what is normal for this size'); }

  if (redFlags.length) tier = 'mirage';
  else if (!followers || (followers < 1000 && !bookings)) { tier = 'basecamp'; reasons.push(followers ? 'under 1,000 followers' : 'follower count not given'); }
  else if (q.score >= 60 && !q.flags.includes('low_reach') && !q.flags.includes('inactive_lately')) { tier = 'ridge'; reasons.push(...q.why.slice(0, 2)); }
  else if (q.score >= 45) { tier = 'trail'; reasons.push(...q.why.slice(0, 2)); }
  else { tier = 'basecamp'; reasons.push('not enough data to rate higher'); }

  /* Summit: reach, real engagement, reels people actually watch, bookings through RoamWise, and numbers someone checked. */
  const summitOk = tier === 'ridge' && followers >= SUMMIT.minFollowers && bookings >= SUMMIT.minBookings && vpf >= SUMMIT.minViewRatio && verified;
  if (summitOk) { tier = 'summit'; reasons.unshift(`${bookings} verified bookings and reels reaching ${Math.round(vpf * 100)}% of ${followers.toLocaleString('en-IN')} followers`); }
  /* Self-reported numbers cap at Ridge: the claim can be real, but nobody has checked it. */
  if (tier === 'ridge' && !verified) reasons.push('numbers are self-reported, not yet checked');
  if (clicks >= 50 && !bookings && TIERS.indexOf(tier) > TIERS.indexOf('trail')) { tier = 'trail'; reasons.push(`${clicks} clicks but no bookings yet`); }

  let overridden = false;
  if (TIERS.includes(opts.override)) { overridden = opts.override !== tier; tier = opts.override; if (overridden) reasons.unshift('set by the RoamWise founder'); }

  const next = {
    mirage: 'Share real Insights screenshots; the founder re-checks them.',
    basecamp: 'Post regularly and share your Insights numbers.',
    trail: 'Raise engagement, keep posting weekly, and bring one booking through your link.',
    ridge: verified ? `Bring ${Math.max(0, SUMMIT.minBookings - bookings)} more verified bookings${followers < SUMMIT.minFollowers ? ' and grow past 50,000 followers' : ''} for Summit.` : 'Get your Insights numbers checked, then bring bookings for Summit.',
    summit: 'Top tier.',
  }[tier];
  return { tier, ...TIER_INFO[tier], reasons: [...new Set(reasons)].slice(0, 4), next, evidence: verified ? 'checked' : 'self-reported', score: q.score, overridden };
}

/** Rank value used to prefer better tiers when scores tie. */
export const tierRank = (t) => Math.max(0, TIERS.indexOf(t));
