/* ============================================================================
   worker/handlers/tusk-learned.js — shared "learned answers" for Ailon Tusk
   ============================================================================
   GET  /tusk/learned?k=<key>        -> {hit:true,text} | {hit:false}
   POST /tusk/learned {k, text}      -> store ONE plain-text answer (first writer wins)
   POST /tusk/learned/drop {k}       -> forget it (a 👎 on a shared answer)

   What is stored: a short hash of the normalised question (never the question)
   and the answer as PLAIN TEXT. No HTML is ever stored or served, so a bad
   contribution cannot run script. Nothing identifies a user: no account, no IP,
   no device id. Entries expire after 45 days and are re-learned on demand.
   Free-tier guard rails: per-IP limits, a global 300-writes-per-day cap
   (KV free = 1000 writes/day) and a 10-minute edge cache on reads.

   Storage is isolated behind learnedStore() so KV can later be swapped for D1
   or R2 by changing this one function; every record carries a schema `v`.
   Named exports only (see lib/http.js). */
import { json } from './../lib/http.js';
import { overLimit, clientIp } from './../lib/rate-limit.js';

const PREFIX = 'rw-tusk-learned:';
const TTL = 45 * 24 * 3600;
const SCHEMA = 1;
const KEY_RE = /^a[0-9a-z]{3,24}$/;

export function learnedStore(env){
  const kv = env && env.AI_USAGE;
  if(!kv || typeof kv.get !== 'function' || typeof kv.put !== 'function') return null;
  return {
    async get(k){ const r = await kv.get(PREFIX + k, 'json'); return r && r.v === SCHEMA ? r : null; },
    async put(k, rec){ await kv.put(PREFIX + k, JSON.stringify(rec), { expirationTtl: TTL }); },
    async del(k){ await kv.delete(PREFIX + k); }
  };
}

/* Plain text only; null when the answer looks personal, promotional or unsafe to share. */
export function cleanLearned(text){
  let t = String(text == null ? '' : text)
    .replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
  if(t.length < 40 || t.length > 3000) return null;
  if(/https?:\/\/|www\.|javascript:|data:text|[\w.+-]+@[\w-]+\.[\w.-]+|\d[\d\s-]{8,}\d/i.test(t)) return null;
  return t;
}

export async function handleTuskLearnedGet(request, env, cacheImpl){
  const store = learnedStore(env);
  if(!store) return json({ hit: false });
  const k = new URL(request.url).searchParams.get('k') || '';
  if(!KEY_RE.test(k)) return json({ hit: false }, 400);
  if(await overLimit('tusk-learned-get', clientIp(request), 120, 600, cacheImpl)) return json({ hit: false }, 429);
  try{
    const rec = await store.get(k);
    if(!rec) return json({ hit: false });
    const res = json({ hit: true, text: rec.text });
    res.headers.set('Cache-Control', 'public, max-age=600');
    return res;
  }catch(_){ return json({ hit: false }); }
}

export async function handleTuskLearnedPost(request, env, cacheImpl){
  const store = learnedStore(env);
  if(!store) return json({ ok: false, error: 'not_configured' }, 503);
  let body;
  try{ body = await request.json(); }catch(_){ return json({ ok: false, error: 'bad_json' }, 400); }
  const k = String(body && body.k || '');
  const text = cleanLearned(body && body.text);
  if(!KEY_RE.test(k) || !text) return json({ ok: false, error: 'rejected' }, 400);
  if(await overLimit('tusk-learned-ip', clientIp(request), 6, 600, cacheImpl)) return json({ ok: false, error: 'slow_down' }, 429);
  if(await overLimit('tusk-learned-day', 'all', 300, 86400, cacheImpl)) return json({ ok: true, stored: false });
  try{
    if(await store.get(k)) return json({ ok: true, stored: false });   /* first writer wins: no overwrite */
    await store.put(k, { v: SCHEMA, text, t: Date.now() });
    return json({ ok: true, stored: true });
  }catch(_){ return json({ ok: false, error: 'store_failed' }, 500); }
}

export async function handleTuskLearnedDrop(request, env, cacheImpl){
  const store = learnedStore(env);
  if(!store) return json({ ok: false }, 503);
  let body;
  try{ body = await request.json(); }catch(_){ return json({ ok: false }, 400); }
  const k = String(body && body.k || '');
  if(!KEY_RE.test(k)) return json({ ok: false }, 400);
  if(await overLimit('tusk-learned-drop', clientIp(request), 10, 600, cacheImpl)) return json({ ok: false }, 429);
  try{ await store.del(k); }catch(_){ /* already gone */ }
  return json({ ok: true });
}
