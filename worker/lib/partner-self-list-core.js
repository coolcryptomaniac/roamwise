/* ============================================================================
   worker/lib/partner-self-list-core.js — automatic checks for self-listed stays
   ============================================================================
   Pure functions, no I/O, so every rule is unit-tested (tests/partner-self-list.test.mjs).

   A property that signs the MOU on /partner/join/ can go live on its own, but
   only as a NEW · ENQUIRY-ONLY listing:
     - guests see it on Stay & do, the map, the stays hub and in Tusk;
     - every enquiry goes to RoamWise's WhatsApp with a booking code;
     - no price, rate, payment button, signed-partner badge or host number is public.
   Taking payments still needs the founder's approval (status 'active',
   verified:'signed'), exactly as before. Self-listing never touches that path.

   Supplier rates are NEVER copied into the public entry (decision 13 Nov 2026:
   net rates stay behind the server). Packages are published by name, nights,
   inclusions and segment only; the price is confirmed on enquiry.
   ========================================================================= */

export const MOU_VERSION = 'RW-PMOU-2026-09-27-V4';
export const SELF_LIST_VERSION = 'RW-SELFLIST-2026-11-19-V1';

/* The six RoamWise segments (Fair Exchange doc, section 8). */
export const SEGMENTS = {
  workation: 'Workation & corporate retreat',
  wedding: 'Destination wedding',
  artist: 'Artist, yoga & wellness retreat',
  business: 'Business hotel near airport',
  homestay: 'Scenic village homestay',
  destination: 'Popular destination stay',
};

const PROPERTY_TYPES = ['Family homestay', 'Hotel / resort', 'Boutique stay', 'Hostel', 'Villa', 'Other stay',
  'Wedding venue', 'Retreat centre', 'Business hotel'];

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function clip(v, n) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 120);
}

