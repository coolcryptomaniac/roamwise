const MODES = new Set(['barter', 'hybrid', 'paid']);
const KNOWN_CREATOR_HOSTS = ['instagram.com', 'youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com'];

function list(value, limit = 12) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(values.map(item => String(item || '').trim().toLowerCase()).filter(Boolean))].slice(0, limit);
}

function money(value) {
  const amount = Math.max(0, Math.round(Number(value || 0)));
  return Number.isSafeInteger(amount) ? amount : 0;
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' ? url.href.slice(0, 700) : '';
  } catch {
    return '';
  }
}

function host(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ''); }
  catch { return ''; }
}

export const COLLAB_TIERS = Object.freeze([
  {
    id: 'barter',
    label: 'Hosted story swap',
    cashMin: 0,
    cashMax: 0,
    summary: '1–2 hosted nights plus agreed meals or experience; one Reel or short video plus three Stories, or an equivalent photo pack.'
  },
  {
    id: 'hybrid',
    label: 'Hybrid boost',
    cashMin: 3000,
    cashMax: 15000,
    summary: 'Hosted stay plus a mutually agreed fee or travel allowance for stronger production, more deliverables or licensed UGC.'
  },
  {
    id: 'paid',
    label: 'Paid launch production',
    cashMin: 15000,
    cashMax: 50000,
    summary: 'For a new opening, major launch, ad usage, exclusivity or production-heavy work. Stay and expenses remain separate from the creator fee.'
  },
  {
    id: 'custom',
    label: 'Mutually agreed',
    cashMin: 0,
    cashMax: 500000,
    summary: 'Either side may propose different benefits, deliverables or cash. Nothing becomes binding until both accept the same version.'
  }
]);

export function normalizeMatchProfile(input = {}, forcedRole) {
  const role = String(forcedRole || input.role || '').toLowerCase();
  if (!['creator', 'property'].includes(role)) throw new Error('role must be creator or property');
  const modes = list(input.dealModes || input.modes, 3).filter(mode => MODES.has(mode));
  if (!modes.length) modes.push('barter');
  const out = {
    role,
    dealModes: modes,
    niches: list(input.niches),
    platforms: list(input.platforms),
    destinations: list(input.destinations),
    services: list(input.services),
    profileUrl: safeUrl(input.profileUrl),
    minimumCash: money(input.minimumCash),
    maximumCash: money(input.maximumCash),
    hostedNights: Math.max(0, Math.min(30, money(input.hostedNights))),
    mealsIncluded: Boolean(input.mealsIncluded),
    travelIncluded: Boolean(input.travelIncluded),
    newOpening: Boolean(input.newOpening),
    accountAgeDays: Math.max(0, Math.min(36500, money(input.accountAgeDays))),
    claimedFollowers: Math.max(0, Math.min(1000000000, money(input.claimedFollowers))),
    autopilot: input.autopilot !== false,
    note: String(input.note || '').trim().slice(0, 1000)
  };
  if (out.maximumCash && out.maximumCash < out.minimumCash) {
    [out.minimumCash, out.maximumCash] = [out.maximumCash, out.minimumCash];
  }
  return out;
}

export function assessTrust(profileInput = {}) {
  const profile = normalizeMatchProfile(profileInput, profileInput.role);
  const flags = [];
  let riskScore = 0;
  if (!profile.profileUrl) { flags.push('public_profile_missing'); riskScore += 25; }
  if (profile.role === 'creator' && profile.profileUrl && !KNOWN_CREATOR_HOSTS.some(item => host(profile.profileUrl).endsWith(item))) {
    flags.push('unfamiliar_creator_profile'); riskScore += 15;
  }
  if (profile.accountAgeDays && profile.accountAgeDays < 30) { flags.push('new_social_account'); riskScore += 20; }
  if (!profile.niches.length) { flags.push('niche_missing'); riskScore += 10; }
  if (profile.role === 'creator' && !profile.services.length) { flags.push('deliverables_missing'); riskScore += 15; }
  if (profile.role === 'property' && profile.hostedNights < 1) { flags.push('hosted_benefit_missing'); riskScore += 15; }
  if (profile.maximumCash > 15000 || profile.minimumCash > 15000) { flags.push('high_cash_review'); riskScore += 15; }
  if (profile.claimedFollowers > 100000 && profile.accountAgeDays && profile.accountAgeDays < 90) { flags.push('audience_growth_anomaly'); riskScore += 25; }
  return {
    riskScore: Math.min(100, riskScore),
    flags,
    requiresManualReview: riskScore >= 40 || flags.includes('high_cash_review'),
    checks: [
      'Identity and contact ownership',
      'Public profile age, activity and audience quality',
      'Property ownership or management authority',
      'Rate, room and deliverable reasonableness',
      'Duplicate account, payout and device signals',
      'Rights, disclosure and cancellation terms'
    ]
  };
}

