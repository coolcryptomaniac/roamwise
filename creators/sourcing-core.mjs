/* ============================================================================
   creators/sourcing-core.mjs — find creators who will promote without a big ask
   ============================================================================
   The right creators for a small homestay are not celebrities. They are local or
   regional nano and micro creators (a few thousand to about 100k followers) who
   post regularly, engage their audience, and will take a free stay plus a cash
   bonus that is paid only when their guests actually book.

   This file ranks candidates from PUBLIC numbers someone has noted down (follower
   count, engagement, posting rate) and writes the invitation. It cannot know who
   is available: availability is only ever "confirmed" after a creator replies yes.
   Pure functions, no scraping, no network.
   ========================================================================= */
import { placeCloseness, canonicalNiche } from './match-core.mjs';
import { termsText } from './property-terms-core.mjs';

const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x || '').trim().toLowerCase()).filter(Boolean);

export const BANDS = Object.freeze({ nanoMax: 10000, microMax: 100000, celebrityFrom: 250000 });

export function audienceBand(followers) {
  const f = num(followers);
  if (!f) return 'unknown';
  if (f < 2000) return 'tiny';
  if (f < BANDS.nanoMax) return 'nano';
  if (f < BANDS.microMax) return 'micro';
  if (f < BANDS.celebrityFrom) return 'mid';
  return 'celebrity';
}

/** Score one candidate for a low-ask, hosted-stay collaboration at a property in `zone`. */
export function fitLowAsk(c = {}, opts = {}) {
  const zone = String(opts.zone || '').toLowerCase();
  const followers = num(c.followers), band = audienceBand(followers);
  const flags = [], why = [];
  let score = 0;

  /* Reach that suits a small property: nano/micro best; big accounts cost more and rarely accept barter. */
  const reach = { unknown: 5, tiny: 8, nano: 25, micro: 25, mid: 12, celebrity: 0 }[band];
  score += reach;
  if (band === 'celebrity') flags.push('celebrity_tier');
  if (band === 'mid') flags.push('may_expect_fee');
  if (band === 'nano' || band === 'micro') why.push('audience size suits a small stay');

  const er = num(c.engagementPct);
  const eng = !er ? 6 : er >= 3 ? 20 : er >= 1.5 ? 12 : 4;
  score += eng;
  if (er >= 3) why.push('strong engagement');
  if (!er) flags.push('engagement_unknown');

  const places = list(c.destinations).concat(list(c.location));
  const place = zone && places.length ? Math.max(...places.map((p) => placeCloseness(p, zone))) : 0;
  const niches = list(c.niches).map(canonicalNiche), want = list(opts.niches).map(canonicalNiche);
  const nicheHit = want.length && niches.length ? niches.filter((n) => want.includes(n)).length / Math.min(want.length, niches.length) : 0;
  score += Math.round(place * 15 + nicheHit * 10);
  if (place >= 0.85) why.push('based in or covers the area');
  if (nicheHit >= 0.5) why.push('content matches the stay');

  const posts = num(c.postsLast30d);
  score += posts >= 4 ? 15 : posts >= 1 ? 8 : 0;
  if (posts === 0) flags.push('inactive_lately');

  /* Low ask: no upfront fee, no agency in the middle, open to barter. */
  const upfront = num(c.askedUpfrontINR), card = num(c.rateCardINR);
  let ask = 15;
  if (upfront > 0) { ask = 0; flags.push('asks_upfront'); }
  else if (card > 15000) { ask -= 10; flags.push('high_rate_card'); }
  if (c.hasAgency) { ask = Math.max(0, ask - 10); flags.push('agency_managed'); }
  if (c.openToBarter === true) { ask = Math.min(15, ask + 0); why.push('open to barter'); }
  else if (c.openToBarter === false) { ask = 0; flags.push('barter_declined'); }
  score += ask;

  if (num(c.accountAgeDays) && num(c.accountAgeDays) < 60) flags.push('new_account');
  if (followers > 50000 && num(c.accountAgeDays) && num(c.accountAgeDays) < 120) flags.push('audience_growth_anomaly');

  score = Math.max(0, Math.min(100, score));
  const blocked = flags.some((f) => ['celebrity_tier', 'asks_upfront', 'barter_declined', 'audience_growth_anomaly'].includes(f));
  return {
    handle: String(c.handle || '').slice(0, 80), platform: String(c.platform || '').toLowerCase(), band, score, flags, why,
    verdict: blocked ? 'skip' : score >= 70 ? 'invite_first' : score >= 50 ? 'invite_if_room' : 'skip',
    availability: c.availability === 'confirmed' ? 'confirmed' : 'unknown',
  };
}

export function rankCandidates(candidates, opts = {}) {
  const seen = new Set();
  return (Array.isArray(candidates) ? candidates : [])
    .filter((c) => c && c.handle && !seen.has(String(c.platform || '') + ':' + String(c.handle).toLowerCase()) && seen.add(String(c.platform || '') + ':' + String(c.handle).toLowerCase()))
    .map((c) => fitLowAsk(c, opts))
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit || 30);
}

/** First message to a creator. Short, honest about terms, no pressure, easy to say no. */
export function inviteMessage(policy, creatorName, opts = {}) {
  const name = String(creatorName || 'there').split(/\s+/)[0].slice(0, 30);
  return 'Hi ' + name + ', I am from RoamWise (roamwise.co.in), a small India-first travel planner. '
    + 'We work with ' + (policy && policy.name ? policy.name : 'a property') + ' and would love a real local creator to stay and share an honest take.\n\n'
    + termsText(policy) + '\n\n'
    + 'No upfront fee on either side, no minimum followers, and you keep full creative control. You are free to say no, or to suggest other dates. '
    + 'If this sounds interesting, reply with 2-3 dates you could travel and a link to your best work.'
    + (opts.joinUrl ? '\n\nApply here: ' + opts.joinUrl : '');
}

/** Where to look. Starting points only: check each tag and place yourself before outreach. */
export function searchPlan(zone) {
  const z = String(zone || '').toLowerCase().replace(/[^a-z ]/g, '').trim();
  const tag = z.replace(/\s+/g, '');
  return {
    zone: z,
    instagram: [`#${tag}`, `#${tag}diaries`, `#${tag}tourism`, '#kumaon', '#uttarakhand', '#pahadi', 'location tag: ' + (zone || 'the town')].slice(0, 7),
    youtube: [`${zone} vlog`, `${zone} travel guide`, `${zone} homestay review`, 'Kumaon travel vlog'],
    filters: ['3k to 100k followers', 'posted in the last 30 days', 'real comments, not only emojis', 'lives in or travels to Uttarakhand/Himachal often', 'no agency in bio', 'works in Hindi and English'],
    ask: 'Message a handful at a time, say plainly what is on offer, and track who replies. Only a yes makes a creator "available".',
  };
}