export function slug(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/* Same identity rule the app uses to merge twins (js/misc/partners.js rwPartnerKey). */
export function partnerKey(p) {
  return String((p && p.zone) || '').toLowerCase() + '|' +
    String((p && p.name) || '').toLowerCase().replace(/^hotel\s+/, '').replace(/[^a-z0-9]+/g, '');
}

export function validGstin(v) {
  const g = String(v == null ? '' : v).replace(/[\s-]/g, '').toUpperCase();
  if (!/^(0[1-9]|[1-2]\d|3[0-8]|97|99)[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const p = CHARS.indexOf(g.charAt(i)) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  return CHARS.charAt((36 - (sum % 36)) % 36) === g.charAt(14);
}

export function indianMobile(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : '';
}

function httpsUrl(v) {
  try { const u = new URL(String(v || '')); return u.protocol === 'https:' ? u.href.slice(0, 500) : ''; } catch (_) { return ''; }
}

function mapsUrl(v) {
  const u = httpsUrl(v);
  if (!u) return '';
  const h = new URL(u);
  return /^(www\.google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(h.host + h.pathname) ? u : '';
}

/* Typed signature must plausibly be the person who applied: share at least one
   name token of 3+ letters with the owner name (case-insensitive). */
export function signatureMatches(signed, owner) {
  const toks = (s) => String(s || '').toLowerCase().split(/[^a-zऀ-ॿ]+/).filter((t) => t.length >= 3);
  const a = toks(signed), b = toks(owner);
  return a.length > 0 && a.some((t) => b.includes(t));
}

const BLOCKED_WORDS = /\b(casino|escort|massage parlour|adult|xxx|bitcoin|crypto|loan|investment scheme)\b/i;
const URL_IN_TEXT = /(https?:\/\/|www\.)/i;

export function cleanSegments(v) {
  const list = Array.isArray(v) ? v : [];
  return [...new Set(list.map((s) => String(s || '').toLowerCase()).filter((s) => Object.prototype.hasOwnProperty.call(SEGMENTS, s)))];
}

/* Public-safe packages: name, nights, inclusions, segment. Prices are dropped on purpose. */
export function publicPackages(v) {
  const list = Array.isArray(v) ? v.slice(0, 3) : [];
  return list.map((p) => {
    const nights = Math.round(Number(p && p.nights));
    const pkg = {
      name: clip(p && p.name, 60),
      nights: Number.isFinite(nights) && nights >= 1 && nights <= 120 ? nights : 0,
      includes: (Array.isArray(p && p.includes) ? p.includes : String((p && p.includes) || '').split(','))
        .map((x) => clip(x, 40)).filter(Boolean).slice(0, 6),
      segment: cleanSegments([p && p.segment])[0] || '',
    };
    return pkg;
  }).filter((p) => p.name.length >= 3 && !URL_IN_TEXT.test(p.name) && !BLOCKED_WORDS.test(p.name));
}

/* Run every automatic check. `ctx` = { emailVerified, existing: config/partners list,
   phoneOwners: uids of other partner docs with the same phone }.
   Returns { pass, hold, checks:[{id, ok, label, fix}] }.
   - pass:  publish as a new enquiry-only listing now.
   - hold:  something needs a human (duplicate, phone reused); nothing is published.
   - neither: the host can fix the listed items and try again. */
export function assess(p, uid, ctx) {
  p = p || {}; ctx = ctx || {};
  const on = p.onboarding || {};
  const checks = [];
  const add = (id, ok, label, fix, holdIfFail) => checks.push({ id, ok: !!ok, label, fix: ok ? '' : fix, hold: !ok && !!holdIfFail });
  const name = clip(p.name, 110), zone = clip(p.zone, 70);

  add('mou', on.mouVersion === MOU_VERSION && !!on.mouAcceptedAt, 'Current property MOU accepted', 'Accept the current RoamWise property MOU on the join form.');
  add('signature', clip(on.mouSignedName, 80).length >= 3 && signatureMatches(on.mouSignedName, p.ownerName),
    'MOU signed with your name', 'Type your own full name (the owner or manager named on the form) to sign the MOU.');
  add('email', ctx.emailVerified === true, 'Email address verified', 'Open the verification email we sent and tap the link, then press "Check again".');
  add('basics', name.length >= 3 && zone.length >= 2 && !URL_IN_TEXT.test(name) && !BLOCKED_WORDS.test(name + ' ' + (p.hook || '')),
    'Property name, town and description', 'Give the real property name and town, without links.');
  add('type', PROPERTY_TYPES.includes(p.type), 'Property type chosen', 'Choose what kind of place it is.');
  add('phone', !!indianMobile(p.phone || p.ownerWa), 'Working Indian mobile number', 'Add a 10-digit Indian mobile number we can reach on WhatsApp.');
  add('location', !!(mapsUrl(p.mapsUrl) || mapsUrl(p.website) || httpsUrl(p.website)),
    'Google Maps or website link', 'Paste the Google Maps link of the property, or its website.');
  add('photo', !!httpsUrl(p.photoUrl) || Number(p.photoCount) > 0, 'At least one real photo', 'Add a link to one real photo of the property.');
  add('segments', cleanSegments(p.segments).length > 0, 'At least one RoamWise segment', 'Pick at least one experience your property is good for.');
  const price = Number(p.startPrice);
  add('price', !p.startPrice || (price >= 300 && price <= 300000), 'Room price looks real', 'Check the starting room price (between ₹300 and ₹3,00,000 a night).');
  add('gstin', !p.gstin || validGstin(p.gstin), 'GSTIN valid (if given)', 'Re-check your GSTIN or leave it blank.');
  add('authority', ['owner', 'manager', 'authorized'].includes(p.role || on.role), 'Your authority to list it', 'Tell us if you own, manage or are authorised by the owner.');

  const key = partnerKey({ name, zone });
  const dup = (ctx.existing || []).some((e) => e && partnerKey(e) === key && e.partnerUid !== uid);
  add('unique', !dup, 'Not already listed by someone else', 'This property is already listed. RoamWise will contact you to confirm who manages it.', true);
  const phoneReuse = (ctx.phoneOwners || []).some((o) => o && o !== uid);
  add('phoneUnique', !phoneReuse, 'Phone not used by another property account', 'This phone is linked to another property account. RoamWise will confirm with you.', true);

  const hold = checks.some((c) => c.hold);
  const pass = !hold && checks.every((c) => c.ok);
  return { pass, hold, checks };
}

/* The public-safe entry written into config/partners. Only fields guests may see. */
export function publicEntry(p, uid, nowIso) {
  const segs = cleanSegments(p.segments);
  const e = {
    id: 'p_' + slug(p.name),
    cat: 'stay',
    zone: clip(p.zone, 70),
    area: clip(p.area, 100),
    name: clip(p.name, 110),
    type: clip(p.type, 40),
    verified: 'self-listed',
    enquiryOnly: true,
    listingReady: true,
    bookingMode: 'enquiry',
    selfListed: { version: SELF_LIST_VERSION, at: nowIso, mouVersion: MOU_VERSION },
    supportEmail: 'support@roamwise.co.in',
    partnerUid: uid,
    segments: segs,
    segmentLabels: segs.map((s) => SEGMENTS[s]),
  };
  const hook = clip(p.hook, 300);
  if (hook) e.hook = hook;
  const mu = mapsUrl(p.mapsUrl) || mapsUrl(p.website);
  if (mu) e.mapsUrl = mu;
  const rooms = Math.round(Number(p.roomCount));
  if (rooms > 0 && rooms <= 1000) e.roomCount = rooms;
  const cap = Math.round(Number(p.guestCapacity));
  if (cap > 0 && cap <= 5000) e.guestCapacity = cap;
  const pk = publicPackages(p.packages);
  if (pk.length) e.packages = pk;
  if (p.nomad && p.nomad.enabled) e.nomad = { enabled: true, mbps: Math.round(Number(p.nomad.mbps)) || 0, speedVerified: false };
  return e;
}

/* Replace-or-append this property's entry; never touch entries owned by other hosts
   or any founder-signed entry for the same id. */
export function mergeEntry(list, entry) {
  /* A host who renamed their property re-lists under a new id: drop their own older self-listed entry. */
  const out = (Array.isArray(list) ? list : []).filter((x) =>
    !(x && x.verified === 'self-listed' && x.partnerUid === entry.partnerUid && x.id !== entry.id));
  const i = out.findIndex((x) => x && x.id === entry.id);
  if (i >= 0) {
    const cur = out[i];
    if (cur.verified !== 'self-listed' || cur.partnerUid !== entry.partnerUid) return { list: out, changed: false, reason: 'owned_elsewhere' };
    out[i] = entry;
  } else out.push(entry);
  return { list: out, changed: true };
}

/* Evidence record for the MOU acceptance (stored admin-only in mouEvidence/{uid}). */
export function evidence(p, uid, meta) {
  const on = (p && p.onboarding) || {};
  return {
    uid,
    mouVersion: on.mouVersion || '',
    signedName: clip(on.mouSignedName, 80),
    ownerName: clip(p && p.ownerName, 100),
    role: clip((p && p.role) || on.role, 20),
    acceptedAtClient: on.mouAcceptedAt || '',
    signedAtClient: on.mouSignedAt || '',
    recordedAt: meta.now,
    ip: clip(meta.ip, 64),
    userAgent: clip(meta.ua, 300),
    email: clip(meta.email, 120),
    emailVerified: meta.emailVerified === true,
    contentHash: meta.hash || '',
  };
}
