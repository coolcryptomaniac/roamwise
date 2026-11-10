/* Weekly/monthly read-only maintenance snapshots. No AI spend, payment mutation or email.
 * KV is a best-effort report cache, not a financial ledger.
 */
export const AUDIT_CRONS=Object.freeze({weekly:'15 4 * * 1',monthly:'45 4 1 * *'});
export function auditKind(cron){return Object.entries(AUDIT_CRONS).find(([,v])=>v===cron)?.[0]||null;}
export function auditSnapshot(env,kind,instant=new Date()){
 if(!['weekly','monthly'].includes(kind))throw new Error('unknown_audit_kind');
 const checks={
  cashfreeCredentialsPresent:!!(env.CASHFREE_APP_ID&&env.CASHFREE_SECRET_KEY),
  firebaseCredentialsPresent:!!env.FIREBASE_SERVICE_ACCOUNT_JSON,
  supplierCredentialsPresent:!!(env.QIKINK_CLIENT_ID&&env.QIKINK_CLIENT_SECRET),
  aiProviderConfigured:!!(env.GROQ_API_KEY||env.OPENAI_API_KEY||env.ANTHROPIC_API_KEY),
  managedAiEnabled:env.MANAGED_AI_ENABLED==='true',
  aiAutopilotEnabled:env.AI_AUTOPILOT_ENABLED==='true'
 };
 return {schema:1,kind,generatedAt:instant.toISOString(),checks,issues:[
  ...(!checks.firebaseCredentialsPresent?['firebase_backend_unconfigured']:[]),
  ...(!checks.cashfreeCredentialsPresent?['cashfree_credentials_missing']:[]),
  'cashfree_settlement_bank_unverified',
  'wallet_atomic_migration_unverified',
  'ai_expense_limit_not_enforced_across_providers'
 ],readOnly:true,source:'worker_configuration_presence_only'};
}
export async function runScheduledAudit(env,cron,instant=new Date()){
 const kind=auditKind(cron);
 if(!kind)return {status:'skipped'};
 if(env.RW_AUDIT_ENABLED!=='true')return {status:'disabled',kind};
 const report=auditSnapshot(env,kind,instant);
 if(!env.RW_KV?.put)return {status:'storage_unavailable',kind};
 const period=kind==='weekly'?instant.toISOString().slice(0,10):instant.toISOString().slice(0,7);
 await env.RW_KV.put('rw-audit:'+kind+':latest',JSON.stringify(report),{expirationTtl:60*60*24*100});
 await env.RW_KV.put('rw-audit:'+kind+':'+period,JSON.stringify(report),{expirationTtl:60*60*24*100});
 return {status:'stored',kind,issues:report.issues.length};
}
