/* ============================================================================
   worker/handlers/bot.js — Telegram + WhatsApp Cloud API bot webhooks
   ============================================================================
   Routes (dispatched from worker/worker.js):

     POST /bot/telegram     Telegram webhook (header X-Telegram-Bot-Api-Secret-Token)
     GET  /bot/whatsapp     Meta webhook verification handshake
     POST /bot/whatsapp     WhatsApp Cloud API webhook (header X-Hub-Signature-256)

   Each channel is OFF until its secrets exist (501), so merging this changes
   nothing in production. NO PAYMENT CODE: the bot only lists stays, registers
   an enquiry code in the stay ledger and relays messages.

   Secrets (wrangler secret put ...):
     Telegram:  TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET
     WhatsApp:  WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET
     Optional:  BOT_HASH_SALT (extra salt for the chat hash)
   ========================================================================= */
import { json } from '../lib/http.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, updateDoc, createDocIfAbsent } from '../lib/firestore-rest.js';
import { sha256Hex, validCode } from '../lib/stay-ledger-core.js';
import { HELP, parseCommand, staysReply, splitReply, parseEnquiry, newCode, enquiryReply, usableStays, SITE } from '../lib/bot-core.js';

const LEDGER = 'stayLedger';
const MAX_BODY = 64 * 1024;
const hits = new Map();
function limited(key, max) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

