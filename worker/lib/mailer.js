/* ============================================================================
   worker/lib/mailer.js — one place that sends email from the Worker.
   ============================================================================
   Automated messages prefer AgentMail; Gmail relay is the secondary
   provider when AgentMail is not configured. Explicit manual sends prefer
   Gmail. Existing callers remain automation by default.
   channel 'partner' (partner auto-inform): Brevo's free plan (300/day) first,
   then the Gmail relay. A Brevo quota refusal (402/429) means nothing was
   sent, so that one case falls through to Gmail.
   No retry to a second provider after a send failure (avoids duplicate mail).
   Never throws. Returns { ok:true } or { ok:false, reason } where reason is
   'cap' (daily limit reached - try again tomorrow), 'not_configured' or 'error'. */
const DEFAULT_FROM = 'RoamWise <hello@roamwise.co.in>';

export function mailerKind(env, { channel = 'automation' } = {}) {
  const gmail = !!(env && env.GMAIL_RELAY_URL && env.GMAIL_RELAY_SECRET);
  const agentmail = !!(env && env.AGENTMAIL_API_KEY && env.AGENTMAIL_INBOX_ID);
  if (channel === 'manual') {
    if (gmail) return 'gmail';
    if (agentmail) return 'agentmail';
  } else {
    if (agentmail) return 'agentmail';
    if (gmail) return 'gmail';
  }
  if (env && env.RESEND_API_KEY) return 'resend';
  return null;
}

const brevoReady = (env) => !!(env && env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL);
async function sendBrevo(env, { to, subject, html, text, unsubUrl }) {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Mohit from RoamWise', email: env.BREVO_SENDER_EMAIL }, to: [{ email: to }],
        replyTo: { email: 'support@roamwise.co.in' }, subject, htmlContent: html, textContent: text || '',
        ...(unsubUrl ? { headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
      }),
    });
    return res.ok ? { ok: true, provider: 'brevo' } : { ok: false, reason: (res.status === 402 || res.status === 429) ? 'cap' : 'error' };
  } catch (_) { return { ok: false, reason: 'error' }; }
}

export async function sendMail(env, { to, subject, html, text, unsubUrl, channel = 'automation' }) {
  if (channel === 'partner') {
    if (brevoReady(env)) {
      const r = await sendBrevo(env, { to, subject, html, text, unsubUrl });
      if (r.ok || r.reason !== 'cap') return r;
    }
    if (!(env && env.GMAIL_RELAY_URL && env.GMAIL_RELAY_SECRET)) return { ok: false, reason: brevoReady(env) ? 'cap' : 'not_configured' };
    channel = 'manual'; /* -> Gmail relay */
  }
  const kind = mailerKind(env, { channel });
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
