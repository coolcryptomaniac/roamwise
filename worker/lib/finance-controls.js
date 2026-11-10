/* Pure, fail-closed finance controls. This module does NOT move funds.
 * Durable reservation and settlement must occur in a server-side atomic transaction.
 * The founder's Rs 500/day cap applies to discretionary automation expenses only.
 * Statutory refunds, customer liabilities, vendor payouts and taxes are never reclassified
 * as discretionary expenses to bypass approval; those flows require separate policies. */
export const DAILY_HARD_CAP_PAISE=50000;
export const DAILY_TARGET_LOW_PAISE=10000;
export const DAILY_TARGET_HIGH_PAISE=20000;
export const EXPENSE_TYPES=Object.freeze(['ai_inference','seo_tools','research_api','approved_marketing','approved_automation']);
const nonneg=x=>Number.isSafeInteger(x)&&x>=0;
export function expenseDecision({type,amountPaise,spentPaise,reservedPaise=0,approved=true}){
 if(!EXPENSE_TYPES.includes(type))return {allowed:false,reason:'category_not_authorized'};
 if(!approved)return {allowed:false,reason:'not_approved'};
 if(![amountPaise,spentPaise,reservedPaise].every(nonneg)||amountPaise===0)return {allowed:false,reason:'invalid_amount'};
 if(amountPaise>DAILY_HARD_CAP_PAISE-spentPaise-reservedPaise)return {allowed:false,reason:'daily_hard_cap'};
 return {allowed:true,reason:'within_cap',remainingPaise:DAILY_HARD_CAP_PAISE-spentPaise-reservedPaise-amountPaise,aboveTarget:spentPaise+reservedPaise+amountPaise>DAILY_TARGET_HIGH_PAISE};
}
export function validateJournal(journal){
 if(!journal||!journal.id||!journal.currency||journal.currency!=='INR'||!Array.isArray(journal.lines)||journal.lines.length<2)return {valid:false,reason:'invalid_journal'};
 const seen=new Set();let debit=0,credit=0;
 for(const line of journal.lines){
  if(!line||!line.account||!['debit','credit'].includes(line.side)||!Number.isSafeInteger(line.amountPaise)||line.amountPaise<=0)return {valid:false,reason:'invalid_line'};
  if(line.side==='debit')debit+=line.amountPaise;else credit+=line.amountPaise;
  seen.add(line.account);
 }
 if(!Number.isSafeInteger(debit)||!Number.isSafeInteger(credit)||debit!==credit)return {valid:false,reason:'unbalanced'};
 if(seen.size<2)return {valid:false,reason:'same_account'};
 return {valid:true,totalPaise:debit};
}
export function journalForGatewayPayment({id,amountPaise,receivableAccount='cashfree_clearing',liabilityAccount='customer_order_liability'}){
 const journal={id,currency:'INR',lines:[{account:receivableAccount,side:'debit',amountPaise},{account:liabilityAccount,side:'credit',amountPaise}]};
 return validateJournal(journal).valid?journal:null;
}
export function eligibleReward({paid,refunded,disputed,settled,orderTotalPaise,rateBps=0,capPaise=0}){
 if(!paid||!settled||refunded||disputed||![orderTotalPaise,rateBps,capPaise].every(nonneg)||rateBps>10000)return 0;
 return Math.min(Math.floor(orderTotalPaise*rateBps/10000),capPaise);
}
