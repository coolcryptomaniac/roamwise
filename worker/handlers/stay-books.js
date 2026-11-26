/* Clean books for RoamWise as principal seller: one KV entry per invoice record, monthly CSVs for the CA, and a
 * founder email on the 1st of each month with signed download links (valid 7 days; no admin sign-in needed on a phone).
 *
 *   sales    - every RoamWise invoice record: date, guest, property, place of supply, SAC, rate, taxable, CGST/SGST/IGST
 *   gstr1    - ready for GSTR-1: B2CS (place of supply x rate), B2CL (inter-state B2C invoices above the limit),
 *              SAC summary, and the month's document count
 *   payouts  - partner payments: partner, GSTIN, their invoice number and GST (for input credit), amount, UTR, status
 *   margin   - private: RoamWise's pre-GST sale minus the partner net, per booking (founder only; never committed)
 * Storage (RW_KV): book:<YYYY-MM>:<recordId> (13 months). Months are India time (IST). */
import { json } from '../lib/http.js';
import { sendMail } from '../lib/mailer.js';

const API = 'https://roamwise-api.founder-f53.workers.dev';
const FOUNDER = 'founder@roamwise.co.in';
const B2CL_LIMIT = 100000; // inter-state B2C invoices above this are reported one by one in GSTR-1 (confirm the current limit with the CA)
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const istMonth = (iso) => new Date(Date.parse(iso) + 19800000).toISOString().slice(0, 7);
const csv = (rows) => rows.map((r) => r.map((v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n') + '\n';

/* Called with every invoice record (stay-finance.recordStayInvoice). partnerShare = partner net for this part. */
export async function bookEntry(env, doc, record) {
  const net = Array.isArray(record.supplierNet) ? record.supplierNet.reduce((t, l) => t + (Number(l.cost) || 0), 0) : (Number.isFinite(record.partnerNet) ? record.partnerNet : null);
  const share = net != null && (record.total || record.amount) ? r2(net * (doc.amountINR + (doc.coinsDiscount || 0)) / (record.total || record.amount)) : null;
  const e = { ...doc, property: record.property, supplier: record.supplier, stay: record.stay || '', checkin: record.checkin, partnerShare: doc.tax && doc.tax.model === 'agent' ? null : share };
  await env.RW_KV.put('book:' + istMonth(doc.paidAt) + ':' + doc.id, JSON.stringify(e), { expirationTtl: 60 * 60 * 24 * 400 });
  return e;
}

async function entries(env, month) {
  const out = []; let cursor;
  do {
    const page = await env.RW_KV.list({ prefix: 'book:' + month + ':', cursor });
    for (const k of page.keys) { const e = await env.RW_KV.get(k.name, 'json'); if (e) out.push(e); }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out.sort((a, b) => a.paidAt.localeCompare(b.paidAt));
}
async function payouts(env, month) {
  const out = []; let cursor;
  do {
    const page = await env.RW_KV.list({ prefix: 'payout:', cursor });
    for (const k of page.keys) { const p = await env.RW_KV.get(k.name, 'json'); if (p && istMonth(p.paidAt || p.createdAt) === month) out.push(p); }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out.sort((a, b) => String(a.paidAt || a.createdAt).localeCompare(String(b.paidAt || b.createdAt)));
}
const split = (l, tax) => (tax.interState ? { c: 0, s: 0, i: l.tax } : { c: r2(l.tax / 2), s: r2(l.tax - r2(l.tax / 2)), i: 0 });

export function salesCsv(list) {
  const rows = [['date', 'record', 'guest_email', 'property', 'seller', 'place_of_supply', 'sac', 'rate_pct', 'taxable', 'cgst', 'sgst', 'igst', 'line_total', 'coins_discount', 'payment', 'payment_ref']];
  for (const e of list) for (const l of (e.tax && e.tax.lines) || []) {
    const t = split(l, e.tax);
    rows.push([e.paidAt.slice(0, 10), e.id, e.email, e.property, e.seller, e.tax.pos, l.sac === 'PA' ? 'pure agent' : l.sac, l.ratePct, l.taxable, t.c, t.s, t.i, l.gross, e.coinsDiscount || 0, e.provider, e.providerRef]);
  }
  return csv(rows);
}
export function gstr1Csv(list) {
  const b2cs = new Map(), sac = new Map(), b2cl = [];
  for (const e of list) {
    if (!e.tax || !e.tax.lines) continue;
    const big = e.tax.interState && e.amountINR > B2CL_LIMIT;
    for (const l of e.tax.lines) {
      if (l.sac === 'PA' || !l.ratePct) continue;
      const t = split(l, e.tax);
      if (big) b2cl.push([e.paidAt.slice(0, 10), e.id, e.tax.pos, l.ratePct, l.taxable, t.i]);
      else { const k = e.tax.pos + '|' + l.ratePct, g = b2cs.get(k) || { pos: e.tax.pos, rate: l.ratePct, taxable: 0, c: 0, s: 0, i: 0 }; g.taxable += l.taxable; g.c += t.c; g.s += t.s; g.i += t.i; b2cs.set(k, g); }
      const k2 = l.sac + '|' + l.ratePct, h = sac.get(k2) || { sac: l.sac, rate: l.ratePct, taxable: 0, c: 0, s: 0, i: 0, n: 0 }; h.taxable += l.taxable; h.c += t.c; h.s += t.s; h.i += t.i; h.n++; sac.set(k2, h);
    }
  }
  const rows = [['section', 'place_of_supply_or_sac', 'rate_pct', 'taxable', 'cgst', 'sgst', 'igst', 'note']];
  for (const g of b2cs.values()) rows.push(['B2CS', g.pos, g.rate, r2(g.taxable), r2(g.c), r2(g.s), r2(g.i), '']);
  for (const b of b2cl) rows.push(['B2CL', b[2], b[3], b[4], 0, 0, b[5], 'record ' + b[1] + ' on ' + b[0]]);
  for (const h of sac.values()) rows.push(['HSN/SAC', h.sac, h.rate, r2(h.taxable), r2(h.c), r2(h.s), r2(h.i), h.n + ' lines']);
  rows.push(['DOCS', 'invoice records', '', '', '', '', '', list.length + ' (numbers are in the RoamWise invoice register)']);
  return csv(rows);
}
export function payoutsCsv(list) {
  const rows = [['date', 'booking', 'property', 'partner', 'partner_gstin', 'partner_invoice', 'partner_invoice_gst', 'amount', 'status', 'utr']];
  for (const p of list) rows.push([String(p.paidAt || p.createdAt).slice(0, 10), p.stayId, p.property, p.payeeName || '', p.partnerGstin || '', p.partnerInvoice || '', p.partnerInvoiceGst || '', p.amount, p.status, p.utr || '']);
  return csv(rows);
}
export function marginCsv(list) {
  const rows = [['date', 'record', 'property', 'sale_pre_gst', 'partner_net', 'roamwise_margin', 'margin_pct']];
  for (const e of list) {
    if (e.partnerShare == null || !e.tax) continue;
    const pre = r2(e.tax.lines.filter((l) => l.sac !== 'PA').reduce((t, l) => t + l.taxable, 0)), pa = r2(e.tax.lines.filter((l) => l.sac === 'PA').reduce((t, l) => t + l.gross, 0));
    const m = r2(pre - (e.partnerShare - pa));
    rows.push([e.paidAt.slice(0, 10), e.id, e.property, pre, r2(e.partnerShare - pa), m, pre ? r2(m / pre * 100) : '']);
  }
  return csv(rows);
}
const FILES = { sales: salesCsv, gstr1: gstr1Csv, margin: marginCsv };

async function hmac(secret, text) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(text)))].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
export async function booksLink(env, month, file, nowMs = Date.now()) {
  const exp = Math.floor(nowMs / 1000) + 7 * 86400;
  return API + '/books/download?m=' + month + '&f=' + file + '&e=' + exp + '&t=' + (await hmac(env.WALLET_LINK_SECRET || 'x', ['books', month, file, exp].join('|')));
}
/* GET /books/download?m=YYYY-MM&f=sales|gstr1|payouts|margin&e=&t= */
export async function handleBooksDownload(request, env, nowMs = Date.now()) {
  const u = new URL(request.url), m = u.searchParams.get('m') || '', f = u.searchParams.get('f') || '', e = Number(u.searchParams.get('e')), t = u.searchParams.get('t') || '';
  if (!/^20\d\d-(0[1-9]|1[0-2])$/.test(m) || !(f in FILES || f === 'payouts') || !(e * 1000 > nowMs) || t !== await hmac(env.WALLET_LINK_SECRET || 'x', ['books', m, f, e].join('|'))) return json({ error: 'invalid_or_expired_link' }, 403);
  const body = f === 'payouts' ? payoutsCsv(await payouts(env, m)) : FILES[f](await entries(env, m));
  return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="roamwise-' + f + '-' + m + '.csv"', 'cache-control': 'no-store' } });
}

/* Daily cron: on the 1st (IST), email the founder last month's books and the GST calendar. */
export async function runMonthlyBooks(env, nowMs = Date.now(), deps = {}) {
  const ist = new Date(nowMs + 19800000);
  if (ist.getUTCDate() !== 1 || !env.RW_KV) return null;
  const prev = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  if (await env.RW_KV.get('booksmail:' + prev)) return null;
  const list = await entries(env, prev), tax = list.reduce((t, x) => t + ((x.tax && x.tax.gst) || 0), 0), sales = list.reduce((t, x) => t + (x.amountINR || 0), 0);
  const qEnd = [3, 6, 9, 12].includes(Number(prev.slice(5)));
  const links = []; for (const f of ['sales', 'gstr1', 'payouts', 'margin']) links.push(f + ': ' + await booksLink(env, prev, f, nowMs));
  await (deps.sendMail || sendMail)(env, { to: FOUNDER, subject: 'RoamWise books for ' + prev + ': sales Rs ' + Math.round(sales).toLocaleString('en-IN') + ', GST Rs ' + Math.round(tax).toLocaleString('en-IN'), text: [
    list.length + ' invoice records in ' + prev + '. Forward the sales, gstr1 and payouts files to the CA (margin is for you only).', '', ...links, '(links work for 7 days)', '',
    'GST calendar (QRMP, quarterly returns):',
    qEnd ? '- This was a quarter-end month: file GSTR-1 by the 13th and GSTR-3B by the 22nd/24th (the portal shows your date); GST for this month is paid with GSTR-3B.'
      : '- Pay this month\'s GST with PMT-06 by the 25th (net banking or UPI on gst.gov.in).',
    '- Partner invoices: check each one appears in GSTR-2B before claiming credit.',
  ].join('\n') });
  await env.RW_KV.put('booksmail:' + prev, '1', { expirationTtl: 60 * 60 * 24 * 60 });
  return { month: prev, records: list.length };
}
