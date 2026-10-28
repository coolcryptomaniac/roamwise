/* admin/command-core.mjs - pure logic for the Admin Command Center (admin/command.html).
   No network, no DOM: it turns raw Firestore documents (partners, config/partners list, roomBookings,
   stayLeads, users) into a partner pipeline, an ordered action queue and a few insights, so tests can
   run it directly. It reads and ranks only. Every write (approve, publish, payment, entitlement) stays
   in the existing console, where it is separately reviewed. */

export const MOU_VERSION = 'RW-PMOU-2026-09-27-V4';
export const CHECKPOINTS = ['identity', 'property', 'experience', 'payout'];
export const STAGES = [
  ['applied', 'Applied'], ['mou', 'MOU signed'], ['verified', 'Checks passed'],
  ['approved', 'Approved'], ['published', 'Published'], ['bookable', 'Bookable'],
];
const DAY = 864e5;

export const slug = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
export const publicId = (p) => 'p_' + slug(p && p.name);
const str = (v) => String(v == null ? '' : v);
export const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  const t = Date.parse(v); return Number.isFinite(t) ? t : 0;
};
export const digits = (v) => str(v).replace(/\D/g, '');
export const waUrl = (phone, text) => {
  let d = digits(phone); if (d.length === 10) d = '91' + d;
  return d.length >= 11 ? 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '') : '';
};

