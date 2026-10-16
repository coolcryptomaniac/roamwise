/* ============================================================================
   worker/lib/trip-notify-core.js — pure rules for booking emails + trip reminders.
   ============================================================================
   No network, no Firestore: testable in Node. Operates on roomBookings docs.

   · Acknowledgement email: booking status 'requested', guest has a valid email,
     not yet acknowledged (ackEmailAt), created in the last 3 days. Says plainly
     that it is a REQUEST, not a confirmation, and that nothing is charged here.
   · Trip reminders: booking status 'confirmed'; check-in is 3 days and again
     1 day away (India date). Push first; email only if no push was delivered.
     Each reminder is sent once (remind3At / remind1At).
   ========================================================================= */
const DAY = 86400000;
const IST = 5.5 * 3600000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TRIP_DEFAULTS = Object.freeze({ ackEmail: false, reminders: false, maxEmailsPerRun: 40 });

export function parseTripSettings(doc) {
  const d = doc && typeof doc === 'object' ? doc : {};
  const cap = Math.round(Number(d.maxEmailsPerRun));
  return {
    ackEmail: d.ackEmail === true,
    reminders: d.reminders === true,
    maxEmailsPerRun: Number.isFinite(cap) ? Math.min(90, Math.max(1, cap)) : TRIP_DEFAULTS.maxEmailsPerRun,
  };
}

export function validEmail(e) { const s = String(e || '').trim(); return s.length <= 254 && EMAIL_RE.test(s); }

function ms(v) { if (v == null) return 0; if (typeof v === 'number') return v; const t = Date.parse(v); return Number.isFinite(t) ? t : 0; }

/** India calendar day number for a timestamp. */
function istDay(t) { return Math.floor((t + IST) / DAY); }
/** 'YYYY-MM-DD' -> India day number, or null. */
export function dateOnlyDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Number.isFinite(t) ? Math.floor(t / DAY) : null;
}

export function needsAck(b, now) {
  if (!b || b.status !== 'requested' || b.ackEmailAt) return false;
  if (!validEmail(b.guestEmail)) return false;
  const created = ms(b.createdAt || b.at);
  return !!created && now - created < 3 * DAY;
}

/** Returns 'r3' | 'r1' | null. Reminders are never sent for past or declined stays. */
export function reminderDue(b, now) {
  if (!b || b.status !== 'confirmed' || !b.guestUid) return null;
  const ci = dateOnlyDay(b.checkIn);
  if (ci == null) return null;
  const left = ci - istDay(now);
  if (left === 1 && !b.remind1At) return 'r1';
  if (left === 3 && !b.remind3At) return 'r3';
  return null;
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function money(n) { const v = Number(n); return Number.isFinite(v) && v > 0 ? 'Rs ' + Math.round(v).toLocaleString('en-IN') : ''; }
function first(name) { const n = String(name || '').trim().split(/\s+/)[0] || ''; return /^[\p{L}'.-]{1,30}$/u.test(n) ? n : 'there'; }
function shell(title, bodyHtml) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1d1a17"><h2 style="margin:0 0 12px;color:#8a5a12">${esc(title)}</h2>${bodyHtml}<p style="color:#777;font-size:12px;margin-top:22px">RoamWise · roamwise.co.in · Reply to this email or write to support@roamwise.co.in</p></div>`;
}
function rows(b) {
  const r = [['Stay', [b.property, b.room].filter(Boolean).join(' - ')], ['Check-in', b.checkIn], ['Check-out', b.checkOut],
    ['Guests', b.guests], ['Estimated total', money(b.amount)], ['Reference', b.ref]].filter((x) => x[1]);
  return r;
}
function table(b) {
  return '<table style="border-collapse:collapse;width:100%;margin:10px 0">' + rows(b).map((x) =>
    `<tr><td style="padding:6px 8px;color:#777;border-bottom:1px solid #eee">${esc(x[0])}</td><td style="padding:6px 8px;border-bottom:1px solid #eee"><b>${esc(x[1])}</b></td></tr>`).join('') + '</table>';
}
function plain(b) { return rows(b).map((x) => `${x[0]}: ${x[1]}`).join('\n'); }

export function buildAckEmail(b) {
  const name = first(b.guestName);
  const subject = `We got your stay request${b.ref ? ' (' + b.ref + ')' : ''}`;
  const html = shell('We got your request', `<p>Hi ${esc(name)},</p><p>Your request has been sent to the property. <b>This is a request, not a confirmed booking.</b> The host will confirm availability and the final price, and nothing has been charged by RoamWise at this step.</p>${table(b)}<p>You will get another message when the host replies.</p>`);
  const text = `Hi ${name},\n\nYour request has been sent to the property. This is a request, not a confirmed booking. The host will confirm availability and the final price. Nothing has been charged by RoamWise at this step.\n\n${plain(b)}\n\nYou will get another message when the host replies.\n\nRoamWise - support@roamwise.co.in`;
  return { subject, html, text };
}

export function buildReminder(b, kind) {
  const when = kind === 'r1' ? 'tomorrow' : 'in 3 days';
  const place = b.property || 'your stay';
  const push = { title: kind === 'r1' ? 'Your trip starts tomorrow' : 'Your trip is 3 days away', body: `Check-in at ${place} is ${when}${b.checkIn ? ' (' + b.checkIn + ')' : ''}. Tap for your trip details.`.slice(0, 200), url: 'https://roamwise.co.in/' };
  const name = first(b.guestName);
  const subject = kind === 'r1' ? `Check-in tomorrow: ${place}` : `Your stay at ${place} is in 3 days`;
  const html = shell(push.title, `<p>Hi ${esc(name)},</p><p>Check-in is <b>${when}</b>. Quick reminder of your stay:</p>${table(b)}<p>Questions about arrival? Reply to this email and we will help.</p>`);
  const text = `Hi ${name},\n\nCheck-in is ${when}.\n\n${plain(b)}\n\nQuestions about arrival? Reply to this email.\n\nRoamWise - support@roamwise.co.in`;
  return { push, email: { subject, html, text } };
}
