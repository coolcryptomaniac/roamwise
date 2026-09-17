/* Server-owned allowance for RoamWise-funded AI. The browser never chooses
   its quota or model. AI_USAGE is a Cloudflare KV binding; deployments that
   omit it fail closed instead of creating an unmetered API bill. */
export const MANAGED_AI_LIMITS = Object.freeze({
  free: 0,
  plus: 10,
  pro: 40,
  elite: 100,
  founder: 12,
});

function cleanTier(v){
  const id = String(v || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(MANAGED_AI_LIMITS, id) ? id : '';
}

export function managedAITier(userDoc){
  const user = userDoc || {};
  if(user.pro !== true) return 'free';
  const proUntil = Number(user.proUntil || 0);
  if(proUntil && proUntil <= Date.now()) return 'free';
  const method = String(user.proMethod || user.proSource || user.planId || '').toLowerCase();
  const amount = Number(user.proAmount);
  // Legacy Founder purchases were stored as manual-paid + ₹100, while NMIMS
  // and partner activations can predate the tier field. Resolve these durable
  // promises before trusting a stale generic tier value.
  if(method.includes('founder') || method.includes('nmims') || method.includes('partner') || amount === 100){
    return 'founder';
  }
  const explicit = cleanTier(user.tier || user.proTier || user.planTier);
  if(explicit) return explicit;
  // Unknown legacy Pro records receive the modest Founder pool by default.
  // This preserves a useful hosted path without silently creating an
  // unbounded or Elite-sized liability.
  return 'founder';
}

export function managedAILimit(userDoc){
  return MANAGED_AI_LIMITS[managedAITier(userDoc)];
}

export function usageKey(uid, date){
  const month = (date || new Date()).toISOString().slice(0, 7);
  return `managed-ai:${month}:${String(uid || '').slice(0, 128)}`;
}

export async function reserveManagedAI(env, uid, limit, date){
  if(!env.AI_USAGE || typeof env.AI_USAGE.get !== 'function' || typeof env.AI_USAGE.put !== 'function'){
    return { ok:false, reason:'meter_not_configured', used:0, limit };
  }
  if(limit <= 0) return { ok:false, reason:'allowance_exhausted', used:0, limit };
  const key = usageKey(uid, date);
  const used = Math.max(0, parseInt(await env.AI_USAGE.get(key) || '0', 10) || 0);
  if(used >= limit) return { ok:false, reason:'allowance_exhausted', used, limit };
  const next = used + 1;
  await env.AI_USAGE.put(key, String(next), { expirationTtl: 2678400 });
  return { ok:true, used:next, limit, remaining:Math.max(0, limit-next) };
}

export function managedAIRequest(body, env){
  const maxPrompt = Math.max(500, Math.min(6000, Number(env.AI_MAX_PROMPT_CHARS)||4000));
  const maxTokens = Math.max(100, Math.min(1500, Number(env.AI_MAX_OUTPUT_TOKENS)||700));
  const model = String(env.GROQ_MODEL || '').trim();
  return {
    model,
    prompt:String(body && body.prompt || '').slice(0, maxPrompt),
    maxTokens,
  };
}
