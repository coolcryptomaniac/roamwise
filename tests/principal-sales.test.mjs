import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { principalQuote, taxForPart, inclusiveTax, placeOfSupply, roomRate, SAC } from '../worker/lib/principal-tax.js';
import { invoiceRecord, recordStayInvoice, queuePayout, onStayRefunded, runPartnerPayouts, handlePayoutMark, markLink, transferBody, payoutSignature } from '../worker/handlers/stay-finance.js';
const I = createRequire(import.meta.url)('../features/invoicing/invoice-core.js');

const sum = (a) => Math.round(a.reduce((t, x) => t + x, 0) * 100) / 100;
function kvStore() {
  const m = new Map();
  return { m, get: async (k, t) => { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    put: async (k, v) => { m.set(k, String(v)); }, delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) };
}

test('GST slabs (GST 2.0): rooms 5% up to Rs 7,500 a night, 18% above; tour packages 5%; no 12% anywhere', () => {
  assert.equal(roomRate(7500), 0.05); assert.equal(roomRate(7501), 0.18);
  const lo = principalQuote({ items: [{ cost: 4000, units: 1, margin: 0.2 }] });
  assert.equal(lo.lines[0].ratePct, 5); assert.ok(Math.abs(lo.margin - 0.2) < 0.01); assert.equal(lo.total % 10, 0);
  const hi = principalQuote({ items: [{ cost: 12000, units: 1, margin: 0.2 }], pos: '02' });
  assert.equal(hi.lines[0].ratePct, 18); assert.equal(hi.igst, hi.gst); assert.equal(hi.cgst, 0);
  const tour = principalQuote({ items: [{ cost: 12000, units: 1, margin: 0.2 }, { cost: 3000, units: 0, margin: 0.2 }], tour: true });
  assert.deepEqual(tour.lines.map((l) => [l.sac, l.ratePct]), [[SAC.tour, 5]]); assert.equal(tour.cgst + tour.sgst, tour.gst);
  for (const q of [lo, hi, tour]) { assert.equal(sum(q.lines.map((l) => l.gross)), q.total); assert.ok(!q.lines.some((l) => l.ratePct === 12)); }
});

test('margin is protected: target margin, 7% floor under a public-price cap, and a room kept in the 5% slab when cheaper for the guest', () => {
  const capped = principalQuote({ items: [{ cost: 5000, units: 1, margin: 0.25 }], cap: 5700 });
  assert.equal(capped.total, 5700); assert.ok(capped.margin >= 0.07);
  const floor = principalQuote({ items: [{ cost: 5000, units: 1, margin: 0.25 }], cap: 4000 });
  assert.ok(floor.aboveCap); assert.ok(floor.margin >= 0.0699, 'never below the 7% floor');
  const edge = principalQuote({ items: [{ cost: 6200, units: 1, margin: 0.2 }] }); // 7,750 pre-GST at 18% vs 7,500 at 5%
  assert.equal(edge.lines[0].ratePct, 5); assert.equal(edge.total, 7880); assert.ok(edge.margin >= 0.15);
});

test('input credit only for 18% rooms bought from a partner in Uttarakhand; other states keep the partner GST as cost', () => {
  const it = { cost: 11800, units: 1, margin: 0.2, inputGst: 1800, inputRate: 0.18 };
  const uk = principalQuote({ items: [it], propertyState: '05' }), hp = principalQuote({ items: [it], propertyState: '02', pos: '02' });
  assert.equal(uk.inputCredit, 1800); assert.equal(hp.inputCredit, 0);
  assert.ok(uk.total < hp.total, 'credit passes to a lower price'); assert.ok(Math.abs(uk.margin - 0.2) < 0.01 && Math.abs(hp.margin - 0.2) < 0.01);
});

test('pure-agent fees pass through at cost with no GST; place of supply rules', () => {
  const q = principalQuote({ items: [{ cost: 4000, units: 1, margin: 0.2 }, { cost: 1350, units: 0, margin: 0, pureAgent: true }] });
  const pa = q.lines.find((l) => l.sac === 'PA'); assert.equal(pa.ratePct, 0); assert.ok(Math.abs(pa.gross - 1350) < 1);
  assert.equal(placeOfSupply({ tour: false, propertyState: 'Himachal Pradesh', guestState: 'Delhi' }), '02');
  assert.equal(placeOfSupply({ tour: true, propertyState: '02', guestState: 'Delhi' }), '07');
  assert.equal(placeOfSupply({ tour: true }), '05');
});

