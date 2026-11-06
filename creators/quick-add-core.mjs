/* creators/quick-add-core.mjs - founder "Quick add": record a person who agreed by email reply, phone, WhatsApp or in
   person, without a form or paperwork. Pure functions, no network, no storage. The admin page (admin/quick-add.js)
   writes the returned record to the existing `crm` collection, where the founder is already allowed to create any record
   (firestore.rules, match /crm/{id}). Nothing here sends a message, grants Pro, sets a tier or pays anyone. */

export const TYPES = Object.freeze({
  creator: { seg: 'creator', label: 'Creator' },
  artist: { seg: 'artist', label: 'Artist' },
  property: { seg: 'property', label: 'Property partner' },
  transport: { seg: 'transport', label: 'Transport partner' },
});
export const VIA = Object.freeze({
  'email-reply': 'Email reply', 'phone-call': 'Phone call', whatsapp: 'WhatsApp', 'in-person': 'In person', other: 'Other',
});
export const CREATOR_STAGES = Object.freeze(['new', 'contacted', 'shortlisted', 'offered', 'active', 'declined']);

const clean = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[A-Za-z]{2,}$/;
const isoDay = (d) => (/^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(String(d || '')) ? String(d) : '');

/** '+91' plus 10 digits, or '' if it is not an Indian mobile number. */
export function normalizePhone(v) {
  let d = String(v == null ? '' : v).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? '+91' + d : '';
}

/** "Uttarkashi, Harsil Valley and Gangotri" -> ['Uttarkashi', 'Harsil Valley', 'Gangotri'] */
export function splitPlaces(v, max = 12) {
  const seen = new Set(), out = [];
  for (const p of String(v == null ? '' : v).split(/[,;\n]|\band\b|&/i)) {
    const t = clean(p, 60);
    if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push(t); }
    if (out.length >= max) break;
  }
  return out;
}

const httpsUrl = (v) => { const s = clean(v, 300); return /^https:\/\/[^\s]{4,}$/i.test(s) ? s : ''; };
/** '@bheempahadi10' -> instagram link; a bare youtube handle is not guessed. */
export function instagramLink(v) {
  const s = clean(v, 120);
  if (httpsUrl(s)) return s;
  const m = /^@?([A-Za-z0-9._]{2,30})$/.exec(s);
  return m ? 'https://www.instagram.com/' + m[1] + '/' : '';
}

