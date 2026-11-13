#!/usr/bin/env node
/* Refreshes every Amor price shown on the homepage from the live price engine (worker/lib/amor-pricing.js).
 *   node tools/build-amor-offers.mjs          rewrite index.html in place
 *   node tools/build-amor-offers.mjs --check  exit 1 if any homepage price is stale (CI / daily upkeep)
 * Cards carry data-rw-pkg / data-rw-stay and data-rw-from; the visible "From ₹..." text is rewritten to match. */
import fs from 'node:fs';
import { publicRates, publicPackageList } from '../worker/handlers/stay-cashfree.js';

const FILE = new URL('../index.html', import.meta.url);
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const STAY_ROOM = { nanau: ['studio', 'CP'], padma: ['royal', 'EP'], aramness: ['kothi', 'AP'], tattwaa: ['forest', 'CP'] };

export function expectedPrices() {
  const out = {}, rates = publicRates();
  for (const k of publicPackageList()) if (k.from) out['pkg:' + k.id] = k.from.total;
  for (const [id, [room, plan]] of Object.entries(STAY_ROOM)) out['stay:' + id] = rates[id].rooms[room].perNight[plan];
  return out;
}

export function rewrite(html, want) {
  let changed = 0;
  const re = /<a class="rw-sales-card" data-rw-(pkg|stay)="([a-z0-9-]+)" data-rw-from="(\d+)"([\s\S]*?)<\/a>/g;
  const outHtml = html.replace(re, (card, kind, id, from, rest) => {
    const v = want[kind + ':' + id]; if (v == null) return card;
    let body = rest;
    if (kind === 'pkg') body = body.replace(/<span class="rw-price">From ₹[\d,]+<\/span>/, '<span class="rw-price">From ' + inr(v) + '</span>');
    else body = body.replace(/<span class="rw-price">(From )?₹[\d,]+\/night/, (m, f) => '<span class="rw-price">' + (f || '') + inr(v) + '/night');
    const next = '<a class="rw-sales-card" data-rw-' + kind + '="' + id + '" data-rw-from="' + v + '"' + body + '</a>';
    if (next !== card) changed++;
    return next;
  });
  return { html: outHtml, changed };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const html = fs.readFileSync(FILE, 'utf8'), { html: next, changed } = rewrite(html, expectedPrices());
  if (process.argv.includes('--check')) {
    if (changed) { console.error('Amor homepage prices are stale (' + changed + ' cards). Run: node tools/build-amor-offers.mjs'); process.exit(1); }
    console.log('Amor homepage prices match the price engine.');
  } else { fs.writeFileSync(FILE, next); console.log('Updated ' + changed + ' Amor cards on index.html.'); }
}
