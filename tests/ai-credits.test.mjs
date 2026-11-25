import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {webcrypto} from 'node:crypto';
import {AICreditAccount,AICreditBudget} from '../worker/lib/ai-credit-ledger.js';
import {handleAICredits} from '../worker/handlers/ai-credits.js';
import {AI_CREDIT_PACKS,AI_CREDIT_RATE_VERSION,AI_CREDIT_MODELS,creditPrice,creditHash,creditModel} from '../worker/lib/ai-credit-policy.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const day=86400000;
function storage(){
 const map=new Map();let alarm=null,tail=Promise.resolve();
 const s={get:async k=>structuredClone(map.get(k)),put:async(k,v)=>{if(typeof k==='string')map.set(k,structuredClone(v));else for(const [a,b]of Object.entries(k))map.set(a,structuredClone(b));},delete:async k=>map.delete(k),list:async opts=>new Map([...map].filter(([k])=>k.startsWith(opts.prefix)).slice(0,opts.limit)),getAlarm:async()=>alarm,setAlarm:async t=>{alarm=t;},deleteAll:async()=>map.clear(),map};
 s.transaction=fn=>{const p=tail.then(()=>fn(s));tail=p.catch(()=>{});return p;};return s;
}
function account(env={}){const st=storage(),obj=new AICreditAccount({storage:st},env);return {st,obj,call:async b=>(await obj.fetch(new Request('https://test/',{method:'POST',body:JSON.stringify(b)}))).json()};}
const orderId='ai_'+'a'.repeat(32)+'_12345678';
async function fund(a,amount=1000){
 await a.call({op:'prepareOrder',id:orderId,packId:'inr10',environment:'sandbox',idempotencyKey:'test'});
 return a.call({op:'reconcile',id:orderId,paid:true,refunded:1000-amount,paymentId:'123'});
}
async function quote(a,id='q',cost=10){return a.call({op:'quote',quote:{id,hash:'hash',modelId:'standard',price:{modelPaise:cost-1,gatewayPaise:0,servicePaise:1,totalPaise:cost}}});}

