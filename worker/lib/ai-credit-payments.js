import {cfBase,cfHeaders} from './cashfree-pg.js';
import {cashfreeTransportFetch} from './cashfree-transport.js';
export async function creditCashfree(env,path,options={},transport=cashfreeTransportFetch){
  const r=await transport(cfBase(env)+'/pg'+path,{...options,method:options.method||'GET',headers:cfHeaders(env,options.headers),signal:AbortSignal.timeout(12000),redirect:'error'});
  const data=await r.json().catch(()=>null);
  if(!r.ok)throw Error('payment_service_unavailable');return data;
}
const paise=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*100))&&Math.abs(n*100-Math.round(n*100))<1e-7?Math.round(n*100):-1;
export async function reconcileCreditOrder(env,account,id,subject,transport){
  const {order}=await account({op:'order',id});
  if(!order)throw Error('order_not_found');
  if(order.environment!==env.CASHFREE_ENV)throw Error('environment_mismatch');
  const data=await creditCashfree(env,'/orders/'+id,{},transport);
  if(data.order_id!==id||data.order_currency!=='INR'||paise(data.order_amount)!==order.amountPaise||data.customer_details?.customer_id!==subject)throw Error('payment_mismatch');
  if(data.order_status!=='PAID')return account({op:'reconcile',id,paid:false,status:data.order_status});
  const [payments,refunds]=await Promise.all([
    creditCashfree(env,'/orders/'+id+'/payments',{},transport),creditCashfree(env,'/orders/'+id+'/refunds',{},transport)
  ]);
  if(!Array.isArray(payments)||!Array.isArray(refunds))throw Error('payment_service_unavailable');
  const paid=payments.filter(p=>p.payment_status==='SUCCESS'&&p.is_captured===true&&p.order_id===id&&p.payment_currency==='INR'&&paise(p.payment_amount)===order.amountPaise);
  if(paid.length!==1||!/^\d{1,30}$/.test(String(paid[0].cf_payment_id)))throw Error('payment_mismatch');
  const paymentId=String(paid[0].cf_payment_id),seen=new Set();let refunded=0,pending=false;
  for(const r of refunds){
    if(r.order_id!==id||r.refund_currency!=='INR'||!/^\d{1,30}$/.test(String(r.cf_payment_id))||paise(r.refund_amount)<0)throw Error('refund_mismatch');
    // Automatic refunds for another attempt on the same order do not reverse
    // the captured payment that funded this customer's AI credits.
    if(String(r.cf_payment_id)!==paymentId)continue;
    const rid=String(r.cf_refund_id||r.refund_id||'');if(!rid||seen.has(rid))throw Error('refund_mismatch');seen.add(rid);
    if(r.refund_status==='SUCCESS')refunded+=paise(r.refund_amount);
    else if(!['FAILED','CANCELLED','REJECTED'].includes(r.refund_status))pending=true;
  }
  if(refunded>order.amountPaise)throw Error('refund_mismatch');
  return account({op:'reconcile',id,paid:true,paymentId,refunded,pending});
}
