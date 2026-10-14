/* ============================================================================
   creators/property-terms-core.mjs — what each property will actually offer creators
   ============================================================================
   match-core.mjs scores how well a creator and a property fit. This file adds the
   property's OWN terms on top, because properties differ:

     open     takes creators, on stated terms (free stay on set nights, optional
              cash that is paid only when referred guests actually stay)
     pending  owner has not decided yet: nobody is introduced
     closed   owner said no: nobody is introduced, and the reason is kept

   Pure functions, no network, no money. Cash here is always PERFORMANCE cash paid
   by the property to the creator after a referred stay is completed; RoamWise does
   not hold or move it. "AI adjustable" means: the numbers live in editable config,
   suggestions (rule-based or from a model) are validated and clamped, and nothing
   changes on its own unless the owner switched auto-adjust on and set ceilings.
   ========================================================================= */
import { autopilotDecision, normalizeMatchProfile, quoteCollaboration, scoreMatch } from './match-core.mjs';
import { PACKAGES } from './rate-guide-core.mjs';

export const POLICY_STATUS = Object.freeze(['open', 'pending', 'closed']);
const clampInt = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const dateOk = (d) => /^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(String(d || '')) && !Number.isNaN(Date.parse(d));
const months = (v) => [...new Set((Array.isArray(v) ? v : []).map(Number).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12))].sort((a, b) => a - b);

export function normalizePolicy(raw = {}) {
  const status = POLICY_STATUS.includes(raw.status) ? raw.status : 'pending';
  const fs = raw.freeStay || {};
  const pc = raw.performanceCash || {};
  const aa = raw.autoAdjust || {};
  const cap = clampInt(pc.max, 0, 50000, 0);
  return {
    propertyId: String(raw.propertyId || '').slice(0, 60),
    name: String(raw.name || '').slice(0, 110),
    status,
    reason: String(raw.reason || '').slice(0, 300),
    freeStay: {
      nights: clampInt(fs.nights, 0, 14, 0),
      weekdaysOnly: fs.weekdaysOnly !== false,          // Fri and Sat nights are weekend nights
      offSeasonOnly: fs.offSeasonOnly !== false,
      offSeasonMonths: months(fs.offSeasonMonths),
      blackoutDates: (Array.isArray(fs.blackoutDates) ? fs.blackoutDates : []).filter(dateOk).slice(0, 60),
      meals: !!fs.meals || fs.food === 'all' || fs.food === 'breakfast',
      food: ['none', 'breakfast', 'all'].includes(fs.food) ? fs.food : (fs.meals ? 'all' : 'none'),
      guests: clampInt(fs.guests, 1, 4, 2),
      travel: ['none', 'pickup', 'full'].includes(fs.travel) ? fs.travel : 'none',
      maxPerMonth: clampInt(fs.maxPerMonth, 0, 30, 2),
    },
    performanceCash: {
      max: cap,
      ratePct: cap ? clampInt(pc.ratePct, 1, 30, 10) : 0,
      trigger: 'completed_referred_stay',
    },
    upfrontCash: 0,                                       // by design: nothing is paid before guests stay
    autoAdjust: {
      enabled: aa.enabled === true,
      ceilings: {
        maxCash: clampInt(aa.ceilings && aa.ceilings.maxCash, 0, 50000, cap),
        maxNights: clampInt(aa.ceilings && aa.ceilings.maxNights, 0, 14, fs.nights ? clampInt(fs.nights, 0, 14, 0) : 0),
        maxPerMonth: clampInt(aa.ceilings && aa.ceilings.maxPerMonth, 0, 30, clampInt(fs.maxPerMonth, 0, 30, 2)),
      },
    },
    /* Where the stay is (for distance-first matching and Google Maps) and the number deals go to. */
    location: {
      town: String((raw.location && raw.location.town) || '').slice(0, 60),
      lat: Number.isFinite(Number(raw.location && raw.location.lat)) ? Number(raw.location.lat) : null,
      lng: Number.isFinite(Number(raw.location && raw.location.lng)) ? Number(raw.location.lng) : null,
    },
    whatsapp: String(raw.whatsapp || '').replace(/\D/g, '').slice(0, 15),
    niches: (Array.isArray(raw.niches) ? raw.niches : []).map(String).slice(0, 8),
    /* From the property's own join form: what content they want, who gets offers automatically, the
       upfront top-up budget a strong creator can be offered, and the room rate that prices the stay. */
    package: ['standard', 'stories', 'feature'].includes(raw.package) ? raw.package : 'standard',
    reach: ['nearby', 'local', 'state'].includes(raw.reach) ? raw.reach : 'nearby',
    cashBudget: clampInt(raw.cashBudget, 0, 500000, 0),
    roomRate: clampInt(raw.roomRate, 0, 1000000, 0),
    instantAccept: raw.instantAccept === true,
    unconfirmed: (Array.isArray(raw.unconfirmed) ? raw.unconfirmed : []).map(String).slice(0, 12),
    updatedAt: String(raw.updatedAt || '').slice(0, 30),
  };
}

