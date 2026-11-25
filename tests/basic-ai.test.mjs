import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { BasicAIQuota } from '../worker/lib/basic-ai-quota.js';
import { handleBasicAI } from '../worker/handlers/basic-ai.js';
import { BASIC_AI_MODEL, BASIC_AI_OUTPUT_TOKENS, basicAIConfig, basicAIAccount,
  basicAIReset, basicAIActualUsage, basicAIReservation } from '../worker/lib/basic-ai-policy.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const uid='a'.repeat(64), config={BASIC_AI_ENABLED:'true'};

// Deterministic transactional store for policy/handler tests. The real DO
// concurrency smoke test is documented in docs/shared-cloudflare-ai.md.
function storage(){
  const map=new Map();let alarm=null,tail=Promise.resolve();
  const s={map,get:async k=>structuredClone(map.get(k)),put:async(k,v)=>{
    if(typeof k==='string')map.set(k,structuredClone(v));
    else for(const [key,value]of Object.entries(k))map.set(key,structuredClone(value));
  },getAlarm:async()=>alarm,setAlarm:async v=>{alarm=v;},deleteAll:async()=>map.clear()};
  s.transaction=fn=>{const p=tail.then(()=>fn(s));tail=p.catch(()=>{});return p;};return s;
}
function meter(env=config){
  const store=storage(),obj=new BasicAIQuota({storage:store},env);
  return {store,obj,send:async b=>(await obj.fetch(new Request('https://quota/',{method:'POST',body:JSON.stringify({uid,...b})}))).json()};
}
function setup(run=async()=>({choices:[{message:{content:'Choose quiet weekdays and confirm travel times.'}}],usage:{prompt_tokens:200,completion_tokens:40}})){
  const counters=new Map(),cacheEntries=new Map(),calls=[];
  const env={...config,FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify({project_id:'test-project',client_email:'test@test-project.iam.gserviceaccount.com',private_key:'-----BEGIN PRIVATE KEY----- TEST ONLY'}),
    AI:{run:async(...args)=>{calls.push(args);return run(...args);}},BASIC_AI_QUOTA:{idFromName:n=>n,get:n=>{
      if(!counters.has(n))counters.set(n,meter(env));
      return {fetch:(url,init)=>counters.get(n).obj.fetch(new Request(url,init))};
    }}};
  const deps={verify:async token=>{if(token==='bad')throw new Error('invalid');return {uid:token,email_verified:token!=='unverified',firebase:{sign_in_provider:token==='anon'?'anonymous':'google.com'}};},
    cache:{match:async key=>cacheEntries.get(key.url)?.clone(),put:async(key,value)=>{cacheEntries.set(key.url,value.clone());}}};
  const req=(token='alice',body={prompt:'How should I choose a quiet weekend?'},method='POST')=>new Request('https://w.test/ai/basic',{method,headers:token?{Authorization:'Bearer '+token}:{},...(method==='POST'?{body:JSON.stringify(body)}:{})});
  return {env,deps,counters,calls,cacheEntries,req,send:(token,body,method)=>handleBasicAI(req(token,body,method),env,deps)};
}

test('configuration honors zero and rejects malformed or excessive budgets',()=>{
  assert.equal(basicAIConfig({}).enabled,false);
  assert.equal(basicAIConfig(config).dailyLimit,10);
  assert.equal(basicAIConfig({...config,BASIC_AI_DAILY_NEURONS:'0'}).neuronBudget,0);
  assert.equal(basicAIConfig({...config,BASIC_AI_DAILY_NEURONS:'oops'}).neuronBudget,0);
  assert.equal(basicAIConfig({...config,BASIC_AI_DAILY_NEURONS:'99999'}).neuronBudget,10000);
  assert.equal(basicAIConfig({...config,BASIC_AI_DAILY_LIMIT:'99'}).dailyLimit,20);
  assert.equal(basicAIReset(Date.parse('2026-11-18T23:59:59Z')),'2026-11-19T00:00:00.000Z');
  assert.equal(basicAIAccount({uid:'x',email_verified:true,firebase:{sign_in_provider:'anonymous'}}),false);
  assert.equal(basicAIAccount({uid:'x',firebase:{sign_in_provider:'phone'}}),true);
});

test('parallel reservations cannot exceed a user allowance',async()=>{
  const m=meter();await m.store.put('u:'+uid,{used:9,attempts:9,minute:0,burst:0});
  const results=await Promise.all(Array.from({length:40},(_,i)=>m.send({op:'reserve',id:'req-'+i,estimate:30})));
  assert.equal(results.filter(x=>x.ok).length,1);
  assert.equal((await m.send({op:'status'})).remaining,0);
  assert.equal(m.store.map.get('global').requests,1);
});

