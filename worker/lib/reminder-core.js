/* ============================================================================
   worker/lib/reminder-core.js — pure logic for the inactivity email reminders.
   ============================================================================
   No network, no Firestore: everything here is testable in Node.

   Policy (deliberately conservative — a spam complaint costs more than a
   missed nudge):
     · a user is "inactive" when users/{uid}.lastActive is older than 7 days
     · only users with a valid email, who have not opted out
     · at most one reminder per 14 days, at most 3 in a row — the counter
       resets as soon as the user is active again
     · every email carries a signed one-click unsubscribe link
   Content is plain facts + links; no invented discounts. Offers come from the
   founder-editable Firestore doc config/reminderContent.
   ========================================================================= */

export const DEFAULTS = Object.freeze({
  inactiveDays: 7,
  cooldownDays: 14,
  maxInARow: 3,
  maxPerRun: 100,
});

const DAY = 86400000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function toMs(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

export function validEmail(e) {
  const s = String(e || '').trim();
  return s.length <= 254 && EMAIL_RE.test(s);
}

/** Why a user is (not) eligible. Returns { ok, reason }. */
export function checkUser(user, now, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  if (!user || !user.id) return { ok: false, reason: 'no_id' };
  if (!validEmail(user.email) || String(user.email).trim() === user.id) return { ok: false, reason: 'no_email' };
  if (user.emailOptOut === true) return { ok: false, reason: 'opted_out' };
  const last = toMs(user.lastActive);
  if (!last) return { ok: false, reason: 'no_activity_record' };
  if (now - last < o.inactiveDays * DAY) return { ok: false, reason: 'recently_active' };
  const sent = toMs(user.reminderLastSentAt);
  /* Active again after our last email? Start the count over. */
  const count = sent && last > sent ? 0 : Number(user.reminderCount || 0);
  if (sent && now - sent < o.cooldownDays * DAY) return { ok: false, reason: 'cooldown' };
  if (count >= o.maxInARow) return { ok: false, reason: 'max_reached' };
  return { ok: true, reason: 'eligible', count };
}

export function selectRecipients(users, now, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const picked = [];
  const skipped = {};
  for (const u of users || []) {
    const r = checkUser(u, now, o);
    if (r.ok) picked.push({ user: u, count: r.count });
    else skipped[r.reason] = (skipped[r.reason] || 0) + 1;
  }
  /* Longest-inactive first, then cap the run. */
  picked.sort((a, b) => toMs(a.user.lastActive) - toMs(b.user.lastActive));
  return { picked: picked.slice(0, o.maxPerRun), skipped, eligible: picked.length };
}

/* ---- signed unsubscribe tokens (HMAC-SHA256, Web Crypto) ---- */
function hex(buf) { return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg)));
}
export async function signUnsub(secret, uid) { return (await hmac(secret, 'unsub:' + uid)).slice(0, 32); }
export async function verifyUnsub(secret, uid, token) {
  if (!secret || !uid || !token) return false;
  const want = await signUnsub(secret, uid);
  if (want.length !== String(token).length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ String(token).charCodeAt(i);
  return diff === 0;
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function safeUrl(u, fallback) { return /^https:\/\/[^\s"<>]+$/.test(String(u || '')) ? u : fallback; }

export const DEFAULT_CONTENT = Object.freeze({
  headline: 'Your next Himalayan stay is waiting',
  intro: 'It has been a little while. Here is what is new on RoamWise.',
  items: [
    { title: 'Verified stays in Almora and Manali', text: 'Homestays signed with RoamWise. Enquire on WhatsApp and confirm the final price directly with the host.', url: 'https://roamwise.co.in/partner/' },
    { title: 'Plan your trip with Ailon Tusk', text: 'Tell Tusk where and when. Get a day-by-day plan, costs and a stay quote in one chat.', url: 'https://roamwise.co.in/' },
  ],
  cta: { label: 'Open RoamWise', url: 'https://roamwise.co.in/' },
});

export function mergeContent(doc) {
  const d = doc && typeof doc === 'object' ? doc : {};
  const items = Array.isArray(d.items) ? d.items.filter((x) => x && x.title).slice(0, 5) : [];
  return {
    headline: String(d.headline || DEFAULT_CONTENT.headline).slice(0, 120),
    intro: String(d.intro || DEFAULT_CONTENT.intro).slice(0, 300),
    items: (items.length ? items : DEFAULT_CONTENT.items).map((x) => ({
      title: String(x.title).slice(0, 100), text: String(x.text || '').slice(0, 300), url: safeUrl(x.url, 'https://roamwise.co.in/'),
    })),
    cta: { label: String((d.cta && d.cta.label) || DEFAULT_CONTENT.cta.label).slice(0, 40), url: safeUrl(d.cta && d.cta.url, DEFAULT_CONTENT.cta.url) },
  };
}

export function firstName(user) {
  const n = String(user.name || user.displayName || '').trim().split(/\s+/)[0] || '';
  return /^[\p{L}'.-]{1,30}$/u.test(n) ? n : '';
}

export function cleanDestination(v) {
  const d = String(v || '').trim().slice(0, 60);
  return /^[\p{L}\p{N} ,.'()-]{2,60}$/u.test(d) ? d : '';
}

export function buildEmail(user, content, unsubUrl) {
  const dest = cleanDestination(user.lastDestination);
  const c = mergeContent(content);
  if (dest) {
    /* Personalised by the user's own last search; admin-edited headline is only used for generic mails. */
    c.headline = `Still waiting for your next trip to ${dest}?`;
    c.intro = `You looked at ${dest} on RoamWise. Pick up where you left off, we have stays, costs and a day-by-day plan ready.`;
    c.cta = { label: `Plan ${dest}`, url: `https://roamwise.co.in/?destination=${encodeURIComponent(dest)}` };
  } else if (!(content && content.headline)) {
    c.headline = 'Planning a trip anytime soon?';
  }
  const hi = firstName(user) ? `Hi ${firstName(user)},` : 'Hi,';
  const items = c.items.map((i) => `<tr><td style="padding:12px 0;border-top:1px solid #eee"><a href="${esc(i.url)}" style="color:#b3261e;font-weight:700;text-decoration:none">${esc(i.title)}</a><br><span style="color:#444">${esc(i.text)}</span></td></tr>`).join('');
  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ef;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table width="100%" style="max-width:560px;background:#fff;border-radius:14px;padding:28px"><tr><td><div style="font-size:13px;letter-spacing:.14em;color:#a8761f;font-weight:700">ROAMWISE</div><h1 style="font-size:24px;margin:10px 0">${esc(c.headline)}</h1><p style="color:#333">${esc(hi)}<br>${esc(c.intro)}</p><table width="100%" cellpadding="0" cellspacing="0">${items}</table><p style="margin:22px 0"><a href="${esc(c.cta.url)}" style="background:#b3261e;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">${esc(c.cta.label)}</a></p><p style="font-size:12px;color:#777;border-top:1px solid #eee;padding-top:14px">You are receiving this because you have a RoamWise account and have not visited for a while${dest ? ' (we used your last searched destination)' : ''}. <a href="${esc(unsubUrl)}" style="color:#777">Unsubscribe</a> any time. Questions: support@roamwise.co.in. RoamWise, Almora, Uttarakhand, India.</p></td></tr></table></td></tr></table></body></html>`;
  const text = [hi, c.intro, '', ...c.items.map((i) => `- ${i.title}: ${i.text} ${i.url}`), '', `${c.cta.label}: ${c.cta.url}`, '', `Unsubscribe: ${unsubUrl}`, 'Questions: support@roamwise.co.in'].join('\n');
  return { subject: c.headline, html, text };
}
