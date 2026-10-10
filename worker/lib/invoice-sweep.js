/* worker/lib/invoice-sweep.js — issues one invoice per verified payment, exactly once, with gap-free numbering and a hash chain.
   Idempotent: invoices/{sourceKey} is created only if absent, and each number is claimed by creating invoiceNumbers/{FY}_{seq}
   (create-if-absent), so two overlapping sweeps can never issue the same number. A lost race leaves a flagged, voided number
   (never a silent gap). Reads payments + manual revenue ledger entries; never writes to them. */
import { createDocIfAbsent, getDoc, listDocs, updateDoc } from './firestore-rest.js';
import RWInvoice from '../../features/invoicing/invoice-core.js';
import gstRules from '../../features/finance-tax/gst-rules.js';

globalThis.RWGst = globalThis.RWGst || gstRules;   // the core reads the dated platform-fee rule from here
const core = () => RWInvoice;

export async function loadSeller(env, token, project) {
  let c = null;
  try { c = await getDoc(env, token, project, 'invoiceConfig/seller'); } catch (e) { c = null; }
  return c || {};
}

async function claimNumber(env, token, project, fy, startAt, key) {
  for (let seq = startAt; seq < startAt + 50; seq++) {
    if (await createDocIfAbsent(env, token, project, 'invoiceNumbers', fy + '_' + seq, { fy, seq, sourceKey: key, claimedAt: new Date().toISOString() })) return seq;
  }
  throw new Error('Could not claim an invoice number; retry the sweep.');
}

/* Returns { issued:[numbers], skipped, errors } */
export async function sweepInvoices(env, token, project, limit = 60) {
  const C = core(), out = { issued: [], skipped: 0, errors: [] };
  const [payments, ledger, existing] = await Promise.all([
    listDocs(env, token, project, 'payments', 2000), listDocs(env, token, project, 'ledger', 2000), listDocs(env, token, project, 'invoices', 5000)
  ]);
  const have = new Set(existing.map(i => i.sourceKey));
  const payIds = new Set(payments.map(p => String(p.providerRef || p.id)).concat(payments.map(p => p.id)));
  const todo = [];
  payments.forEach(p => { const n = C.fromPayment(p, p.id); if (n && !have.has(n.key)) todo.push(n); });
  ledger.forEach(e => {
    const n = C.fromLedgerRevenue(e, e.id);
    if (!n || have.has(n.key)) return;
    if (n.providerRef && payIds.has(n.providerRef)) return;   // already invoiced from the payment record
    todo.push(n);
  });
  todo.sort((a, b) => a.paidAt < b.paidAt ? -1 : a.paidAt > b.paidAt ? 1 : a.key < b.key ? -1 : 1);
  const seller = await loadSeller(env, token, project);
  const tail = {};   // per FY: last seq + hash, seeded from stored invoices
  existing.forEach(i => { const t = tail[i.fy]; if (!t || i.seq > t.seq) tail[i.fy] = { seq: i.seq, hash: i.hash }; });
  for (const norm of todo.slice(0, limit)) {
    try {
      const fy = C.fyLabel(C.istDay(norm.paidAt)), t = tail[fy] || { seq: 0, hash: '' };
      const seq = await claimNumber(env, token, project, fy, t.seq + 1, norm.key);
      const prev = t.hash;   // if a concurrent sweep interleaved, verifyChain() reports the break instead of hiding it
      const inv = await C.seal(C.build(norm, seller, seq, prev));
      const created = await createDocIfAbsent(env, token, project, 'invoices', norm.key, inv);
      if (!created) { out.skipped++; continue; }
      tail[fy] = { seq, hash: inv.hash }; out.issued.push(inv.number);
    } catch (e) { out.errors.push(norm.key + ': ' + String(e.message || e).slice(0, 160)); }
  }
  out.remaining = Math.max(0, todo.length - limit);
  try { await updateDoc(env, token, project, 'meta/invoiceSweep', { at: new Date().toISOString(), issued: out.issued.length, errors: out.errors.length, remaining: out.remaining }); } catch (e) { /* status doc is best-effort */ }
  return out;
}