/* Founder-reported on 2026-10-07; the founder accepted the working numbers for Milan Heights the same evening
   (2 nights, Jan/Feb/Jul-Sep off-season, no meals, 10% share, 2 a month). Any field still unsettled for a property
   goes in `unconfirmed` so it is flagged to creators. */
export const SEED_POLICIES = Object.freeze([
  {
    propertyId: 'p_milan_heights', name: 'Milan Heights', status: 'open',
    reason: 'Owner agreed: free stay on non-weekend nights in the off-season, optional cash up to Rs 5,000 if the creator brings customers who book.',
    freeStay: { nights: 2, weekdaysOnly: true, offSeasonOnly: true, offSeasonMonths: [1, 2, 7, 8, 9], meals: false, maxPerMonth: 2 },
    performanceCash: { max: 5000, ratePct: 10 },
    location: { town: 'Almora', lat: 29.5966, lng: 79.6593 },   // Dharanaula, opposite Milan Cafe
    whatsapp: '917302315845',                                       // the public booking number in partners-data.js
    niches: ['mountains', 'food', 'culture', 'budget'],
  },
  {
    propertyId: 'p_soulmate_homestay', name: 'Soulmate Homestay', status: 'closed',
    reason: 'Owner declined creator collaborations (2026-10-07).',
    location: { town: 'Almora' },
  },
  {
    propertyId: 'p_new_himank', name: 'New Himank', status: 'pending',
    reason: 'Waiting for the owner (Deepanshi) to confirm whether to take creators and on what terms.',
    location: { town: 'Manali', lat: 32.2600, lng: 77.1800 },
  },
].map(normalizePolicy));

/* Admin can override or add policies in Firestore config/creatorPolicies { list: [...] }. */
export function mergePolicies(seed, override) {
  const byId = new Map((seed || []).map((p) => [p.propertyId, normalizePolicy(p)]));
  (Array.isArray(override) ? override : []).forEach((o) => { const p = normalizePolicy(o); if (p.propertyId) byId.set(p.propertyId, p); });
  return [...byId.values()];
}

/* ---- Dates: is a requested stay inside what the owner offers? ---- */
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isWeekendNight = (iso) => { const g = new Date(iso + 'T00:00:00Z').getUTCDay(); return g === 5 || g === 6; };

export function checkStayWindow(policyIn, checkIn, nights) {
  const p = normalizePolicy(policyIn);
  const problems = [];
  if (!dateOk(checkIn)) return { ok: false, problems: ['Check-in must look like 2026-11-10.'] };
  const n = clampInt(nights || p.freeStay.nights || 1, 1, 30, 1);
  if (p.freeStay.nights && n > p.freeStay.nights) problems.push('The free stay is ' + p.freeStay.nights + ' night' + (p.freeStay.nights > 1 ? 's' : '') + '.');
  for (let i = 0; i < n; i++) {
    const night = addDays(checkIn, i), m = Number(night.slice(5, 7));
    if (p.freeStay.weekdaysOnly && isWeekendNight(night)) problems.push(night + ' is a weekend night (Friday/Saturday).');
    if (p.freeStay.offSeasonOnly && p.freeStay.offSeasonMonths.length && !p.freeStay.offSeasonMonths.includes(m)) problems.push(night + ' is in peak season.');
    if (p.freeStay.blackoutDates.includes(night)) problems.push(night + ' is blocked by the property.');
  }
  return { ok: problems.length === 0, problems: [...new Set(problems)].slice(0, 4) };
}

