/* ============================================================================
   worker/handlers/stay-lead.js — guest stay requests that need a human reply
   ============================================================================
   POST /stay/lead   public, rate limited. Body: see lib/stay-lead-core.js.
   Stores one document in Firestore `stayLeads/{id}` through the service
   account (clients can never write it; firestore.rules lets only an admin read
   and mark it contacted). The founder is told through the daily chat digest
   and "/admin requests". Leads older than 12 months are deleted by the daily
   cron (purgeOldStayLeads).

   NO PAYMENT CODE HERE. This records a request and who to reply to. */
import { json } from '../lib/http.js';
import { overLimit, clientIp } from '../lib/rate-limit.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { createDocIfAbsent, listDocs, deleteDocument } from '../lib/firestore-rest.js';
import { parseLead, leadId, isExpired, CONSENT_VERSION } from '../lib/stay-lead-core.js';

const COLLECTION = 'stayLeads';
const MAX_BODY = 6000;

function realDeps(env) {
  let sa = null, tokenP = null;
  const project = () => (sa = sa || parseServiceAccount(env)).project_id;
  const token = () => (tokenP = tokenP || getServiceAccountAccessToken(env));
  return {
    configured: () => !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
    async create(id, values) { return createDocIfAbsent(env, await token(), project(), COLLECTION, id, values); },
    async list() { return listDocs(env, await token(), project(), COLLECTION, 3000); },
    async remove(id) { return deleteDocument(env, await token(), project(), `${COLLECTION}/${id}`); },
  };
}

export async function handleStayLead(request, env, deps, cacheImpl) {
  deps = deps || realDeps(env);
  if (request.method !== 'POST') return json({ error: 'not found' }, 404);
  if (!deps.configured()) return json({ error: 'not_configured', message: 'Stay requests are not switched on yet.' }, 501);
  if (await overLimit('stay-lead-ip', clientIp(request), 5, 600, cacheImpl)) return json({ error: 'slow_down', message: 'Too many requests. Try again in a few minutes.' }, 429);
  if (await overLimit('stay-lead-day', 'all', 400, 86400, cacheImpl)) return json({ error: 'busy', message: 'We are receiving many requests. Please message the property on WhatsApp directly.' }, 429);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'too_large' }, 413);
  let body;
  try { body = JSON.parse(text); } catch (_) { return json({ error: 'bad_json' }, 400); }
  const p = parseLead(body);
  if (p.error) return json({ error: p.error }, 400);
  const now = new Date().toISOString();
  const id = leadId();
  const created = await deps.create(id, {
    id, ...p.value, status: 'new', waConsent: true, consentVersion: CONSENT_VERSION, createdAt: now,
  });
  if (!created) return json({ error: 'retry' }, 409);
  return json({ ok: true, id });
}

/* Daily cron: delete leads past the retention period. Returns how many were removed. */
export async function purgeOldStayLeads(env, deps, now) {
  deps = deps || realDeps(env);
  if (!deps.configured()) return 0;
  const rows = await deps.list();
  let n = 0;
  for (const r of rows) {
    if (isExpired(r.createdAt, now)) { await deps.remove(r.id); n++; }
  }
  return n;
}