test('parallel users share one atomic budget, with no inference over-reservation',async()=>{
  const m=meter({...config,BASIC_AI_DAILY_NEURONS:'100'});
  const results=await Promise.all(Array.from({length:50},(_,i)=>m.send({uid:i.toString(16).padStart(64,'0'),op:'reserve',id:'req-'+i,estimate:30})));
  assert.equal(results.filter(x=>x.ok).length,3);
  assert.equal(m.store.map.get('global').neurons,90);
  assert.ok(results.filter(x=>!x.ok).every(x=>x.reason==='shared_budget'));
});

test('verified UID rate limits survive changing request IDs and stop retry loops',async t=>{
  let now=Date.now();t.mock.method(Date,'now',()=>now);const m=meter();
  for(let i=0;i<3;i++)assert.equal((await m.send({op:'reserve',id:'r'+i,estimate:3})).ok,true);
  assert.equal((await m.send({op:'reserve',id:'new-token',estimate:3})).reason,'slow_down');
  now+=60001;
  assert.equal((await m.send({op:'reserve',id:'next-minute',estimate:3})).ok,true);
  await m.store.put('u:'+uid,{used:0,attempts:20,minute:0,burst:0});
  assert.equal((await m.send({op:'reserve',id:'retry',estimate:3})).reason,'retry_limit');
});

test('failure refund is idempotent, restores user quota and retains possible compute cost',async()=>{
  const m=meter();await m.send({op:'reserve',id:'r',estimate:40});
  assert.equal((await m.send({op:'settle',id:'r',success:false})).remaining,10);
  assert.equal((await m.send({op:'settle',id:'r',success:false})).ok,false);
  assert.equal(m.store.map.get('global').neurons,40);
  assert.equal((await m.send({op:'status'})).used,0);
});

test('actual provider usage reconciles reservations; missing telemetry keeps the estimate',async()=>{
  const m=meter();await m.send({op:'reserve',id:'r',estimate:40});
  await m.send({op:'settle',id:'r',success:true,actual:8});
  assert.equal(m.store.map.get('global').neurons,8);
  assert.equal(basicAIActualUsage({}),null);
  assert.equal(basicAIActualUsage({usage:{prompt_tokens:-1,completion_tokens:5}}),null);
  assert.ok(basicAIReservation([{content:'हिंदी में यात्रा की योजना बनाओ'}])>0);
  // A provider returning more than reserved is fully recorded, blocking future calls.
  await m.send({op:'reserve',id:'r2',estimate:40});
  await m.send({op:'settle',id:'r2',success:true,actual:9000});
  assert.equal((await m.send({op:'reserve',id:'r3',estimate:1})).reason,'shared_budget');
});

test('new day has a new allowance, and expired objects delete only their own counters',async()=>{
  const day1=meter(),day2=meter();await day1.send({op:'reserve',id:'r',estimate:10});
  assert.equal((await day2.send({op:'status'})).remaining,10);
  assert.ok(await day1.store.getAlarm());await day1.obj.alarm();assert.equal(day1.store.map.size,0);
});

test('missing/invalid/unverified accounts cannot cause inference',async()=>{
  const x=setup();
  for(const [token,status]of [['',401],['bad',401],['anon',403],['unverified',403]])assert.equal((await x.send(token)).status,status);
  assert.equal(x.calls.length,0);
});

test('disabled route, missing coordinator and coordinator failure all fail closed',async()=>{
  const x=setup();x.env.BASIC_AI_ENABLED='false';assert.equal((await x.send()).status,503);
  x.env.BASIC_AI_ENABLED='true';const binding=x.env.BASIC_AI_QUOTA;delete x.env.BASIC_AI_QUOTA;
  assert.equal((await x.send()).status,503);x.env.BASIC_AI_QUOTA=binding;
  binding.get=()=>({fetch:async()=>{throw new Error('storage offline');}});
  assert.equal((await x.send()).status,503);assert.equal(x.calls.length,0);
});

test('client model/quota/token claims are ignored, status reads spend nothing',async()=>{
  const x=setup();const status=await x.send('alice',undefined,'GET');
  assert.equal(status.status,200);assert.equal((await status.json()).remaining,10);assert.equal(x.calls.length,0);
  const r=await x.send('alice',{prompt:'Suggest a quiet weekend approach',model:'expensive',max_tokens:999999,limit:999999});
  const d=await r.json();assert.equal(r.status,200);assert.equal(d.remaining,9);
  assert.equal(r.headers.get('Cache-Control'),'private, no-store');
  assert.equal(x.calls[0][0],BASIC_AI_MODEL);assert.equal(x.calls[0][1].max_completion_tokens,BASIC_AI_OUTPUT_TOKENS);
});

