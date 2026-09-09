/* One bounded, signed delivery attempt to an administrator-provisioned endpoint. */
import { reply } from './http.js';
import { hash } from './crypto.js';
const encoder = new TextEncoder();
function destination(tenant) {
  // Endpoint is an administrator-provisioned secret, never a request parameter.
  const u = new URL(tenant.webhookUrl);
  if (u.protocol !== 'https:' || u.username || u.password || u.hash || u.port ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) || /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(u.hostname)) throw new Error('Invalid webhook endpoint');
  if (typeof tenant.webhookSecret !== 'string' || tenant.webhookSecret.length < 32 || tenant.webhookSecret.length > 256) throw new Error('Invalid webhook secret');
  return u.href;
}
export async function deliver(tenant, result, requestId) {
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
