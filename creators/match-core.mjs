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

function overlap(a, b) {
  if (!a.length || !b.length) return 0.5;
  return a.filter(item => b.includes(item)).length / Math.max(1, Math.min(a.length, b.length));
}

export function scoreMatch(creatorInput, propertyInput) {
  const creator = normalizeMatchProfile(creatorInput, 'creator');
  const property = normalizeMatchProfile(propertyInput, 'property');
  const mode = overlap(creator.dealModes, property.dealModes);
  const niche = overlap(creator.niches, property.niches);
  const destination = overlap(creator.destinations, property.destinations);
  const platform = overlap(creator.platforms, property.platforms);
  const budgetFits = property.dealModes.includes('barter') && creator.dealModes.includes('barter') ||
    property.maximumCash >= creator.minimumCash;
  const benefitsFit = property.hostedNights > 0 && (property.mealsIncluded || property.travelIncluded);
  const score = Math.round(mode * 30 + niche * 25 + destination * 20 + platform * 10 + (budgetFits ? 10 : 0) + (benefitsFit ? 5 : 0));
  const creatorTrust = assessTrust(creator);
  const propertyTrust = assessTrust(property);
  const manualReview = creatorTrust.requiresManualReview || propertyTrust.requiresManualReview;
  return {
    score: Math.max(0, Math.min(100, score)),
    shortlist: score >= 68 && !manualReview,
    manualReview,
    reasons: [
      mode >= 0.5 ? 'deal style aligns' : 'deal style needs negotiation',
      niche >= 0.5 ? 'audience and stay theme align' : 'audience fit is uncertain',
      destination >= 0.5 ? 'travel geography aligns' : 'travel geography needs confirmation',
      budgetFits ? 'budget is compatible' : 'cash expectation does not fit'
    ]
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
  if (match.score >= 80) return { action: 'invite_both', match, tier };
  if (match.score >= 68) return { action: 'shortlist', match, tier };
  return { action: 'hold', match, tier };
}
