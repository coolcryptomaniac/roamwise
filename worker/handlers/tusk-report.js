/* ============================================================================
   worker/handlers/tusk-report.js — anonymous "this answer was wrong" reports
   ============================================================================
   POST /tusk/report   body {q, kind, dest}  (public, rate limited)
   GET  /tusk/reports  Authorization: Bearer TUSK_REPORT_TOKEN  (the GitHub bot)

   What is stored: the question text (emails and long digit runs removed,
   300 characters max), the kind of answer shown, and the place name. No
   account id, no IP, no device id. Each report lives 30 days in KV
   (AI_USAGE binding, key prefix rw-tusk-report:) and is only readable with
   the bot token. Writes are bounded by the per-IP limiter plus a global
   300-per-day cap, so a flood cannot burn the free KV write quota.
   Named exports only (see lib/http.js). */
import { json } from './../lib/http.js';
import { overLimit, clientIp, sha256Hex } from './../lib/rate-limit.js';

const PREFIX = 'rw-tusk-report:';
const TTL = 30 * 24 * 3600;
const KINDS = new Set(['event', 'picks', 'state', 'country', 'card', 'text']);

export function cleanReportText(v, max){
  return String(v == null ? '' : v)
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\d[\d\s-]{8,}\d/g, '[number]')
    .replace(/[\u0000-\u001f<>]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, max);
}

function kv(env){
  return env && env.AI_USAGE && typeof env.AI_USAGE.put === 'function' && typeof env.AI_USAGE.list === 'function' ? env.AI_USAGE : null;
}

function safeEqual(a, b){
  a = String(a); b = String(b);
  if(a.length !== b.length) return false;
  let r = 0;
  for(let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function handleTuskReport(request, env, cacheImpl){
  const store = kv(env);
  if(!store) return json({ ok: false, error: 'not_configured' }, 503);
  let body;
  try{ body = await request.json(); }catch(_){ return json({ ok: false, error: 'bad_json' }, 400); }
  const q = cleanReportText(body && body.q, 300);
  if(q.length < 3) return json({ ok: false, error: 'empty' }, 400);
  if(await overLimit('tusk-report-ip', clientIp(request), 10, 600, cacheImpl)) return json({ ok: false, error: 'slow_down' }, 429);
  if(await overLimit('tusk-report-day', 'all', 300, 86400, cacheImpl)) return json({ ok: true, stored: false });
  const kind = KINDS.has(String(body.kind)) ? String(body.kind) : 'text';
  const meta = { q, kind, dest: cleanReportText(body.dest, 60), t: Date.now() };
  const id = (await sha256Hex(q + '|' + kind)).slice(0, 12) + '-' + String(meta.t).slice(-6);
  await store.put(PREFIX + id, '1', { expirationTtl: TTL, metadata: meta });
  return json({ ok: true, stored: true });
}

export async function handleTuskReports(request, env){
  const store = kv(env);
  const token = env && env.TUSK_REPORT_TOKEN;
  if(!store || !token) return json({ error: 'not_configured' }, 503);
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if(!m || !safeEqual(m[1], token)) return json({ error: 'unauthorized' }, 401);
  const out = [];
  let cursor;
  for(let page = 0; page < 3 && out.length < 300; page++){
    const res = await store.list({ prefix: PREFIX, cursor, limit: 100 });
    for(const k of res.keys || []){ if(k.metadata) out.push({ id: k.name.slice(PREFIX.length), ...k.metadata }); }
    if(res.list_complete) break;
    cursor = res.cursor;
  }
  return json({ count: out.length, reports: out });
}
