/* creators/roster-core.mjs - every creator application on one list, each matched to every open property.
   Pure functions, no network. The barter desk (barter-desk.js) answers "who gets THIS offer"; the roster answers
   "what happens to EACH applicant", so nobody disappears into a 'not offered' fold.
   Nothing here sends or pays anything. */
import { proximity, termsFit, creatorQuality, normalizeCreatorAsk, resolveLocation, waLink, offerText } from './local-barter-core.mjs';
import { barterOfferFromPolicy } from './property-terms-core.mjs';
import { quickLinks } from './public-check-core.mjs';
import { rateTier } from './rating-tier-core.mjs';
import { nichesOf, nicheFit, travelBand, bandLabel, bandNote, photoOf, tripOf, travelAlerts, alertMessage } from './strict-match-core.mjs';
export { quickLinks } from './public-check-core.mjs';
export { TIER_INFO, TIERS } from './rating-tier-core.mjs';
export { travelAlerts, alertMessage, nichesOf, bandLabel, NICHE_NAMES, normalizeNeeds } from './strict-match-core.mjs';

export const STAGES = Object.freeze(['new', 'contacted', 'shortlisted', 'offered', 'active', 'declined']);
const str = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

export function phoneOf(app = {}) {
  if (app.phone) return str(app.phone, 24);
  const m = /WhatsApp:\s*([+\d][\d\s-]{8,})/.exec(String(app.note || ''));
  return m ? m[1].trim() : '';
}

/** One CRM application in the shape the matcher needs. Missing fields never throw. */
export function creatorOf(app = {}) {
  const b = app.barter || {}, mp = app.matchProfile || {};
  /* Numbers from Instagram's own Business Discovery API (admin "Verify from Instagram") beat typed-in ones, and count as checked for 90 days. */
  const ig = b.instagram && b.instagram.metrics ? b.instagram : null;
  const igFresh = !!ig && Date.now() - Date.parse(ig.ratedAt || '') < 90 * 864e5;
  /* No Instagram numbers? A fresh YouTube Data API check of their channel (official public numbers) stands in. */
  const pc = b.publicCheck && b.publicCheck.youtube && b.publicCheck.youtube.metrics ? b.publicCheck : null;
  const ytFresh = !igFresh && !!pc && Date.now() - Date.parse(pc.checkedAt || '') < 90 * 864e5;
  const metrics = { ...(b.metrics || {}), ...(igFresh ? ig.metrics : {}), ...(ytFresh ? pc.youtube.metrics : {}) };
  if (igFresh || ytFresh) metrics.metricsVerified = true;
  metrics.followers = Number(metrics.followers || mp.claimedFollowers || 0);
  /* conversion proof: stay bookings RoamWise verified plus paid upgrades made through the creator's own code */
  metrics.verifiedBookings = Math.max(Number(metrics.verifiedBookings || 0), Number(app.verifiedBookings || 0)) + Number(app.refSales || 0);
  const town = (b.location && b.location.town) || (Array.isArray(mp.destinations) ? mp.destinations[0] : '') || '';
  return {
    id: str(app.id, 60), name: str(app.name || app.email || 'Creator', 80), handle: str(app.handle, 160), email: str(app.email, 120),
    phone: phoneOf(app), stage: STAGES.includes(app.stage) ? app.stage : (app.stage === 'new' || !app.stage ? 'new' : 'contacted'),
    createdAt: str(app.createdAt, 30), location: b.location || { town },
    ask: normalizeCreatorAsk(b.ask || { cashMin: Number(app.creatorMinimum || 0) }),
    metrics, niches: String(app.niche || (mp.niches || []).join(',')).split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
    note: str(app.note, 300),
    /* strict matching inputs: canonical content types, one optional public photo, an optional trip */
    primaryNiche: str((app.barter && app.barter.primaryNiche) || '', 30),
    nicheTags: nichesOf((app.barter && app.barter.primaryNiche) || '', app.niche || (mp.niches || []).join(' '), app.note || ''),
    photoUrl: photoOf(app), trip: tripOf(app),
    igFresh, via: igFresh ? 'instagram' : ytFresh ? 'youtube' : '',
    youtube: /^https:\/\//i.test(String(b.youtube || '')) ? str(b.youtube, 200) : '',
    footprint: b.publicCheck && b.publicCheck.footprint && !b.publicCheck.footprint.error ? b.publicCheck.footprint : null, publicCheckedAt: str((b.publicCheck && b.publicCheck.checkedAt) || '', 30),
    igSignals: igFresh ? (ig.signals || {}) : ytFresh ? { lastPostDays: pc.youtube.signals && pc.youtube.signals.lastPostDays } : {}, igRatedAt: ig ? str(ig.ratedAt, 30) : '', igFailedAt: str((b.instagram && b.instagram.failedAt) || '', 30), igFailure: str((b.instagram && b.instagram.failure) || '', 160),
    tierOverride: ['mirage', 'basecamp', 'trail', 'ridge', 'summit'].includes(app.tierOverride) ? app.tierOverride : '',
  };
}

