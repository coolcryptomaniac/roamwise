/* Cashfree one-time checkout. Secret keys stay exclusively on the Worker.
 * Auth, prices, receipt ownership and paid order status are server-verified. */
import { json } from '../lib/http.js';
import { cashfreeEntitlementForPlan, priceForPlan } from '../lib/pricing.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, updateDoc } from '../lib/firestore-rest.js';

const SANDBOX_BASE = 'https://sandbox.cashfree.com';
const LIVE_BASE = 'https://api.cashfree.com';
function isLive(env){ return String(env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'live'; }
function cashfreeBase(env){ return isLive(env) ? LIVE_BASE : SANDBOX_BASE; }
function safeId(v){ return String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 45); }
function cfHeaders(env, extra){
  return Object.assign({
    'content-type':'application/json',
    'x-api-version':env.CASHFREE_API_VERSION || '2026-01-01',
    'x-client-id':env.CASHFREE_APP_ID,
    'x-client-secret':env.CASHFREE_SECRET_KEY
  }, extra || {});
}
function backendUnavailable(){
  return json({ error:'payment_backend_unavailable',
    message:'Secure payment verification is temporarily unavailable. No payment was started. Please contact RoamWise support.' }, 503);
}
async function authenticatedContext(request, env){
  if(!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY || !env.FIREBASE_SERVICE_ACCOUNT_JSON){
    return {error:json({error:'not_configured',message:'Cashfree checkout is not fully configured on this server yet.'},501)};
  }
  const auth = request.headers && request.headers.get ? request.headers.get('authorization') || '' : '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if(!match) return {error:json({error:'unauthorized',message:'Sign in before payment.'},401)};
  // Credential parsing and OAuth are BACKEND operations, not customer login.
  // Never return private-key details or Google OAuth response bodies to users.
  let sa;
  try { sa = parseServiceAccount(env); }
  catch (_) { return {error:backendUnavailable()}; }
  // This payment service accepts only credentials for RoamWise. The generic
  // parser is also used by push notifications and must stay project-neutral.
  if(sa.project_id !== 'roamwisepro') return {error:backendUnavailable()};
  let claims;
  try { claims = await verifyFirebaseIdToken(match[1], sa.project_id); }
  catch (_) { return {error:json({error:'unauthorized',message:'Your sign-in could not be verified. Please sign in again.'},401)}; }
  let accessToken;
  try { accessToken = await getServiceAccountAccessToken(env); }
  catch (_) { return {error:backendUnavailable()}; }
  return {claims,accessToken,projectId:sa.project_id};
}
function paymentRecord(orderId, receipt, paidAt){
  return {
    uid:receipt.uid,email:receipt.email || '',
    amount:Math.round(Number(receipt.amountINR)*100),amountINR:Number(receipt.amountINR),
    currency:'INR',provider:'cashfree',providerRef:orderId,planId:receipt.planId,
    status:'paid',created:receipt.createdAt || paidAt,
    receivedDate:String(paidAt).slice(0,10),paidAt
  };
}
function expiryMillis(value){
  if(value == null || value === '') return 0;
  const numeric=Number(value);
  if(Number.isFinite(numeric)) return numeric;
  const parsed=Date.parse(String(value));
  return Number.isFinite(parsed)?parsed:0;
}
export function createCashfreeHandlers(overrides){
  const deps=Object.assign({context:authenticatedContext,getDoc,updateDoc,request:fetch},overrides||{});
  async function requireSandboxAdmin(env,ctx){
    if(isLive(env))return null;
    try{
      const admin=await deps.getDoc(env,ctx.accessToken,ctx.projectId,`admins/${ctx.claims.uid}`);
      if(admin)return null;
    }catch(_){return json({error:'sandbox_access_unavailable',message:'Could not verify sandbox access.'},502);}
    return json({error:'sandbox_admin_only',message:'Cashfree sandbox is restricted to an administrator.'},403);
  }
  async function requireCheckoutEnabled(env,ctx){
    let config;
    try{config=await deps.getDoc(env,ctx.accessToken,ctx.projectId,'config/app');}
    catch(_){return json({error:'payment_config_unavailable',message:'Could not verify payment configuration.'},502);}
    if(!config||config.PAYMENT_PROVIDER!=='cashfree')return json({error:'checkout_disabled',message:'Cashfree checkout is currently disabled.'},503);
    if(String(config.CASHFREE_ENVIRONMENT||'sandbox').toLowerCase()!==(isLive(env)?'live':'sandbox')){
      return json({error:'environment_mismatch',message:'Admin and Worker Cashfree environments do not match.'},503);
    }
    return null;
  }
  async function handleCashfreeOrder(request,env){
    const ctx=await deps.context(request,env);
    if(ctx.error)return ctx.error;
    const sandboxError=await requireSandboxAdmin(env,ctx);
    if(sandboxError)return sandboxError;
    const configError=await requireCheckoutEnabled(env,ctx);
    if(configError)return configError;
    try{
      const currentUser=await deps.getDoc(env,ctx.accessToken,ctx.projectId,`users/${ctx.claims.uid}`);
      const currentUntil=expiryMillis(currentUser&&currentUser.proUntil);
      if(currentUser&&currentUser.pro===true&&(!currentUntil||currentUntil>Date.now())){
        return json({error:'already_entitled',message:'This account already has an active paid plan. Contact support for an upgrade or extension.'},409);
      }
    }catch(_){return json({error:'entitlement_check_failed',message:'Could not verify the current account plan.'},502);}
    let body;
    try{body=await request.json();}catch(_){return json({error:'invalid_json'},400);}
    const amount=Math.round(Number(body&&body.amount)*100)/100;
    if(!Number.isFinite(amount)||amount<=0)return json({error:'invalid_amount'},400);
    const customer=(body&&body.customer)||{};
    const phone=String(customer.phone||'').replace(/\s+/g,'');
    if(!/^\+?\d{7,15}$/.test(phone))return json({error:'missing_customer_phone',message:'Cashfree needs a valid phone number on your account to start checkout.'},422);
    const meta=(body&&body.meta)||{};
    const knownPrice=priceForPlan(meta.planId);
    if(knownPrice==null)return json({error:'unknown_plan',message:'Could not verify the price for this plan.'},400);
    if(amount!==knownPrice)return json({error:'amount_mismatch',message:'The submitted amount does not match this plan’s real price.'},400);
    const entitlement=cashfreeEntitlementForPlan(meta.planId);
    if(!entitlement)return json({error:'unsupported_plan',message:'Cashfree is currently available only for one-time plans.'},409);
    const orderId='rw_'+safeId(Date.now()+'_'+Math.random().toString(36).slice(2,8));
    const orderBody={
      order_id:orderId,order_amount:amount,order_currency:'INR',
      customer_details:{customer_id:safeId(ctx.claims.uid),customer_phone:phone.slice(0,20)}
    };
    if(ctx.claims.email||customer.email)orderBody.customer_details.customer_email=String(ctx.claims.email||customer.email).slice(0,160);
    if(env.PAYMENT_RETURN_URL)orderBody.order_meta={return_url:env.PAYMENT_RETURN_URL};
    if(meta.planId||meta.label)orderBody.order_note=String(meta.label||meta.planId||'').slice(0,200);
    let r,data;
    try{
      r=await deps.request(cashfreeBase(env)+'/pg/orders',{
        method:'POST',headers:cfHeaders(env,{'x-request-id':orderId,'x-idempotency-key':orderId}),body:JSON.stringify(orderBody)
      });
      data=await r.json().catch(()=>({}));
    }catch(_){return json({error:'network_error',message:'Could not reach Cashfree.'},502);}
    if(!r.ok||!data.payment_session_id){
      return json({error:'cashfree_order_failed',message:data.message||'Cashfree order creation failed.'},r.status>=400?r.status:502);
    }
    if(String(data.order_id||'')!==orderId||Number(data.order_amount)!==amount||data.order_currency!=='INR'){
      return json({error:'cashfree_order_mismatch',message:'Cashfree returned an order that did not match the requested purchase.'},502);
    }
    try{
      await deps.updateDoc(env,ctx.accessToken,ctx.projectId,`cashfreeOrders/${data.order_id||orderId}`,{
        uid:ctx.claims.uid,email:String(ctx.claims.email||customer.email||'').slice(0,160),cfOrderId:data.order_id,
        planId:String(meta.planId),amountINR:amount,currency:'INR',environment:isLive(env)?'live':'sandbox',
        status:'ACTIVE',fulfilled:false,createdAt:new Date().toISOString()
      });
    }catch(_){return json({error:'payment_record_failed',message:'The payment session could not be recorded safely. Check My Payments before trying again.'},502);}
    return json({payment_session_id:data.payment_session_id,order_id:data.order_id,
      order_amount:data.order_amount!=null?data.order_amount:amount,order_currency:data.order_currency||'INR',
      environment:isLive(env)?'production':'sandbox'});
  }
  async function handleCashfreeOrderStatus(request,env,orderId){
    const ctx=await deps.context(request,env);
    if(ctx.error)return ctx.error;
    const sandboxError=await requireSandboxAdmin(env,ctx);
    if(sandboxError)return sandboxError;
    const id=safeId(orderId);
    if(!id)return json({error:'invalid_order_id'},400);
    let receipt;
    try{receipt=await deps.getDoc(env,ctx.accessToken,ctx.projectId,`cashfreeOrders/${id}`);}
    catch(_){return json({error:'payment_record_unavailable'},502);}
    if(!receipt)return json({error:'payment_record_not_found'},404);
    if(receipt.uid!==ctx.claims.uid)return json({error:'forbidden'},403);
    let r,data;
    try{
      r=await deps.request(cashfreeBase(env)+'/pg/orders/'+encodeURIComponent(id),{method:'GET',headers:cfHeaders(env)});
      data=await r.json().catch(()=>({}));
    }catch(_){return json({error:'network_error'},502);}
    if(!r.ok)return json({error:'cashfree_status_failed',message:data.message||'Could not fetch order status.'},r.status>=400?r.status:502);
    if(String(data.order_id||'')!==id||data.order_currency!=='INR'||Number(data.order_amount)!==Number(receipt.amountINR)){
      return json({error:'payment_integrity_failed',message:'Cashfree returned an order that does not match the recorded purchase.'},409);
    }
    let persisted=receipt.fulfilled===true;
    const entitlement=cashfreeEntitlementForPlan(receipt.planId);
    if(data.order_status==='PAID'&&entitlement&&!persisted){
      const paidAt=new Date().toISOString();
      const method=receipt.planId==='founder'?'founder-cashfree':'cashfree';
      try{
        await deps.updateDoc(env,ctx.accessToken,ctx.projectId,`payments/${id}`,paymentRecord(id,receipt,paidAt));
        await deps.updateDoc(env,ctx.accessToken,ctx.projectId,`users/${ctx.claims.uid}`,{
          pro:true,proTier:entitlement.tier,proMethod:method,proPayId:id,proPlanId:receipt.planId,
          proAmount:Number(receipt.amountINR),proVia:'cashfree',proAt:paidAt,proUntil:entitlement.until
        });
        await deps.updateDoc(env,ctx.accessToken,ctx.projectId,`cashfreeOrders/${id}`,{
          status:'PAID',fulfilled:true,paidAt,updatedAt:paidAt
        });
        persisted=true;
      }catch(_){return json({error:'entitlement_persistence_failed',message:'Payment is confirmed, but account activation is still retrying. Check My Payments.'},503);}
    }
    return json({order_id:data.order_id||id,order_status:data.order_status||'UNKNOWN',
      entitlement:entitlement?{planId:entitlement.planId,tier:entitlement.tier,until:entitlement.until,persisted}:null});
  }
  return {handleCashfreeOrder,handleCashfreeOrderStatus};
}
const handlers=createCashfreeHandlers();
export const handleCashfreeOrder=handlers.handleCashfreeOrder;
export const handleCashfreeOrderStatus=handlers.handleCashfreeOrderStatus;