/* ---- Vocabulary: so "Almora" matches "Uttarakhand" and "yoga" matches "wellness" ---- */
const PLACE_PARENT = Object.freeze({
  'kasar devi': 'almora', almora: 'kumaon', kausani: 'kumaon', nainital: 'kumaon', bhimtal: 'kumaon', ranikhet: 'kumaon',
  mukteshwar: 'kumaon', binsar: 'kumaon', jageshwar: 'kumaon', kumaon: 'uttarakhand', garhwal: 'uttarakhand',
  rishikesh: 'garhwal', dehradun: 'garhwal', mussoorie: 'garhwal', auli: 'garhwal', chopta: 'garhwal', uttarakhand: 'himalaya',
  manali: 'kullu', kasol: 'kullu', kullu: 'himachal', shimla: 'himachal', dharamshala: 'himachal', mcleodganj: 'dharamshala',
  bir: 'himachal', spiti: 'himachal', kinnaur: 'himachal', himachal: 'himalaya', leh: 'ladakh', ladakh: 'himalaya',
  sikkim: 'himalaya', darjeeling: 'himalaya', shillong: 'meghalaya', meghalaya: 'northeast', ziro: 'northeast',
  jaipur: 'rajasthan', jodhpur: 'rajasthan', udaipur: 'rajasthan', jaisalmer: 'rajasthan', pushkar: 'rajasthan',
  'north goa': 'goa', 'south goa': 'goa', munnar: 'kerala', alleppey: 'kerala', varkala: 'kerala', kochi: 'kerala',
  hampi: 'karnataka', coorg: 'karnataka', gokarna: 'karnataka', pondicherry: 'south india', kerala: 'south india', karnataka: 'south india'
});
const NICHE_GROUPS = Object.freeze({
  mountains: ['mountain', 'mountains', 'himalaya', 'himalayan', 'hills', 'hill station', 'trekking', 'trek', 'nature', 'scenic'],
  wellness: ['wellness', 'yoga', 'meditation', 'retreat', 'ayurveda', 'spa', 'slow living', 'digital detox'],
  food: ['food', 'foodie', 'cuisine', 'cooking', 'culinary', 'cafe', 'local food'],
  culture: ['culture', 'heritage', 'folk', 'music', 'festival', 'local', 'traditional', 'art'],
  adventure: ['adventure', 'rafting', 'paragliding', 'camping', 'biking', 'offroad'],
  luxury: ['luxury', 'premium', 'boutique', 'fine stay'],
  budget: ['budget', 'backpacker', 'hostel', 'solo'],
  family: ['family', 'kids', 'family travel'],
  romance: ['romance', 'romantic', 'honeymoon', 'couple', 'couples'],
  workation: ['workation', 'nomad', 'digital nomad', 'remote work', 'coworking']
});
const PLATFORM_ALIAS = Object.freeze({ ig: 'instagram', insta: 'instagram', reels: 'instagram', yt: 'youtube', shorts: 'youtube', fb: 'facebook' });
const NICHE_LOOKUP = new Map(Object.entries(NICHE_GROUPS).flatMap(([group, words]) => words.map(word => [word, group])));

export const canonicalNiche = value => NICHE_LOOKUP.get(value) || value;
const canonicalPlatform = value => PLATFORM_ALIAS[value] || value;

function placeChain(place) {
  const chain = [place];
  for (let step = 0; step < 6 && PLACE_PARENT[chain[chain.length - 1]]; step += 1) chain.push(PLACE_PARENT[chain[chain.length - 1]]);
  return chain;
}

/* 1 = same place, .85 = one contains the other, .5 = same region, .25 = same mountain range / broad zone. */
export function placeCloseness(a, b) {
  if (a === b) return 1;
  const ca = placeChain(a), cb = placeChain(b);
  if (ca.includes(b) || cb.includes(a)) return 0.85;
  const shared = ca.filter(item => cb.includes(item));
  if (!shared.length) return 0;
  return shared.every(item => item === 'himalaya' || item === 'northeast' || item === 'south india') ? 0.25 : 0.5;
}

/* Returns { value 0..1, known }. Unknown (an empty side) is deliberately weak, not neutral. */
function overlap(a, b, kind = 'exact') {
  if (!a.length || !b.length) return { value: 0, known: false };
  if (kind === 'place') {
    const best = a.map(x => Math.max(...b.map(y => placeCloseness(x, y)))).reduce((m, v) => Math.max(m, v), 0);
    return { value: best, known: true };
  }
  const canon = kind === 'niche' ? canonicalNiche : kind === 'platform' ? canonicalPlatform : (x => x);
  const A = new Set(a.map(canon)), B = new Set(b.map(canon));
  const hits = [...A].filter(item => B.has(item)).length;
  return { value: hits / Math.max(1, Math.min(A.size, B.size)), known: true };
}

