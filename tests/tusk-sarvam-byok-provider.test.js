const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const client=fs.readFileSync('js/voice/voice-provider.js','utf8');
function clientCtx(){
 const store={},messages=[],calls=[],w={window:null,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},
 RW_CONFIG:{workerUrl:'https://voice.roamwise.example'},showToast:s=>messages.push(s),console,
 fetch:(url,opts)=>{calls.push({url,opts});return Promise.resolve({ok:true,json:()=>Promise.resolve({audio:'UklGRg=='})});},
 Audio:function(){this.play=()=>Promise.resolve();this.pause=()=>{};this.src='';}};
 w.window=w;vm.createContext(w);vm.runInContext(client,w);return {api:w.RWTuskVoiceProvider,calls,messages,store,w};
}
test('Sarvam BYOK key stays in page memory and model selection persists only provider',()=>{
 const x=clientCtx();x.api.setKey('test-key-not-production');
 x.api.setProvider('sarvam');x.api.setModel('bulbul:v4-flash');
 assert.equal(x.api.hasKey(),true);assert.equal(x.store.rw_tusk_voice_provider,'sarvam');
 assert.ok(!Object.values(x.store).some(v=>v.includes('test-key')));
 x.api.clearKey();assert.equal(x.api.hasKey(),false);
});
test('no Worker URL => no BYOK fetch, free device fallback',async()=>{
 const x=clientCtx();x.w.RW_CONFIG.workerUrl='';
 x.api.setProvider('sarvam');x.api.setKey('test-key-not-production');
 assert.equal(await x.api.speak('Hello','en-IN'),false);assert.equal(x.calls.length,0);
});
test('only explicit Sarvam mode sends bounded excerpt to HTTPS gateway',async()=>{
 const x=clientCtx();x.api.setKey('test-key-not-production');
 assert.equal(await x.api.speak('Hello','hi-IN'),false);assert.equal(x.calls.length,0);
 x.api.setProvider('sarvam');
 assert.equal(await x.api.speak('Hello','hi-IN'),true);
 assert.equal(x.calls[0].url,'https://voice.roamwise.example/voice/sarvam/byok');
 const req=JSON.parse(x.calls[0].opts.body);
 assert.equal(req.model,'bulbul:v4-flash');assert.equal(req.language_code,'hi-IN');
 assert.equal(req.key,'test-key-not-production');assert.equal(req.text,'Hello');
});
test('UI includes voice provider settings and short beginner tutorial',()=>{
 const s=fs.readFileSync('js/voice/tusk-studio.js','utf8');
 const settings=fs.readFileSync('js/ui/settings-modal.js','utf8');
 assert.match(client,/Create an API key/);assert.match(client,/Clear voice key/);
 assert.match(s,/data-action="provider"/);assert.match(settings,/RWTuskVoiceProvider\.mount/);
});
test('worker validates BYOK and calls fixed Sarvam origin',async()=>{
 const src=fs.readFileSync('worker/handlers/sarvam-voice.js','utf8').replace('export async function','async function');
 const http={request:null};
 const fn=new Function('fetch','Response','AbortController','setTimeout','clearTimeout',
  src+';return handleSarvamVoice;')(
   async(url,init)=>{http.request={url,init};return {ok:true,json:async()=>({audios:['UklGRg==']})};},
   Response,AbortController,setTimeout,clearTimeout);
 const req=new Request('https://worker.example/voice/sarvam/byok',{method:'POST',headers:{Origin:'https://roamwise.co.in','content-type':'application/json'},
 body:JSON.stringify({key:'test-key-not-production',text:'नमस्ते',language_code:'hi-IN',model:'bulbul:v4-flash'})});
 const out=await fn(req);assert.equal(out.status,200);
 assert.equal(http.request.url,'https://api.sarvam.ai/text-to-speech');
 assert.equal(http.request.init.headers['api-subscription-key'],'test-key-not-production');
 assert.equal(http.request.init.body.includes('test-key'),false);
});
test('worker rejects unrelated origin and oversized text',async()=>{
 const src=fs.readFileSync('worker/handlers/sarvam-voice.js','utf8').replace('export async function','async function');
 const fn=new Function('fetch','Response','AbortController','setTimeout','clearTimeout',src+';return handleSarvamVoice;')(
 async()=>{throw Error('unexpected')},Response,AbortController,setTimeout,clearTimeout);
 const req=new Request('https://worker.example/voice/sarvam/byok',{method:'POST',headers:{Origin:'https://attacker.example','content-type':'application/json'},
 body:JSON.stringify({key:'test-key-not-production',text:'hi'})});
 assert.equal((await fn(req)).status,403);
 const tooLong=new Request('https://worker.example/voice/sarvam/byok',{method:'POST',headers:{Origin:'https://roamwise.co.in','content-type':'application/json'},
 body:JSON.stringify({key:'test-key-not-production',text:'a'.repeat(900)})});
 assert.equal((await fn(tooLong)).status,400);
});