/** Next eligible check-in dates, so a creator is offered real windows instead of a "no". */
export function suggestWindows(policyIn, fromIso, count = 3, horizonDays = 180) {
  const p = normalizePolicy(policyIn);
  if (p.status !== 'open' || !dateOk(fromIso) || !p.freeStay.nights) return [];
  const out = [];
  for (let i = 0; i < horizonDays && out.length < count; i++) {
    const d = addDays(fromIso, i);
    if (checkStayWindow(p, d, p.freeStay.nights).ok) { out.push({ checkIn: d, nights: p.freeStay.nights }); i += p.freeStay.nights + 5; }
  }
  return out;
}

/* ---- Terms in plain words (used in invitations) ---- */
const MONTH = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function termsText(policyIn) {
  const p = normalizePolicy(policyIn);
  if (p.status === 'closed') return p.name + ' is not taking creator collaborations right now.';
  if (p.status === 'pending') return p.name + ' has not confirmed creator terms yet.';
  const f = p.freeStay, parts = [];
  parts.push('Free stay for ' + f.guests + ': ' + f.nights + ' night' + (f.nights > 1 ? 's' : '') + (f.weekdaysOnly ? ', Sunday to Thursday nights only' : '')
    + (f.offSeasonOnly && f.offSeasonMonths.length ? ', off-season (' + f.offSeasonMonths.map((m) => MONTH[m]).join(', ') + ')' : '') + (f.food === 'all' ? ', meals included' : f.food === 'breakfast' ? ', breakfast included' : ', meals not included') + (f.travel === 'full' ? ', travel covered' : f.travel === 'pickup' ? ', local pickup' : ''));
  if (p.performanceCash.max > 0) parts.push('Optional cash: nothing upfront; up to Rs ' + p.performanceCash.max.toLocaleString('en-IN') + ' total, ' + p.performanceCash.ratePct + '% of each completed stay booked through you, paid by the property after the guest stays.');
  else parts.push('No cash component.');
  parts.push('Up to ' + f.maxPerMonth + ' creator stays a month.');
  if (p.unconfirmed.length) parts.push('Some details are still being confirmed with the owner.');
  return parts.join(' ');
}

/** Performance cash earned from referred stays. Only completed stays count; total never passes the cap. */
export function performanceBonus(policyIn, referred) {
  const p = normalizePolicy(policyIn);
  const { max, ratePct } = p.performanceCash;
  let left = max, earned = 0;
  const lines = [];
  (Array.isArray(referred) ? referred : []).forEach((r) => {
    if (!r || r.status !== 'completed') return;
    const value = Math.max(0, Math.round(Number(r.bookingValue) || 0));
    const want = Math.round((value * ratePct) / 100);
    const pay = Math.min(want, left);
    left -= pay; earned += pay;
    lines.push({ code: r.code || '', bookingValue: value, pay, capped: pay < want });
  });
  return { earned, remaining: left, cap: max, ratePct, lines, paidBy: 'property', note: 'Paid by the property after each referred stay is completed. RoamWise does not hold this money.' };
}

/** The stay-for-content offer in the shape local-barter-core.mjs ranks creators against. Cash here is upfront cash: always 0. */
export function barterOfferFromPolicy(policyIn) {
  const p = normalizePolicy(policyIn);
  return {
    propertyId: p.propertyId, name: p.name, whatsapp: p.whatsapp, niches: p.niches,
    package: p.package, reach: p.reach, cashBudget: p.cashBudget, roomRate: p.roomRate, instantAccept: p.instantAccept,
    location: p.location.lat != null ? p.location : { town: p.location.town },
    offer: { guests: p.freeStay.guests, nights: p.freeStay.nights || 1, food: p.freeStay.food, travel: p.freeStay.travel, cashMax: 0, deliverables: PACKAGES[p.package].deliverables },
    contingentCashUpTo: p.performanceCash.max,
  };
}

