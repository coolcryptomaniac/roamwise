// Server-only Cashfree payment lookup. Supply credentials via backend secrets;
// never expose this adapter or its credentials to browser clients.
export function createCashfreePaymentReconciler({appId,secretKey,environment='sandbox',fetchImpl=globalThis.fetch,timeoutMs=5000}) {
 if(typeof appId!=='string'||!appId||typeof secretKey!=='string'||!secretKey)
  throw new TypeError('Cashfree backend credentials required');
 if(!['sandbox','production'].includes(environment)) throw new RangeError('Invalid Cashfree environment');
 if(typeof fetchImpl!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>30000)
  throw new TypeError('Invalid Cashfree API adapter');
 const origin=environment==='production'?'https://api.cashfree.com':'https://sandbox.cashfree.com';
 return async ({orderId,paymentId})=>{
  if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(orderId||''))||!/^[0-9]{1,30}$/.test(String(paymentId||'')))
   throw new TypeError('Invalid order/payment identifier');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
   const response=await fetchImpl(origin+'/pg/orders/'+encodeURIComponent(orderId)+'/payments/'+encodeURIComponent(paymentId),{
    method:'GET',headers:{'x-client-id':appId,'x-client-secret':secretKey,'x-api-version':'2023-08-01','accept':'application/json'},signal:controller.signal,redirect:'error'
   });
   if(!response.ok) throw new Error('Cashfree reconciliation unavailable');
   const data=await response.json();
   if (!data || (typeof data.payment_amount !== 'number' && typeof data.payment_amount !== 'string') || String(data.payment_amount).trim()==='')
    throw new Error('Invalid Cashfree payment amount');
   const amount=Number(data.payment_amount);
   if(!Number.isFinite(amount)||amount<=0||!Number.isSafeInteger(Math.round(amount*100))||Math.abs(amount*100-Math.round(amount*100))>1e-7)
    throw new Error('Invalid Cashfree payment amount');
   if (data.order_id !== orderId || String(data.cf_payment_id) !== String(paymentId))
    throw new Error('Cashfree payment identity mismatch');
   return {orderId:data.order_id,paymentId:String(data.cf_payment_id),status:data.payment_status,
    amountMinor:Math.round(amount*100),currency:data.payment_currency};
  } finally {clearTimeout(timer)}
 };
}
