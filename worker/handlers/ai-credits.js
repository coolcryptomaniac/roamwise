import {json} from '../lib/http.js';
import {verifyFirebaseIdToken} from '../lib/firebase-verify.js';
import {parseServiceAccount} from '../lib/service-account.js';
import {basicAIAccount,BASIC_AI_SYSTEM} from '../lib/basic-ai-policy.js';
import {workersAIText} from './ai.js';
import {guardAnswer,matchFacts,factsBlock} from '../lib/tusk-facts.js';
import {cfConfigured} from '../lib/cashfree-pg.js';
import {verifyCashfreeWorkerWebhook} from '../lib/cashfree-booking-webhook-verify.js';
import {creditCashfree,reconcileCreditOrder} from '../lib/ai-credit-payments.js';
import {AI_CREDIT_PACKS,AI_CREDIT_MODELS,AI_CREDIT_RATE_VERSION,AI_CREDIT_RATES_UNTIL,AI_CREDIT_FX,
 AI_CREDIT_SERVICE_PERCENT,AI_ORDER_RE,creditModel,creditEstimate,creditUsage,creditHash,creditBody} from '../lib/ai-credit-policy.js';

function reply(d,status=200){const r=json(d,status);r.headers.set('Cache-Control','private, no-store');return r;}
function ledger(env,subject){
  const stub=env.AI_CREDIT_ACCOUNTS.get(env.AI_CREDIT_ACCOUNTS.idFromName(subject));
  return async b=>{const r=await stub.fetch('https://credits.internal/',{method:'POST',body:JSON.stringify(b)});if(!r.ok)throw Error('ledger_unavailable');return r.json();};
}
const ready=env=>env.AI_CREDITS_ENABLED==='true'&&!!env.AI_CREDIT_ACCOUNTS&&!!env.AI_CREDIT_BUDGET&&!!env.AI?.run&&cfConfigured(env)&&['sandbox','live'].includes(env.CASHFREE_ENV)&&Date.now()<AI_CREDIT_RATES_UNTIL;
const budgetReady=env=>Number.isSafeInteger(Number(env.AI_CREDITS_DAILY_PROVIDER_PAISE))&&Number(env.AI_CREDITS_DAILY_PROVIDER_PAISE)>0;

async function webhook(request,env,deps){
  if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
  const raw=await creditBody(request,65536);
  if(!await verifyCashfreeWorkerWebhook({rawBody:raw,headers:request.headers,secret:env.CASHFREE_SECRET_KEY}))return reply({error:'invalid_signature'},401);
  const event=JSON.parse(new TextDecoder().decode(raw)),id=event?.data?.order?.order_id||event?.data?.refund?.order_id||event?.data?.order_id||event?.data?.dispute?.order_id;
  if(!AI_ORDER_RE.test(id||''))return reply({ok:true,ignored:true});
  const subject=id.split('_')[1],account=ledger(env,subject);
  if(/DISPUTE|CHARGEBACK/.test(String(event.type||''))){await account({op:'hold'});return reply({ok:true,held:true});}
  const result=await reconcileCreditOrder(env,account,id,subject,deps.fetch);
  if(!result.ok)throw Error('ledger_unavailable');return reply({ok:true,status:result.status});
}