test('packs are exact integer INR service credits and fresh server models are allowlisted',()=>{
 assert.deepEqual(AI_CREDIT_PACKS.map(p=>p.amountPaise/100),[10,20,50,100,250,500,1000]);
 assert.ok(AI_CREDIT_PACKS.every(p=>p.credits===p.amountPaise));
 const env={AI:{run(){}}};assert.ok(creditModel('standard',env,Date.parse('2026-11-18')));
 assert.equal(creditModel('gptmini',env,Date.parse('2026-11-18')),null);
 assert.equal(creditModel('__proto__',env),null);assert.equal(creditModel('standard',env,Date.parse('2027-01-01')),null);
 const p=creditPrice(AI_CREDIT_MODELS.standard,1500,350);assert.deepEqual(p,{modelPaise:3,gatewayPaise:0,servicePaise:1,totalPaise:4});
 assert.throws(()=>creditPrice(AI_CREDIT_MODELS.standard,-1,20));
});
test('twenty simultaneous paid callbacks grant one top-up, refunds are cumulative and monotonic',async()=>{
 const a=account();await a.call({op:'prepareOrder',id:orderId,packId:'inr10',environment:'sandbox'});
 await Promise.all(Array.from({length:20},()=>a.call({op:'reconcile',id:orderId,paid:true,paymentId:'123',refunded:0})));
 assert.equal((await a.call({op:'status'})).balancePaise,1000);
 await a.call({op:'reconcile',id:orderId,paid:true,paymentId:'123',refunded:300});
 await a.call({op:'reconcile',id:orderId,paid:true,paymentId:'123',refunded:0});
 assert.equal((await a.call({op:'status'})).balancePaise,700);
});
test('pending refunds and disputes block spend; failed refunds can release the hold',async()=>{
 const a=account();await fund(a);await quote(a);
 await a.call({op:'reconcile',id:orderId,paid:true,paymentId:'123',refunded:0,pending:true});
 assert.equal((await a.call({op:'reserve',id:'q',hash:'hash'})).error,'account_on_hold');
 await a.call({op:'reconcile',id:orderId,paid:true,paymentId:'123',refunded:0,pending:false});
 assert.equal((await a.call({op:'reserve',id:'q',hash:'hash'})).ok,true);
 await a.call({op:'hold'});assert.equal((await a.call({op:'status'})).accountHold,true);
});
test('parallel requests cannot overdraw and cannot spend one quote twice',async()=>{
 const a=account();await fund(a,10);await quote(a,'one',8);await quote(a,'two',8);
 const results=await Promise.all(Array.from({length:20},(_,i)=>a.call({op:'reserve',id:i%2?'one':'two',hash:'hash'})));
 assert.equal(results.filter(r=>r.ok).length,1);assert.equal((await a.call({op:'status'})).balancePaise,2);
 const id=results.find(r=>r.ok).quote.id;
 const done=await a.call({op:'complete',id,charge:5,text:'answer',receipt:{totalPaise:5}});
 assert.equal(done.result.balancePaise,5);
 assert.equal((await a.call({op:'reserve',id,hash:'hash'})).result.text,'answer');
 await a.call({op:'complete',id,charge:8,text:'different'});assert.equal((await a.call({op:'status'})).balancePaise,5);
});
test('confirmed ceiling caps charges, and refund after consumption blocks unfunded usage',async()=>{
 const a=account();await fund(a);await quote(a);await a.call({op:'reserve',id:'q',hash:'hash'});
 assert.equal((await a.call({op:'complete',id:'q',charge:500,text:'answer'})).result.chargedPaise,10);
 await a.call({op:'reconcile',id:orderId,paid:true,paymentId:'123',refunded:1000});
 assert.equal((await a.call({op:'status'})).balancePaise,-10);
 await quote(a,'q2');assert.equal((await a.call({op:'reserve',id:'q2',hash:'hash'})).error,'insufficient_credits');
});
test('expired quotes, changed prompts and abandoned holds never silently consume credits',async t=>{
 let now=Date.now();t.mock.method(Date,'now',()=>now);const a=account();await fund(a);await quote(a);
 assert.equal((await a.call({op:'reserve',id:'q',hash:'different'})).error,'quote_changed');
 await a.call({op:'reserve',id:'q',hash:'hash'});now+=180000;await a.obj.alarm();
 assert.equal((await a.call({op:'status'})).balancePaise,1000);
 await quote(a,'expired');now+=300001;assert.equal((await a.call({op:'reserve',id:'expired',hash:'hash'})).error,'quote_expired');
 now+=day;await a.obj.alarm();assert.equal(await a.st.get('q:q'),undefined);assert.ok(await a.st.get('receipt:q'));
});
test('daily provider budget serializes concurrent reservations and keeps unknown failure cost',async()=>{
 const st=storage(),obj=new AICreditBudget({storage:st},{AI_CREDITS_DAILY_PROVIDER_PAISE:'100'});
 const call=async b=>(await obj.fetch(new Request('https://b/',{method:'POST',body:JSON.stringify(b)}))).json();
 const all=await Promise.all(Array.from({length:50},(_,i)=>call({op:'reserve',id:'r'+i,amount:30})));
 assert.equal(all.filter(x=>x.ok).length,3);assert.equal(await st.get('used'),90);
 await call({op:'settle',id:'r0'});assert.equal(await st.get('used'),90);
 await call({op:'settle',id:'r1',actual:5});assert.equal(await st.get('used'),65);
});

