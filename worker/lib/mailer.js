/* ============================================================================
   worker/lib/mailer.js — one place that sends email from the Worker.
   ============================================================================
   Preferred: the founder's own Gmail, through a tiny Google Apps Script web app
   (tools/gmail-relay/Code.gs). Free; Google enforces the daily limit.
     secrets: GMAIL_RELAY_URL, GMAIL_RELAY_SECRET
   Fallback: Resend, if RESEND_API_KEY is set and no Gmail relay is.
   Never throws. Returns { ok:true } or { ok:false, reason } where reason is
   'cap' (daily limit reached - try again tomorrow), 'not_configured' or 'error'. */
const DEFAULT_FROM = 'RoamWise <hello@roamwise.co.in>';

export function mailerKind(env) {
  if (env && env.GMAIL_RELAY_URL && env.GMAIL_RELAY_SECRET) return 'gmail';
  if (env && env.RESEND_API_KEY) return 'resend';
  return null;
}

export async function sendMail(env, { to, subject, html, text, unsubUrl }) {
  const kind = mailerKind(env);
  if (!kind) return { ok: false, reason: 'not_configured' };
  try {
    if (kind === 'gmail') {
      const res = await fetch(env.GMAIL_RELAY_URL, {
        method: 'POST', redirect: 'follow',
        headers: { 'content-type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ secret: env.GMAIL_RELAY_SECRET, to, subject, html, text, unsubUrl: unsubUrl || '' }),
      });
      const j = await res.json().catch(() => null);
      if (j && j.ok) return { ok: true };
      return { ok: false, reason: j && j.reason === 'cap' ? 'cap' : 'error' };
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.REMINDER_FROM || DEFAULT_FROM, to: [to], reply_to: 'support@roamwise.co.in', subject, html, text,
        ...(unsubUrl ? { headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
      }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: res.status === 429 ? 'cap' : 'error' };
  } catch (_) { return { ok: false, reason: 'error' }; }
}
