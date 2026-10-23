// providers/provider-core.mjs - listing application and verification rules for agencies, tour operators, trek providers,
// guides, transport, food and goods sellers. Pure functions. Nothing is published from here: an application becomes a
// public listing only after a person checks it (see verificationLevel). Document lists are RoamWise's own standard and
// are marked "confirm" where the legal rule has not been checked with the authority.

export const CATEGORIES = Object.freeze({
  agency:    { label: 'Travel agency', docs: ['PAN', 'Business registration or Udyam', 'GST number, if registered', 'Uttarakhand tourism registration (UTTBRR), if you sell tours', 'Two recent customer references'] },
  operator:  { label: 'Tour operator', docs: ['PAN', 'Business registration or Udyam', 'UTTBRR registration (confirm with the tourism office)', 'Insurance for guests', 'Sample itinerary with prices and what is included'] },
  trek:      { label: 'Trekking provider', docs: ['UTTBRR adventure operator registration (confirm)', 'Guide course certificates', 'First-aid certificate', 'Insurance for guests', 'Safety and weather cut-off plan'] },
  guide:     { label: 'Individual guide', docs: ['ID with photo', 'Police verification or character certificate', 'Guide licence or registration (confirm what your area requires)', 'First-aid certificate', 'Two references'] },
  transport: { label: 'Vehicle owner or driver', docs: ['Registration showing commercial use', 'Tourist permit', 'Fitness and pollution certificates', 'Commercial insurance with passenger cover', 'Driver licence with badge and police verification'] },
  food:      { label: 'Food seller or kitchen', docs: ['FSSAI licence or registration', 'Photo of the kitchen', 'Menu with prices', 'Allergen handling note'] },
  goods:     { label: 'Local goods seller', docs: ['ID with photo', 'Udyam or GST, if you have one', 'Product photos', 'Where the goods are made or sourced'] },
  service:   { label: 'Other service (photographer, wellness, rental)', docs: ['ID with photo', 'Examples of work or a certificate', 'Rate card', 'Two references'] },
});

export const ZONES = Object.freeze(['Almora', 'Nainital', 'Ranikhet', 'Kausani', 'Pithoragarh', 'Munsiyari', 'Lansdowne', 'Pauri', 'Dehradun', 'Mussoorie', 'Rishikesh', 'Haridwar', 'Corbett', 'Auli', 'Char Dham', 'Elsewhere in Uttarakhand']);

/** Steps a person ticks off, in order. A listing is public only at the "verified" step. */
export const STEPS = Object.freeze(['applied', 'documents', 'conversation', 'trial']);
export const LEVELS = Object.freeze({ applied: 'Applied', documents: 'Documents checked', conversation: 'Met or video call done', verified: 'Verified: trial completed' });

const txt = (v, n) => String(v == null ? '' : v).replace(/[<>\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const phone = (v) => { const d = String(v == null ? '' : v).replace(/\D/g, ''); const t = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d; return /^[6-9]\d{9}$/.test(t) ? t : ''; };
const https = (v) => { const s = String(v || '').trim(); return /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s"'<>]*)?$/i.test(s) ? s : ''; };
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i;

/** Returns { ok, errors, record }. record is safe to put in a JSON line and a message. */
export function validateApplication(a) {
  const errors = [];
  const cat = CATEGORIES[a && a.category] ? a.category : '';
  const zones = (Array.isArray(a && a.zones) ? a.zones : []).filter((z) => ZONES.includes(z)).slice(0, 6);
  const rec = {
    name: txt(a && a.name, 80), business: txt(a && a.business, 90), category: cat, zones,
    phone: phone(a && a.phone), email: EMAIL.test(String(a && a.email || '').trim()) ? String(a.email).trim().toLowerCase().slice(0, 100) : '',
    website: https(a && a.website), instagram: https(a && a.instagram),
    about: txt(a && a.about, 400), price: txt(a && a.price, 120),
    docs: (Array.isArray(a && a.docs) ? a.docs : []).map((d) => txt(d, 60)).filter((d) => CATEGORIES[cat] && CATEGORIES[cat].docs.includes(d)),
  };
  if (!rec.name) errors.push('Your name is needed.');
  if (!cat) errors.push('Choose what you offer.');
  if (!zones.length) errors.push('Pick at least one place you work in.');
  if (!rec.phone && !rec.email) errors.push('Give a valid 10-digit mobile number or an email.');
  if (a && a.website && !rec.website) errors.push('Website must start with https://');
  if (a && a.instagram && !rec.instagram) errors.push('Instagram link must start with https://');
  if (rec.about.length < 20) errors.push('Say what you offer in at least 20 characters.');
  if (!(a && a.consent)) errors.push('Please tick the confirmation so we can check and list your details.');
  return { ok: !errors.length, errors, record: rec };
}

export const missingDocs = (rec) => (CATEGORIES[rec.category] ? CATEGORIES[rec.category].docs.filter((d) => !rec.docs.includes(d)) : []);

/** checks = { documents, conversation, trial } booleans set by a person. Order matters: you cannot skip a step. */
export function verificationLevel(checks = {}) {
  if (!checks.documents) return { level: 'applied', label: LEVELS.applied, public: false };
  if (!checks.conversation) return { level: 'documents', label: LEVELS.documents, public: false };
  if (!checks.trial) return { level: 'conversation', label: LEVELS.conversation, public: false };
  return { level: 'verified', label: LEVELS.verified, public: true };
}

/** What a public listing may show. Contact details only if the provider asked for them to be public. */
export function publicListing(rec, checks, shareContact = false) {
  const v = verificationLevel(checks);
  if (!v.public) return null;
  const out = { name: rec.business || rec.name, category: CATEGORIES[rec.category].label, zones: rec.zones, about: rec.about, price: rec.price, badge: v.label };
  if (shareContact && rec.phone) out.phone = rec.phone;
  return out;
}

export function applicationMessage(rec) {
  const c = CATEGORIES[rec.category];
  const lines = ['Hello RoamWise, I would like to be listed as a verified provider.', '', 'Name: ' + rec.name];
  if (rec.business) lines.push('Business: ' + rec.business);
  lines.push('Offer: ' + c.label, 'Places: ' + rec.zones.join(', '));
  if (rec.phone) lines.push('Mobile: ' + rec.phone);
  if (rec.email) lines.push('Email: ' + rec.email);
  if (rec.website) lines.push('Website: ' + rec.website);
  if (rec.instagram) lines.push('Instagram: ' + rec.instagram);
  if (rec.price) lines.push('Typical price: ' + rec.price);
  lines.push('About: ' + rec.about);
  const miss = missingDocs(rec);
  lines.push('Documents ready: ' + (rec.docs.length ? rec.docs.join('; ') : 'none yet'));
  if (miss.length) lines.push('Still to collect: ' + miss.join('; '));
  lines.push('', 'I confirm these details are true and agree that RoamWise may check them and contact me.', '', 'DATA: ' + JSON.stringify(rec));
  return lines.join('\n');
}