function setup(){
 const accounts=new Map(),budgets=new Map(),cf=new Map(),calls=[],modelCalls=[];
 const env={AI_CREDITS_ENABLED:'true',AI_CREDITS_DAILY_PROVIDER_PAISE:'2000',CASHFREE_ENV:'sandbox',CASHFREE_APP_ID:'fixture',CASHFREE_SECRET_KEY:'fixture-secret-for-tests-only',FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify({project_id:'test',client_email:'fixture@test.iam.gserviceaccount.com',private_key:'-----BEGIN PRIVATE KEY----- fixture'}),AI:{run:async(...args)=>{modelCalls.push(args);return {choices:[{message:{content:'Try quiet weekdays.'}}],usage:{prompt_tokens:100,completion_tokens:30}};}},AI_CREDIT_ACCOUNTS:{idFromName:s=>s,get:s=>{if(!accounts.has(s))accounts.set(s,account(env));return {fetch:r=>r};}},AI_CREDIT_BUDGET:{idFromName:s=>s,get:s=>{if(!budgets.has(s))budgets.set(s,new AICreditBudget({storage:storage()},env));return {fetch:(url,init)=>budgets.get(s).fetch(new Request(url,init))};}}};
 env.AI_CREDIT_ACCOUNTS.get=s=>{if(!accounts.has(s))accounts.set(s,account(env));return {fetch:(url,init)=>accounts.get(s).obj.fetch(new Request(url,init))};};
 const deps={verify:async token=>{if(token==='bad')throw Error();return {uid:token,email_verified:token!=='unverified',firebase:{sign_in_provider:token==='anon'?'anonymous':'google.com'}};},fetch:async(url,init)=>{
  calls.push({url,init});const path=new URL(url).pathname.split('/').slice(2),id=path[1];
  if(init.method==='POST'){const b=JSON.parse(init.body);if(!cf.has(b.order_id))cf.set(b.order_id,{...b,order_status:'ACTIVE',payment_session_id:'test-session',refunds:[]});return Response.json(cf.get(b.order_id));}
  const d=cf.get(id);if(!d)return Response.json({error:'not_found'},{status:404});
  if(path[2]==='payments')return Response.json([{order_id:id,payment_status:'SUCCESS',is_captured:true,payment_currency:'INR',payment_amount:d.order_amount,cf_payment_id:123}]);
  if(path[2]==='refunds')return Response.json(d.refunds);return Response.json(d);
 }};
 const request=(path,body,token='alice')=>new Request('https://worker.test/ai/credits/'+path,{method:body===undefined?'GET':'POST',headers:token?{Authorization:'Bearer '+token}:{},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const send=(path,body,token)=>handleAICredits(request(path,body,token),env,'ai/credits/'+path,deps);
 return {env,deps,cf,calls,accounts,modelCalls,request,send};
}
async function paid(x){
 const d=await(await x.send('order',{packId:'inr10',phone:'9999999999',termsVersion:AI_CREDIT_RATE_VERSION})).json();
 x.cf.get(d.orderId).order_status='PAID';const r=await x.send('orders/'+d.orderId);assert.equal(r.status,200);return d.orderId;
}
test('auth, feature flag, streamed size and server-owned pack amounts fail closed',async()=>{
 const x=setup();for(const token of ['', 'bad','anon','unverified'])assert.ok((await x.send('balance',undefined,token)).status>=400);
 x.env.AI_CREDITS_ENABLED='false';assert.equal((await x.send('order',{})).status,503);x.env.AI_CREDITS_ENABLED='true';
 assert.equal((await x.send('order',{packId:'inr1'})).status,400);
 const d=await(await x.send('order',{packId:'inr10',amount:1,credits:9999999,phone:'9999999999',termsVersion:AI_CREDIT_RATE_VERSION})).json();
 assert.equal(x.cf.get(d.orderId).order_amount,10);assert.equal((await(await x.send('balance')).json()).balancePaise,0);
 assert.equal((await x.send('order',{prompt:'x'.repeat(17000)})).status,413);
});
test('order replay reuses checkout; server verifies payment amount, ownership and refunds before credit',async()=>{
 const x=setup(),body={packId:'inr10',phone:'9999999999',termsVersion:AI_CREDIT_RATE_VERSION};
 const first=await(await x.send('order',body)).json(),second=await(await x.send('order',body)).json();assert.equal(first.orderId,second.orderId);
 assert.equal((await x.send('orders/'+first.orderId,undefined,'bob')).status,404);
 const o=x.cf.get(first.orderId);o.order_status='PAID';o.order_amount=1;assert.equal((await x.send('orders/'+first.orderId)).status,503);
 assert.equal((await(await x.send('balance')).json()).balancePaise,0);o.order_amount=10;
 await Promise.all(Array.from({length:5},()=>x.send('orders/'+first.orderId)));assert.equal((await(await x.send('balance')).json()).balancePaise,1000);
 o.refunds=[{order_id:first.orderId,cf_payment_id:'123',refund_currency:'INR',refund_id:'r1',refund_amount:5,refund_status:'SUCCESS'}];await x.send('orders/'+first.orderId);assert.equal((await(await x.send('balance')).json()).balancePaise,500);
});
test('paid model requests require confirmed quotes; replay returns same result without another inference',async()=>{
 const x=setup();await paid(x);const body={prompt:'Plan a quiet weekend',modelId:'standard'};
 assert.equal((await x.send('run',body)).status,400);const q=await(await x.send('quote',body)).json();
 assert.equal((await x.send('run',{...body,quoteId:q.quote.id,prompt:'different'})).status,409);
 const first=await(await x.send('run',{...body,quoteId:q.quote.id})).json(),again=await(await x.send('run',{...body,quoteId:q.quote.id})).json();
 assert.equal(first.text,again.text);assert.equal(x.modelCalls.length,1);assert.equal(x.modelCalls[0][0],AI_CREDIT_MODELS.standard.model);
 assert.ok(first.chargedPaise<=q.quote.price.totalPaise);assert.equal((await(await x.send('balance')).json()).heldPaise,0);
});
test('provider failure or missing telemetry cannot debit invented usage',async()=>{
 const x=setup();await paid(x);const b={prompt:'Plan a quiet weekend',modelId:'standard'};
 x.env.AI.run=async()=>{throw Error('secret-upstream-message');};let q=await(await x.send('quote',b)).json();
 const failed=await x.send('run',{...b,quoteId:q.quote.id});assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('secret'));
 assert.equal((await(await x.send('balance')).json()).balancePaise,1000);
 x.env.AI.run=async()=>({response:'An answer without usage'});q=await(await x.send('quote',b)).json();
 assert.equal((await(await x.send('run',{...b,quoteId:q.quote.id})).json()).chargedPaise,0);
});
test('invalid webhook signatures cannot add credit or freeze an account',async()=>{
 const x=setup();await paid(x);const req=new Request('https://worker.test/ai/credits/webhook',{method:'POST',body:JSON.stringify({type:'DISPUTE',data:{order_id:[...x.cf.keys()][0]}})});
 assert.equal((await handleAICredits(req,x.env,'ai/credits/webhook',x.deps)).status,401);
 assert.equal((await(await x.send('balance')).json()).accountHold,false);
});
test('signed refund webhook reconciles from Cashfree rather than trusting event amounts',async()=>{
 const x=setup(),id=await paid(x);x.cf.get(id).refunds=[{order_id:id,cf_payment_id:'123',refund_currency:'INR',refund_id:'r',refund_amount:3,refund_status:'SUCCESS'}];
 const raw=JSON.stringify({type:'REFUND_STATUS_WEBHOOK',data:{refund:{order_id:id,refund_amount:9999}}}),timestamp=String(Date.now());
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(x.env.CASHFREE_SECRET_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const sig=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+raw))).toString('base64');
 const req=new Request('https://worker.test/ai/credits/webhook',{method:'POST',headers:{'x-webhook-timestamp':timestamp,'x-webhook-signature':sig},body:raw});
 assert.equal((await handleAICredits(req,x.env,'ai/credits/webhook',x.deps)).status,200);assert.equal((await(await x.send('balance')).json()).balancePaise,700);
});
test('UI fails closed, displays packs and does not turn purchased balance into automatic paid usage',async()=>{
 const html=readFileSync('ai-credits/index.html','utf8'),dom=new JSDOM(html,{url:'https://roamwise.co.in/ai-credits/',runScripts:'outside-only'}),w=dom.window;
 const fakeAuth={currentUser:null,onAuthStateChanged:fn=>fn(null)};let fetches=0;
 Object.assign(w,{AbortSignal,firebase:{apps:[{}],auth:()=>fakeAuth},fetch:async()=>{fetches++;throw Error('offline');}});
 w.eval(readFileSync('ai-credits/credits.js','utf8'));await new Promise(r=>setImmediate(r));
 assert.equal(w.document.querySelectorAll('[data-pack]').length,7);assert.ok([...w.document.querySelectorAll('[data-pack]')].every(b=>b.disabled));assert.equal(fetches,1);
 assert.equal(w.document.getElementById('run').disabled,true);assert.match(w.document.getElementById('notice').textContent,/No payment/);dom.window.close();
});
test('signed-in UI requires checkout consent and a quote, then recovers the same paid request',async()=>{
 const dom=new JSDOM(readFileSync('ai-credits/index.html','utf8'),{url:'https://roamwise.co.in/ai-credits/',runScripts:'outside-only'}),w=dom.window;
 const user={uid:'alice',getIdToken:async()=>'fixture-token'},requests=[],checkouts=[];
 const $=id=>w.document.getElementById(id),flush=()=>new Promise(r=>setImmediate(r));let runs=0;
 Object.assign(w,{AbortSignal,firebase:{apps:[{}],auth:()=>({onAuthStateChanged:fn=>fn(user)})},Cashfree:opts=>({checkout:async data=>checkouts.push({opts,data})}),fetch:async(url,opts)=>{
  const path=new URL(url).pathname.split('/ai/credits')[1],body=opts.body?JSON.parse(opts.body):null;requests.push({path,body,headers:opts.headers});
  if(path==='/catalogue')return Response.json({enabled:true,environment:'sandbox',packs:AI_CREDIT_PACKS,rateVersion:AI_CREDIT_RATE_VERSION,billingInrPerUsd:90,servicePercent:25,models:[{id:'standard',label:'Standard',available:true,inputUsdPerMillion:0.1,outputUsdPerMillion:0.3,gatewayPercent:0}]});
  if(path==='/balance')return Response.json({balancePaise:1000,heldPaise:0,orders:[]});
  if(path==='/order')return Response.json({orderId,paymentSessionId:'fixture-session',environment:'sandbox'});
  if(path==='/quote')return Response.json({quote:{id:'fixture-quote',price:{modelPaise:4,gatewayPaise:0,servicePaise:1,totalPaise:5}}});
  if(path==='/run'){if(++runs===1)throw Error('network interrupted');return Response.json({text:'A recovered answer',chargedPaise:3,balancePaise:997,receipt:{inputTokens:100,outputTokens:30}});}
  throw Error('Unexpected request '+path);
 }});
 try{
  w.eval(readFileSync('ai-credits/credits.js','utf8'));await flush();
  assert.equal($('run').disabled,true);assert.equal(requests.filter(r=>r.path==='/run').length,0);
  const buy=w.document.querySelector('[data-pack]');buy.click();await flush();
  assert.equal(requests.filter(r=>r.path==='/order').length,0);assert.match($('notice').textContent,/tick the agreement/);
  $('agree').checked=true;$('phone').value='9999999999';buy.click();await flush();
  assert.equal(checkouts.length,1);assert.equal(checkouts[0].opts.mode,'sandbox');assert.equal(checkouts[0].data.paymentSessionId,'fixture-session');
  assert.equal(requests.filter(r=>r.path==='/run').length,0);assert.equal($('run').disabled,true);
  $('prompt').value='A quiet Kumaon weekend';await $('quote').onclick();
  assert.match($('quote-info').textContent,/Maximum ₹0.05/);assert.match($('quote-info').textContent,/RoamWise service ₹0.01/);assert.equal(runs,0);
  await $('run').onclick();assert.equal($('run').textContent,'Check same answer');assert.equal($('run').disabled,false);
  await $('run').onclick();assert.equal($('answer').textContent,'A recovered answer');assert.match($('receipt').textContent,/Charged ₹0.03/);assert.equal($('run').disabled,true);
  const attempts=requests.filter(r=>r.path==='/run');assert.equal(attempts.length,2);assert.deepEqual(attempts[0].body,attempts[1].body);
  assert.ok(requests.filter(r=>r.path!=='/catalogue').every(r=>r.headers.Authorization==='Bearer fixture-token'));
 }finally{w.close();}
});


test('staged credit sales and gateway default off',()=>{
  const config=readFileSync('worker/wrangler.toml','utf8');
  assert.match(config,/AI_CREDITS_ENABLED = "false"/);
  assert.match(config,/AI_CREDITS_GATEWAY_ENABLED = "false"/);
  assert.match(config,/BASIC_AI_ENABLED = "false"/);
});
