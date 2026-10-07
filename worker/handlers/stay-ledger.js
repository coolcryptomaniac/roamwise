/* ============================================================================
   worker/handlers/stay-ledger.js — booking codes, guest stay confirmation,
   admin settlement and the monthly commission statement
   ============================================================================
   Routes (all JSON, dispatched from worker/worker.js):

     POST /stay/enquiry     public   guest's browser registers a new code
     POST /stay/confirm     public   guest says "I stayed" / "I did not"
     POST /stay/settle      admin    mark a stay completed/cancelled/no_show + amount
     GET  /stay/statement   admin    ?month=YYYY-MM  per-property commission statement

   NO PAYMENT CODE HERE. Nothing in this file creates an order, calls a
   gateway, holds or moves money. It records who was introduced to whom and
   what was later reported, so RoamWise can invoice its own fee.

   Storage: Firestore collection `stayLedger/{code}`, written only through the
   service account (which bypasses firestore.rules). The collection has no
   client rule, so browsers can never read or write it directly: deny-by-default.

   Public-route abuse limits: strict input shapes, a create-only write that can
   never overwrite an existing code, a small per-isolate rate limit, and a
   secret that never leaves the guest's browser (only its SHA-256 is stored).
   ========================================================================= */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, updateDoc, createDocIfAbsent, listDocs } from '../lib/firestore-rest.js';
import {
  validCode, validPartnerId, validHash, validMonth, sha256Hex, parseSettle, buildStatement,
  DEFAULT_COMMISSION_PCT, DEFAULT_GST_PCT,
} from '../lib/stay-ledger-core.js';

const COLLECTION = 'stayLedger';
const MAX_BODY = 2048;

/* Tiny in-memory limiter. Per Worker isolate, resets on restart. That is
   enough to blunt casual abuse without writing KV per request (see the
   free-tier note in worker/lib/http.js). */
const hits = new Map();
function limited(request, bucket, max) {
  const ip = request.headers.get('cf-connecting-ip') || 'anon';
  const key = bucket + ':' + ip;
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return { error: 'too_large' };
  try { return { body: JSON.parse(text) }; } catch (_) { return { error: 'bad_json' }; }
}
const bad = (message, status = 400) => json({ error: 'bad_request', message }, status);

/* Real Firestore store. Tests inject an in-memory one. */
function firestoreDeps(env) {
  let sa = null;
  let tokenP = null;
  const project = () => (sa = sa || parseServiceAccount(env)).project_id;
  const token = () => (tokenP = tokenP || getServiceAccountAccessToken(env));
  return {
    configured: () => !!(env.FIREBASE_SERVICE_ACCOUNT_JSON),
    async get(code) { return getDoc(env, await token(), project(), `${COLLECTION}/${code}`); },
    async create(code, values) { return createDocIfAbsent(env, await token(), project(), COLLECTION, code, values); },
    async update(code, values) { return updateDoc(env, await token(), project(), `${COLLECTION}/${code}`, values); },
    async list() { return listDocs(env, await token(), project(), COLLECTION, 3000); },
    async isAdmin(request) {
      const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
      if (!m) return false;
      try {
        const claims = await verifyFirebaseIdToken(m[1], project());
        return !!(await getDoc(env, await token(), project(), `admins/${claims.uid}`));
      } catch (_) { return false; }
    },
  };
}

