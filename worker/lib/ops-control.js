/* RoamWise automation control plane: zero external dependencies.
 * KV is an operational cache/lease store, NOT authoritative for payments or
 * financial state. Firestore is the durable ledger. Never persist secrets.
 * This module does not execute jobs or AI requests by itself.
 */
export const DEFAULT_RULES = Object.freeze({
  minIntervalSeconds: 3600,
  maxRunsPerDay: 24,
  maxAiNeuronsPerDay: 8000, // conservative cap below free daily allowance
  maxEstimatedPaidCostPaisePerDay: 0,
  // Only enumerated, read-only actions may run without a dated authorization.
  // Unknown actions are rejected rather than treated as harmless by default.
  allowedReadActions: Object.freeze(['draft','read','triage','classify','summarize','analyze','report','preview','health-check','cache-refresh','data-validation','metrics-read']),
  approvalRequired: Object.freeze(['payment','refund','payout','supplier-order','publish','email-send','staff-permission','credential-change','deployment','customer-data-export']),
});
const safeName = (s) => typeof s === 'string' && /^[a-z][a-z0-9-]{1,63}$/.test(s);
const number = (x, fallback) => Number.isFinite(x) && x >= 0 ? x : fallback;
const dayOf = (now) => new Date(now).toISOString().slice(0, 10);
const parseJSON = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
export function validateJob(job, rules = DEFAULT_RULES) {
  if (!job || !safeName(job.id)) return { ok:false, reason:'invalid_job_id' };
  if (!safeName(job.domain)) return { ok:false, reason:'invalid_domain' };
  if (!Number.isFinite(job.intervalSeconds) || job.intervalSeconds < rules.minIntervalSeconds) return { ok:false, reason:'interval_too_short' };
  if (!Array.isArray(job.actions) || job.actions.length === 0) return { ok:false, reason:'missing_actions' };
  if (job.actions.some(x => !safeName(x))) return { ok:false, reason:'invalid_action' };
  if (job.actions.some(x => !rules.allowedReadActions.includes(x) && !rules.approvalRequired.includes(x))) return { ok:false, reason:'action_not_allowlisted' };
  if (!Number.isFinite(job.estimatedAiNeurons) || job.estimatedAiNeurons < 0 ||
      !Number.isFinite(job.estimatedPaidCostPaise) || job.estimatedPaidCostPaise < 0)
    return { ok:false, reason:'invalid_cost_estimate' };
  return { ok:true };
}
export function needsApproval(job, rules = DEFAULT_RULES) {
  return job.actions.some(x => !rules.allowedReadActions.includes(x));
}
export function decideRun({job, state, budget, now = Date.now(), rules = DEFAULT_RULES, approval = null}) {
  const valid = validateJob(job, rules);
  if (!valid.ok) return {allow:false, reason:valid.reason};
  if (job.enabled !== true) return {allow:false, reason:'disabled'};
  const today = dayOf(now);
  const current = state && state.day === today ? state : { day:today, dailyRuns:0, lastRunAt:0 };
  if (Number(current.dailyRuns) >= rules.maxRunsPerDay) return {allow:false, reason:'daily_run_cap'};
  if (Number(current.lastRunAt) > 0 && now - Number(current.lastRunAt) < job.intervalSeconds * 1000) return {allow:false, reason:'interval'};
  const aiUsed = number(budget?.aiNeuronsUsedToday, 0);
  const estimatedAi = number(job.estimatedAiNeurons, 0);
  if (aiUsed + estimatedAi > rules.maxAiNeuronsPerDay) return {allow:false, reason:'ai_budget'};
  const paid = number(budget?.estimatedPaidCostPaiseToday, 0);
  const estimate = number(job.estimatedPaidCostPaise, 0);
  if (paid + estimate > rules.maxEstimatedPaidCostPaisePerDay) return {allow:false, reason:'paid_budget'};
  if (needsApproval(job, rules) && !(approval && approval.jobId === job.id && approval.day === today && approval.authorized === true)) return {allow:false, reason:'approval_required'};
  return {allow:true, reason:'eligible', day:today};
}
export function sanitizedAudit(job, outcome, now = Date.now()) {
  return { jobId:job.id, domain:job.domain, outcome:String(outcome).slice(0,80), at:new Date(now).toISOString() };
}
/* KV operations are best effort; callers must enforce atomicity in Firestore
 * for all money-moving or irreversible operations, not via KV put/get.
 * KV is eventually consistent and cannot provide an exclusive distributed lock.
 */
export async function readOpsState(kv, jobId) {
  if (!kv || !safeName(jobId)) throw new Error('ops_kv_or_job_invalid');
  return parseJSON(await kv.get('ops:state:' + jobId));
}
export async function writeOpsState(kv, jobId, state) {
  if (!kv || !safeName(jobId)) throw new Error('ops_kv_or_job_invalid');
  await kv.put('ops:state:' + jobId, JSON.stringify({
    day:String(state.day), dailyRuns:Number(state.dailyRuns)||0,
    lastRunAt:Number(state.lastRunAt)||0
  }));
}
export async function writeOpsAudit(kv, record) {
  if (!kv || !safeName(record.jobId)) throw new Error('ops_kv_or_job_invalid');
  const suffix = crypto.randomUUID();
  await kv.put('ops:audit:' + record.jobId + ':' + record.at + ':' + suffix, JSON.stringify(record), {expirationTtl:60*60*24*30});
}