test('invoice core: per-line GST, CGST+SGST inside Uttarakhand, IGST across states, nothing if not registered', () => {
  const tax = principalQuote({ items: [{ cost: 4000, units: 2, margin: 0.2 }, { cost: 12000, units: 1, margin: 0.2 }], pos: '02' });
  const p = { amountINR: tax.total, paidAt: '2026-12-01T10:00:00Z', status: 'paid', email: 'g@x.in', planLabel: 'Padma Villa', tax: { ...tax, lines: tax.lines } };
  const seller = { gstRegistered: true, gstin: '05ABCDE1234F1Z5', legalName: 'RoamWise Technologies' };
  const inv = I.build(I.fromPayment(p, 'stay_x_first'), seller, 1, '');
  assert.equal(inv.docType, 'tax_invoice'); assert.equal(inv.taxMode, 'igst'); assert.equal(inv.lines.length, 2);
  assert.deepEqual(inv.lines.map((l) => l.ratePct).sort(), [18, 5]);
  assert.equal(inv.taxablePaise + inv.taxPaise, inv.totalPaise); assert.equal(inv.igstPaise, inv.taxPaise);
  const local = I.build(I.fromPayment({ ...p, tax: { ...p.tax, pos: '05' } }, 'y'), seller, 2, '');
  assert.equal(local.taxMode, 'cgst_sgst'); assert.equal(local.cgstPaise + local.sgstPaise, local.taxPaise);
  const none = I.build(I.fromPayment(p, 'z'), { legalName: 'RoamWise' }, 3, '');
  assert.equal(none.taxMode, 'none'); assert.equal(none.taxPaise, 0); assert.match(none.gstNote, /not charged/);
});

const STAY = () => ({ id: 'rwstay_' + 'a'.repeat(32), property: 'Nanau Resort', stay: 'nanau', supplier: 'amor', checkin: '2027-02-08', checkout: '2027-02-10',
  email: 'g@x.in', total: 13000, amount: 3900, balance: 9100, kind: 'nightly', seller: 'RoamWise', status: 'confirmed',
  supplierNet: [{ cost: 10000 }], tax: inclusiveTax(13000, { rate: 0.05, pos: '05' }) });

test('invoice records: advance, then balance, Coins lower the invoice value, agent bookings invoice only the fee', async () => {
  const r = STAY(); r.coinsUsed = 390;
  const first = invoiceRecord(r, 'first', 3900);
  assert.equal(first.amountINR, 3510); assert.equal(first.coinsDiscount, 390); assert.equal(sum(first.tax.lines.map((l) => l.gross)), 3510);
  assert.equal(first.tax.lines[0].sac, '996311'); assert.equal(first.id, 'stay_' + r.id + '_first');
  assert.equal(invoiceRecord(r, 'balance', 9100).amountINR, 9100);
  const ag = { ...STAY(), tax: { model: 'agent' }, amount: 13000, balance: 0 };
  const f = invoiceRecord(ag, 'first', 13000); assert.equal(f.amountINR, 3000); assert.equal(f.tax.lines[0].sac, '998552'); assert.equal(f.tax.lines[0].ratePct, 18);
  const docs = []; const env = { RW_KV: kvStore() };
  await recordStayInvoice(env, r, 'first', 3900, Date.now(), { writePayment: async (d) => docs.push(d) });
  assert.equal(docs.length, 1);
  await recordStayInvoice(env, r, 'first', 3900, Date.now(), { writePayment: async () => { throw new Error('down'); } });
  assert.equal([...env.RW_KV.m.keys()].filter((k) => k.startsWith('invoiceq:')).length, 1, 'queued for retry');
});

test('payout: partner net for what the guest paid is queued on accept and topped up when the balance is paid; refund cancels', async () => {
  const env = { RW_KV: kvStore() }, mails = [], deps = { sendMail: async (e, m) => mails.push(m) };
  const r = STAY(); await env.RW_KV.put('stayorder:' + r.id, JSON.stringify(r));
  const p1 = await queuePayout(env, r, Date.parse('2026-12-01T05:00:00Z'), deps);
  assert.equal(p1.amount, 3000, '30% paid -> 30% of the net'); assert.equal(p1.dueAt, '2026-12-01T05:00:00.000Z', 'same day');
  assert.equal(await queuePayout(env, r, Date.now(), deps), null, 'no double payout');
  r.balance = 0; const p2 = await queuePayout(env, r, Date.now(), deps); assert.equal(p2.amount, 7000);
  const res = await onStayRefunded(env, r, Date.now(), deps);
  assert.equal(res.cancelled, 10000); assert.ok(mails.some((m) => /Credit note/.test(m.subject)));
  const later = { ...STAY(), id: 'rwstay_' + 'b'.repeat(32) }; const env2 = { RW_KV: kvStore(), PAYOUT_WHEN: 'checkin' };
  assert.equal((await queuePayout(env2, later, Date.parse('2026-12-01T05:00:00Z'), deps)).dueAt, '2027-02-08T00:30:00.000Z');
  const unknown = { ...STAY(), id: 'rwstay_' + 'c'.repeat(32), supplierNet: undefined };
  assert.equal(await queuePayout(env, unknown, Date.now(), deps), null); assert.ok(mails.some((m) => /Set the partner net/.test(m.subject)));
});