/** A partners/{uid} application (partner/join form) as a creator policy. Open only when the owner gave full terms. */
export function policyFromPartner(uid, doc = {}) {
  const cm = doc.creatorMatching || {}, t = cm.terms || null;
  const months = t && Array.isArray(t.months) ? t.months : [];
  return normalizePolicy({
    propertyId: 'p_' + String(uid || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40), name: doc.name || '',
    status: cm.enabled && t ? 'open' : cm.enabled ? 'pending' : 'closed',
    reason: cm.enabled && !t ? 'Owner opted in but has not set creator terms yet.' : '',
    freeStay: t ? { nights: t.nights, guests: t.guests, food: t.food, travel: t.travel, weekdaysOnly: t.weekdaysOnly !== false, offSeasonOnly: months.length > 0 && months.length < 12, offSeasonMonths: months, maxPerMonth: t.maxPerMonth } : {},
    performanceCash: t ? { max: t.performancePct ? t.performanceMax : 0, ratePct: t.performancePct } : {},
    location: { town: doc.zone || doc.city || '', lat: doc.lat, lng: doc.lng },
    whatsapp: doc.ownerWa || doc.phone || '',
    niches: cm.niches || [], package: t && t.package, reach: t && t.reach,
    cashBudget: cm.maximumCash || 0, roomRate: doc.startPrice || 0, instantAccept: !!(t && t.instantAccept),
    updatedAt: cm.updatedAt || '',
  });
}

/* ---- The decision ---- */
export function propertyProfileFromPolicy(policyIn, base = {}) {
  const p = normalizePolicy(policyIn);
  return {
    ...base, role: 'property',
    dealModes: p.performanceCash.max > 0 ? ['barter', 'hybrid'] : ['barter'],
    hostedNights: p.freeStay.nights, mealsIncluded: p.freeStay.meals,
    maximumCash: p.performanceCash.max,
  };
}

export function evaluateCollab(creatorIn, policyIn, propertyBase = {}, opts = {}) {
  const p = normalizePolicy(policyIn);
  const terms = termsText(p);
  if (p.status === 'closed') return { action: 'closed', reason: p.reason || 'Not taking creators.', terms };
  if (p.status === 'pending') return { action: 'waiting_on_owner', reason: p.reason || 'Owner has not decided.', terms };
  if (!p.freeStay.nights) return { action: 'waiting_on_owner', reason: 'Free-stay terms are not set.', terms };
  if (Number.isFinite(opts.acceptedThisMonth) && opts.acceptedThisMonth >= p.freeStay.maxPerMonth) {
    return { action: 'full_this_month', reason: 'Creator stays for this month are taken.', terms, windows: suggestWindows(p, opts.today || new Date().toISOString().slice(0, 10)) };
  }
  const creator = normalizeMatchProfile({ ...creatorIn, role: 'creator' }, 'creator');
  /* This property pays nothing before guests stay. A creator who needs money upfront is not a fit. */
  if (creator.minimumCash > 0 && !creator.dealModes.includes('barter')) {
    return { action: 'hold', reason: 'Asks for Rs ' + creator.minimumCash.toLocaleString('en-IN') + ' upfront; this property pays only after referred stays are completed.', terms };
  }
  if (opts.checkIn) {
    const w = checkStayWindow(p, opts.checkIn, opts.nights);
    if (!w.ok) return { action: 'dates_not_offered', reason: w.problems.join(' '), terms, windows: suggestWindows(p, opts.today || opts.checkIn) };
  }
  const property = propertyProfileFromPolicy(p, propertyBase);
  /* A creator who also accepts barter is judged on barter; their cash minimum is not a blocker for a stay-only deal. */
  const decision = autopilotDecision({ ...creatorIn, minimumCash: 0 }, property);
  const quote = quoteCollaboration(property, { ...creatorIn, minimumCash: 0 });
  return {
    action: decision.action, reason: decision.match.reasons.join('; '), terms, score: decision.match.score,
    match: decision.match, tier: decision.tier,
    quote: { ...quote, creatorReceives: 0, contingentCashUpTo: p.performanceCash.max, note: 'Cash is contingent on completed referred stays; nothing is paid upfront.' },
    windows: suggestWindows(p, opts.today || new Date().toISOString().slice(0, 10)),
  };
}

/* ---- AI-adjustable: suggestions are data, applying them is bounded ---- */
const FIELDS = Object.freeze({
  'freeStay.maxPerMonth': { lo: 0, hi: 30, ceil: 'maxPerMonth' },
  'freeStay.nights': { lo: 0, hi: 14, ceil: 'maxNights' },
  'performanceCash.max': { lo: 0, hi: 50000, ceil: 'maxCash' },
  'performanceCash.ratePct': { lo: 1, hi: 30 },
});
const getPath = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setPath = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };

