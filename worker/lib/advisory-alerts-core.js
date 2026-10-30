/* ============================================================================
   worker/lib/advisory-alerts-core.js — pure rules for advisory alerts.
   ============================================================================
   No network, no Firestore: testable in Node. Input is data/conditions.json
   (built from conditions-data.js) plus roomBookings / users rows.

   Who hears about a new advisory (closure, crowds, snow, event):
     · guests   — a live stay booking (requested / confirmed / paid) whose place
                  is in a region the advisory touches and whose dates overlap it
     · followers— users who chose regions on /uttarakhand-road-status/
                  (users/{uid}.alertRegions, saved by js/core/alert-follow.js)
     · partners — the property owner of those bookings, with a guest count
     · team     — a daily digest: what is live, what expires soon (refresh it),
                  how many people were told, and how many stays are affected
   Each person hears about each advisory once (the handler keeps a KV marker).
   ========================================================================= */
const DAY = 86400000;
const IST = 5.5 * 3600000;
export const LIVE_STATUSES = Object.freeze(['requested', 'confirmed', 'confirmed-pay-later', 'paid-unverified', 'paid']);
const ISO = /^20\d\d-\d\d-\d\d$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LOOKAHEAD_DAYS = 21;
export const MAX_PER_MESSAGE = 3;

export const ADVISORY_DEFAULTS = Object.freeze({ advisoryAlerts: false, partnerAlerts: false, teamDigest: false, maxEmailsPerRun: 40 });

/** Switches live in Firestore config/tripNotifySettings next to the booking switches.
    A boolean set there always wins (so the founder can turn any part off from the console).
    A missing field falls back to the Worker var ADVISORY_ALERTS ("guests,partners,digest"),
    so the switches can also be turned on in code (worker/wrangler.toml) and deployed. */
export function parseAdvisorySettings(doc, envDefault) {
  const d = doc && typeof doc === 'object' ? doc : {};
  const on = new Set(String(envDefault || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean));
  const pick = (field, word) => (typeof d[field] === 'boolean' ? d[field] : on.has(word));
  const cap = Math.round(Number(d.maxEmailsPerRun));
  return {
    advisoryAlerts: pick('advisoryAlerts', 'guests'),
    partnerAlerts: pick('partnerAlerts', 'partners'),
    teamDigest: pick('teamDigest', 'digest'),
    maxEmailsPerRun: Number.isFinite(cap) ? Math.min(90, Math.max(1, cap)) : ADVISORY_DEFAULTS.maxEmailsPerRun,
  };
}

