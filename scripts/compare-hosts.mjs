#!/usr/bin/env node
// Compare two hosts of the same static site before switching a domain.
// Usage: node scripts/compare-hosts.mjs https://roamwise.co.in https://roamwise-pages.pages.dev [--all]
// Checks every URL in sitemap.xml plus key app files (all tracked html/js/css with --all).
// For each path: final status and SHA-256 of the body after redirects. Exit 1 on any difference.
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const [a, b] = process.argv.slice(2, 4).map((u) => (u || '').replace(/\/+$/, ''));
if (!/^https?:\/\//.test(a || '') || !/^https?:\/\//.test(b || '')) {
  console.error('Usage: node scripts/compare-hosts.mjs <hostA> <hostB> [--all]');
  process.exit(2);
}
const all = process.argv.includes('--all');
const core = ['/', '/index.html', '/app.js', '/app.css', '/sw.js', '/rw-config.js', '/manifest.webmanifest',
  '/robots.txt', '/sitemap.xml', '/ads.txt', '/404-check-missing-page'];
const paths = new Set(core);

try {
  const xml = await (await fetch(a + '/sitemap.xml')).text();
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try { paths.add(new URL(m[1]).pathname); } catch { /* skip */ }
  }
} catch { /* sitemap optional */ }
if (all) {
  for (const f of execSync('git ls-files', { encoding: 'utf8' }).split('\n')) {
    if (/\.(html|js|css|json|webmanifest|svg)$/.test(f)) paths.add('/' + f);
  }
}

async function probe(base, p) {
  try {
    const r = await fetch(base + p, { redirect: 'follow' });
    const body = Buffer.from(await r.arrayBuffer());
    return { status: r.status, hash: createHash('sha256').update(body).digest('hex').slice(0, 12), size: body.length };
  } catch (e) {
    return { status: 'ERR', hash: String(e.message).slice(0, 30), size: 0 };
  }
}

const list = [...paths];
const diffs = [];
let next = 0;
async function worker() {
  while (next < list.length) {
    const p = list[next++];
    const [x, y] = await Promise.all([probe(a, p), probe(b, p)]);
    if (x.status !== y.status || x.hash !== y.hash) diffs.push({ p, x, y });
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

console.log(`Checked ${list.length} paths: ${a}  vs  ${b}`);
if (!diffs.length) { console.log('IDENTICAL'); process.exit(0); }
for (const d of diffs.sort((m, n) => m.p.localeCompare(n.p))) {
  console.log(`DIFF ${d.p}\n   A ${d.x.status} ${d.x.hash} ${d.x.size}B\n   B ${d.y.status} ${d.y.hash} ${d.y.size}B`);
}
console.log(`${diffs.length} difference(s)`);
process.exit(1);
