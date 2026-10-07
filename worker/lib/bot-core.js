/* ============================================================================
   worker/lib/bot-core.js — pure command router for the Telegram / WhatsApp bots
   ============================================================================
   Named exports only. No network, no Firestore: the handler passes in the
   partner list and a few functions, so this is unit-testable under Node.

   What the bot does: lists stays that can really be booked, makes a coded
   enquiry to the property (same RW-XXXXXX code as the website), lets the guest
   confirm the stay later, and splits a total between a group.

   What it never does: take payment, hold money, quote a price a property has
   not published, or show a property's phone number without a booking code.
   ========================================================================= */
import { validCode, CODE_ALPHABET, validPartnerId, validDate } from './stay-ledger-core.js';
import gstin from '../../features/finance-tax/gstin.js';

export const SITE = 'https://roamwise.co.in';

export const HELP = [
  'RoamWise trip helper',
  '',
  '/stays <city>  – verified stays you can ask about',
  '/enquire <ref> <check-in YYYY-MM-DD> <nights> <guests>  – message a stay with a booking code',
  '/stayed <code> yes|no  – after your trip, tell us if you stayed',
  '/split <total> <people>  – split a bill',
  '/join <property>, <city>, <rooms>, <GSTIN or none>, <UPI or none>[, <phone>]  – list your property',
  '',
  'For a full AI trip plan, open ' + SITE,
].join('\n');

export function parseCommand(text) {
  const t = String(text || '').trim().slice(0, 500);
  const m = /^\/?([a-zA-Z]+)(?:@\w+)?(?:\s+(.*))?$/s.exec(t);
  if (!m) return { cmd: '', args: [], raw: t };
  return { cmd: m[1].toLowerCase(), args: (m[2] || '').trim().split(/\s+/).filter(Boolean), raw: t };
}

const waNumber = (v) => {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 10) d = '91' + d;
  return d.length >= 11 && d.length <= 15 ? d : '';
};
const httpsUrl = (v) => { try { const u = new URL(String(v || '').trim()); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } };

/* The route a guest would use, mirroring js/booking/routes.js (mode decides which field counts). */
export function routeOf(p) {
  const mode = String(p.bookingMode || '').toLowerCase();
  if (mode === 'direct') return { type: 'direct' };
  if (mode === 'whatsapp' && waNumber(p.bookingWhatsapp)) return { type: 'whatsapp', number: waNumber(p.bookingWhatsapp) };
  if ((mode === 'ota' || mode === 'website') && httpsUrl(p.bookingUrl)) return { type: mode, url: httpsUrl(p.bookingUrl) };
  if (mode === 'phone' && String(p.bookingPhone || '').replace(/\D/g, '').length >= 10) return { type: 'phone' };
  return { type: 'none' };
}

/** Verified, live partners that have a working booking route. */
export function usableStays(list) {
  return (Array.isArray(list) ? list : []).filter((p) =>
    p && p.verified === 'signed' && p.listingReady === true && validPartnerId(p.id) && routeOf(p).type !== 'none');
}

export function staysReply(list, city) {
  const c = String(city || '').trim().toLowerCase();
  if (!c) return 'Tell me a city, for example: /stays Almora';
  const hits = usableStays(list).filter((p) => String(p.zone || '').toLowerCase() === c).slice(0, 8);
  if (!hits.length) return 'No verified stays listed in ' + city + ' yet. I will not guess. Try another city, or plan with the full app: ' + SITE;
  const how = { direct: 'book in the app', whatsapp: 'by WhatsApp, via this chat', ota: 'on their booking site', website: 'on their website', phone: 'by phone' };
  return hits.map((p, i) => (i + 1) + '. ' + p.name + (p.area ? ' (' + p.area + ')' : '') + ' – ' + how[routeOf(p).type] + '\n   ref: ' + p.id).join('\n')
    + '\n\nNext: /enquire <ref> <check-in YYYY-MM-DD> <nights> <guests>\nPrices are confirmed by each property, not by us.';
}

export function splitReply(args) {
  const total = Number(args[0]), n = Math.round(Number(args[1]));
  if (!Number.isFinite(total) || total <= 0 || total > 10000000 || !Number.isFinite(n) || n < 1 || n > 50) return 'Use: /split <total in rupees> <number of people>';
  const each = Math.ceil(total / n);
  return 'Rs ' + total.toLocaleString('en-IN') + ' between ' + n + ' = Rs ' + each.toLocaleString('en-IN') + ' each' + (each * n !== total ? ' (rounded up; the last person pays Rs ' + (total - each * (n - 1)).toLocaleString('en-IN') + ')' : '') + '.';
}