/* Where one partner sits on the road to "bookable", and exactly what is missing. */
export function partnerState(p, listedIds) {
  const o = p.onboarding || {}, v = p.verification || {}, listed = listedIds instanceof Set ? listedIds : new Set(listedIds || []);
  const mou = !!o.mouAcceptedAt && o.mouVersion === MOU_VERSION;
  const checks = CHECKPOINTS.filter((c) => v[c] !== 'verified');
  const verified = v.overall === 'verified' && !checks.length;
  const approved = p.status === 'active' && p.verified === true;
  const published = approved && listed.has(publicId(p));
  const rooms = Number(p.roomCount || 0);
  const bookable = published && !p.operationsLocked && rooms > 0;
  const basics = [];
  if (!str(p.name).trim()) basics.push('property name');
  if (!str(p.zone || p.city).trim()) basics.push('city');
  if (!digits(p.phone || p.ownerWa)) basics.push('owner phone');
  const m = p.media || {};
  if (![m.photoUrl, m.videoUrl, m.youtubeUrl, m.instagramUrl].some((u) => /^https:\/\//i.test(str(u)))) basics.push('photo or link');
  let stage = 'applied';
  if (mou) stage = 'mou'; if (mou && verified) stage = 'verified';
  if (approved) stage = 'approved'; if (published) stage = 'published'; if (bookable) stage = 'bookable';
  const missing = [];
  if (!mou) missing.push('Owner has not accepted the current MOU');
  if (mou && !verified) missing.push('Verify: ' + checks.join(', '));
  if (verified && !approved) missing.push('Approve to go live');
  if (approved && !published) missing.push('Publish to the public list');
  if (published && rooms < 1) missing.push('Add a priced room (guests cannot book yet)');
  if (p.operationsLocked) missing.push('Operations are locked');
  if (basics.length) missing.push('Profile gaps: ' + basics.join(', '));
  /* "details complete": everything the owner supplies is in, only RoamWise's own step remains. */
  const complete = mou && !basics.length && !bookable;
  return { stage, mou, checks, verified, approved, published, rooms, bookable, basics, missing, complete };
}

export function buildPartners(partners, listed) {
  const ids = new Set((listed || []).map((x) => x && x.id).filter(Boolean));
  return (partners || []).map((p) => ({ ...p, st: partnerState(p, ids) }))
    .sort((a, b) => STAGES.findIndex((s) => s[0] === a.st.stage) - STAGES.findIndex((s) => s[0] === b.st.stage)
      || (b.st.complete - a.st.complete) || str(a.name).localeCompare(str(b.name)));
}

export function funnel(rows) {
  const idx = (s) => STAGES.findIndex((x) => x[0] === s);
  return STAGES.map(([k, label]) => [label, rows.filter((r) => idx(r.st.stage) >= idx(k)).length, k]);
}

const OPEN_BOOKING = new Set(['requested', 'pending']);
const DONE_BOOKING = new Set(['completed', 'checked_out']);

/* Ordered "do this next" queue. tone: bad (money/guest waiting) > warn > info. */
export function buildActions({ partners = [], leads = [], bookings = [], creators = null, now = Date.now() } = {}) {
  const out = [], add = (a) => out.push(a);
  const ph = (p) => p.phone || p.ownerWa;

  leads.filter((l) => l.status !== 'contacted').forEach((l) => {
    const age = now - toMs(l.createdAt), hrs = Math.round(age / 36e5);
    const what = (l.items || []).slice(0, 2).map((i) => i.name || i.partnerId).filter(Boolean).join(', ') || 'a stay';
    add({ id: 'lead:' + l.id, tone: age > 3 * 36e5 ? 'bad' : 'warn', area: 'Guests', rank: 1,
      title: 'Guest waiting: ' + str(l.name || 'enquiry'), detail: what + (hrs >= 1 ? ' · waiting ' + hrs + 'h' : ' · just in'),
      cta: 'Reply on WhatsApp', href: waUrl(l.phone, 'Hi ' + str(l.name) + ', this is RoamWise about your request for ' + what + '.'), external: true,
      alt: { label: 'Open requests', href: 'index.html#stayreq' } });
  });
  bookings.filter((b) => OPEN_BOOKING.has(str(b.status))).forEach((b) => {
    const age = now - toMs(b.createdAt || b.at);
    if (age < 24 * 36e5) return;
    add({ id: 'bk:' + b.id, tone: 'bad', area: 'Bookings', rank: 2, title: 'Booking request unanswered ' + Math.floor(age / DAY) + 'd',
      detail: str(b.property || b.propertyName || b.propertyId) + (b.ref ? ' · ' + b.ref : ''), cta: 'Open partner desk', href: '../partner/' });
  });
  partners.forEach((p) => {
    const s = p.st, name = str(p.name || 'Property'), city = str(p.zone || p.city);
    if (s.mou && s.verified && !s.approved) add({ id: 'ap:' + p.id, tone: 'warn', area: 'Partners', rank: 3, title: 'Approve ' + name, detail: city + ' · MOU signed, all four checks passed', cta: 'Approve in operations', href: 'index.html#operations' });
    else if (s.approved && !s.published) add({ id: 'pub:' + p.id, tone: 'warn', area: 'Partners', rank: 3, title: 'Publish ' + name, detail: city + ' · approved but not on the public list', cta: 'Open partner desk', href: '../partner/' });
    else if (s.published && s.rooms < 1) add({ id: 'rm:' + p.id, tone: 'warn', area: 'Partners', rank: 4, title: name + ' has no bookable room', detail: city + ' · guests can only enquire; add a priced room', cta: 'Add rooms', href: '../partner/' });
    else if (s.mou && !s.verified && !s.approved) add({ id: 'vf:' + p.id, tone: 'info', area: 'Partners', rank: 5, title: 'Verify ' + name, detail: city + ' · pending: ' + s.checks.join(', '), cta: 'Open operations', href: 'index.html#operations' });
    else if (!s.mou && !s.approved) add({ id: 'mou:' + p.id, tone: 'info', area: 'Partners', rank: 6, title: name + ' has not accepted the MOU', detail: city + ' · nudge the owner',
      cta: waUrl(ph(p)) ? 'Nudge on WhatsApp' : 'Open operations', href: waUrl(ph(p), 'Hi, this is RoamWise. Please accept the partner MOU so ' + name + ' can go live.') || 'index.html#operations', external: !!waUrl(ph(p)) });
  });
  if (creators && creators.needsReview) add({ id: 'cr:review', tone: 'info', area: 'Creators', rank: 7, title: creators.needsReview + ' creator application' + (creators.needsReview > 1 ? 's' : '') + ' to review', detail: creators.ready ? creators.ready + ' ready for an offer' : 'Rate and match them', cta: 'Open creator desk', href: '../creators/admin.html' });
  return out.sort((a, b) => a.rank - b.rank || ({ bad: 0, warn: 1, info: 2 }[a.tone] - { bad: 0, warn: 1, info: 2 }[b.tone]));
}

/* Headline numbers and plain-language insights. */
export function insights({ partners = [], bookings = [], users = [], leads = [], now = Date.now() } = {}) {
  const done = bookings.filter((b) => DONE_BOOKING.has(str(b.status)));
  const gross = done.reduce((s, b) => s + Math.max(0, Number(b.amount || b.gross || 0)), 0);
  const comm = done.reduce((s, b) => s + Math.max(0, Number(b.amount || b.gross || 0)) * Math.max(0, Math.min(30, Number(b.commissionPctSnapshot || b.commissionPct || 7))) / 100, 0);
  const pro = users.filter((u) => u.pro === true).length;
  const week = users.filter((u) => toMs(u.createdAt) && now - toMs(u.createdAt) < 7 * DAY).length;
  const active7 = users.filter((u) => toMs(u.lastActive) && now - toMs(u.lastActive) < 7 * DAY).length;
  const zones = {};
  partners.forEach((p) => { const z = str(p.zone || p.city || 'Unknown'); const r = zones[z] = zones[z] || { zone: z, total: 0, live: 0, pipeline: 0 }; r.total++; p.st.bookable ? r.live++ : r.pipeline++; });
  const notes = [];
  Object.values(zones).filter((z) => z.live === 0 && z.total > 0).forEach((z) => notes.push({ tone: 'warn', text: z.zone + ': ' + z.total + ' partner' + (z.total > 1 ? 's' : '') + ' signed up but none is bookable yet. Guests there can only enquire.' }));
  const complete = partners.filter((p) => p.st.complete && !p.st.approved).length;
  if (complete) notes.push({ tone: 'good', text: complete + ' propert' + (complete > 1 ? 'ies have' : 'y has') + ' every detail in and only needs your approval.' });
  const stale = leads.filter((l) => l.status !== 'contacted' && now - toMs(l.createdAt) > DAY).length;
  if (stale) notes.push({ tone: 'bad', text: stale + ' guest request' + (stale > 1 ? 's are' : ' is') + ' over a day old with no reply.' });
  if (done.length && !comm) notes.push({ tone: 'warn', text: 'Completed bookings carry no amount, so commission shows as zero.' });
  if (!notes.length) notes.push({ tone: 'good', text: 'Nothing is stuck right now.' });
  const byMonth = {}; done.forEach((b) => { const m = str(b.completedAt || b.createdAt || b.at).slice(0, 7); if (m) byMonth[m] = (byMonth[m] || 0) + Math.max(0, Number(b.amount || b.gross || 0)); });
  return { users: users.length, pro, week, active7, bookings: bookings.length, done: done.length, gross, comm, zones: Object.values(zones).sort((a, b) => b.total - a.total), notes, byMonth };
}

/* Feature audit of the old console: what to keep, merge or retire. Shown in the "Console map" tab. */
export const CONSOLE_MAP = [
  ['Keep', 'Money', 'Reconciliation of Pro and revenue records. Unique, sensitive.', 'index.html#money'],
  ['Keep', 'Partner payments', 'Payment rails and destinations. Unique, sensitive.', 'index.html#partner-payments'],
  ['Keep', 'Stay ledger', 'Commission reconciliation per stay. Core to the business.', 'index.html#stay-ledger'],
  ['Keep', 'Operations', 'Where partners are verified and approved. Core.', 'index.html#operations'],
  ['Keep', 'Users', 'Search and fix accounts.', 'index.html#users'],
  ['Keep', 'Security and Rules', 'Admin MFA and Firestore rules text.', 'index.html#security'],
  ['Merge', 'Overview + Command centre card + KPIs + Business + Investor view', 'Five tabs show overlapping numbers. This Command Center replaces them as the home.', 'index.html#overview'],
  ['Merge', 'Stay requests', 'Now shown in the Guests action queue; keep the full list as a detail view.', 'index.html#stayreq'],
  ['Merge', 'Activity + Reminders + Notifications', 'One "Users and messaging" area would do.', 'index.html#activity'],
  ['Merge', 'Referrals + Staff', 'Both are people and rewards. One "Team and referrals" area.', 'index.html#referrals'],
  ['Move', 'Artist outreach, VC outreach, Trek sales, Property leads', 'Sales and fundraising CRMs. They belong in a separate "Outreach" group, not beside money.', 'index.html#outreach'],
  ['Review', 'Autopilot, Growth and Intel, Records and SOPs, Dev requests', 'Mostly static text and checklists. Keep only if you open them weekly.', 'index.html#autopilot'],
  ['Review', 'System sync', 'A status page. Fold into a small footer strip.', 'index.html#system'],
];
