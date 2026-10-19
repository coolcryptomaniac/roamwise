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
test('fails closed without a Sarvam key',async()=>{
  const r=await K.handleKala(post('kala/chat',{q:'hi'}),{}, 'kala/chat'); assert.equal(r.status,501);
});
test('chat calls Sarvam with the server-held key and returns clean text',async()=>{
  stubCaches(); let seen;
  global.fetch=async(u,o)=>{seen={u,o}; return new Response(JSON.stringify({choices:[{message:{content:'<think>x</think>Namaste! Price is ₹30,000.'}}]}),{status:200});};
  const r=await K.handleKala(post('kala/chat',{q:'price?',ctx:{title:'T',price:'₹30,000'}}),{SARVAM_API_KEY:'k'}, 'kala/chat');
  const d=await r.json(); assert.equal(r.status,200); assert.equal(d.text,'Namaste! Price is ₹30,000.');
  assert.equal(seen.u,'https://api.sarvam.ai/v1/chat/completions'); assert.equal(seen.o.headers.Authorization,'Bearer k');
  assert.equal(JSON.parse(seen.o.body).messages.at(-1).content,'price?');
});
test('speech: Sarvam TTS bytes returned, then served from cache without a second call',async()=>{
  stubCaches(); let calls=0; const wav=Buffer.from('ID3fake').toString('base64');
  global.fetch=async(u,o)=>{calls++; assert.equal(u,'https://api.sarvam.ai/text-to-speech'); assert.equal(o.headers['api-subscription-key'],'k'); return new Response(JSON.stringify({audios:[wav]}),{status:200});};
  const ip={'CF-Connecting-IP':'7.7.7.7'};
  const a=await K.handleKala(post('kala/speak',{text:'Namaste कला',lang:'hi-IN'},ip),{SARVAM_API_KEY:'k'}, 'kala/speak');
  assert.equal(a.headers.get('content-type'),'audio/mpeg'); assert.equal(Buffer.from(await a.arrayBuffer()).toString(),'ID3fake');
  const b=await K.handleKala(post('kala/speak',{text:'Namaste कला',lang:'hi-IN'},ip),{SARVAM_API_KEY:'k'}, 'kala/speak');
  assert.equal(b.status,200); assert.equal(calls,1);
});
test('oversized and empty requests are refused; provider errors do not leak details',async()=>{
  stubCaches();
  assert.equal((await K.handleKala(post('kala/chat',{q:''}),{SARVAM_API_KEY:'k'},'kala/chat')).status,400);
  assert.equal((await K.handleKala(post('kala/chat',{q:'x'},{'content-length':'999999'}),{SARVAM_API_KEY:'k'},'kala/chat')).status,413);
  global.fetch=async()=>new Response('{"error":"secret detail"}',{status:500});
  const r=await K.handleKala(post('kala/chat',{q:'hi'}),{SARVAM_API_KEY:'k'},'kala/chat'); const d=await r.json();
  assert.equal(r.status,502); assert.ok(!JSON.stringify(d).includes('secret'));
});