/** Why this application needs a human before any offer. Short plain-language flags. */
export function flagsOf(c, all = []) {
  const f = [];
  if (!c.phone) f.push('no phone / WhatsApp');
  if (!/^https:\/\//i.test(c.handle)) f.push('profile link is not a full https link');
  if (!resolveLocation(c.location).known && !(c.location && c.location.town)) f.push('location not set');
  const same = (k) => c[k] && all.filter((o) => o.id !== c.id && String(o[k]).toLowerCase() === String(c[k]).toLowerCase()).length;
  if (same('email')) f.push('same email as another application');
  if (same('handle')) f.push('same profile as another application');
  if (shareBlocked(c)) f.push('asked not to be shared publicly');
  return f;
}

function nicheOverlap(a = [], b = []) {
  const s = new Set((b || []).map((x) => String(x).toLowerCase()));
  return (a || []).some((x) => s.has(String(x).toLowerCase())) ? 1 : 0;
}

/** Score one creator against one open policy. verdict: send | negotiate | no_fit. */
export function matchOne(creator, policy) {
  const offer = barterOfferFromPolicy(policy);
  const prox = proximity(creator.location, offer.location);
  const terms = termsFit(creator.ask, offer.offer, prox.tier);
  const quality = creatorQuality(creator.metrics);
  const fit = nicheFit(creator.nicheTags || [], policy.needs);
  const niche = nicheOverlap(creator.niches, offer.niches) || (fit.matched.length ? 1 : 0);
  const band = travelBand(prox.km);
  const rating = rateTier(creator.metrics, { override: creator.tierOverride, quality, signals: creator.igSignals, via: creator.via });
  const score = Math.round(quality.score * 0.55 + prox.score * 0.30 + niche * 15 + (fit.matched.length ? 10 : 0) + ({ summit: 10, ridge: 5, mirage: -30 }[rating.tier] || 0));
  let verdict = terms.fit === 'no_fit' ? 'no_fit' : (terms.fit === 'ready' && ['local', 'nearby'].includes(prox.tier)) ? 'send' : 'negotiate';
  const why = [];
  if (terms.fit === 'no_fit') why.push('the ask is outside the offer');
  if (quality.flags.includes('likely_inflated') || quality.flags.includes('audience_growth_anomaly')) { verdict = 'no_fit'; why.push('audience numbers look unreliable'); }
  /* Strict niche: a property that needs food vloggers is never introduced to a creator who does not make food content. */
  if (!fit.ok && fit.needs.strict) {
    /* A Summit creator (large reach, real engagement, proven bookings) may still be introduced: negotiated, never sent automatically. */
    if (fit.needs.starsPass && rating.tier === 'summit' && verdict !== 'no_fit') { verdict = 'negotiate'; why.push('Summit creator: different content, but proven reach and bookings'); }
    else { verdict = 'no_fit'; why.push(fit.why); }
  }
  else if (!fit.ok && fit.needs.niches.length && verdict === 'send') { verdict = 'negotiate'; why.push(fit.why); }
  if (band === 'very_far' && verdict === 'send') verdict = 'negotiate';
  if (rating.tier === 'mirage') { verdict = 'no_fit'; why.push('RoamWise rating Mirage: ' + (rating.reasons[0] || 'numbers do not hold up')); }
  return { propertyId: policy.propertyId, name: policy.name, verdict, score, proximity: prox, terms, quality, niche: !!niche, nicheMatched: fit.matched, needs: fit.needs, band, tier: rating.tier, bandLabel: bandLabel(band), bandNote: bandNote(band), why, offer: offerText(offer.offer) };
}

const ORDER = { send: 0, negotiate: 1, no_fit: 2 };
/** Every application with its matches, best first. Open policies only. */
export function buildRoster(apps = [], policies = []) {
  const open = (policies || []).filter((p) => p && p.status === 'open');
  const creators = (apps || []).map(creatorOf);
  return creators.map((c) => {
    const matches = open.map((p) => matchOne(c, p)).sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict] || b.score - a.score);
    return { ...c, rating: rateTier(c.metrics, { override: c.tierOverride, signals: c.igSignals, via: c.via }), flags: flagsOf(c, creators), matches, best: matches[0] || null };
  });
}

