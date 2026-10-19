'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), path=require('node:path');
let K;
test.before(async()=>{ K=await import(path.join(__dirname,'..','worker','handlers','kala.js')); });
const post=(p,body,headers={})=>new Request('https://api.x/'+p,{method:'POST',headers:{'content-type':'application/json','CF-Connecting-IP':'9.9.9.'+Math.floor(Math.random()*250),...headers},body:JSON.stringify(body)});
function stubCaches(){ const m=new Map(); global.caches={default:{async match(r){const v=m.get(r.url);return v?v.clone():undefined},async put(r,v){m.set(r.url,v)}}}; }
test('prompt is grounded, PG, and sanitises the painting facts',()=>{
  const s=K.buildSystem({title:'Shiva <b>dhyan</b>',artist:'A',studio:'S',price:'₹30,000',sacred:true});
  assert.match(s,/never invent prices/i); assert.match(s,/PG/); assert.ok(!/<b>/.test(s));
});
test('history is capped, role-mapped and clipped',()=>{
  const h=K.sanitiseHistory(Array.from({length:9},(_, i)=>({r:i%2?'k':'u',t:'x'.repeat(500)})));
  assert.equal(h.length,4); assert.equal(h[0].content.length,300); assert.ok(h.every(x=>x.role==='user'||x.role==='assistant'));
});
test('reply cleaner strips reasoning tags, markup and links',()=>{
  assert.equal(K.cleanReply('<think>secret</think>Hello <b>you</b> see https://evil.example now'),'Hello you see now');
});
test('fails closed when no free provider is configured',async()=>{
  assert.equal((await K.handleKala(post('kala/chat',{q:'hi'}),{}, 'kala/chat')).status,501);
});
test('uses Workers AI first and never calls a paid provider',async()=>{
  stubCaches(); let paid=0; global.fetch=async()=>{paid++;return new Response('{}')};
  const env={AI:{async run(model,o){assert.equal(o.messages.at(-1).content,'price?');return {response:'<think>x</think>Namaste! It is ₹30,000.'}}}};
  const r=await K.handleKala(post('kala/chat',{q:'price?',ctx:{title:'T',price:'₹30,000'}}),env,'kala/chat'); const d=await r.json();
  assert.equal(d.provider,'workers-ai'); assert.equal(d.text,'Namaste! It is ₹30,000.'); assert.equal(paid,0);
});
test('falls back to Groq when Workers AI fails, then fails soft',async()=>{
  stubCaches(); let seen;
  global.fetch=async(u,o)=>{seen={u,o};return new Response(JSON.stringify({choices:[{message:{content:'Hi from Groq'}}]}),{status:200})};
  const env={AI:{async run(){throw new Error('quota')}},GROQ_API_KEY:'g',GROQ_MODEL:'m',AI_USAGE:{async get(){return '0'},async put(){}}};
  const d=await (await K.handleKala(post('kala/chat',{q:'hi'}),env,'kala/chat')).json();
  assert.equal(d.provider,'groq'); assert.equal(seen.u,'https://api.groq.com/openai/v1/chat/completions');
  global.fetch=async()=>new Response('{"error":"secret"}',{status:500});
  const r=await K.handleKala(post('kala/chat',{q:'hi'}),env,'kala/chat'); assert.equal(r.status,502); assert.ok(!(await r.text()).includes('secret'));
});
test('empty and oversized requests are refused',async()=>{
  stubCaches(); const env={AI:{async run(){return {response:'x'}}}};
  assert.equal((await K.handleKala(post('kala/chat',{q:''}),env,'kala/chat')).status,400);
  assert.equal((await K.handleKala(post('kala/chat',{q:'x'},{'content-length':'999999'}),env,'kala/chat')).status,413);
});