/** Rule-based suggestions from simple stats. Always explainable; never applied here. */
export function suggestAdjustments(policyIn, stats = {}) {
  const p = normalizePolicy(policyIn);
  if (p.status !== 'open') return [];
  const s = (k) => Math.max(0, Number(stats[k]) || 0);
  const out = [];
  const stays = s('completedCreatorStays'), conv = s('referredConversions');
  if (stays >= 3 && conv === 0) out.push({ field: 'freeStay.nights', to: Math.max(1, p.freeStay.nights - 1), reason: stays + ' creator stays so far brought no booked guests, so offer one night less until a creator proves they convert.' });
  if (stays >= 3 && conv / stays >= 0.5 && p.performanceCash.max > 0) out.push({ field: 'performanceCash.max', to: p.performanceCash.max + 1000, reason: 'Creators are converting (' + conv + ' booked guests from ' + stays + ' stays). A slightly higher cap keeps the best ones.' });
  if (s('applications30d') < 3 && s('emptyOffSeasonNights') >= 10) out.push({ field: 'freeStay.maxPerMonth', to: p.freeStay.maxPerMonth + 1, reason: 'Few applicants and many empty off-season nights: take one more creator a month.' });
  if (s('applications30d') >= 8 && s('accepted30d') < 2 && p.performanceCash.max > 0) out.push({ field: 'performanceCash.ratePct', to: Math.min(30, p.performanceCash.ratePct + 2), reason: 'Plenty of interest but few take it up: a slightly higher share of each completed stay may help.' });
  return out.map((x) => ({ ...x, from: getPath(p, x.field), needsOwner: true, source: 'rules' }));
}

/** Apply one adjustment inside the owner's limits. Without auto-adjust it only reports what it would do. */
export function applyAdjustment(policyIn, adj) {
  const p = normalizePolicy(policyIn);
  const spec = FIELDS[adj && adj.field];
  if (!spec) return { applied: false, reason: 'That setting cannot be changed automatically.', policy: p };
  if (p.status !== 'open') return { applied: false, reason: 'Only open policies are adjusted.', policy: p };
  if (!p.autoAdjust.enabled) return { applied: false, needsOwner: true, reason: 'Auto-adjust is off: the owner must approve this.', policy: p };
  let to = clampInt(adj.to, spec.lo, spec.hi, getPath(p, adj.field));
  if (spec.ceil) to = Math.min(to, p.autoAdjust.ceilings[spec.ceil]);
  const next = JSON.parse(JSON.stringify(p));
  setPath(next, adj.field, to);
  return { applied: true, from: getPath(p, adj.field), to, policy: normalizePolicy(next) };
}

/** Prompt for a model. The reply is untrusted: run it through parseAiSuggestions. */
export function buildAiPrompt(policyIn, stats = {}) {
  const p = normalizePolicy(policyIn);
  return [
    'You tune a small homestay creator-collaboration offer. Reply with ONLY a JSON array, at most 3 items, each {"field","to","reason"}.',
    'Allowed fields: ' + Object.keys(FIELDS).join(', ') + '. Never suggest upfront cash, weekend nights, or opening a closed property.',
    'Current offer: ' + JSON.stringify({ freeStay: p.freeStay, performanceCash: p.performanceCash }),
    'Recent stats: ' + JSON.stringify(stats),
  ].join('\n');
}

export function parseAiSuggestions(text, policyIn) {
  const p = normalizePolicy(policyIn);
  let arr = [];
  try { const m = /\[[\s\S]*\]/.exec(String(text || '')); arr = m ? JSON.parse(m[0]) : []; } catch (_) { arr = []; }
  return (Array.isArray(arr) ? arr : []).filter((x) => x && FIELDS[x.field]).slice(0, 3).map((x) => {
    const spec = FIELDS[x.field];
    /* Hard bounds only: a suggestion still needs the owner. The owner's ceilings bind in applyAdjustment. */
    const to = clampInt(x.to, spec.lo, spec.hi, getPath(p, x.field));
    return { field: x.field, from: getPath(p, x.field), to, reason: String(x.reason || '').slice(0, 240), needsOwner: true, source: 'ai' };
  }).filter((x) => x.to !== x.from);
}

export { scoreMatch };
