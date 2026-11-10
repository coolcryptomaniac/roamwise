/* Pure read-only reconciliation for a single RoamWise order.
 * No refunds, settlement writes or external API calls. All amounts INR paise.
 * Missing or contradictory evidence always produces a manual exception. */
const money=x=>Number.isSafeInteger(x)&&x>=0;
export function reconcileOrder({order,payment,journal,supplier,refund}={}){
 const issues=[];
 if(!order||!order.id||!money(order.totalPaise))return {ok:false,issues:['missing_or_invalid_order'],action:'hold'};
 if(!payment||payment.orderId!==order.id||payment.verified!==true||payment.currency!=='INR'||!money(payment.amountPaise)||payment.amountPaise!==order.totalPaise)issues.push('payment_unverified_or_mismatch');
 if(payment?.status!=='paid'&&payment?.status!=='refunded')issues.push('payment_not_final');
 if(!journal||journal.orderId!==order.id||journal.posted!==true||!money(journal.debitPaise)||!money(journal.creditPaise)||journal.debitPaise!==journal.creditPaise||journal.debitPaise!==order.totalPaise)issues.push('journal_missing_or_unbalanced');
 if(order.fulfilmentState==='submitted'&&(!supplier||supplier.orderId!==order.id||!supplier.providerOrderId))issues.push('supplier_reference_missing');
 if(order.status==='refunded_to_wallet'||order.status==='refunded'){
  if(!refund||refund.orderId!==order.id||!money(refund.amountPaise)||refund.amountPaise!==order.totalPaise||!['pending','processing','settled'].includes(refund.status))issues.push('refund_not_reconciled');
  if(refund?.status!=='settled')issues.push('refund_not_settled');
 }
 if(order.status==='paid'&&payment?.status==='refunded')issues.push('order_payment_state_conflict');
 return {ok:issues.length===0,issues,action:issues.length?'hold':'reconciled'};
}
export function reconcileBatch(rows){
 const seen=new Set(),exceptions=[];
 let checked=0,ok=0;
 for(const row of rows||[]){
  checked++;const id=row?.order?.id;
  if(!id||seen.has(id)){exceptions.push({id:id||null,issues:['duplicate_or_missing_order_id']});continue;}
  seen.add(id);const r=reconcileOrder(row);
  if(r.ok)ok++;else exceptions.push({id,issues:r.issues});
 }
 return {checked,ok,exceptions,hasExceptions:exceptions.length>0};
}
export function istBudgetDay(instant){
 const d=new Date(instant);
 if(!Number.isFinite(d.getTime()))throw new Error('invalid_timestamp');
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}
