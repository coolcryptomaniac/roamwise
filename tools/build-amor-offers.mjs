#!/usr/bin/env node
/* Refreshes the no-JavaScript fallback prices on the homepage Amor cards from the LIVE Worker (/stays/rates).
 * Net rates are sealed on the Worker, so prices can only come from it. In the browser, js/ui/amor-offers.js
 * already shows live prices and season order; this keeps the static HTML close for crawlers and old browsers.
 *   node tools/build-amor-offers.mjs           rewrite index.html in place
 *   node tools/build-amor-offers.mjs --check   exit 1 if any homepage price differs from the Worker */
import fs from 'node:fs';

const API = 'https://roamwise-api.founder-f53.workers.dev/stays/rates';
const FILE = new URL('../index.html', import.meta.url);
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const STAY_ROOM = { nanau: ['studio', 'CP'], padma: ['royal', 'EP'], aramness: ['kothi', 'AP'], tattwaa: ['forest', 'CP'] };

export function expectedFrom(d) {
  const out = {};
  for (const k of d.packages || []) if (k.from) out['pkg:' + k.id] = k.from.total;
  for (const [id, [room, plan]] of Object.entries(STAY_ROOM)) { const r = d.stays && d.stays[id] && d.stays[id].rooms && d.stays[id].rooms[room]; if (r && r.perNight[plan]) out['stay:' + id] = r.perNight[plan]; }
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
  const d = await (await fetch(API)).json(), want = expectedFrom(d);
  if (!Object.keys(want).length) { console.error('The Worker returned no Amor prices (rate book not loaded?). Nothing changed.'); process.exit(2); }
  const html = fs.readFileSync(FILE, 'utf8'), { html: next, changed } = rewrite(html, want);
  if (process.argv.includes('--check')) { if (changed) { console.error(changed + ' homepage Amor prices differ from the Worker. Run: node tools/build-amor-offers.mjs'); process.exit(1); } console.log('Homepage Amor prices match the Worker.'); }
  else { fs.writeFileSync(FILE, next); console.log('Updated ' + changed + ' Amor cards on index.html.'); }
}
