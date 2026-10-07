'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const account = require('../business-account.js');

test('cutover migrates only the old platform UPI, preserving gateway and future account choices', () => {
  const source = { publicUpiId:'roamwise@ybl', publicPayeeName:'old', cashfreeEnabled:true,
    manualUpiEnabled:false, environment:'live', workerBaseUrl:'https://example.test' };
  const result = account.paymentConfig(source);
  assert.equal(result.publicUpiId,'roamwisepay@ybl');
  assert.equal(result.publicPayeeName,'MOHIT PANDEY');
  assert.equal(result.easySplitState,'under_review');
  assert.equal(result.cashfreeEnabled,true);
  assert.equal(result.manualUpiEnabled,false);
  assert.equal(result.environment,'live');
  assert.equal(source.publicUpiId,'roamwise@ybl');
  const future = account.paymentConfig({publicUpiId:'future@bank', publicPayeeName:'Company', easySplitState:'live'});
  assert.equal(future.publicUpiId,'future@bank');
  assert.equal(future.publicPayeeName,'Company');
  assert.equal(future.easySplitState,'live');
});

test('account nomination never rewrites historical/cash entries or implies bank reconciliation', () => {
  assert.deepEqual(account.entryDefaults('2026-10-06','upi'),{});
  assert.deepEqual(account.entryDefaults('2026-10-07','cash'),{});
  assert.deepEqual(account.entryDefaults('unknown','bank'),{});
  const row = account.entryDefaults('2026-10-07','UPI');
  assert.equal(row.businessAccountId,'hdfc-current-8061');
  assert.equal(row.bankReconciliationState,'pending');
  assert.equal(account.profile.bankFeedConnected,false);
  assert.equal(account.profile.transferVerificationState,'not_recorded');
  assert.doesNotMatch(JSON.stringify(account.profile),/\d{10,}/);
});

function admin(before) {
  const writes=[],messages=[];
  const db={collection:name=>({doc:id=>({path:name+'/'+(id||'audit-id')})}),runTransaction:async fn=>fn({
    get:async()=>({exists:true,data:()=>before}),
    set:(ref,value,options)=>writes.push({path:ref.path,value,options})
  })};
  const context={db,CURRENT_ADMIN:{uid:'admin-fixture'},RWBusinessAccount:account,
    FV:{serverTimestamp:()=> 'test-stamp'},confirm:()=>true,toast:m=>messages.push(m),
    document:{getElementById:()=>null},URL};
  context.window=context;context.addEventListener=()=>{};
  vm.runInNewContext(fs.readFileSync(require.resolve('../admin/payment-operations.js'),'utf8'),context);
  return {context,writes,messages};
}
test('persisting the masked profile preserves provider switches and records requested split state atomically', async () => {
  const h=admin({publicUpiId:'roamwise@ybl',activeDestinationId:'old',easySplitState:'not_requested',manualUpiEnabled:false});
  await h.context.rwPaymentApplyCurrentAccount();
  const config=h.writes.find(x=>x.path==='config/partnerPayments');
  assert.equal(config.value.publicUpiId,'roamwisepay@ybl');
  assert.equal(config.value.easySplitState,'under_review');
  assert.equal(config.options.merge,true);
  assert.equal(config.value.manualUpiEnabled,undefined);
  assert.equal(config.value.cashfreeEnabled,undefined);
  assert.equal(config.value.environment,undefined);
  assert.equal(h.writes.some(x=>x.path==='config/app'||x.path.startsWith('ledger/')),false);
  assert.equal(h.writes.find(x=>x.path==='paymentDestinations/old').value.active,false);
  assert.equal(h.writes.some(x=>x.path.startsWith('adminAuditLog/')),true);
});
test('persisting is idempotent and refuses to overwrite a different later UPI address', async () => {
  const existing=admin({publicUpiId:account.profile.upiId,activeDestinationId:account.profile.id,accountProfileVersion:account.profile.cutoverDate});
  await existing.context.rwPaymentApplyCurrentAccount();
  assert.equal(existing.writes.length,0);
  const future=admin({publicUpiId:'company@bank'});
  await future.context.rwPaymentApplyCurrentAccount();
  assert.equal(future.writes.length,0);
  assert.match(future.messages[0],/Another UPI destination/);
});