test('server cache is per-user and cached replies consume no allowance',async()=>{
  const x=setup();await x.send();const a=await x.send();assert.equal((await a.json()).cached,true);
  assert.equal(x.calls.length,1);assert.equal((await(await x.send('alice',undefined,'GET')).json()).remaining,9);
  await x.send('bob');assert.equal(x.calls.length,2);
  for(const k of x.cacheEntries.keys()){assert.ok(!k.includes('alice'));assert.ok(!k.includes('weekend'));}
});

test('provider error refunds account usage and never returns an upstream secret',async()=>{
  const x=setup(async()=>{throw new Error('SECRET echo');});const r=await x.send();
  assert.equal(r.status,503);const d=await r.json();assert.equal(d.remaining,10);assert.ok(!JSON.stringify(d).includes('SECRET'));
  assert.equal(x.calls.length,1);assert.ok([...x.counters.values()][0].store.map.get('global').neurons>0);
});

test('actual streamed body length is bounded even without Content-Length',async()=>{
  const x=setup();const r=await x.send('alice',{prompt:'x'.repeat(13000)});assert.equal(r.status,413);
  assert.equal((await x.send('alice',{prompt:'x'.repeat(4001)})).status,400);
  assert.equal(x.calls.length,0);
});

test('included AI Settings works without BYOK and displays server quota and safe errors',async()=>{
  const dom=new JSDOM('<div id="settingsOverlay"><div class="modal-body"></div></div>',{url:'https://www.roamwise.co.in',runScripts:'outside-only'});
  const w=dom.window,calls=[];let signedIn=false,response={remaining:10,limit:10},ok=true;
  Object.assign(w,{AbortController,RW_CONFIG:{basicAI:{enabled:true,url:'https://worker.test/ai/basic'}},
    firebase:{auth:()=>({currentUser:signedIn?{uid:'alice',getIdToken:async()=>'firebase-test-token'}:null})},
    fetch:async(url,opts)=>{calls.push({url,opts});return {ok,json:async()=>response};}});
  w.eval(readFileSync('js/copilot/basic-ai.js','utf8'));w.rwMountBasicAISetting();
  assert.match(w.document.getElementById('rwBasicAIStatus').textContent,/Sign in/);assert.equal(calls.length,0);
  signedIn=true;w.rwMountBasicAISetting();await new Promise(r=>setImmediate(r));
  assert.match(w.document.getElementById('rwBasicAIStatus').textContent,/10 of 10/);
  response={text:'A short travel answer',remaining:9,limit:10,route:'workers-ai-basic'};
  const answer=await new Promise(resolve=>w.rwBasicAICall('Plan a quiet weekend',(err,text)=>resolve({err,text})));
  assert.equal(answer.text,response.text);assert.equal(w.lastAiSource.prov,'smart');
  assert.match(w.rwBasicAIBadge(),/9 of 10/);assert.equal(calls.at(-1).opts.headers.Authorization,'Bearer firebase-test-token');
  assert.deepEqual(JSON.parse(calls.at(-1).opts.body),{prompt:'Plan a quiet weekend'});
  ok=false;response={error:'shared_budget',message:'untrusted secret'};
  await assert.rejects(w.rwBasicAIRequest('again'),/shared AI pool/);
  assert.ok(!w.document.body.textContent.includes('untrusted secret'));
  assert.ok(w.rwBasicAICompactPrompt('x'.repeat(9000),'LATEST QUESTION').endsWith('LATEST QUESTION'));
  dom.window.close();
});


test('included AI is wired but production stays disabled and personal context is excluded',()=>{
  const core=readFileSync('js/copilot/core.js','utf8');
  assert.match(readFileSync('index.html','utf8'),/js\/copilot\/basic-ai\.js/);
  assert.match(readFileSync('rw-config.js','utf8'),/basicAI:\s*\{\s*enabled:\s*false/);
  assert.match(core,/rwBasicAICompactPrompt\(basicGuideFacts,aiText\|\|t\)/);
  assert.match(core,/if\(_ck&&!basicAI\) rwAnsRemember/);
  assert.match(readFileSync('js/ui/settings-modal.js','utf8'),/rwMountBasicAISetting\(\)/);
});
