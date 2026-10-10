import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const I = require('../features/invoicing/invoice-core.js');
const B = require('../features/invoicing/invoice-books.js');
const GOOD = '05AAAAA0000A1Z5';   // placeholder with Uttarakhand state code; validated below
const validGstin = (() => { const g = require('../features/finance-tax/gstin.js'); const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const first = '05AAAAA0000A1Z'; return first + g.checkChar(first); })();
const pay = (id, rupees, at, extra = {}) => ({ id, amountINR: rupees, currency: 'INR', provider: 'cashfree', providerRef: id, planId: 'founder', status: 'paid', paidAt: at, uid: 'u_' + id, email: id + '@example.com', ...extra });

test('financial year, IST day and numbering', () => {
  assert.equal(I.istDay('2026-03-31T19:00:00Z'), '2026-04-01');   // 00:30 IST next day
  assert.equal(I.fyLabel('2026-03-31'), '2025-26'); assert.equal(I.fyLabel('2026-04-01'), '2026-27');
  assert.equal(I.numberOf({}, '2026-27', 7), 'RW/2627/000007');
  assert.ok(I.numberOf({ prefix: 'abc-d' }, '2026-27', 1).length <= 16, 'GST invoice numbers are at most 16 characters');
});
test('amount in words uses the Indian system', () => {
  assert.equal(I.amountInWords(123456), 'Rupees One Thousand Two Hundred Thirty Four and Fifty Six Paise Only');
  assert.equal(I.amountInWords(10000000), 'Rupees One Lakh Only');
  assert.equal(I.amountInWords(250000000), 'Rupees Twenty Five Lakh Only');
  assert.equal(I.amountInWords(100), 'Rupees One Only');
});
test('no GST is charged unless the seller is registered with a valid GSTIN', () => {
  assert.equal(I.taxFor(11800, {}, '').mode, 'none');
  assert.equal(I.taxFor(11800, { gstRegistered: true, gstin: 'bad' }, '').mode, 'none');
  assert.ok(I.taxFor(11800, { gstRegistered: true, gstin: 'bad' }, '').flags.includes('gstin_invalid_no_gst_charged'));
  assert.ok(I.gstState(validGstin), 'test GSTIN must validate');
});
test('registered seller: inclusive split, intra vs inter state, honest flags', () => {
  const seller = { gstRegistered: true, gstin: validGstin, gstRateBps: 1800 };
  const intra = I.taxFor(11800, seller, '05');
  assert.deepEqual([intra.mode, intra.taxPaise, intra.taxablePaise, intra.cgstPaise, intra.sgstPaise], ['cgst_sgst', 1800, 10000, 900, 900]);
  const inter = I.taxFor(11800, seller, '27');
  assert.deepEqual([inter.mode, inter.igstPaise, inter.cgstPaise], ['igst', 1800, 0]);
  const odd = I.taxFor(10001, seller, '05'); assert.equal(odd.taxablePaise + odd.cgstPaise + odd.sgstPaise, 10001);
  const unknown = I.taxFor(11800, seller, ''); assert.ok(unknown.flags.includes('place_of_supply_assumed_seller_state'));
  const noRate = I.taxFor(11800, { gstRegistered: true, gstin: validGstin }, '05'); assert.ok(noRate.flags.includes('gst_rate_not_confirmed_by_ca'));
});
test('only verified paid INR payments become invoices', () => {
  assert.ok(I.fromPayment(pay('a', 499, '2026-10-01T05:00:00Z'), 'a'));
  assert.equal(I.fromPayment(pay('b', 499, '2026-10-01', { status: 'failed' }), 'b'), null);
  assert.equal(I.fromPayment(pay('c', 499, '2026-10-01', { currency: 'USD' }), 'c'), null);
  assert.equal(I.fromPayment(pay('d', 0, '2026-10-01'), 'd'), null);
  assert.equal(I.fromLedgerRevenue({ kind: 'expense', amount: 5, at: '2026-10-01' }, 'x'), null);
  assert.equal(I.fromLedgerRevenue({ kind: 'revenue', amount: 5, at: '2026-10-01', reversalOf: 'q' }, 'x'), null);
});
test('hash chain detects edits, deleted invoices and number gaps', async () => {
  const seller = { gstRegistered: false };
  const mk = async (n, prev, rupees) => I.seal(I.build(I.fromPayment(pay('p' + n, rupees, '2026-10-0' + n + 'T05:00:00Z'), 'p' + n), seller, n, prev, '2026-10-10T00:00:00Z'));
  const a = await mk(1, '', 100), b = await mk(2, a.hash, 200), c = await mk(3, b.hash, 300);
  assert.equal((await I.verifyChain([a, b, c])).ok, true);
  const tampered = { ...b, totalPaise: 1 }; assert.ok((await I.verifyChain([a, tampered, c])).issues.some(x => x.code === 'content_changed'));
  const missing = await I.verifyChain([a, c]); assert.ok(missing.issues.some(x => x.code === 'number_gap'));
  assert.ok(missing.issues.some(x => x.code === 'chain_break'));
});
test('books: register is formula-safe, GST summary and P&L exclude GST from revenue', async () => {
  const seller = { gstRegistered: true, gstin: validGstin, gstRateBps: 1800 };
  const n = I.fromPayment(pay('=cmd', 1180, '2026-10-05T05:00:00Z', { email: '=HYPERLINK("x")@e.com' }), 'z');
  const inv = await I.seal(I.build(n, seller, 1, '', '2026-10-10T00:00:00Z'));
  const csv = B.toCsv(B.REGISTER_COLS, B.salesRegister([inv], 2026));
  assert.match(csv, /'=HYPERLINK/); assert.doesNotMatch(csv, /,=HYPERLINK/);
  const g = B.gstSummary([inv], 2026)[0]; assert.equal(g.taxPaise, 18000); assert.equal(g.taxablePaise, 100000);
  const p = B.pnl([inv], [{ kind: 'expense', amount: 200, at: '2026-10-07' }, { kind: 'expense', amount: 999, at: '2025-01-01' }, { kind: 'bill', status: 'unpaid', amount: 50, at: '2026-10-08' }], 2026, e => e.kind);
  assert.equal(p.total.revenuePaise, 100000); assert.equal(p.total.expensePaise, 20000); assert.equal(p.total.profitPaise, 80000); assert.equal(p.total.gstCollectedPaise, 18000);
});
test('bank matching: reference first, then unique amount+date, gateway lines set aside', async () => {
  const seller = {}, mk = async (n, ref, rupees, day) => I.seal(I.build(I.fromPayment(pay(ref, rupees, day + 'T05:00:00Z'), ref), seller, n, '', 'x'));
  const i1 = await mk(1, 'UTR111', 500, '2026-10-01'), i2 = await mk(2, 'ord2', 700, '2026-10-02'), i3 = await mk(3, 'ord3', 700, '2026-10-02');
  const csv = 'Txn Date,Narration,Debit,Credit\r\n01/10/2026,UPI-UTR111-NAME,,500.00\r\n02/10/2026,UPI-SOMEONE,,700.00\r\n03/10/2026,CASHFREE PAYOUT 88,,1,234.00\r\n04/10/2026,UPI-OTHER,,99.00\r\n';
  const bank = B.normaliseBank(csv.replace('1,234.00', '"1,234.00"'));
  const m = B.matchBank([i1, i2, i3], bank);
  assert.equal(m.matched.length, 1); assert.equal(m.matched[0].by, 'reference');
  assert.equal(m.ambiguous.length, 1); assert.equal(m.gatewayLines.length, 1); assert.equal(m.unmatchedBank.length, 1);
  assert.throws(() => B.normaliseBank('a,b\r\n1,2'), /header row/);
});

/* ---- Worker sweep against an in-memory Firestore REST fake ---- */
function fakeFirestore(seed) {
  const store = new Map(Object.entries(seed).map(([k, v]) => [k, v]));
  const toW = o => JSON.parse(JSON.stringify(o));
  return { store, fetch: async (url, init = {}) => {
    const u = new URL(url), path = decodeURIComponent(u.pathname.split('/documents/')[1] || ''), method = init.method || 'GET';
    const wire = v => v === null ? { nullValue: null } : typeof v === 'string' ? { stringValue: v } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : Array.isArray(v) ? { arrayValue: { values: v.map(wire) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, wire(x)])) } };
    const unwire = v => 'stringValue' in v ? v.stringValue : 'integerValue' in v ? Number(v.integerValue) : 'doubleValue' in v ? v.doubleValue : 'booleanValue' in v ? v.booleanValue : 'nullValue' in v ? null : 'arrayValue' in v ? (v.arrayValue.values || []).map(unwire) : Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, unwire(x)]));
    const res = (status, body) => ({ status, ok: status < 300, json: async () => body, text: async () => JSON.stringify(body) });
    if (method === 'POST') { const coll = path, id = u.searchParams.get('documentId'), key = coll + '/' + id; if (store.has(key)) return res(409, {}); store.set(key, Object.fromEntries(Object.entries(JSON.parse(init.body).fields).map(([k, x]) => [k, unwire(x)]))); return res(200, {}); }
    if (method === 'PATCH') { const cur = store.get(path) || {}; const f = JSON.parse(init.body).fields; Object.keys(f).forEach(k => { cur[k] = unwire(f[k]); }); store.set(path, cur); return res(200, {}); }
    if (path.split('/').length % 2 === 1) { const docs = [...store.entries()].filter(([k]) => k.startsWith(path + '/') && k.split('/').length === 2).map(([k, v]) => ({ name: 'x/' + k, fields: Object.fromEntries(Object.entries(v).map(([a, b]) => [a, wire(b)])) })); return res(200, { documents: docs }); }
    if (!store.has(path)) return res(404, {});
    return res(200, { fields: Object.fromEntries(Object.entries(store.get(path)).map(([a, b]) => [a, wire(b)])) });
  } };
}
test('sweep issues each payment once, in order, de-duplicates the ledger, and the trail verifies', async () => {
  const { sweepInvoices } = await import('../worker/lib/invoice-sweep.js');
  const fs_ = fakeFirestore({
    'payments/ord_b': pay('ord_b', 999, '2026-10-02T05:00:00Z'), 'payments/ord_a': pay('ord_a', 499, '2026-10-01T05:00:00Z'),
    'ledger/l1': { kind: 'revenue', amount: 499, at: '2026-10-01', provider: 'cashfree', providerRef: 'ord_a' },   // duplicate of payment: must not be invoiced twice
    'ledger/l2': { kind: 'revenue', amount: 250, at: '2026-10-03', provider: 'manual' },                           // manual UPI: invoiced and flagged
    'ledger/l3': { kind: 'expense', amount: 80, at: '2026-10-03' },
    'invoiceConfig/seller': { legalName: 'Test Seller', gstRegistered: false }
  });
  const realFetch = globalThis.fetch; globalThis.fetch = fs_.fetch;
  try {
    const first = await sweepInvoices({}, 'tok', 'proj');
    assert.deepEqual(first.issued, ['RW/2627/000001', 'RW/2627/000002', 'RW/2627/000003']); assert.deepEqual(first.errors, []);
    const second = await sweepInvoices({}, 'tok', 'proj'); assert.deepEqual(second.issued, [], 'running again must not create duplicates');
    const invs = [...fs_.store.entries()].filter(([k]) => k.startsWith('invoices/')).map(([, v]) => v);
    assert.equal(invs.length, 3);
    assert.equal(invs.find(i => i.sourceKey === 'pay_ord_a').seq, 1, 'oldest payment gets the first number');
    assert.ok(invs.find(i => i.sourceKey === 'led_l2').flags.includes('manual_entry_no_payment_reference'));
    assert.equal(invs.find(i => i.sourceKey === 'led_l1'), undefined);
    assert.equal(fs_.store.get('invoiceNumbers/2026-27_1').sourceKey, 'pay_ord_a');
    assert.equal((await I.verifyChain(invs)).ok, true);
  } finally { globalThis.fetch = realFetch; }
});
test('rules: invoices and numbers are server-written only; seller config is not public', () => {
  const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const block = name => { const i = rules.indexOf('match /' + name + '/{'), j = rules.indexOf('\n    }', i); return rules.slice(i, j); };
  assert.match(block('invoices'), /allow write: if false/); assert.match(block('invoiceNumbers'), /allow write: if false/);
  assert.match(block('invoices'), /customer\.uid == request\.auth\.uid/);
  assert.doesNotMatch(block('invoiceConfig'), /allow read: if true/);
});
test('renderer shows stored text as text, never markup', async () => {
  const { JSDOM } = await import('jsdom'); const dom = new JSDOM('<body></body>'); globalThis.window = dom.window; globalThis.document = dom.window.document;
  dom.window.RWInvoice = I; require('../features/invoicing/invoice-render.js');
  const inv = await I.seal(I.build(I.fromPayment(pay('x', 100, '2026-10-01T05:00:00Z', { customerName: '<img src=x onerror=alert(1)>' }), 'x'), {}, 1, ''));
  const node = dom.window.RWInvoiceRender.render(inv, { showFlags: true });
  assert.equal(node.querySelector('img'), null); assert.match(node.textContent, /<img src=x/); assert.match(node.textContent, /GST not charged/);
});
