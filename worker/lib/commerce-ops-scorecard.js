/* Read-only operations intelligence. No spending, sending, payment or supplier writes.
 * Every missing metric is unknown, not zero. UI must distinguish verified from estimated. */
const isCount=n=>Number.isSafeInteger(n)&&n>=0;
export function commerceScorecard(input={}){
 const metrics=['visits','leads','qualifiedLeads','paidOrders','fulfilledOrders','refunds','supportExceptions','outreachSent','outreachReplies'];
 const values={},missing=[];
 for(const k of metrics){if(isCount(input[k]))values[k]=input[k];else{values[k]=null;missing.push(k);}}
 const rate=(num,den)=>num===null||den===null||den===0?null:Math.round(num/den*10000)/100;
 const conversion=rate(values.paidOrders,values.visits),replyRate=rate(values.outreachReplies,values.outreachSent);
 const flags=[];
 if(values.supportExceptions!==null&&values.supportExceptions>0)flags.push('review_support_exceptions');
 if(values.refunds!==null&&values.paidOrders!==null&&values.refunds>values.paidOrders)flags.push('refund_count_inconsistent');
 if(values.fulfilledOrders!==null&&values.paidOrders!==null&&values.fulfilledOrders>values.paidOrders)flags.push('fulfillment_count_inconsistent');
 if(values.outreachReplies!==null&&values.outreachSent!==null&&values.outreachReplies>values.outreachSent)flags.push('outreach_count_inconsistent');
 return {values,missing,conversionPercent:conversion,replyRatePercent:replyRate,flags,complete:missing.length===0};
}
export function chooseNextAction(report){
 if(report.flags.includes('review_support_exceptions'))return 'Resolve customer support and payment exceptions before increasing traffic';
 if(report.flags.length)return 'Investigate inconsistent metrics before automated decisions';
 if(report.values.paidOrders===null)return 'Connect verified payment/order analytics';
 if(report.values.paidOrders===0)return 'Test checkout and improve high-intent offers before increasing outreach';
 if(report.conversionPercent!==null&&report.conversionPercent<1)return 'Audit checkout friction and product-page clarity';
 if(report.replyRatePercent!==null&&report.replyRatePercent<1)return 'Improve segmentation and verify offer relevance';
 return 'Improve repeat purchase and partner fulfillment reliability';
}
