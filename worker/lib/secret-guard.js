/* Server-side secret readiness checks. Never return secret values or lengths.
 * Use encrypted Cloudflare Worker Secrets / Secrets Store, not KV, Git or vars.
 * Missing credentials fail closed; do not ask users to paste secrets into chat. */
export const SECRET_GROUPS=Object.freeze({
 payments:['CASHFREE_APP_ID','CASHFREE_SECRET_KEY'],
 supplier:['QIKINK_CLIENT_ID','QIKINK_CLIENT_SECRET'],
});
export function secretReadiness(env,group){
 const keys=SECRET_GROUPS[group];
 if(!keys)throw new Error('unknown_secret_group');
 const missing=keys.filter(k=>typeof env?.[k]!=='string'||!env[k].trim());
 return {ready:missing.length===0,missing};
}
export function redactSensitive(text){
 return String(text??'')
  .replace(/(Bearer\s+)[^\s,;]+/gi,'$1[REDACTED]')
  .replace(/((?:api[_-]?key|client[_-]?secret|password|authorization|token)\s*[:=]\s*["']?)[^\s"',;}]+/gi,'$1[REDACTED]');
}
