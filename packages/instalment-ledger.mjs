// RoamWise package instalment ledger (pure calculations; no payment capture).
// All amounts integer paise. A production adapter must lock and authenticate
// quotes, verify Cashfree webhooks independently, and commit atomically.
export function splitInstallments(totalMinor, percentages) {
 if(!Number.isSafeInteger(totalMinor)||totalMinor<=0)throw Error('Invalid amount');
 if(!Array.isArray(percentages)||percentages.length<1||percentages.length>5||
  percentages.some(p=>!Number.isSafeInteger(p)||p<=0)||percentages.reduce((a,b)=>a+b,0)!==100)
  throw Error('Installments must be positive integers summing to 100');
 let assigned=0;
 return percentages.map((pct,index)=>{const amount=index===percentages.length-1?totalMinor-assigned:Math.floor(totalMinor*pct/100);assigned+=amount;return {ordinal:index+1,percentage:pct,amountMinor:amount,status:'pending'};});
}
export function allocateSupplierCash({capturedMinor,refundedMinor=0,amountDueMinor,feesMinor=0,alreadyRemittedMinor=0}) {
 const nums=[capturedMinor,refundedMinor,amountDueMinor,feesMinor,alreadyRemittedMinor];
 if(nums.some(n=>!Number.isSafeInteger(n)||n<0))throw Error('Invalid ledger amount');
 if(refundedMinor>capturedMinor)throw Error('Refund exceeds receipts');
 const available=capturedMinor-refundedMinor-feesMinor-alreadyRemittedMinor;
 return {availableMinor:Math.max(0,available),remittancePossibleMinor:Math.min(Math.max(0,available),Math.max(0,amountDueMinor-alreadyRemittedMinor)),automaticPayoutAuthorized:false};
}
export function validateConfirmedQuote(q){
 const required=['id','customerUid','supplierHoldId','supplierApproval','cancellationPolicyVersion','currency','totalMinor','partnerDueMinor','expiresAt'];
 if(!q||required.some(k=>q[k]===undefined||q[k]===null||q[k]===''))return false;
 return q.currency==='INR'&&Number.isSafeInteger(q.totalMinor)&&q.totalMinor>0&&
 Number.isSafeInteger(q.partnerDueMinor)&&q.partnerDueMinor>=0&&q.partnerDueMinor<=q.totalMinor&&
 Date.parse(q.expiresAt)>Date.now()&&q.supplierApproval===true;
}
