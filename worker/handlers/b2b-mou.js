/* ============================================================================
   worker/handlers/b2b-mou.js — POST /b2b/mou-signed
   ============================================================================
   Called by partner/mou/mou.js the moment a property signs an MOU link that the
   staff B2B desk prepared (?deal=ID&k=TOKEN). It writes the signature onto
   b2bDeals/{deal} through the service account, so the desk shows "MOU signed"
   without anyone forwarding a link. Staff can never write these fields
   themselves (firestore.rules), which is what makes the record trustworthy.

   Trust: the caller must present the deal's 128-bit mouToken. The token only
   ever travels inside the signing link sent to that property. The signing
   time is the Worker's clock, never the browser's.

   Idempotent: a deal already signed is left exactly as it is.
   NO PAYMENT CODE HERE. Named exports only (see worker/lib/http.js). */
import { json } from '../lib/http.js';
import { overLimit, clientIp } from '../lib/rate-limit.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, updateDoc } from '../lib/firestore-rest.js';

const MAX_BODY = 2000;
const SIGNABLE = ['lead', 'pitched', 'mou_sent'];

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

/* Length-independent comparison so a wrong token cannot be guessed byte by byte. */
export function sameToken(a, b) {
  a = String(a || ''); b = String(b || '');
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0 && a.length >= 32;
}

export function parseSignature(body) {
  const b = body || {};
  const deal = String(b.deal || '');
  const k = String(b.k || '');
  const name = clip(b.name, 80);
  const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(deal)) return { error: 'bad_deal' };
  if (!/^[a-f0-9]{32,64}$/.test(k)) return { error: 'bad_key' };
  if (name.length < 3) return { error: 'bad_name' };
  const desig = ['Owner', 'Manager', 'Authorised by the owner'].includes(b.desig) ? b.desig : 'Owner';
  const clientAt = !isNaN(new Date(b.clientAt)) ? new Date(b.clientAt).toISOString() : '';
  return { value: { deal, k, name, desig, phone: /^[6-9]\d{9}$/.test(phone) ? phone : '', clientAt } };
}

function realDeps(env) {
  let sa = null, tokenP = null;
  const project = () => (sa = sa || parseServiceAccount(env)).project_id;
  const token = () => (tokenP = tokenP || getServiceAccountAccessToken(env));
  return {
    configured: () => !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
    async get(id) { return getDoc(env, await token(), project(), `b2bDeals/${id}`); },
    async patch(id, values) { return updateDoc(env, await token(), project(), `b2bDeals/${id}`, values); },
  };
}

export async function handleMouSigned(request, env, deps, cacheImpl, now) {
  deps = deps || realDeps(env);
  if (request.method !== 'POST') return json({ error: 'not found' }, 404);
  if (!deps.configured()) return json({ error: 'not_configured' }, 501);
  if (await overLimit('b2b-mou-ip', clientIp(request), 8, 600, cacheImpl)) return json({ error: 'slow_down' }, 429);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'too_large' }, 413);
  let body;
  try { body = JSON.parse(text); } catch (_) { return json({ error: 'bad_json' }, 400); }
  const p = parseSignature(body);
  if (p.error) return json({ error: p.error }, 400);
  const v = p.value;
  const deal = await deps.get(v.deal);
  /* Unknown deal and wrong key answer the same way, so deal ids cannot be probed. */
  if (!deal || !sameToken(deal.mouToken, v.k)) return json({ error: 'not_found' }, 404);
  if (deal.mouSignedAt) return json({ ok: true, already: true, at: deal.mouSignedAt });
  if (!SIGNABLE.includes(deal.stage)) return json({ error: 'closed' }, 409);
  const at = (now ? now() : new Date()).toISOString();
  await deps.patch(v.deal, {
    stage: 'mou_signed', mouSignedAt: at, mouSignedBy: v.name, mouSignedDesig: v.desig,
    mouSignerPhone: v.phone, mouSignedClientAt: v.clientAt, updatedAt: at,
  });
  return json({ ok: true, at });
}
