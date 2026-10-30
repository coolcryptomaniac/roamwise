// Workers-native independent Cashfree payment lookup. No Node APIs.
export async function reconcileCashfreeWorkerPayment({orderId,paymentId,env,fetchImpl=fetch}){
 if(env?.CASHFREE_ENV!=='sandbox'||!env.CASHFREE_APP_ID||!env.CASHFREE_SECRET_KEY)
  throw new Error('sandbox_reconciliation_unavailable');
 if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(orderId))||!/^[0-9]{1,30}$/.test(String(paymentId)))
  throw new Error('invalid_payment_identity');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{
  const url='https://sandbox.cashfree.com/pg/orders/'+encodeURIComponent(orderId)+'/payments/'+encodeURIComponent(paymentId);
  const response=await fetchImpl(url,{method:'GET',headers:{
   'x-client-id':env.CASHFREE_APP_ID,'x-client-secret':env.CASHFREE_SECRET_KEY,
   'x-api-version':env.CASHFREE_API_VERSION||'2025-01-01',accept:'application/json'
  },signal:controller.signal,redirect:'error'});
  if(!response.ok)throw new Error('cashfree_lookup_failed');
  const data=await response.json();
  if(data?.order_id!==orderId||String(data?.cf_payment_id)!==String(paymentId)||data?.payment_status!=='SUCCESS')
   throw new Error('payment_identity_or_status_mismatch');
  if((typeof data.payment_amount!=='number'&&typeof data.payment_amount!=='string')||
    String(data.payment_amount).trim()==='')throw new Error('invalid_amount');
  const amount=Number(data.payment_amount);
  if(!Number.isFinite(amount)||amount<=0||!Number.isSafeInteger(Math.round(amount*100))||
    Math.abs(amount*100-Math.round(amount*100))>1e-7)throw new Error('invalid_amount');
  if(typeof data.payment_currency!=='string'||!/^[A-Z]{3}$/.test(data.payment_currency))
   throw new Error('invalid_currency');
  return {orderId,paymentId:String(paymentId),amountMinor:Math.round(amount*100),
   currency:data.payment_currency,status:'SUCCESS'};
 }finally{clearTimeout(timer);}
}
