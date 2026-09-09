/* Validate server-owned tenant policies; no client-controlled tenant membership. */
import '../core/validation.js';
import '../core/money.js';
import '../core/reports.js';
const core = globalThis.RWBusinessCore;
export function tenantConfig(env) {
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
