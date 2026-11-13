/* ============================================================================
   worker/handlers/data-cleanup.js — weekly cleanup of short-lived data
   ============================================================================
   Runs from the daily cron on Sundays. Deletes ONLY data that is meant to be
   temporary, so Firestore and KV never bloat or start costing money:

     beacons/{uid}                      expireAt older than 1 day   (2-hour beacons)
     tripchats/{room}/presence/{uid}    at (ms) older than 2 days   (online dots)
     tripchats/{room}/msgs/{id}         at older than CHAT_RETENTION_DAYS (180)
     tuskMisses/{slug}                  lastAsked older than 120 days

   It NEVER touches money or legal records (wallets, orders, invoices, ledger,
   bookings, staff logs). Cloudflare KV needs no sweep: every temporary key is
   written with expirationTtl; wallet and credit keys are kept on purpose.

   Safety: at most MAX_DELETES deletes per run (free tier is 20k/day), at most
   MAX_ROOMS chat rooms scanned, and DATA_CLEANUP_ENABLED must be "true" or the
   run only counts (dry run). A summary is kept in KV as cleanup:last.
   Named exports only. */
import { parseServiceAccount, getServiceAccountAccessToken } from '../lib/service-account.js';

const BASE = 'https://firestore.googleapis.com/v1';
export const MAX_DELETES = 2000;
export const MAX_ROOMS = 300;
const DAY = 86400000;

export function cleanupPlan(env = {}, now = Date.now()){
  const chatDays = Math.max(30, Math.min(730, Number(env.CHAT_RETENTION_DAYS) || 180));
  return [
    { name: 'beacons', collection: 'beacons', field: 'expireAt', type: 'timestamp', before: now - 1 * DAY },
    { name: 'presence', collection: 'presence', parent: 'tripchats', field: 'at', type: 'integer', before: now - 2 * DAY },
    { name: 'chat messages', collection: 'msgs', parent: 'tripchats', field: 'at', type: 'timestamp', before: now - chatDays * DAY },
    { name: 'tusk misses', collection: 'tuskMisses', field: 'lastAsked', type: 'timestamp', before: now - 120 * DAY },
  ];
}

function filterValue(type, ms){
  return type === 'integer' ? { integerValue: String(Math.floor(ms)) } : { timestampValue: new Date(ms).toISOString() };
}

/* Default Firestore REST deps; tests inject fakes. */
export function firestoreDeps(env){
  let tok = null, project = null;
  const auth = async () => { if(!tok){ project = parseServiceAccount(env).project_id; tok = await getServiceAccountAccessToken(env); } return tok; };
  const root = () => `projects/${project}/databases/(default)/documents`;
  return {
    async listIds(collection, max){
      await auth();
      const r = await fetch(`${BASE}/${root()}/${collection}?pageSize=${max}&mask.fieldPaths=__name__`, { headers: { authorization: 'Bearer ' + tok } });
      if(!r.ok) throw new Error('list ' + collection + ' ' + r.status);
      const j = await r.json();
      return (j.documents || []).map(d => String(d.name).split('/').pop());
    },
    async oldDocNames(parentPath, step, limit){
      await auth();
      const parent = parentPath ? `${root()}/${parentPath}` : root();
      const r = await fetch(`${BASE}/${parent}:runQuery`, { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' },
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: step.collection }], select: { fields: [{ fieldPath: '__name__' }] },
          where: { fieldFilter: { field: { fieldPath: step.field }, op: 'LESS_THAN', value: filterValue(step.type, step.before) } }, limit } }) });
      if(!r.ok) throw new Error('query ' + step.collection + ' ' + r.status);
      const rows = await r.json();
      return (Array.isArray(rows) ? rows : []).filter(x => x.document).map(x => x.document.name);
    },
    async deleteNames(names){
      await auth();
      for(let i = 0; i < names.length; i += 400){
        const r = await fetch(`${BASE}/projects/${project}/databases/(default)/documents:commit`, { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' },
          body: JSON.stringify({ writes: names.slice(i, i + 400).map(n => ({ delete: n })) }) });
        if(!r.ok) throw new Error('commit ' + r.status);
      }
    },
  };
}

export async function runDataCleanup(env, { deps, now = Date.now(), force = false } = {}){
  const isSunday = new Date(now).getUTCDay() === 0;
  if(!force && !isSunday) return { skipped: 'not sunday' };
  if(!env.FIREBASE_SERVICE_ACCOUNT_JSON && !deps) return { skipped: 'no service account' };
  const live = String(env.DATA_CLEANUP_ENABLED || '').toLowerCase() === 'true';
  const d = deps || firestoreDeps(env);
  const summary = { at: new Date(now).toISOString(), live, steps: {}, errors: [] };
  let budget = MAX_DELETES;
  let rooms = null;
  for(const step of cleanupPlan(env, now)){
    let found = [];
    try{
      if(step.parent){
        if(!rooms) rooms = await d.listIds(step.parent, MAX_ROOMS);
        for(const room of rooms){
          if(found.length >= budget) break;
          found = found.concat(await d.oldDocNames(`${step.parent}/${room}`, step, Math.min(300, budget - found.length)));
        }
      }else{
        found = await d.oldDocNames('', step, Math.min(1000, budget));
      }
      found = found.slice(0, budget);
      if(live && found.length) await d.deleteNames(found);
      budget -= found.length;
      summary.steps[step.name] = found.length;
    }catch(e){ summary.errors.push(step.name + ': ' + String(e && e.message || e).slice(0, 120)); }
    if(budget <= 0) break;
  }
  try{ if(env.RW_KV) await env.RW_KV.put('cleanup:last', JSON.stringify(summary), { expirationTtl: 60 * DAY / 1000 }); }catch(e){}
  return summary;
}