/* How much of a profile is filled in (0..1). Thin profiles cannot be confidently matched. */
export function profileCompleteness(profileInput = {}) {
  const profile = normalizeMatchProfile(profileInput, profileInput.role);
  const checks = profile.role === 'creator'
    ? [profile.niches.length, profile.destinations.length, profile.platforms.length, profile.services.length, profile.profileUrl]
    : [profile.niches.length, profile.destinations.length, profile.platforms.length, profile.hostedNights > 0, profile.profileUrl];
  return checks.filter(Boolean).length / checks.length;
}

export function scoreMatch(creatorInput, propertyInput) {
  const creator = normalizeMatchProfile(creatorInput, 'creator');
  const property = normalizeMatchProfile(propertyInput, 'property');
  const mode = overlap(creator.dealModes, property.dealModes);
  const niche = overlap(creator.niches, property.niches, 'niche');
  const destination = overlap(creator.destinations, property.destinations, 'place');
  const platform = overlap(creator.platforms, property.platforms, 'platform');
  const sharedBarter = property.dealModes.includes('barter') && creator.dealModes.includes('barter');
  const cashGap = sharedBarter ? 0 : Math.max(0, creator.minimumCash - property.maximumCash);
  const budgetFits = sharedBarter || (property.maximumCash > 0 && cashGap === 0);
  const benefitsFit = property.hostedNights > 0 && (property.mealsIncluded || property.travelIncluded);
  /* Hard gates: no shared deal style or an unbridgeable cash gap is never a match, however well the themes line up. */
  const compatible = mode.value > 0 && budgetFits;
  const confidence = Math.round(((profileCompleteness(creator) + profileCompleteness(property)) / 2) * 100) / 100;
  const raw = Math.round(mode.value * 30 + niche.value * 25 + destination.value * 20 + platform.value * 10 + (budgetFits ? 10 : 0) + (benefitsFit ? 5 : 0));
  const score = Math.max(0, Math.min(100, compatible ? raw : Math.min(raw, 40)));
  const creatorTrust = assessTrust(creator);
  const propertyTrust = assessTrust(property);
  const manualReview = creatorTrust.requiresManualReview || propertyTrust.requiresManualReview;
  const thin = confidence < 0.6;
  const reasons = [
    mode.value <= 0 ? 'no shared deal style' : mode.value >= 0.5 ? 'deal style aligns' : 'deal style needs negotiation',
    !niche.known ? 'add niches to improve this match' : niche.value >= 0.5 ? 'audience and stay theme align' : 'audience fit is uncertain',
    !destination.known ? 'add destinations to improve this match' : destination.value >= 0.85 ? 'travel geography aligns' : destination.value >= 0.5 ? 'same region, different place' : 'travel geography needs confirmation',
    budgetFits ? 'budget is compatible' : cashGap > 0 ? `cash gap of ₹${cashGap.toLocaleString('en-IN')}` : 'cash expectation does not fit'
  ];
  if (thin) reasons.push('profiles are thin: add details before an introduction');
  return {
    score,
    shortlist: score >= 68 && !manualReview && compatible && !thin,
    manualReview,
    compatible,
    confidence,
    cashGap,
    breakdown: {
      dealStyle: Math.round(mode.value * 30), theme: Math.round(niche.value * 25), geography: Math.round(destination.value * 20),
      platform: Math.round(platform.value * 10), budget: budgetFits ? 10 : 0, hostedBenefits: benefitsFit ? 5 : 0
    },
    reasons
  };
}

export function recommendTier(propertyInput, creatorInput = {}) {
  const property = normalizeMatchProfile(propertyInput, 'property');
  const creator = normalizeMatchProfile({ ...creatorInput, role: 'creator' }, 'creator');
  let tier = 'barter';
  const available = property.maximumCash || 0;
  if (property.newOpening && available >= 15000 && creator.dealModes.includes('paid')) tier = 'paid';
  else if (available >= 3000 && creator.dealModes.includes('hybrid') && property.dealModes.includes('hybrid')) tier = 'hybrid';
  else if (!creator.dealModes.includes('barter') || !property.dealModes.includes('barter')) tier = available >= creator.minimumCash && available ? 'hybrid' : 'custom';
  return COLLAB_TIERS.find(item => item.id === tier) || COLLAB_TIERS[3];
}

