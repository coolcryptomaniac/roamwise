#!/usr/bin/env node
/* tools/backup/export.mjs — weekly backup of RoamWise data (run by .github/workflows/weekly-backup.yml)
   Writes NDJSON files into an output folder; the workflow then encrypts the folder with
   BACKUP_PASSPHRASE before anything is uploaded. Nothing readable ever leaves the runner.

   - Firestore: every top-level collection, plus the subcollections listed in SUBCOLLECTIONS.
     Reads are capped (MAX_READS) to stay inside the free 50k/day.
   - Cloudflare KV (RW_KV): only keys WITHOUT an expiry, i.e. the durable records
     (wallets, orders, credit, group pots). Temporary keys expire by themselves.
   Prints counts only, never document contents.
   Usage: node tools/backup/export.mjs <outDir> */
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getServiceAccountAccessToken, parseServiceAccount } from '../../worker/lib/service-account.js';

const FS = 'https://firestore.googleapis.com/v1';
export const SUBCOLLECTIONS = { tripchats: ['msgs', 'members'], users: ['trips', 'private'], partners: ['private'] };
export const MAX_READS = 40000;
const KV_NAMESPACE = 'be31e0935be843219cea1edf2203877b';

async function j(url, opts, tries = 3){
  for (let i = 0; ; i++) {
    const r = await fetch(url, opts);
    if (r.ok) return r.json();
    if (i >= tries - 1 || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${url.split('?')[0].replace(/\/projects\/[^/]+/, '/projects/…')}`);
    await new Promise((s) => setTimeout(s, 1000 * (i + 1)));
  }
}

export async function exportFirestore(out, { token, project, fetchJson = j, log = console.log }){
  const base = `${FS}/projects/${project}/databases/(default)/documents`;
  const auth = { headers: { authorization: 'Bearer ' + token } };
  let reads = 0; const counts = {};
  const ids = (await fetchJson(`${base}:listCollectionIds`, { method: 'POST', ...auth, headers: { ...auth.headers, 'content-type': 'application/json' }, body: JSON.stringify({ pageSize: 300 }) })).collectionIds || [];
  async function dump(parentPath, coll, file){
    let pageToken = '', names = [];
    do {
      if (reads >= MAX_READS) { log(`read cap reached at ${coll}`); return names; }
      const p = await fetchJson(`${base}${parentPath ? '/' + parentPath : ''}/${coll}?pageSize=300${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`, auth);
      const docs = p.documents || [];
      reads += Math.max(1, docs.length);
      if (docs.length) await appendFile(file, docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
      names = names.concat(docs.map((d) => d.name.split('/documents/')[1]));
      counts[coll] = (counts[coll] || 0) + docs.length;
      pageToken = p.nextPageToken || '';
    } while (pageToken);
    return names;
  }
  for (const coll of ids) {
    const file = join(out, `firestore-${coll}.ndjson`);
    await writeFile(file, '');
    const docs = await dump('', coll, file);
    for (const sub of SUBCOLLECTIONS[coll] || []) {
      const subFile = join(out, `firestore-${coll}-${sub}.ndjson`);
      await writeFile(subFile, '');
      for (const path of docs) { if (reads >= MAX_READS) break; await dump(path, sub, subFile); }
    }
  }
  return { reads, counts };
}

export async function exportKv(out, { accountId, apiToken, fetchJson = j, fetchText }){
  const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${KV_NAMESPACE}`;
  const auth = { headers: { authorization: 'Bearer ' + apiToken } };
  const getText = fetchText || (async (url) => { const r = await fetch(url, auth); if (!r.ok) throw new Error('kv get ' + r.status); return r.text(); });
  const file = join(out, 'kv-durable.ndjson');
  await writeFile(file, '');
  let cursor = '', kept = 0, skipped = 0;
  do {
    const p = await fetchJson(`${base}/keys?limit=1000${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`, auth);
    for (const k of p.result || []) {
      if (k.expiration) { skipped++; continue; }
      const value = await getText(`${base}/values/${encodeURIComponent(k.name)}`);
      await appendFile(file, JSON.stringify({ key: k.name, value }) + '\n');
      kept++;
    }
    cursor = (p.result_info && p.result_info.cursor) || '';
  } while (cursor);
  return { kept, skipped };
}

async function main(){
  const out = process.argv[2];
  if (!out) throw new Error('usage: export.mjs <outDir>');
  await mkdir(out, { recursive: true });
  const env = { FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT };
  const project = parseServiceAccount(env).project_id;
  const fs = await exportFirestore(out, { token: await getServiceAccountAccessToken(env), project });
  console.log(`Firestore: ${fs.reads} reads`, JSON.stringify(fs.counts));
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
    const kv = await exportKv(out, { accountId: process.env.CLOUDFLARE_ACCOUNT_ID, apiToken: process.env.CLOUDFLARE_API_TOKEN });
    console.log(`KV: ${kv.kept} durable keys saved, ${kv.skipped} expiring keys skipped`);
  } else console.log('KV: skipped (Cloudflare secrets missing)');
  await writeFile(join(out, 'MANIFEST.json'), JSON.stringify({ at: new Date().toISOString(), project, counts: fs.counts }, null, 2));
}

if (import.meta.url === 'file://' + process.argv[1]) main().catch((e) => { console.error('Backup failed:', e.message); process.exit(1); });
