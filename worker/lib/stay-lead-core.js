/* ============================================================================
   worker/lib/stay-lead-core.js — validation for guest stay requests ("leads")
   ============================================================================
   A guest who asks RoamWise to pass a stay request to a property gives a name
   and a mobile number. This file decides what is accepted. It is pure (no I/O)
   so it can be tested exhaustively.

   Consent: the request is refused unless the guest explicitly agreed that
   RoamWise and the property may contact them on WhatsApp or phone ABOUT THIS
   REQUEST. That is NOT consent for marketing messages; those need a separate
   opt-in and are not collected here.
   Named exports only (see lib/http.js). */

export const CONSENT_VERSION = 'wa-2026-10';
export const RETENTION_DAYS = 365;

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const idLike = (v) => /^[A-Za-z0-9_-]{1,60}$/.test(String(v || ''));
const isoDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !isNaN(Date.parse(v + 'T12:00:00Z'));

/* Indian mobile: 10 digits starting 6-9, optionally written with +91 / 91 / 0. Returns the 10 digits or ''. */
export function normalizePhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : '';
}

export function parseLead(b) {
  b = b && typeof b === 'object' ? b : {};
  if (b.consent !== true) return { error: 'consent_required' };
  const name = clean(b.name, 60);
  if (name.length < 2) return { error: 'bad_name' };
  const phone = normalizePhone(b.phone);
  if (!phone) return { error: 'bad_phone' };
  const source = b.source === 'room' ? 'room' : 'basket';
  const rawItems = Array.isArray(b.items) ? b.items.slice(0, 8) : [];
  if (!rawItems.length) return { error: 'no_items' };
  const items = rawItems.map((x) => {
    x = x && typeof x === 'object' ? x : {};
    const price = Number(x.price);
    return {
      partnerId: idLike(x.partnerId) ? String(x.partnerId) : '',
      itemId: idLike(x.itemId || x.id) ? String(x.itemId || x.id) : '',
      name: clean(x.name || x.property, 80),
      room: clean(x.room, 80),
      where: clean(x.where || x.zone, 60),
      cat: clean(x.cat, 20),
      price: isFinite(price) && price >= 0 && price <= 1000000 ? Math.round(price) : 0,
    };
  }).filter((x) => x.name || x.partnerId);
  if (!items.length) return { error: 'no_items' };
  const value = {
    source, name, phone, items,
    checkIn: isoDay(b.checkIn) ? b.checkIn : '', checkOut: isoDay(b.checkOut) ? b.checkOut : '',
    dates: clean(b.dates, 40),
    guests: Math.min(50, Math.max(0, parseInt(b.guests, 10) || 0)),
    people: clean(b.people, 20),
    note: clean(b.note, 300),
    ref: idLike(b.ref) ? String(b.ref) : '',
    estTotal: Math.min(10000000, Math.max(0, Math.round(Number(b.estTotal) || 0))),
  };
  return { value };
}

export function leadId(now, rand) {
  return 'L' + (now || Date.now()).toString(36).toUpperCase() + (rand || Math.random().toString(36).slice(2, 5)).toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 3);
}

export function isExpired(createdAt, now) {
  const t = Date.parse(createdAt || '');
  return isFinite(t) && (now || Date.now()) - t > RETENTION_DAYS * 86400000;
}

/* One short line per lead for the founder's chat. Phone shown as a wa.me link so a tap opens WhatsApp. */
export function leadLine(l) {
  const what = (l.items || []).slice(0, 3).map((i) => i.name || i.partnerId).filter(Boolean).join(', ') || 'a stay';
  const when = l.checkIn ? l.checkIn + (l.checkOut ? '→' + l.checkOut : '') : (l.dates || 'dates not given');
  return '- ' + (l.id || '?') + ': ' + (l.name || '?') + ' wants ' + what + ' (' + when + (l.guests ? ', ' + l.guests + ' guests' : l.people ? ', ' + l.people + ' people' : '') + '), wa.me/91' + (l.phone || '');
}