export function autopilotDecision(creatorInput, propertyInput) {
  const match = scoreMatch(creatorInput, propertyInput);
  const tier = recommendTier(propertyInput, creatorInput);
  if (match.manualReview) return { action: 'manual_review', match, tier };
  if (!match.compatible) return { action: 'hold', match, tier };
  if (match.confidence < 0.6) return { action: 'ask_for_details', match, tier };
  if (match.score >= 80) return { action: 'invite_both', match, tier };
  if (match.score >= 68) return { action: 'shortlist', match, tier };
  return { action: 'hold', match, tier };
}

/* ---- Ranking: best partners for one profile, de-duplicated, with the reason for each ---- */
export function rankMatches(subjectInput, candidates = [], { limit = 10, minScore = 50 } = {}) {
  const subjectRole = String(subjectInput?.role || '').toLowerCase();
  if (!['creator', 'property'].includes(subjectRole)) throw new Error('subject role must be creator or property');
  const subject = normalizeMatchProfile(subjectInput, subjectRole);
  const wanted = subjectRole === 'creator' ? 'property' : 'creator';
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(candidates) ? candidates : []) {
    if (!raw || String(raw.role || '').toLowerCase() !== wanted) continue;
    const candidate = normalizeMatchProfile(raw, wanted);
    const key = String(raw.id || raw.uid || candidate.profileUrl || '').toLowerCase();
    if (key && (seen.has(key) || key === String(subjectInput.id || subjectInput.uid || '').toLowerCase())) continue;
    if (key) seen.add(key);
    if (candidate.profileUrl && subject.profileUrl && candidate.profileUrl === subject.profileUrl) continue;
    const creator = subjectRole === 'creator' ? subject : candidate;
    const property = subjectRole === 'creator' ? candidate : subject;
    const decision = autopilotDecision(creator, property);
    if (decision.match.score < minScore && decision.action !== 'manual_review') continue;
    out.push({ id: raw.id || raw.uid || key, action: decision.action, tier: decision.tier, quote: quoteCollaboration(property, creator), ...decision.match });
  }
  return out.sort((a, b) => b.score - a.score || Number(a.manualReview) - Number(b.manualReview)).slice(0, Math.max(1, Math.min(50, limit)));
}

/* ---- Fee disclosure (no money moves here) ------------------------------------------------
   RoamWise charges the PROPERTY a small fee; the creator keeps 100% of the agreed cash fee.
   No fee applies unless both sides accept, and the barter fee is due only after the stay is
   completed. These are DEFAULTS for the quote shown to both sides; the server that actually
   collects (creators/protection, CREATOR_PLATFORM_FEE_BPS) must be aligned in a separate
   payments review before live collection is enabled. */
export const PLATFORM_FEES = Object.freeze({ cashBps: 800, minCashFee: 99, barterSuccessFee: 299 });
export const PLATFORM_FEE_GST_BPS = 1800;

export function quoteCollaboration(propertyInput, creatorInput = {}, fees = PLATFORM_FEES) {
  const property = normalizeMatchProfile(propertyInput, 'property');
  const creator = normalizeMatchProfile({ ...creatorInput, role: 'creator' }, 'creator');
  const tier = recommendTier(property, creator);
  let cash = 0;
  if (tier.id !== 'barter') {
    const floor = Math.max(creator.minimumCash, tier.cashMin);
    cash = property.maximumCash ? Math.min(property.maximumCash, Math.max(floor, tier.cashMin)) : 0;
    if (creator.minimumCash > property.maximumCash && !(property.dealModes.includes('barter') && creator.dealModes.includes('barter'))) cash = 0;
  }
  const platformFee = cash > 0
    ? Math.max(fees.minCashFee, Math.round(cash * fees.cashBps / 10000))
    : (property.hostedNights > 0 ? fees.barterSuccessFee : 0);
  return {
    tier: tier.id,
    creatorReceives: cash,
    propertyPays: cash + platformFee,
    platformFee,
    /* GST on RoamWise's own fee, due only once RoamWise is GST-registered. Rate lives in
       features/finance-tax/gst-rules.js (rule platform_fee); a test keeps the two equal. */
    platformFeeGst: Math.round(platformFee * PLATFORM_FEE_GST_BPS / 10000),
    platformFeeGstNote: 'Plus GST on the RoamWise fee once RoamWise is GST-registered.',
    feeBasis: cash > 0 ? `${(fees.cashBps / 100).toFixed(fees.cashBps % 100 ? 1 : 0)}% of the cash fee (minimum ₹${fees.minCashFee})` : 'flat success fee for a hosted-stay collaboration',
    dueWhen: cash > 0 ? 'when the campaign is funded by the property' : 'only after the hosted stay is completed',
    notes: [
      'The fee is charged to the property; it is never deducted from the creator’s agreed fee.',
      'No fee applies unless both sides accept the same written brief.',
      'This is a disclosure estimate; no payment is taken until live collection is enabled.'
    ]
  };
}