export function rosterCounts(rows = []) {
  const out = { total: rows.length, send: 0, negotiate: 0, no_match: 0, needs_review: 0 };
  rows.forEach((r) => {
    if (r.best && r.best.verdict === 'send') out.send++; else if (r.best && r.best.verdict === 'negotiate') out.negotiate++; else out.no_match++;
    if (r.flags.length) out.needs_review++;
  });
  STAGES.forEach((s) => { out['stage_' + s] = rows.filter((r) => r.stage === s).length; });
  return out;
}

/** WhatsApp intro to the creator for a given match. A person presses send; nothing is automatic. */
export function creatorIntro(creator, match, policy) {
  const text = `Hi ${creator.name.split(' ')[0] || 'there'}, this is RoamWise. We matched you with ${match.name}: ${match.offer}. `
    + `${match.verdict === 'send' ? 'Are you free to visit soon? Reply with your dates.' : 'Some terms still need a quick chat. Reply and we will sort them out.'}`;
  return creator.phone ? waLink(creator.phone, text) : '';
}

export function toCsv(rows = []) {
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const head = ['name', 'handle', 'email', 'phone', 'town', 'stage', 'best_property', 'verdict', 'score', 'flags'];
  const lines = rows.map((r) => [r.name, r.handle, r.email, r.phone, (r.location && r.location.town) || '', r.stage, r.best ? r.best.name : '', r.best ? r.best.verdict : '', r.best ? r.best.score : '', r.flags.join('; ')].map(q).join(','));
  return [head.join(','), ...lines].join('\n');
}

/* ---- Home-page spotlight (public). Only public Instagram profile + match result; never phone or email. ---- */
export const SPOTLIGHT_MAX = 12;
const IG = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._\/-]{1,80}\/?(\?[^\s<>"']{0,60})?$/i;
export const isInstagramUrl = (u) => IG.test(String(u || '').trim());
/** True when the applicant's own words ask not to be shown, photographed or promoted. Errs on the side of not sharing. */
export function shareBlocked(c = {}) {
  return /\b(no|not|don'?t|do not|never|without)\b[^.]{0,30}\b(photo|picture|pic|share|public|publish|feature|promot|display)/i.test(String(c.note || ''));
}
export function canSpotlight(row) {
  if (!row || shareBlocked(row)) return { ok: false, why: 'asked not to be shared' };
  if (!isInstagramUrl(row.handle)) return { ok: false, why: 'needs a public Instagram link' };
  if (row.rating && row.rating.tier === 'mirage') return { ok: false, why: 'RoamWise rating is Mirage' };
  if (!row.best || row.best.verdict === 'no_fit') return { ok: false, why: 'no property fit yet' };
  return { ok: true, why: '' };
}
/** The exact public record: nothing private can be added here by accident. */
export function spotlightEntry(row) {
  const b = row.best || {};
  return { id: str(row.id, 60), name: str(row.name, 60), handle: str(row.handle, 160), niche: row.niches.slice(0, 3).join(', ').slice(0, 60),
    town: str((row.location && row.location.town) || '', 40), tier: row.rating ? row.rating.tier : 'basecamp', match: { name: str(b.name, 80), score: Math.max(0, Math.min(100, Number(b.score) || 0)), verdict: b.verdict === 'send' ? 'send' : 'negotiate' } };
}
/** Add or replace one entry (by id), newest first, capped. */
export function withSpotlight(list = [], entry) {
  return [entry, ...(Array.isArray(list) ? list : []).filter((x) => x && x.id !== entry.id)].slice(0, SPOTLIGHT_MAX);
}
export const withoutSpotlight = (list = [], id) => (Array.isArray(list) ? list : []).filter((x) => x && x.id !== id);
