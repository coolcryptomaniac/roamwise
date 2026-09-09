/* Opt-in, stateless B2B adapter. Server credentials only; no browser integration.
 * Tenant, policy and destination derive from provisioned secrets, never input.
 * No AI calls, KV writes, booking, approval or payment execution. */
import '../../business/core.js';

const core = globalThis.RWBusinessCore;
const encoder = new TextEncoder();
const MAX_BODY = 131072;
function reply(value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...extra
  } });
}
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
async function body(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw { status: 415, code: 'json_required' };
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw { status: 413, code: 'body_too_large' };
  if (!request.body) throw { status: 400, code: 'report_required' };
  const reader = request.body.getReader();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const chunks = []; let size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY) throw { status: 413, code: 'body_too_large' };
          chunks.push(value);
        }
        const bytes = new Uint8Array(size); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
        catch (_) { throw { status: 400, code: 'invalid_json' }; }
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => reject({ status: 408, code: 'body_timeout' }), 5000); })
    ]);
  } finally { clearTimeout(timer); reader.cancel().catch(() => {}); }
}
function tenantConfig(env) {
  const tenants = JSON.parse(env.BUSINESS_TENANTS_JSON || 'null');
  if (!Array.isArray(tenants) || !tenants.length || tenants.length > 25) throw new Error('Invalid tenant configuration');
  const ids = new Set(), hashes = new Set();
  for (const t of tenants) {
    if (!t || !/^[a-z0-9_-]{1,64}$/.test(t.id) || ids.has(t.id) || typeof t.enabled !== 'boolean') throw new Error('Invalid tenant');
    ids.add(t.id);
    if (!Array.isArray(t.keyHashes) || !t.keyHashes.length || t.keyHashes.length > 2) throw new Error('Invalid keys');
    for (const h of t.keyHashes) {
      if (typeof h !== 'string' || !/^[a-f0-9]{64}$/.test(h) || hashes.has(h)) throw new Error('Invalid key hash');
      hashes.add(h);
    }
    if (!Number.isFinite(Date.parse(t.expiresAt)) || !/^[a-zA-Z0-9_.-]{1,64}$/.test(t.policyVersion)) throw new Error('Invalid tenant policy version or expiry');
    if (!Array.isArray(t.scopes) || t.scopes.some(s => !['reconcile', 'export'].includes(s))) throw new Error('Invalid scopes');
    core.policy(t.policy);
  }
  return tenants;
}
function destination(tenant) {
  // Endpoint is an administrator-provisioned secret, never a request parameter.
  const u = new URL(tenant.webhookUrl);
  if (u.protocol !== 'https:' || u.username || u.password || u.hash || u.port ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) || /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(u.hostname)) throw new Error('Invalid webhook endpoint');
  if (typeof tenant.webhookSecret !== 'string' || tenant.webhookSecret.length < 32 || tenant.webhookSecret.length > 256) throw new Error('Invalid webhook secret');
  return u.href;
}
async function deliver(tenant, result, requestId) {
  let target;
  try { target = destination(tenant); } catch (_) { return reply({ error: 'export_not_configured', requestId }, 503); }
  // Stable across retries; the receiver MUST persist/deduplicate this event ID.
  const eventId = 'rwbe_' + await hash(JSON.stringify([tenant.id, tenant.policyVersion, result.report]));
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = JSON.stringify({ schemaVersion: 1, id: eventId, type: 'expense_report.exported', tenantId: tenant.id,
    policyVersion: tenant.policyVersion, exportedAt: new Date().toISOString(), reconciliation: result });
  const signingKey = await crypto.subtle.importKey('raw', encoder.encode(tenant.webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', signingKey, encoder.encode(timestamp + '.' + payload));
  const hex = Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(target, { method: 'POST', redirect: 'manual', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-RoamWise-Event-Id': eventId, 'X-RoamWise-Timestamp': timestamp, 'X-RoamWise-Signature': 'v1=' + hex }, body: payload });
    if (response.body) response.body.cancel().catch(() => {});
    if (!response.ok) return reply({ error: 'receiver_rejected', eventId, requestId, retry: 'Check receiver status before retrying the same report.' }, 502);
    return reply({ status: 'receiver_accepted', eventId, requestId, notice: 'The receiver accepted this export. ERP posting and payment are not confirmed.' });
  } catch (_) {
    return reply({ error: 'delivery_unknown', eventId, requestId, retry: 'The receiver may have processed this report. Check by event ID before retrying.' }, 502);
  } finally { clearTimeout(timer); }
}
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
  let result;
  try {
    if (!input || !input.report || !input.report.policy || input.report.policy.baseCurrency !== tenant.policy.baseCurrency) throw new Error('Report currency must match the company policy.');
    result = core.evaluate(input.report, tenant.policy);
  } catch (e) { return reply({ error: 'invalid_report', message: e.message, requestId }, 400); }
  if (operation === 'reconcile') return reply({ tenantId: tenant.id, policyVersion: tenant.policyVersion, requestId, reconciliation: result });
  if (input.reviewed !== true) return reply({ error: 'review_confirmation_required', requestId }, 400);
  if (result.status !== 'ready_for_review') return reply({ error: 'report_needs_attention', requestId, reconciliation: result }, 422);
  return deliver(tenant, result, requestId);
}
