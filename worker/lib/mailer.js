/* ============================================================================
   worker/lib/mailer.js — one place that sends email from the Worker.
   ============================================================================
   Preferred: the founder's own Gmail, through a tiny Google Apps Script web app
   (tools/gmail-relay/Code.gs). Free; Google enforces the daily limit.
     secrets: GMAIL_RELAY_URL, GMAIL_RELAY_SECRET
   Fallback: AgentMail if AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID are set;\n   then Resend if RESEND_API_KEY is set. Existing Gmail preference is preserved.
   Never throws. Returns { ok:true } or { ok:false, reason } where reason is
   'cap' (daily limit reached - try again tomorrow), 'not_configured' or 'error'. */
const DEFAULT_FROM = 'RoamWise <hello@roamwise.co.in>';

export function mailerKind(env) {
  if (env && env.GMAIL_RELAY_URL && env.GMAIL_RELAY_SECRET) return 'gmail';
  if (env && env.AGENTMAIL_API_KEY && env.AGENTMAIL_INBOX_ID) return 'agentmail';
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
    if (kind === 'agentmail') {
      // Explicitly configured sender inbox; no auto-creation, client-provided sender or key exposure.
      const inboxId = String(env.AGENTMAIL_INBOX_ID);
      const res = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.AGENTMAIL_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          to: [to], subject, text: text || '', ...(html ? { html } : {}),
          reply_to: 'support@roamwise.co.in',
          ...(unsubUrl ? { headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
        }),
      });
      return res.ok ? { ok: true } : { ok: false, reason: res.status === 429 ? 'cap' : 'error' };
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