export function newCode(rand) {
  const bytes = rand || crypto.getRandomValues(new Uint8Array(6));
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET.charAt(bytes[i] % CODE_ALPHABET.length);
  return 'RW-' + s;
}

export function parseEnquiry(args) {
  const [ref, checkIn, nights, guests] = args;
  if (!validPartnerId(ref || '')) return { error: 'Use: /enquire <ref> <check-in YYYY-MM-DD> <nights> <guests>' };
  if (!validDate(checkIn || '') || Number.isNaN(Date.parse(checkIn))) return { error: 'Check-in must look like 2026-11-10.' };
  const n = Math.round(Number(nights)), g = Math.round(Number(guests));
  if (!(n >= 1 && n <= 60)) return { error: 'Nights must be between 1 and 60.' };
  if (!(g >= 1 && g <= 100)) return { error: 'Guests must be between 1 and 100.' };
  return { value: { ref, checkIn, nights: n, guests: g } };
}

export function enquiryText(p, d, code) {
  return 'Hello ' + p.name + ', I found your stay through RoamWise.\n'
    + 'Dates: check-in ' + d.checkIn + ' for ' + d.nights + ' night' + (d.nights > 1 ? 's' : '') + '.\n'
    + 'Guests: ' + d.guests + '.\n'
    + 'Please share availability, the final total including applicable taxes, payment method and booking terms.\n\n'
    + 'RoamWise booking code: ' + code;
}

/** Final reply after a code has been registered. Never reveals a number for a non-WhatsApp route. */
export function enquiryReply(p, d, code) {
  const r = routeOf(p);
  if (r.type === 'whatsapp') {
    return 'Tap to message ' + p.name + ' with your dates filled in:\nhttps://wa.me/' + r.number + '?text=' + encodeURIComponent(enquiryText(p, d, code))
      + '\n\nYour booking code: ' + code + '\nAfter your trip send: /stayed ' + code + ' yes   (or no)\nThe stay confirms availability and the price. Nothing is booked or paid yet.';
  }
  if (r.type === 'ota' || r.type === 'website') return p.name + ' takes bookings on its own site (rates and terms are set there):\n' + r.url + '\nYour reference: ' + code;
  return p.name + ' books through the RoamWise app (' + (r.type === 'direct' ? 'see rooms and book' : 'call the property from its page') + '): ' + SITE + '\nYour reference: ' + code;
}

/** "/join Sunrise Homestay, Almora, 6, 05ABCDE1234F1Z5, owner@upi, 9876543210". Returns { value } or { error }. */
export function parseJoin(raw) {
  const body = String(raw || '').replace(/^\/?join(?:@\w+)?\s*/i, '');
  const parts = body.split(',').map((x) => x.trim());
  const usage = 'Use: /join <property name>, <city>, <rooms>, <GSTIN or none>, <UPI id or none>[, <phone>]';
  if (parts.length < 5) return { error: usage };
  const [name, city, rooms, g, upi, phone] = parts;
  if (name.length < 3 || name.length > 110) return { error: 'Please give the full property name first. ' + usage };
  if (city.length < 2 || city.length > 70) return { error: 'Please give the town or city second. ' + usage };
  const nrooms = Math.round(Number(rooms));
  if (!(nrooms >= 1 && nrooms <= 1000)) return { error: 'Rooms must be a number from 1 to 1000. ' + usage };
  const none = (x) => !x || /^(none|no|na|n\/a|-)$/i.test(x);
  let gst = '';
  if (!none(g)) {
    const r = gstin.validateGstin(g);
    if (!r.ok) return { error: 'That GSTIN does not check out (' + r.error + ') Send "none" if you are not registered.' };
    gst = r.gstin;
  }
  let vpa = '';
  if (!none(upi)) {
    if (!gstin.validUpi(upi)) return { error: 'That UPI id looks wrong. It should look like name@bank, or send "none".' };
    vpa = upi;
  }
  const ph = String(phone || '').replace(/\D/g, '');
  if (phone && (ph.length < 10 || ph.length > 13)) return { error: 'That phone number looks wrong. ' + usage };
  return { value: { name, city, rooms: nrooms, gstin: gst, upi: vpa, phone: ph } };
}