export function validEmail(e) { const s = String(e || '').trim(); return s.length <= 254 && EMAIL_RE.test(s); }
export function istToday(now) { return new Date(now + IST).toISOString().slice(0, 10); }
export function addDays(iso, n) { return new Date(Date.parse(iso + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10); }

/** Validates the fetched feed; returns null when it is unusable (the run then does nothing). */
export function parseFeed(j) {
  if (!j || j.version !== 1 || !Array.isArray(j.advisories) || !Array.isArray(j.regions)) return null;
  const regions = j.regions.filter((r) => r && /^[a-z][a-z0-9-]{1,23}$/.test(r.id) && Array.isArray(r.words))
    .map((r) => ({ id: r.id, name: String(r.name || r.id).slice(0, 60), words: r.words.map((w) => String(w).toLowerCase()).filter(Boolean) }));
  const advisories = j.advisories.filter((a) => a && typeof a.id === 'string' && ISO.test(a.until) && /^https:\/\//.test(a.sourceUrl || '') && a.title)
    .map((a) => ({ ...a, regions: Array.isArray(a.regions) ? a.regions.filter((x) => regions.some((r) => r.id === x)) : [] }));
  return { checked: ISO.test(j.checked || '') ? j.checked : null, regions, advisories };
}

/** Advisories in force on `today` (from <= today <= until) that touch Uttarakhand. */
export function activeAdvisories(feed, today) {
  return (feed ? feed.advisories : []).filter((a) => a.regions.length && (!a.from || a.from <= today) && today <= a.until);
}

export function regionsForText(feed, text) {
  const t = String(text || '').toLowerCase();
  if (!t) return [];
  return feed.regions.filter((r) => r.words.some((w) => t.includes(w))).map((r) => r.id);
}

/** A booking we should warn: live status, stay not over, check-in within the look-ahead window. */
export function bookingInWindow(b, today) {
  if (!b || !LIVE_STATUSES.includes(b.status)) return false;
  if (!ISO.test(String(b.checkIn || '').slice(0, 10))) return false;
  const ci = String(b.checkIn).slice(0, 10);
  const co = ISO.test(String(b.checkOut || '').slice(0, 10)) ? String(b.checkOut).slice(0, 10) : ci;
  return co >= today && ci <= addDays(today, LOOKAHEAD_DAYS);
}

/** Advisories that touch this booking's region and overlap its dates (closures also matter after their date). */
export function advisoriesForBooking(feed, active, b) {
  const regions = regionsForText(feed, [b.zone, b.area, b.property].filter(Boolean).join(' | '));
  if (!regions.length) return [];
  const ci = String(b.checkIn).slice(0, 10);
  const co = ISO.test(String(b.checkOut || '').slice(0, 10)) ? String(b.checkOut).slice(0, 10) : ci;
  return active.filter((a) => a.regions.some((r) => regions.includes(r))
    && (!a.from || a.from <= co) && (a.until >= ci || a.kind === 'closure'));
}

/** Advisories in the regions a follower picked. */
export function advisoriesForFollower(active, regionIds) {
  const ids = Array.isArray(regionIds) ? regionIds.map(String) : [];
  return active.filter((a) => a.regions.some((r) => ids.includes(r)));
}

/* ------------------------------------------------------------ wording */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function first(name) { const n = String(name || '').trim().split(/\s+/)[0] || ''; return /^[\p{L}'.-]{1,30}$/u.test(n) ? n : 'there'; }
const STATUS_URL = 'https://www.roamwise.co.in/uttarakhand-road-status/';
function shell(title, bodyHtml, footHtml) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#1c2321"><h2 style="margin:0 0 12px;color:#0f5c4c">${esc(title)}</h2>${bodyHtml}<p style="color:#777;font-size:12px;margin-top:22px">${footHtml || ''}RoamWise · roamwise.co.in · an independent planner, not a government body. Reply to this email or write to support@roamwise.co.in</p></div>`;
}
function advHtml(list) {
  return list.map((a) => `<div style="border-left:4px solid #c46a12;padding:8px 12px;margin:10px 0;background:#fff8ee"><b>${esc((a.official ? '' : 'Confirm locally: ') + a.title)}</b><br>${esc(a.detail || '')}<br><span style="font-size:12px;color:#666">Until ${esc(a.until)} · Source: <a href="${esc(a.sourceUrl)}">${esc(a.source || 'source')}</a></span></div>`).join('');
}
function advText(list) { return list.map((a) => `- ${a.official ? '' : 'Confirm locally: '}${a.title}\n  ${a.detail || ''}\n  Until ${a.until}. Source: ${a.sourceUrl}`).join('\n'); }
function pushBody(list) {
  const head = list[0].title;
  return (list.length > 1 ? `${head} (+${list.length - 1} more)` : head).slice(0, 180);
}
function cap(list) { return list.slice(0, MAX_PER_MESSAGE); }

export function buildGuestAlert(b, list) {
  const l = cap(list);
  const place = b.property || 'your stay';
  const push = { title: `Travel update for ${place}`.slice(0, 80), body: pushBody(l), url: STATUS_URL };
  const subject = `Travel update before your stay at ${place}`;
  const intro = `<p>Hi ${esc(first(b.guestName))},</p><p>Something has changed near your stay at <b>${esc(place)}</b> (${esc(String(b.checkIn).slice(0, 10))}). Please read before you travel:</p>`;
  const html = shell('Travel update for your trip', intro + advHtml(l) + `<p><a href="${STATUS_URL}">See every current advisory</a>. Questions about arrival? Reply and we will help.</p>`);
  const text = `Hi ${first(b.guestName)},\n\nSomething has changed near your stay at ${place} (${String(b.checkIn).slice(0, 10)}):\n\n${advText(l)}\n\nAll current advisories: ${STATUS_URL}\n\nRoamWise - support@roamwise.co.in`;
  return { push, email: { subject, html, text } };
}

export function buildFollowerAlert(regionNames, list) {
  const l = cap(list);
  const where = regionNames.slice(0, 3).join(', ') || 'Uttarakhand';
  const push = { title: `Uttarakhand update: ${where}`.slice(0, 80), body: pushBody(l), url: STATUS_URL };
  const subject = `New travel advisory: ${where}`;
  const stop = 'You get this because you follow these regions on RoamWise. <a href="https://www.roamwise.co.in/?unfollow=1">Stop these alerts</a>. ';
  const html = shell('New travel advisory', `<p>For the regions you follow (${esc(where)}):</p>` + advHtml(l) + `<p><a href="${STATUS_URL}">Road &amp; safety status</a></p>`, stop);
  const text = `New travel advisory for ${where}:\n\n${advText(l)}\n\nAll current advisories: ${STATUS_URL}\nStop these alerts: https://www.roamwise.co.in/?unfollow=1`;
  return { push, email: { subject, html, text } };
}

export function buildPartnerAlert(propertyName, guests, list) {
  const l = cap(list);
  const n = guests.length;
  const push = { title: `Advisory near ${propertyName}`.slice(0, 80), body: `${pushBody(l)}. ${n} RoamWise guest booking${n === 1 ? '' : 's'} in the next ${LOOKAHEAD_DAYS} days.`.slice(0, 200), url: STATUS_URL };
  const rows = guests.slice(0, 10).map((g) => `<li>${esc(g.ref || g.id)} · check-in ${esc(String(g.checkIn).slice(0, 10))} · ${esc(g.guests || '?')} guest(s)</li>`).join('');
  const html = shell(`Advisory near ${propertyName}`, `<p>We have told these RoamWise guests about it. You may want to message them about arrival times or alternatives:</p><ul>${rows}</ul>` + advHtml(l));
  const text = `Advisory near ${propertyName}:\n\n${advText(l)}\n\nRoamWise guests arriving in the next ${LOOKAHEAD_DAYS} days: ${guests.slice(0, 10).map((g) => `${g.ref || g.id} (${String(g.checkIn).slice(0, 10)})`).join(', ')}.\nWe have told them; you may want to message them too.\n\nRoamWise - support@roamwise.co.in`;
  return { push, email: { subject: `Advisory near ${propertyName}: ${n} guest booking${n === 1 ? '' : 's'} affected`, html, text } };
}

/** Daily team digest. `stats` comes from the run; `feed`/`today` decide what needs refreshing. */
export function buildTeamDigest(feed, today, stats) {
  const active = activeAdvisories(feed, today);
  const expiring = active.filter((a) => a.until <= addDays(today, 2));
  const fresh = active.filter((a) => a.from && a.from >= addDays(today, -1));
  const stale = !feed.checked || feed.checked < addDays(today, -7);
  const lines = [
    `Active Uttarakhand advisories: ${active.length} (new since yesterday: ${fresh.length})`,
    `Expiring within 2 days, refresh or let lapse: ${expiring.length ? expiring.map((a) => a.id + ' (' + a.until + ')').join(', ') : 'none'}`,
    `Live stay bookings in an affected area: ${stats.affectedBookings || 0}`,
    `Told today: ${stats.guests || 0} guest(s), ${stats.followers || 0} follower(s), ${stats.partners || 0} partner(s); emails deferred by the daily cap: ${stats.deferred || 0}`,
    `New guest stay requests waiting for a reply: ${stats.newLeads == null ? 'n/a' : stats.newLeads}`,
    stale ? `List last reviewed ${feed.checked || 'never'}: run the weekly news scout and update conditions-data.js.` : `List last reviewed ${feed.checked}.`,
  ];
  const push = { title: `RoamWise daily: ${active.length} advisories, ${stats.affectedBookings || 0} stays affected`.slice(0, 80), body: (expiring.length ? `${expiring.length} expiring soon. ` : '') + (stale ? 'Advisory list needs a review.' : 'Advisory list is current.'), url: 'https://www.roamwise.co.in/admin/' };
  const html = shell(`Daily travel-safety digest · ${today}`, '<ul>' + lines.map((l) => `<li>${esc(l)}</li>`).join('') + '</ul>' + (active.length ? '<p><b>Live advisories</b></p>' + advHtml(active) : ''));
  const text = `Daily travel-safety digest ${today}\n\n` + lines.map((l) => '- ' + l).join('\n') + (active.length ? `\n\nLive advisories:\n${advText(active)}` : '');
  return { push, email: { subject: `RoamWise travel-safety digest ${today}`, html, text }, lines, stale };
}
