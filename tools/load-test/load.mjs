#!/usr/bin/env node
// Dependency-free HTTP load test for RoamWise static pages and public Worker endpoints.
//
//   node tools/load-test/load.mjs --url https://roamwise-pages.pages.dev --paths /,/about,/app.js \
//        --concurrency 50 --seconds 30 [--max-error-rate 1] [--p95-ms 800]
//
// Reports requests/s, p50/p95/p99 latency, error rate, status mix and Cloudflare cache hit ratio.
// Exit code 1 if the error rate or p95 limits are exceeded, so it can gate a launch checklist.
//
// SAFETY: aim it at staging (the .pages.dev copy or a staging Worker) first. It refuses more
// than 200 concurrent connections, and it never sends auth tokens or payment/AI routes unless
// you pass them explicitly in --paths. Do NOT load-test /ai or /cashfree on production.
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => {
  if (v.startsWith('--')) a.push([v.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
  return a;
}, []));
const base = String(args.url || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(base)) { console.error('Usage: node tools/load-test/load.mjs --url https://host --paths /,/about --concurrency 50 --seconds 30'); process.exit(2); }
const paths = String(args.paths || '/').split(',').map((p) => (p.startsWith('/') ? p : '/' + p));
const concurrency = Math.min(200, Math.max(1, Number(args.concurrency) || 25));
const seconds = Math.max(1, Number(args.seconds) || 20);
const maxErr = Number(args['max-error-rate'] ?? 1);
const p95Limit = Number(args['p95-ms'] ?? 1500);

const lat = [];
const status = new Map();
let errors = 0, hits = 0, cfSeen = 0, bytes = 0, n = 0;
const stopAt = Date.now() + seconds * 1000;

async function runner(id) {
  while (Date.now() < stopAt) {
    const p = paths[(n++ + id) % paths.length];
    const t0 = performance.now();
    try {
      const r = await fetch(base + p, { redirect: 'follow', headers: { 'user-agent': 'roamwise-loadtest' } });
      const buf = await r.arrayBuffer();
      lat.push(performance.now() - t0);
      bytes += buf.byteLength;
      status.set(r.status, (status.get(r.status) || 0) + 1);
      if (r.status >= 500 || r.status === 429) errors++;
      const cf = r.headers.get('cf-cache-status');
      if (cf) { cfSeen++; if (cf === 'HIT') hits++; }
    } catch (e) {
      lat.push(performance.now() - t0);
      errors++;
      status.set('ERR', (status.get('ERR') || 0) + 1);
    }
  }
}

console.log(`Load test: ${base}  paths=${paths.join(' ')}  concurrency=${concurrency}  ${seconds}s`);
const t0 = Date.now();
await Promise.all(Array.from({ length: concurrency }, (_, i) => runner(i)));
const secs = (Date.now() - t0) / 1000;
lat.sort((a, b) => a - b);
const q = (x) => (lat.length ? lat[Math.min(lat.length - 1, Math.floor(lat.length * x))] : 0);
const errRate = lat.length ? (errors / lat.length) * 100 : 100;
console.log(`requests: ${lat.length}  (${(lat.length / secs).toFixed(1)}/s)  transferred: ${(bytes / 1048576).toFixed(1)} MB`);
console.log(`latency ms  p50=${q(0.5).toFixed(0)}  p95=${q(0.95).toFixed(0)}  p99=${q(0.99).toFixed(0)}  max=${(lat[lat.length - 1] || 0).toFixed(0)}`);
console.log(`status: ${[...status.entries()].map(([k, v]) => `${k}=${v}`).join(' ')}`);
console.log(`error rate (5xx/429/network): ${errRate.toFixed(2)}%`);
console.log(cfSeen ? `Cloudflare cache hit ratio: ${((hits / cfSeen) * 100).toFixed(0)}% (${hits}/${cfSeen})` : 'No cf-cache-status header (not behind Cloudflare, or uncached)');
const fail = errRate > maxErr || q(0.95) > p95Limit;
console.log(fail ? `FAIL (limits: errors <= ${maxErr}%, p95 <= ${p95Limit} ms)` : 'PASS');
process.exit(fail ? 1 : 0);
