'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { analyze, fiscalYear, gstSplit } = require('../features/finance-tax/tax-engine.js');
const fy = 2026;
const item = (id, kind, amount, extra = {}) => ({id, kind, amount, at:'2026-09-19', ...extra});

test('financial year boundaries and calendar validation', () => {
  assert.equal(fiscalYear('2027-03-31'), 2026);
  assert.equal(fiscalYear('2027-04-01'), 2027);
  const r = analyze([item('a','revenue',100,{providerRef:'c1'}),
    item('b','revenue',200,{at:'2027-04-01',providerRef:'c2'}),
    item('c','revenue',200,{at:'2026-02-30'})], {fyStart:fy});
  assert.equal(r.revenuePaise,10000);
  assert.equal(r.entriesInPeriod,1);
  assert.equal(r.exceptions[0].code,'invalid_date');
});
test('only actual revenue and paid bills contribute; partner gross is not revenue', () => {
  const r = analyze([item('a','revenue',100,{providerRef:'p1'}),
    item('b','bill',50,{status:'unpaid'}), item('c','bill',25,{status:'paid',invoiceRef:'invoice1'}),
    item('d','partner_collection',1000,{providerRef:'p2'})],{fyStart:fy});
  assert.equal(r.revenuePaise,10000);
  assert.equal(r.expensePaise,2500);
  assert.equal(r.billsUnpaidPaise,5000);
  assert.equal(r.partnerFundsPaise,100000);
  assert.equal(r.grossCollectionsPaise,110000);
  assert.equal(r.complete,false);
});
test('GST is unknown by default and only calculated from explicit metadata', () => {
  const r = analyze([item('a','revenue',118,{providerRef:'1',taxMeta:{gstIncluded:true,gstRateBps:1800}}),
    item('b','expense',59,{invoiceRef:'i',taxMeta:{gstIncluded:true,gstRateBps:1800,itcEligible:true}}),
    item('c','revenue',100,{providerRef:'2'})],{fyStart:fy});
  assert.equal(r.gstOutputPaise,1800);
  assert.equal(r.gstInputCandidatePaise,900);
  assert.equal(gstSplit(11800,{gstIncluded:true,gstRateBps:1800}).taxableBasePaise,10000);
});
test('duplicate provider references are not silently double counted', () => {
  const r = analyze([item('a','revenue',100,{providerRef:'order1',provider:'cashfree'}),
    item('b','revenue',100,{providerRef:'order1',provider:'cashfree'})],{fyStart:fy});
  assert.equal(r.revenuePaise,10000);
  assert.equal(r.exceptions[0].code,'duplicate_payment_reference');
});
test('reversals need source row and matching amount, do not erase history', () => {
  const r = analyze([item('a','revenue',100,{providerRef:'x'}),
    item('r','reversal',100,{reversalOf:'a'})],{fyStart:fy});
  assert.equal(r.revenuePaise,0);
  assert.equal(r.entriesInPeriod,2);
  assert.equal(r.exceptions.length,0);
  assert.equal(analyze([item('r','reversal',100,{reversalOf:'absent'})],{fyStart:fy}).exceptions[0].code,'reversal_reference');
});
test('cash reserve is user-defined, not a guessed tax rate', () => {
  const rows=[item('a','revenue',100,{providerRef:'x'}), item('b','expense',60,{invoiceRef:'y'})];
  assert.equal(analyze(rows,{fyStart:fy}).incomeTaxReservePaise,null);
  assert.equal(analyze(rows,{fyStart:fy,incomeTaxReserveBps:2000}).incomeTaxReservePaise,800);
  assert.throws(() => analyze(rows,{fyStart:fy,incomeTaxReserveBps:10001}));
});
test('unknown, non-INR, malformed and unsupported inputs are flagged not guessed', () => {
  const r=analyze([item('a','revenue',200,{currency:'USD'}),
    item('b','other',20), item('c','expense',0)],{fyStart:fy});
  assert.equal(r.revenuePaise,0);
  assert.deepEqual(r.exceptions.map(x=>x.code),['currency','unknown_kind','invalid_amount']);
});

test('admin chart-of-accounts revenue and expenses reconcile with the staff ledger format', () => {
  const r=analyze([
    {id:'pro',date:'2026-10-07',account:'rev_pro',amount:100,method:'UPI',ref:'utr-pro'},
    {id:'infra',date:'2026-10-07',account:'exp_infra',amount:25.50,invoiceRef:'inv-hosting'},
    item('commission','revenue',50,{providerRef:'commission-1'})
  ],{fyStart:fy});
  assert.equal(r.revenuePaise,15000);
  assert.equal(r.expensePaise,2550);
  assert.equal(r.exceptions.length,0);
});
test('bank settlements, vendor payouts, capital and tax liabilities are not operating profit', () => {
  const rows=['settlement','vendor_payout','capital','owner_draw','transfer','tax_payment'].map((kind,i)=>item('move-'+i,kind,1000));
  rows.push({id:'gst',date:'2026-10-07',account:'liab_gst',amount:180});
  rows.push({id:'funds',date:'2026-10-07',account:'cap_invest',amount:10000});
  rows.push(item('pro','revenue',100,{providerRef:'sale'}));
  const r=analyze(rows,{fyStart:fy});
  assert.equal(r.revenuePaise,10000);
  assert.equal(r.expensePaise,0);
  assert.equal(r.grossCollectionsPaise,10000);
  assert.equal(r.exceptions.length,0);
});
