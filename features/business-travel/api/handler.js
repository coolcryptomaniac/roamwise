/* Optional business API orchestration. Authentication before parsing or external effects. */
import '../core/validation.js';
import '../core/money.js';
import '../core/reports.js';
import { reply, body } from './http.js';
import { hash, equal } from './crypto.js';
import { tenantConfig } from './tenants.js';
import { deliver } from './webhooks.js';
import { summarize } from './summary.js';
const core = globalThis.RWBusinessCore;
export async function handleBusiness(request, env, operation) {
  const requestId = crypto.randomUUID();
  if (!['reconcile', 'export'].includes(operation)) return reply({ error: 'not_found', requestId }, 404);
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed', requestId }, 405, { Allow: 'POST' });
  if (env.BUSINESS_ENABLED !== 'true') return reply({ error: 'business_api_disabled', requestId }, 503);
  // Fail closed: a configured rate-limiter binding is a launch prerequisite.
  if (!env.BUSINESS_RATE_LIMITER || typeof env.BUSINESS_RATE_LIMITER.limit !== 'function') return reply({ error: 'business_api_not_configured', requestId }, 503);
  if (request.headers.has('Origin')) return reply({ error: 'server_to_server_only', requestId }, 403);
  let tenants;
  try { tenants = tenantConfig(env); } catch (_) { return reply({ error: 'business_api_not_configured', requestId }, 503); }
  const match = (request.headers.get('Authorization') || '').match(/^Bearer (rw_biz_[A-Za-z0-9_-]{43,128})$/);
  if (!match) return reply({ error: 'unauthorized', requestId }, 401);
  const digest = await hash(match[1]);
  const tenant = tenants.find(t => t.keyHashes.some(h => equal(h, digest)));
  if (!tenant || !tenant.enabled || Date.parse(tenant.expiresAt) <= Date.now()) return reply({ error: 'unauthorized', requestId }, 401);
  if (!tenant.scopes.includes(operation)) return reply({ error: 'insufficient_scope', requestId }, 403);
  try {
    const rate = await env.BUSINESS_RATE_LIMITER.limit({ key: 'business:' + tenant.id });
    if (!rate || !rate.success) return reply({ error: 'rate_limited', requestId }, 429, { 'Retry-After': '60' });
  } catch (_) { return reply({ error: 'rate_limit_unavailable', requestId }, 503); }
  let input;
  try { input = await body(request); }
  catch (e) { return reply({ error: e.code || 'invalid_request', requestId }, e.status || 400); }
  const responseMode = input?.responseMode === undefined ? 'full' : input.responseMode;
  if (!['full', 'summary'].includes(responseMode)) return reply({ error: 'invalid_response_mode', requestId }, 400);
  let result;
  try {
    if (!input || !input.report || !input.report.policy || input.report.policy.baseCurrency !== tenant.policy.baseCurrency) throw new Error('Report currency must match the company policy.');
    result = core.evaluate(input.report, tenant.policy);
  } catch (e) { return reply({ error: 'invalid_report', message: e.message, requestId }, 400); }
  if (operation === 'reconcile') return reply({ tenantId: tenant.id, policyVersion: tenant.policyVersion, requestId, responseMode,
    ...(responseMode === 'summary' ? { summary: summarize(result) } : { reconciliation: result }) });
  if (input.reviewed !== true) return reply({ error: 'review_confirmation_required', requestId }, 400);
  if (result.status !== 'ready_for_review') return reply({ error: 'report_needs_attention', requestId, reconciliation: result }, 422);
  return deliver(tenant, result, requestId);
}