export async function handleAICredits(request,env,path,deps={}){
  try{
    if(path==='ai/credits/catalogue'&&request.method==='GET')return reply({
      enabled:ready(env)&&budgetReady(env),packs:AI_CREDIT_PACKS,currency:'INR',creditPaise:1,rateVersion:AI_CREDIT_RATE_VERSION,
      billingInrPerUsd:AI_CREDIT_FX,servicePercent:AI_CREDIT_SERVICE_PERCENT,minServicePaise:1,ratesUntil:new Date(AI_CREDIT_RATES_UNTIL).toISOString(),
      models:Object.values(AI_CREDIT_MODELS).map(m=>({id:m.id,label:m.label,available:!!creditModel(m.id,env),inputUsdPerMillion:m.input,outputUsdPerMillion:m.output,gatewayPercent:m.gateway?5:0})),
      environment:env.CASHFREE_ENV==='live'?'production':'sandbox'
    });
    if(!env.AI_CREDIT_ACCOUNTS)return reply({error:'credits_unavailable'},503);
    if(path==='ai/credits/webhook')return await webhook(request,env,deps);
    let claims;
    try{const token=/^Bearer\s+(.+)$/i.exec(request.headers.get('authorization')||'')?.[1];if(!token)throw Error();claims=await (deps.verify||verifyFirebaseIdToken)(token,parseServiceAccount(env).project_id);}catch(_){return reply({error:'sign_in_required'},401);}
    if(!basicAIAccount(claims))return reply({error:'verified_account_required'},403);
    const subject=(await creditHash(claims.uid)).slice(0,32),account=ledger(env,subject);
    if(path==='ai/credits/balance'&&request.method==='GET')return reply(await account({op:'status'}));
    const status=path.match(/^ai\/credits\/orders\/(ai_[a-f0-9]{32}_[a-f0-9]{8})$/);
    if(status&&request.method==='GET'){
      if(status[1].split('_')[1]!==subject)return reply({error:'order_not_found'},404);
      const r=await reconcileCreditOrder(env,account,status[1],subject,deps.fetch);return reply(r,r.ok?200:503);
    }
    if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
    if(!ready(env)||!budgetReady(env))return reply({error:'credits_unavailable'},503);
    const body=JSON.parse(new TextDecoder().decode(await creditBody(request)));
    if(path==='ai/credits/order'){
      if(!AI_CREDIT_PACKS.some(p=>p.id===body.packId)||body.termsVersion!==AI_CREDIT_RATE_VERSION)return reply({error:'invalid_pack_or_terms'},400);
      const phone=String(body.phone||'').replace(/^\+91/,'');if(!/^[6-9]\d{9}$/.test(phone))return reply({error:'phone_required'},400);
      const id='ai_'+subject+'_'+crypto.randomUUID().replace(/-/g,'').slice(0,8);
      const saved=await account({op:'prepareOrder',id,packId:body.packId,environment:env.CASHFREE_ENV,idempotencyKey:crypto.randomUUID()});
      if(!saved.ok)return reply(saved,409);const o=saved.order;
      if(saved.reused&&o.packId!==body.packId)return reply({error:'pending_order',orderId:o.id},409);
      let data;
      try{data=await creditCashfree(env,'/orders',{method:'POST',headers:{'x-idempotency-key':o.idempotencyKey},body:JSON.stringify({order_id:o.id,order_amount:o.amountPaise/100,order_currency:'INR',order_expiry_time:new Date(o.expiresAt).toISOString(),customer_details:{customer_id:subject,customer_phone:phone},order_meta:{return_url:'https://roamwise.co.in/ai-credits/?order_id='+o.id,notify_url:'https://roamwise-api.founder-f53.workers.dev/ai/credits/webhook'},order_note:'RoamWise prepaid AI service'})},deps.fetch);}
      catch(_){data=await creditCashfree(env,'/orders/'+o.id,{},deps.fetch);}
      if(data.order_id!==o.id||data.order_currency!=='INR'||Math.round(Number(data.order_amount)*100)!==o.amountPaise||data.customer_details?.customer_id!==subject)throw Error('payment_mismatch');
      if(data.order_status==='PAID')return reply({orderId:o.id,checkStatus:true});
      if(!data.payment_session_id||data.order_status!=='ACTIVE')return reply({error:'payment_not_active',orderId:o.id},409);
      return reply({orderId:o.id,amountPaise:o.amountPaise,paymentSessionId:data.payment_session_id,environment:env.CASHFREE_ENV==='live'?'production':'sandbox'});
    }
    if(!['ai/credits/quote','ai/credits/run'].includes(path))return reply({error:'not_found'},404);
    const prompt=typeof body.prompt==='string'?body.prompt.trim():'';
    if(!prompt||prompt.length>4000)return reply({error:'invalid_prompt'},400);
    const model=creditModel(body.modelId,env);if(!model)return reply({error:'model_unavailable'},409);
    const facts=matchFacts(prompt),messages=[{role:'system',content:BASIC_AI_SYSTEM},{role:'user',content:(facts.length?factsBlock(facts).slice(0,2000)+'\n\n':'')+prompt}];
    const hash=await creditHash(AI_CREDIT_RATE_VERSION+'|'+model.id+'|'+JSON.stringify(messages));
    if(path==='ai/credits/quote'){
      const q={id:crypto.randomUUID(),hash,modelId:model.id,price:creditEstimate(model,messages),rateVersion:AI_CREDIT_RATE_VERSION};
      const result=await account({op:'quote',quote:q});return reply(result,result.ok?200:429);
    }
    if(typeof body.quoteId!=='string'||!/^[a-f0-9-]{36}$/.test(body.quoteId))return reply({error:'quote_required'},400);
    const reserved=await account({op:'reserve',id:body.quoteId,hash});
    if(!reserved.ok)return reply(reserved,409);if(reserved.replay)return reply(reserved.result);
    const quote=reserved.quote,id=subject+'-'+quote.id;
    const stub=env.AI_CREDIT_BUDGET.get(env.AI_CREDIT_BUDGET.idFromName('paid-'+new Date().toISOString().slice(0,10)));
    const budget=async b=>{const r=await stub.fetch('https://budget.internal/',{method:'POST',body:JSON.stringify({id,...b})});if(!r.ok)throw Error('budget_unavailable');return r.json();};
    let started=false;
    try{
      const cap=await budget({op:'reserve',amount:quote.price.modelPaise+quote.price.gatewayPaise});
      if(!cap.ok)throw Error('paid_pool_busy');
      started=true;
      let timer,out;
      try{out=await Promise.race([env.AI.run(model.model,{messages,max_completion_tokens:model.maxOutput,stream:false},model.gateway?{gateway:{id:env.AI_CREDITS_GATEWAY_ID,skipCache:true,collectLog:false}}:undefined),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('provider_unavailable')),25000);})]);}finally{clearTimeout(timer);}
      const text=workersAIText(out);if(!text)throw Error('provider_unavailable');
      const usage=creditUsage(model,out);
      // Missing telemetry: deliver without charging the traveller. The provider
      // reservation remains charged to our daily budget. Never invent usage.
      if(usage)await budget({op:'settle',actual:usage.modelPaise+usage.gatewayPaise});
      const charge=usage?Math.min(quote.price.totalPaise,usage.totalPaise):0;
      const complete=await account({op:'complete',id:quote.id,charge,text:guardAnswer(text),receipt:usage?{...usage,rateVersion:AI_CREDIT_RATE_VERSION,capped:charge<usage.totalPaise}:null});
      if(!complete.ok)throw Error('ledger_unavailable');return reply(complete.result);
    }catch(_){
      const r=await account({op:'complete',id:quote.id,charge:0,text:'',error:started?'provider_unavailable':'paid_pool_busy'});
      return reply(r.result||{error:'credits_unavailable'},503);
    }
  }catch(e){
    const known=['payload_too_large','order_not_found','payment_mismatch','refund_mismatch','environment_mismatch'];
    return reply({error:known.includes(e.message)?e.message:'credits_unavailable'},e.message==='payload_too_large'?413:e.message==='order_not_found'?404:503);
  }
}