test('payout run: manual path emails the founder with a signed mark-paid link; automatic path calls Cashfree Payouts v2', async () => {
  const env = { RW_KV: kvStore(), WALLET_LINK_SECRET: 's' }, mails = [], deps = { sendMail: async (e, m) => mails.push(m) };
  const r = STAY(); r.balance = 0; await queuePayout(env, r, Date.now() - 1000, deps);
  await env.RW_KV.put('payee:amor', JSON.stringify({ name: 'Amor Hospitality', account: '123456789012', ifsc: 'HDFC0001234', email: 'acc@amor.in' }));
  const out = await runPartnerPayouts(env, Date.now(), deps);
  assert.equal(out.manual, 1); const mail = mails.find((m) => /Pay Nanau/.test(m.subject)); assert.match(mail.text, /IFSC HDFC0001234/);
  const key = 'payout:' + r.id + ':1', link = await markLink(env, key);
  assert.equal((await handlePayoutMark(new Request(link.replace('t=', 't=x')), env)).status, 403);
  const ok = await (await handlePayoutMark(new Request(link + '&utr=UTR123'), env, Date.now(), deps)).json();
  assert.equal(ok.paid, 10000); assert.equal((await env.RW_KV.get(key, 'json')).utr, 'UTR123');
  assert.ok(mails.some((m) => m.to === 'acc@amor.in'), 'remittance advice to the partner');

  const kp = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-1' }, true, ['encrypt', 'decrypt']);
  const pem = '-----BEGIN PUBLIC KEY-----\n' + Buffer.from(await crypto.subtle.exportKey('spki', kp.publicKey)).toString('base64') + '\n-----END PUBLIC KEY-----';
  const sig = await payoutSignature('CID', pem, 1764000000000);
  const plain = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, kp.privateKey, Uint8Array.from(atob(sig), (c) => c.charCodeAt(0))));
  assert.equal(plain, 'CID.1764000000');
  const env2 = { RW_KV: kvStore(), CF_PAYOUT_CLIENT_ID: 'CID', CF_PAYOUT_CLIENT_SECRET: 'SEC', CF_PAYOUT_PUBLIC_KEY: pem, PAYOUTS_AUTO: 'true', CF_PAYOUT_ENV: 'sandbox' };
  const r2 = STAY(); r2.balance = 0; await queuePayout(env2, r2, Date.now() - 1000, deps);
  await env2.RW_KV.put('payee:amor', JSON.stringify({ name: 'Amor Hospitality', vpa: 'amor@hdfc' }));
  const calls = []; const fetch = async (u, o = {}) => { calls.push({ u, o }); return new Response(JSON.stringify(o.method === 'POST' ? { status: 'RECEIVED', cf_transfer_id: 'cf1' } : { status: 'SUCCESS', transfer_utr: 'U9' }), { status: 200 }); };
  assert.equal((await runPartnerPayouts(env2, Date.now(), { ...deps, fetch })).sent, 1);
  const body = JSON.parse(calls[0].o.body);
  assert.equal(calls[0].u, 'https://sandbox.cashfree.com/payout/transfers'); assert.equal(calls[0].o.headers['x-api-version'], '2024-01-01');
  assert.equal(body.transfer_mode, 'upi'); assert.equal(body.beneficiary_details.beneficiary_instrument_details.vpa, 'amor@hdfc'); assert.equal(body.transfer_amount, 10000);
  assert.equal((await runPartnerPayouts(env2, Date.now(), { ...deps, fetch })).paid, 1);
  assert.ok(transferBody({ transferId: 't', amount: 1, stayId: 'rwstay_x', checkin: '2027-01-01' }, { name: 'A', account: '1', ifsc: 'X' }).beneficiary_details.beneficiary_instrument_details.bank_ifsc);
});

test('part-payment tax lines scale and still add up', () => {
  const tax = principalQuote({ items: [{ cost: 4000, units: 1, margin: 0.2 }, { cost: 12000, units: 1, margin: 0.2 }] });
  const part = taxForPart(tax, tax.total, 3333);
  assert.equal(sum(part.lines.map((l) => l.gross)), 3333); assert.equal(Math.round((part.taxable + part.gst) * 100) / 100, 3333);
});
