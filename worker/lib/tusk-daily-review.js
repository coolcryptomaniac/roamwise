/* Daily deterministic safety audit, no autonomous code changes, external sends or paid AI. */
export function tuskDailyReview(env){
 const findings=[];
 if(env.MANAGED_AI_ENABLED==='true'&&!env.AI_USAGE)findings.push('managed_ai_meter_missing');
 if(env.CASHFREE_ENV==='live'&&(!env.CASHFREE_APP_ID||!env.CASHFREE_SECRET_KEY))findings.push('live_checkout_credentials_missing');
 if(env.PUBLIC_DISPLAY_CACHE_ENABLED==='true'&&env.PUBLIC_DISPLAY_SYNC_ENABLED!=='true')findings.push('public_cache_sync_disabled_check_staleness');
 if(env.TUSK_AUTONOMOUS_CHANGES==='true')findings.push('autonomous_changes_not_permitted');
 return {version:1,checkedAt:new Date().toISOString(),status:findings.length?'review_needed':'no_flags',findings,changesApplied:0,providerCalls:0};
}
export async function recordTuskDailyReview(env){
 const review=tuskDailyReview(env);
 if(env.RW_KV?.put)await env.RW_KV.put('tusk:review:latest',JSON.stringify(review),{expirationTtl:172800});
 return review;
}