/** Pull what is easy to find out of a pasted email reply, so the founder only checks it. Never invents anything. */
export function parseReplyText(text) {
  const t = String(text == null ? '' : text).slice(0, 20000);
  const body = t.split(/\r?\n(?:On .{5,120} wrote:|>|-{2,}\s*Original)/)[0] || t;   // drop the quoted earlier mail
  const emails = [...new Set((body.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).map((e) => e.toLowerCase()))]
    .filter((e) => !e.endsWith('@roamwise.co.in'));
  const phones = [...new Set((body.match(/(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}/g) || []).map(normalizePhone).filter(Boolean))];
  const urls = [...new Set((body.match(/https:\/\/[^\s<>")]+/g) || []).map((u) => u.replace(/[.,;]+$/, '')))].slice(0, 6);
  const sign = /(?:regards|thanks|thank you|best|warmly|sincerely)[,.]?\s*\r?\n\s*([A-Z][A-Za-z.' -]{1,50})\s*(?:\r?\n|$)/i.exec(body);
  const from = /^From:\s*"?([^"<\r\n]{2,60}?)"?\s*(?:<|$)/im.exec(t);
  return { name: clean((sign && sign[1]) || (from && from[1]) || '', 60), email: emails[0] || '', phone: phones[0] || '', urls, snippet: clean(body, 600) };
}

function base(type, f, ctx) {
  const t = TYPES[type];
  const errors = [];
  const name = clean(f.name, 120);
  if (!name) errors.push('Add their name.');
  const email = clean(f.email, 160).toLowerCase();
  if (email && !EMAIL.test(email)) errors.push('That email address does not look right.');
  const phoneRaw = clean(f.phone, 30), phone = normalizePhone(phoneRaw);
  if (phoneRaw && !phone) errors.push('Phone should be a 10-digit Indian mobile number.');
  const place = clean(f.town || f.city, 80);
  if (!email && !phone && !httpsUrl(f.link || f.handle)) errors.push('Add at least one way to reach them: email, phone/WhatsApp, or a profile link.');
  const via = Object.keys(VIA).includes(f.via) ? f.via : '';
  if (!via) errors.push('Say how they agreed (email reply, phone call, WhatsApp, in person).');
  const said = clean(f.said, 600);
  const note = clean(f.note, 600);
  const rec = {
    seg: t.seg, name, email, phone, note: [said && 'They said: ' + said, note].filter(Boolean).join(' | ').slice(0, 1200),
    stage: type === 'creator' ? (CREATOR_STAGES.includes(f.stage) ? f.stage : 'contacted') : undefined,
    source: 'founder entry (verbal/email confirmation)',
    consent: f.consent !== false,                       // they agreed to be listed; the founder unticks it if they did not
    consentVia: via,
    verbalConfirmation: { via, confirmedOn: isoDay(f.confirmedOn) || ctx.today, recordedBy: ctx.adminUid || '', whatTheySaid: said },
    formSubmitted: false,
    enteredByFounder: true,
    createdAtIso: ctx.nowIso,
  };
  if (rec.stage === undefined) delete rec.stage;
  return { rec, errors, place };
}

/** type: creator | artist | property | transport. ctx: { today:'YYYY-MM-DD', nowIso, adminUid }. */
export function buildRecord(type, f = {}, ctx = {}) {
  if (!TYPES[type]) return { ok: false, errors: ['Pick who you are adding.'], record: null };
  const c = { today: ctx.today || new Date().toISOString().slice(0, 10), nowIso: ctx.nowIso || new Date().toISOString(), adminUid: ctx.adminUid || '' };
  const { rec, errors, place } = base(type, f, c);
  const places = splitPlaces(f.places);
  if (type === 'creator') {
    const yt = httpsUrl(f.youtube), ig = instagramLink(f.instagram), handle = yt || ig;
    if (!handle) errors.push('Add a YouTube or Instagram link (full https link).');
    const vMin = Math.max(0, Math.round(Number(f.viewsMin) || 0)), vMax = Math.max(vMin, Math.round(Number(f.viewsMax) || 0));
    const radius = Math.max(0, Math.min(500, Math.round(Number(f.radiusKm) || 0)));
    Object.assign(rec, {
      handle, niche: clean(f.niche, 120).toLowerCase(), tier: 'applied', refSales: 0, refRevenue: 0, code: '',
      matchProfile: { destinations: places, niches: clean(f.niche, 120).toLowerCase().split(/[,;]/).map((x) => x.trim()).filter(Boolean).slice(0, 8) },
      barter: {
        location: { town: place }, youtube: yt, instagram: ig, ask: { cashMin: Math.max(0, Math.round(Number(f.cashMin) || 0)), negotiable: true },
        metrics: vMax ? { avgViews: Math.round((vMin + vMax) / 2), viewsMin: vMin, viewsMax: vMax, estimatedByFounder: true } : {},
        coverage: { places, radiusKm: radius, region: clean(f.region, 60) }, dealTypes: clean(f.dealTypes, 80),
      },
    });
  } else if (type === 'artist') {
    Object.assign(rec, { city: place, state: clean(f.state, 60), themes: clean(f.themes, 160), medium: clean(f.medium, 120), portfolio: httpsUrl(f.link), instagram: instagramLink(f.instagram), status: 'verbal-confirmed', photosReceived: false });
  } else if (type === 'property') {
    Object.assign(rec, { city: place, country: 'India', contactPerson: clean(f.contactPerson, 80), tags: clean(f.tags, 160), contactRoute: httpsUrl(f.link), sourceUrl: httpsUrl(f.link), roomsApprox: Math.max(0, Math.round(Number(f.rooms) || 0)), status: 'verbal-confirmed', mouAccepted: false, evidence: 'Confirmed by the founder (' + (VIA[rec.consentVia] || 'verbal') + ').' });
  } else if (type === 'transport') {
    Object.assign(rec, { baseTown: place, vehicles: clean(f.vehicles, 160), routes: places, operatorType: clean(f.operatorType, 40), status: 'verbal-confirmed', licenceChecked: false, insuranceChecked: false });
  }
  return { ok: errors.length === 0, errors, record: errors.length ? null : rec };
}

/** Prefill values for the form from URL query params (used for deep links). Whitelisted; everything is cleaned again on save. */
export function prefillFromQuery(search) {
  const q = new URLSearchParams(search || ''), out = {};
  for (const k of ['type', 'name', 'email', 'phone', 'town', 'places', 'youtube', 'instagram', 'niche', 'dealTypes', 'region', 'radiusKm', 'viewsMin', 'viewsMax', 'via', 'said', 'note']) if (q.has(k)) out[k] = clean(q.get(k), 400);
  return out;
}
