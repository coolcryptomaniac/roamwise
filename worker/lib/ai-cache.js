/* Cost savers for the managed /ai route. Both live in the AI_USAGE KV binding
   under their own prefixes; if the binding is missing they quietly do nothing
   and the route behaves as before (metering itself still fails closed).

   1) Tier cache: the user's allowance is cached for a few minutes so each /ai
      call no longer reads users/{uid} from Firestore. An upgrade can take up
      to TIER_TTL_SECONDS to appear; an expiring plan is honoured immediately
      through the stored proUntil.
   2) Answer cache: identical prompts (same locale and model config) reuse a
      stored answer for ANSWER_TTL_SECONDS and do not use up the allowance.
      The allowance must still be available to be served a cached answer, so
      the free tier cannot read from it. */
export const TIER_TTL_SECONDS = 600;
export const ANSWER_TTL_SECONDS = 7 * 24 * 3600;
const MAX_CACHED_CHARS = 20000;

function kv(env){
  return env && env.AI_USAGE && typeof env.AI_USAGE.get === 'function' && typeof env.AI_USAGE.put === 'function' ? env.AI_USAGE : null;
}

export function normalizePrompt(prompt){
  return String(prompt || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

async function sha256Hex(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function answerCacheKey(policy, env){
  const config = [env && env.WORKERS_AI_MODEL || '', env && env.GROQ_MODEL || '', env && env.SARVAM_MODEL || '', policy.maxTokens, String(policy.locale || '').toLowerCase()].join('|');
  return `ai-cache:${await sha256Hex(config + '\n' + normalizePrompt(policy.prompt))}`;
}

export async function getCachedAnswer(env, key){
  const store = kv(env);
  if(!store) return null;
  try{
    const raw = await store.get(key);
    if(!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v.text === 'string' && v.text ? v : null;
  }catch(e){ return null; }
}

export async function putCachedAnswer(env, key, answer){
  const store = kv(env);
  if(!store || !answer || !answer.text || answer.text.length > MAX_CACHED_CHARS) return;
  try{
    await store.put(key, JSON.stringify({ text:answer.text, provider:answer.provider || '', model:answer.model || '' }), { expirationTtl:ANSWER_TTL_SECONDS });
  }catch(e){ /* cache is best-effort */ }
}

export async function getCachedLimit(env, uid, now){
  const store = kv(env);
  if(!store) return null;
  try{
    const raw = await store.get(`ai-tier:${String(uid).slice(0, 128)}`);
    if(!raw) return null;
    const v = JSON.parse(raw);
    if(!v || typeof v.limit !== 'number') return null;
    if(v.until && v.until <= (now || Date.now())) return null;
    return v.limit;
  }catch(e){ return null; }
}

export async function putCachedLimit(env, uid, limit, userDoc){
  const store = kv(env);
  if(!store) return;
  try{
    const until = Number(userDoc && userDoc.proUntil || 0) || 0;
    await store.put(`ai-tier:${String(uid).slice(0, 128)}`, JSON.stringify({ limit, until }), { expirationTtl:TIER_TTL_SECONDS });
  }catch(e){ /* best-effort */ }
}
