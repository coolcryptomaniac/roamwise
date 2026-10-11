'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const dir=path.join(__dirname,'..','worker','lib');
let RL,TS;
test.before(async()=>{ RL=await import(path.join(dir,'rate-limit.js')); TS=await import(path.join(dir,'turnstile.js')); });
function fakeCache(){ const m=new Map(); return { async match(r){ return m.get(r.url); }, async put(r,v){ m.set(r.url,v); } }; }
const req=(url,o={})=>new Request('https://api.x/'+url,{method:o.method||'GET',headers:o.headers||{}});

test('overLimit allows N then blocks, per key and per window',async()=>{
  const c=fakeCache();
  assert.equal(await RL.overLimit('t','a',2,60,c),false);
  assert.equal(await RL.overLimit('t','a',2,60,c),false);
  assert.equal(await RL.overLimit('t','a',2,60,c),true);
  assert.equal(await RL.overLimit('t','b',2,60,c),false);
});
test('limiter fails open when the cache throws',async()=>{
  const bad={match(){throw new Error('x')},put(){throw new Error('x')}};
  assert.equal(await RL.overLimit('t','a',1,60,bad),false);
});
test('payment orders are limited per signed-in user; a shared IP does not block other users',async()=>{
  const c=fakeCache(), ip='1.1.1.1';
  const as=tok=>req('cashfree/order',{method:'POST',headers:{'CF-Connecting-IP':ip,authorization:'Bearer '+tok}});
  let refused=null;
  for(let i=0;i<11;i++) refused=await RL.abuseGuard(as('userA'),'cashfree/order',c);
  assert.equal(refused.status,429);
  assert.equal(await RL.abuseGuard(as('userB'),'cashfree/order',c),null);
});
test('IP backstop still catches token-less floods on payment routes',async()=>{
  const c=fakeCache(); let r=null;
  for(let i=0;i<601;i++) r=await RL.abuseGuard(req('cashfree/order',{method:'POST',headers:{'CF-Connecting-IP':'3.3.3.3'}}),'cashfree/order',c);
  assert.equal(r.status,429);
});
test('limiter does one cache read per request regardless of the limit',async()=>{
  let reads=0; const m=new Map();
  const c={async match(r){reads++;return m.get(r.url)},async put(r,v){m.set(r.url,v)}};
  for(let i=0;i<500;i++) await RL.overLimit('t','k',1000,60,c);
  assert.equal(reads,500);
});
test('oversized body on a guarded POST is refused with 413; health and cached reads are never throttled',async()=>{
  const c=fakeCache();
  const big=req('cashfree/order',{method:'POST',headers:{'content-length':'999999'}});
  assert.equal((await RL.abuseGuard(big,'cashfree/order',c)).status,413);
  for(let i=0;i<2000;i++) assert.equal(await RL.abuseGuard(req('news'),'news',c),null);
  assert.equal(await RL.abuseGuard(req('health'),'health',c),null);
});
test('/ai is limited per signed-in user, not per shared IP',async()=>{
  const c=fakeCache(), ip={ 'CF-Connecting-IP':'9.9.9.9' };
  const a=()=>req('ai',{method:'POST',headers:{...ip,authorization:'Bearer tokenA'}});
  const b=()=>req('ai',{method:'POST',headers:{...ip,authorization:'Bearer tokenB'}});
  assert.equal(await RL.aiGuard(a(),c),false);
  assert.equal(await RL.aiGuard(a(),c),true);
  assert.equal(await RL.aiGuard(b(),c),false);
});
test('turnstile is dormant without a secret; verifies when token present; required flag works',async()=>{
  assert.deepEqual(await TS.verifyTurnstile(req('x'),{}),{ok:true,skipped:true});
  const env={TURNSTILE_SECRET:'s'};
  assert.equal((await TS.verifyTurnstile(req('x'),env)).ok,true);
  assert.equal((await TS.verifyTurnstile(req('x'),{...env,TURNSTILE_REQUIRED:'true'})).reason,'captcha_required');
  const withTok=req('x',{headers:{'X-Turnstile-Token':'t'}});
  assert.equal((await TS.verifyTurnstile(withTok,env,async()=>({json:async()=>({success:true})}))).ok,true);
  assert.equal((await TS.verifyTurnstile(withTok,env,async()=>({json:async()=>({success:false})}))).reason,'captcha_failed');
  assert.equal((await TS.verifyTurnstile(withTok,env,async()=>{throw new Error('net')})).ok,true);
});
test('worker.js wires the guard before routes and leaves payment handlers untouched',()=>{
  const w=fs.readFileSync(path.join(__dirname,'..','worker','worker.js'),'utf8');
  assert.ok(w.indexOf('abuseGuard(request, path)')<w.indexOf("path === 'cashfree/order'"));
  assert.match(w,/aiGuard\(request\)/);
});