export async function handleStay(request, env, path, deps) {
  deps = deps || firestoreDeps(env);
  if (!deps.configured()) return json({ error: 'not_configured', message: 'Stay ledger is not configured on this Worker.' }, 501);
  const now = new Date().toISOString();

  try {
    /* ---------- public: guest browser registers a code ---------- */
    if (path === 'stay/enquiry' && request.method === 'POST') {
      if (limited(request, 'enq', 20)) return bad('Too many requests', 429);
      const r = await readBody(request);
      if (r.error) return bad(r.error);
      const b = r.body || {};
      if (!validCode(b.code)) return bad('bad code');
      if (!validPartnerId(b.partnerId)) return bad('bad partnerId');
      if (!validHash(b.secretHash)) return bad('bad secretHash');
      const created = await deps.create(b.code, {
        code: b.code, partnerId: b.partnerId, secretHash: b.secretHash,
        status: 'enquired', guestStayed: '', createdAt: now,
      });
      return json({ ok: true, created });
    }

    /* ---------- public: guest confirms (needs the browser-held secret) ---------- */
    if (path === 'stay/confirm' && request.method === 'POST') {
      if (limited(request, 'cfm', 20)) return bad('Too many requests', 429);
      const r = await readBody(request);
      if (r.error) return bad(r.error);
      const b = r.body || {};
      if (!validCode(b.code)) return bad('bad code');
      if (b.stayed !== 'yes' && b.stayed !== 'no') return bad('stayed must be yes or no');
      if (typeof b.secret !== 'string' || b.secret.length < 8 || b.secret.length > 128) return bad('bad secret');
      const doc = await deps.get(b.code);
      if (!doc) return json({ error: 'not_found' }, 404);
      if ((await sha256Hex(b.secret)) !== doc.secretHash) return json({ error: 'forbidden', message: 'This code was not created on this device.' }, 403);
      await deps.update(b.code, { guestStayed: b.stayed, guestConfirmedAt: now });
      return json({ ok: true });
    }

    /* ---------- admin: settle a stay ---------- */
    if (path === 'stay/settle' && request.method === 'POST') {
      if (!(await deps.isAdmin(request))) return json({ error: 'forbidden', message: 'admin only' }, 403);
      const r = await readBody(request);
      if (r.error) return bad(r.error);
      const p = parseSettle(r.body);
      if (p.error) return bad(p.error);
      const v = p.value;
      let doc = await deps.get(v.code);
      if (!doc) {
        if (!v.partnerId) return bad('unknown code: pass partnerId to record a stay reported without a code');
        await deps.create(v.code, {
          code: v.code, partnerId: v.partnerId, secretHash: '', status: 'enquired',
          guestStayed: '', createdAt: now, source: 'manual',
        });
        doc = { partnerId: v.partnerId };
      }
      const patch = { status: v.status, settledAt: now };
      if (v.amount != null) patch.amount = v.amount;
      patch.commissionPct = v.commissionPct != null ? v.commissionPct : (doc.commissionPct != null ? doc.commissionPct : DEFAULT_COMMISSION_PCT);
      if (v.checkIn) patch.checkIn = v.checkIn;
      if (v.note != null) patch.note = v.note;
      await deps.update(v.code, patch);
      return json({ ok: true });
    }

    /* ---------- admin: monthly statement ---------- */
    if (path === 'stay/statement' && request.method === 'GET') {
      if (!(await deps.isAdmin(request))) return json({ error: 'forbidden', message: 'admin only' }, 403);
      const month = new URL(request.url).searchParams.get('month') || '';
      if (!validMonth(month)) return bad('pass ?month=YYYY-MM');
      const rows = await deps.list();
      const st = buildStatement(rows.map((x) => ({ ...x, code: x.code || x.id })), month, { gstPct: DEFAULT_GST_PCT });
      /* Rows for the review table; secretHash is never returned. */
      st.rows = rows
        .filter((x) => (x.checkIn || x.settledAt || x.createdAt || '').slice(0, 7) === month)
        .map((x) => ({
          code: x.code || x.id, partnerId: x.partnerId, status: x.status, guestStayed: x.guestStayed || '',
          amount: x.amount || 0, commissionPct: x.commissionPct == null ? null : x.commissionPct,
          checkIn: x.checkIn || '', createdAt: x.createdAt || '', settledAt: x.settledAt || '', note: x.note || '',
        }));
      return json(st);
    }
  } catch (e) {
    return json({ error: 'server_error', message: 'Stay ledger request failed.' }, 502);
  }
  return json({ error: 'not found' }, 404);
}
