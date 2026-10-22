// packages/booking-core.mjs - the booking request: validate, make a reference, build the confirmation and the message to RoamWise.
// Pure functions. No payment is taken and nothing is stored: the lead sends the request by WhatsApp, we confirm dates with
// the stay, driver and guide, then send the payment details. Medical notes go to RoamWise only, never to the public chat.
import { PACKAGES, GROUP, priceFor, WHATSAPP } from './catalog.mjs';
import { instalmentPlan } from './instalment-core.mjs';

export const CONSENTS = Object.freeze([
  { id: 'adult', text: 'Every traveller is 18 or older.' },
  { id: 'rules', text: 'We have read the group rules: no alcohol or drugs, no swimming in streams or rivers, a headcount at every stop, and no hill-road travel after dark.' },
  { id: 'medical', text: 'Medical and allergy notes below may be shared with the organiser, the guide and the stay, and nobody else.' },
]);

const clean = (s, max) => String(s == null ? '' : s).replace(/[<>\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
export function normalisePhone(v) {
  const d = String(v == null ? '' : v).replace(/\D/g, '');
  const ten = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : '';
}

/* "Asha Rao, 98xxxxxx10" per line (name, emergency contact phone). */
export function parseGuests(text) {
  return String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
    const i = line.lastIndexOf(',');
    const name = clean(i < 0 ? line : line.slice(0, i), 60), phone = i < 0 ? '' : normalisePhone(line.slice(i + 1));
    return { name, emergency: phone };
  });
}

function hash4(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36).toUpperCase().padStart(4, '0').slice(-4);
}
export const bookingRef = (pkgId, startISO, phone) => 'RW-' + pkgId.slice(0, 3).toUpperCase() + '-' + startISO.slice(2).replace(/-/g, '') + '-' + hash4(pkgId + startISO + phone);

export function validateBooking(input) {
  const problems = [];
  const pkg = PACKAGES[input.pkgId];
  if (!pkg) problems.push('Choose a package.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startISO || '')) problems.push('Choose a start date.');
  const n = Number(input.n);
  if (!Number.isInteger(n) || n < GROUP.min || n > GROUP.max) problems.push('Group size must be ' + GROUP.min + ' to ' + GROUP.max + '.');
  if (input.vehicle === 'premium' && n > 10) problems.push('The premium van seats up to 10 guests.');
  const lead = { name: clean(input.leadName, 60), phone: normalisePhone(input.leadPhone), email: clean(input.leadEmail, 80), group: clean(input.group, 80) };
  if (lead.name.length < 2) problems.push('Enter the lead traveller\'s name.');
  if (!lead.phone) problems.push('Enter a valid 10-digit mobile number for the lead traveller.');
  if (lead.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) problems.push('That email address does not look right.');
  const guests = parseGuests(input.guestsText);
  if (guests.length !== n) problems.push('List ' + n + ' travellers, one per line. You have ' + guests.length + '.');
  guests.forEach((g, i) => {
    if (g.name.length < 2) problems.push('Traveller ' + (i + 1) + ' needs a name.');
    else if (!g.emergency) problems.push(g.name + ' needs an emergency contact phone after a comma, for example "Asha Rao, 9876543210".');
  });
  const got = new Set(input.consents || []);
  CONSENTS.forEach((c) => { if (!got.has(c.id)) problems.push('Please tick: ' + c.text); });
  return { ok: problems.length === 0, problems, lead, guests, n, pkg };
}

export function makeBooking(input, todayISO) {
  const v = validateBooking(input);
  if (!v.ok) return { ok: false, problems: v.problems };
  const opts = { vehicle: input.vehicle || 'single', kit: input.kit !== false };
  const price = priceFor(input.pkgId, v.n, opts);
  if (!price) return { ok: false, problems: ['No price for that group and vehicle choice.'] };
  const plan = instalmentPlan({ totalPerPerson: price.totalPP, departISO: input.startISO, todayISO, groupSize: v.n });
  const ref = bookingRef(input.pkgId, input.startISO, v.lead.phone);
  const medical = clean(input.medical, 400);
  const lines = [
    'Hi RoamWise, booking request ' + ref,
    v.pkg.name + ' | ' + input.startISO + ' | ' + v.pkg.days + ' days | ' + v.n + ' travellers | ' + (opts.vehicle === 'premium' ? 'premium van' : opts.vehicle === 'cheapest' ? 'smaller cars' : 'one vehicle') + (opts.kit ? ' | Yaadein kit' : ''),
    'Price: Rs ' + price.totalPP.toLocaleString('en-IN') + ' per person (Rs ' + price.groupTotal.toLocaleString('en-IN') + ' total, GST included)',
    'Lead: ' + v.lead.name + ', ' + v.lead.phone + (v.lead.email ? ', ' + v.lead.email : '') + (v.lead.group ? ' (' + v.lead.group + ')' : ''),
    'Travellers (emergency contact):',
    ...v.guests.map((g, i) => (i + 1) + '. ' + g.name + ' (' + g.emergency + ')'),
    medical ? 'Medical or allergy notes: ' + medical : 'Medical or allergy notes: none',
    'Confirmed: all 18+, group rules read, notes may be shared with organiser, guide and stay.',
  ];
  const text = lines.join('\n');
  return {
    ok: true, ref, price, plan, lead: v.lead, guests: v.guests, medical, text,
    whatsapp: 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text),
    next: [
      'Send this request on WhatsApp. It is not a booking until we confirm.',
      'Within 24 hours we check the dates with the stay, the driver and the guide, and reply with a yes or the nearest alternative.',
      'On a yes we hold your dates for 48 hours and send the payment details for the first part.',
      'When the first part is paid you get the trip chat link, the group rules and the packing list.',
      '3 days before: driver and guide cards, and a final road and weather check.',
    ],
  };
}
