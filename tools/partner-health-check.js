#!/usr/bin/env node
/* Partner listing health check. Reads the PUBLIC config/partners list (the same data every visitor loads),
   combines it with the seed in partners-data.js, and reports what a guest would actually see:
   which listings are live, which are hidden and why, and what needs attention.
   Read-only: it never writes anywhere. Phone numbers are masked in the output.
   Usage: node tools/partner-health-check.js [--json] [--site https://roamwise.co.in]            */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const site = (args.includes('--site') ? args[args.indexOf('--site') + 1] : 'https://roamwise.co.in').replace(/\/$/, '');
const API = 'https://firestore.googleapis.com/v1/projects/roamwisepro/databases/(default)/documents/config/';

function decode(x) {
  const k = Object.keys(x)[0], y = x[k];
  if (k === 'mapValue') return Object.fromEntries(Object.entries(y.fields || {}).map(([a, b]) => [a, decode(b)]));
  if (k === 'arrayValue') return (y.values || []).map(decode);
  if (k === 'integerValue' || k === 'doubleValue') return Number(y);
  if (k === 'nullValue') return null;
  return y;
}
async function getDoc(id) {
  const r = await fetch(API + id);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(id + ' returned ' + r.status);
  const d = await r.json();
  return Object.fromEntries(Object.entries(d.fields || {}).map(([a, b]) => [a, decode(b)]));
}
const mask = n => (n ? String(n).slice(0, 4) + 'xxxx' + String(n).slice(-2) : '');

(async () => {
  const ctx = { window: {}, isFinite, Number, URL, console };
  vm.createContext(ctx);
  for (const f of ['partners-data.js', 'js/booking/routes.js', 'js/booking/stay-quote.js'])
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  const seed = ctx.window.RW_PARTNER_SEED || [];
  const cfg = await getDoc('partners');
  const live = ((cfg && cfg.list) || []).filter(Boolean);
  const merged = new Map();
  for (const e of live) merged.set(e.id, e);
  for (const s of seed) merged.set(s.id, Object.assign({}, merged.get(s.id) || {}, s));
  const report = { checkedAt: new Date().toISOString(), site, listings: [], problems: [] };
  const seen = new Set();
  for (const p of merged.values()) {
    if (p.verified !== 'signed' || p.listingReady !== true) continue;
    const row = { id: p.id, name: p.name, zone: p.zone, status: 'live', route: ctx.rwBookingRoute(p).type, issues: [] };
    if (seen.has(p.id)) row.issues.push('duplicate id'); seen.add(p.id);
    if (row.route === 'none') { row.status = 'hidden'; row.issues.push('no working booking route: add WhatsApp in the partner admin'); }
    if (p.bookingWhatsapp && !/^91\d{10}$/.test(String(p.bookingWhatsapp))) row.issues.push('WhatsApp number is not a 12-digit Indian number (' + mask(p.bookingWhatsapp) + ')');
    const repoPhotos = (p.photos || []).map(x => x.src);
    for (const src of repoPhotos) if (!fs.existsSync(path.join(root, src))) row.issues.push('photo file missing: ' + src);
    let uploaded = 0;
    for (let i = 0; i < Math.min(4, Number(p.photoCount) || 0); i++) {
      const d = await getDoc('photo_' + String(p.id).replace(/[^a-z0-9_]/gi, '') + '_' + i).catch(() => null);
      if (d && ctx.window && /^data:image\/(webp|jpeg);base64,/.test(d.src || '')) uploaded++;
    }
    if ((Number(p.photoCount) || 0) > uploaded) row.issues.push('photoCount says ' + p.photoCount + ' but only ' + uploaded + ' uploaded photo(s) found');
    if (!repoPhotos.length && !uploaded) row.issues.push('no photos yet: ask the owner on WhatsApp from the admin Details panel');
    if (p.mapsUrl && !/^https:\/\/(www\.google\.com\/maps\/|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)/.test(p.mapsUrl)) row.issues.push('Google Maps link is not a recognised Maps URL');
    if (!p.mapsUrl) row.issues.push('no Google Maps link');
    for (const k of ['advancePct', 'lateRefundPct']) if (p[k] != null && (p[k] < 0 || p[k] > 100)) row.issues.push(k + ' out of range');
    if (p.freeCancelHours != null && (p.freeCancelHours < 0 || p.freeCancelHours > 720)) row.issues.push('freeCancelHours out of range');
    if (!ctx.rwHasStayPolicy(p)) row.issues.push('no booking policy set (advance / free cancellation)');
    if (row.route === 'whatsapp') row.whatsapp = mask(p.bookingWhatsapp);
    if (row.status === 'live') {
      for (const src of repoPhotos.slice(0, 1)) {
        const r = await fetch(site + '/' + src, { method: 'HEAD' }).catch(() => null);
        if (!r || !r.ok) row.issues.push('main photo is not reachable on ' + site + ' (not deployed yet?)');
      }
    }
    report.listings.push(row);
  }
  report.problems = report.listings.filter(r => r.issues.some(i => !/^no (booking policy|Google Maps link)/.test(i)));
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 1));
  else {
    console.log('Partner listing health · ' + report.checkedAt);
    for (const r of report.listings) {
      console.log((r.status === 'live' ? 'LIVE   ' : 'HIDDEN ') + r.name + ' (' + r.zone + ') via ' + r.route + (r.whatsapp ? ' ' + r.whatsapp : ''));
      for (const i of r.issues) console.log('   - ' + i);
    }
    console.log(report.problems.length ? '\n' + report.problems.length + ' listing(s) need attention.' : '\nNo blocking problems.');
  }
  process.exit(report.problems.length ? 1 : 0);
})().catch(e => { console.error('health check could not run: ' + e.message); process.exit(2); });