/* constant-time string compare */
export function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function hmacSha256Hex(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function realDeps(env) {
  let sa = null, tokenP = null;
  const project = () => (sa = sa || parseServiceAccount(env)).project_id;
  const token = () => (tokenP = tokenP || getServiceAccountAccessToken(env));
  return {
    configured: () => !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
    async partners() { const d = await getDoc(env, await token(), project(), 'config/partners'); return (d && d.list) || []; },
    async getCode(code) { return getDoc(env, await token(), project(), `${LEDGER}/${code}`); },
    async createCode(code, values) { return createDocIfAbsent(env, await token(), project(), LEDGER, code, values); },
    async updateCode(code, values) { return updateDoc(env, await token(), project(), `${LEDGER}/${code}`, values); },
    fetch: (url, init) => fetch(url, init),
  };
}

/* One message in, one reply out. Channel-agnostic. */
export async function answer(env, deps, channel, chatId, text) {
  if (limited(channel + ':' + chatId, 20)) return 'You are sending messages very fast. Please wait a minute.';
  const { cmd, args } = parseCommand(text);
  const salt = env.BOT_HASH_SALT || '';
  if (cmd === 'start' || cmd === 'help' || cmd === 'hi' || cmd === 'hello' || !cmd) return HELP;
  if (cmd === 'split') return splitReply(args);
  if (cmd === 'stays') return staysReply(await deps.partners(), args.join(' '));
  if (cmd === 'enquire') {
    const p = parseEnquiry(args);
    if (p.error) return p.error;
    const partner = usableStays(await deps.partners()).find((x) => x.id === p.value.ref);
    if (!partner) return 'That ref is not a verified, bookable stay. Send /stays <city> to see current refs.';
    let code = '';
    for (let i = 0; i < 5 && !code; i++) {
      const c = newCode();
      const chatHash = await sha256Hex(['bot', channel, chatId, c, salt].join(':'));
      const made = await deps.createCode(c, { code: c, partnerId: partner.id, secretHash: chatHash, status: 'enquired', guestStayed: '', createdAt: new Date().toISOString(), source: 'bot', channel });
      if (made) code = c;
    }
    if (!code) return 'Could not prepare that enquiry. Please try again in a minute.';
    return enquiryReply(partner, p.value, code);
  }
  if (cmd === 'stayed') {
    const code = String(args[0] || '').toUpperCase(), ans = String(args[1] || '').toLowerCase();
    if (!validCode(code) || (ans !== 'yes' && ans !== 'no')) return 'Use: /stayed <code> yes   or   /stayed <code> no';
    const doc = await deps.getCode(code);
    const want = await sha256Hex(['bot', channel, chatId, code, salt].join(':'));
    /* Same answer for "unknown code" and "someone else's code". */
    if (!doc || doc.source !== 'bot' || !safeEqual(doc.secretHash, want)) return 'I could not find that code in this chat.';
    await deps.updateCode(code, { guestStayed: ans, guestConfirmedAt: new Date().toISOString() });
    return ans === 'yes' ? 'Thank you. Recorded that you stayed. Hope it was a good trip!' : 'Thank you. Recorded that you did not stay.';
  }
  return 'I did not understand that.\n\n' + HELP;
}

async function readRaw(request) {
  const text = await request.text();
  return text.length > MAX_BODY ? null : text;
}

export async function handleBot(request, env, path, deps) {
  deps = deps || realDeps(env);
  const method = request.method;

  if (path === 'bot/telegram' && method === 'POST') {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'not_configured' }, 501);
    if (!safeEqual(request.headers.get('x-telegram-bot-api-secret-token'), env.TELEGRAM_WEBHOOK_SECRET)) return json({ error: 'forbidden' }, 403);
    if (!deps.configured()) return json({ error: 'not_configured' }, 501);
    const raw = await readRaw(request);
    let upd = null; try { upd = raw && JSON.parse(raw); } catch (_) { /* ignore */ }
    const m = upd && upd.message;
    if (!m || !m.chat || typeof m.text !== 'string') return json({ ok: true });
    let reply;
    try { reply = await answer(env, deps, 'telegram', String(m.chat.id), m.text); } catch (_) { reply = 'Something went wrong on our side. Please try again shortly.'; }
    await deps.fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: m.chat.id, text: reply, disable_web_page_preview: true }),
    }).catch(() => null);
    return json({ ok: true });
  }

  if (path === 'bot/whatsapp' && method === 'GET') {
    if (!env.WHATSAPP_VERIFY_TOKEN) return json({ error: 'not_configured' }, 501);
    const q = new URL(request.url).searchParams;
    if (q.get('hub.mode') === 'subscribe' && safeEqual(q.get('hub.verify_token'), env.WHATSAPP_VERIFY_TOKEN)) {
      return new Response(String(q.get('hub.challenge') || ''), { status: 200, headers: { 'content-type': 'text/plain' } });
    }
    return json({ error: 'forbidden' }, 403);
  }

  if (path === 'bot/whatsapp' && method === 'POST') {
    if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_APP_SECRET) return json({ error: 'not_configured' }, 501);
    const raw = await readRaw(request);
    if (raw == null) return json({ error: 'too_large' }, 413);
    const sig = String(request.headers.get('x-hub-signature-256') || '').replace(/^sha256=/, '');
    if (!safeEqual(sig, await hmacSha256Hex(env.WHATSAPP_APP_SECRET, raw))) return json({ error: 'forbidden' }, 403);
    if (!deps.configured()) return json({ error: 'not_configured' }, 501);
    let body = null; try { body = JSON.parse(raw); } catch (_) { return json({ ok: true }); }
    const msgs = [];
    ((body && body.entry) || []).forEach((e) => (e.changes || []).forEach((c) => ((c.value && c.value.messages) || []).forEach((x) => {
      if (x && x.type === 'text' && x.text && typeof x.text.body === 'string' && /^\d{6,15}$/.test(String(x.from))) msgs.push({ from: String(x.from), text: x.text.body });
    })));
    for (const x of msgs.slice(0, 5)) {
      let reply;
      try { reply = await answer(env, deps, 'whatsapp', x.from, x.text); } catch (_) { reply = 'Something went wrong on our side. Please try again shortly.'; }
      await deps.fetch('https://graph.facebook.com/v20.0/' + env.WHATSAPP_PHONE_NUMBER_ID + '/messages', {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.WHATSAPP_TOKEN },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: x.from, type: 'text', text: { preview_url: false, body: reply.slice(0, 3800) } }),
      }).catch(() => null);
    }
    return json({ ok: true });
  }
  return json({ error: 'not found' }, 404);
}
