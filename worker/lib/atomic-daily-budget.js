/* Server-side Firestore transactional budget reservations.
 * Not connected to vendor calls until integration tests and explicit approval.
 * Firestore transaction conflicts are retried by caller with same idempotency key.
 */
import {expenseDecision} from './finance-controls.js';
import {istBudgetDay} from './finance-reconciliation.js';
const ROOT='https://firestore.googleapis.com/v1/projects/';
const validKey=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,90}$/.test(x);
const val=n=>({integerValue:String(n)});
async function request(url,token,body){
 const r=await fetch(url,{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)});
 if(!r.ok){const msg=await r.text().catch(()=>'');throw new Error('firestore_transaction_'+r.status+':'+msg.slice(0,100));}
 return r.json();
}
export function budgetPaths(projectId,instant,expenseId){
 if(!validKey(projectId)||!validKey(expenseId))throw new Error('invalid_identifier');
 const base=ROOT+projectId+'/databases/(default)/documents';
 const day=istBudgetDay(instant).replace(/[^0-9]/g,'');
 return {base,day,aggregate:base+'/financeDailyBudgets/'+day,claim:base+'/financeExpenseClaims/'+day+'__'+expenseId};
}
function getInteger(doc,key){const v=doc?.fields?.[key]?.integerValue;return v===undefined?0:Number(v);}
export async function reserveDailyExpense({projectId,accessToken,expenseId,type,amountPaise,instant=new Date(),approved=false,maxAttempts=3}){
 if(!validKey(accessToken)||!validKey(expenseId))throw new Error('invalid_auth_or_id');
 const p=budgetPaths(projectId,instant,expenseId);
 const root=ROOT+projectId+'/databases/(default)/documents';
 for(let attempt=0;attempt<maxAttempts;attempt++){
  const tx=(await request(root+':beginTransaction',accessToken,{options:{readWrite:{}}})).transaction;
  if(!tx)throw new Error('transaction_unavailable');
  const r=await request(root+':batchGet',accessToken,{documents:[p.aggregate,p.claim],transaction:tx});
  // Firestore batchGet may return documents out of order.
  const docs=Array.isArray(r)?r:[];
  const find=path=>docs.find(x=>x.found?.name===path||x.missing===path)?.found;
  const existing=find(p.claim);
  if(existing)return {reserved:false,reason:'duplicate_expense_id',day:p.day};
  const budget=find(p.aggregate);
  const spent=getInteger(budget,'spentPaise'),reserved=getInteger(budget,'reservedPaise');
  const decision=expenseDecision({type,amountPaise,spentPaise:spent,reservedPaise:reserved,approved});
  if(!decision.allowed)return {reserved:false,reason:decision.reason,day:p.day};
  const next=reserved+amountPaise;
  if(!Number.isSafeInteger(next))throw new Error('overflow');
  const writes=[
   {update:{name:p.aggregate,fields:{spentPaise:val(spent),reservedPaise:val(next),day:{stringValue:p.day}}}},
   {update:{name:p.claim,fields:{amountPaise:val(amountPaise),type:{stringValue:type},state:{stringValue:'reserved'},day:{stringValue:p.day}}},currentDocument:{exists:false}}
  ];
  try{await request(root+':commit',accessToken,{transaction:tx,writes});return {reserved:true,reason:'reserved',day:p.day,aboveTarget:decision.aboveTarget};}
  catch(e){if(!/firestore_transaction_(409|412)/.test(String(e))||attempt===maxAttempts-1)throw e;}
 }
 throw new Error('budget_reservation_unavailable');
}
