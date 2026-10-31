const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/voice/tusk-speak.js','utf8');
function load(){
 const messages=[],store={};const voices=[{name:'Indian Hindi A',lang:'hi-IN',voiceURI:'hi-1'}, {name:'Indian Hindi B',lang:'hi-IN',voiceURI:'hi-2'},{name:'Indian English',lang:'en-IN',voiceURI:'en-1'}];
 const s={console,showToast:x=>messages.push(x),localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},speechSynthesis:{getVoices:()=>voices}};
 s.window=s;vm.createContext(s);vm.runInContext(src,s);return {s,voices,messages};
}
test('select actual installed Hindi voice and preserve locale agreement',()=>{
 const x=load();
 assert.equal(x.s.rwTuskCycleActorVoice(),'hi-1');
 assert.equal(x.s.rwTuskCycleActorVoice(),'hi-2');
 assert.equal(x.s.rwSpeechPickVoice(x.voices,'hi-IN').voiceURI,'hi-2');
 assert.equal(x.s.rwSpeechPickVoice(x.voices,'en-IN').voiceURI,'en-1');
});
test('reduced device support does not claim imaginary actor',()=>{
 const x=load();x.s.speechSynthesis.getVoices=()=>[];
 assert.equal(x.s.rwTuskCycleActorVoice(),'');
 assert.ok(x.messages.some(m=>m.includes('No Indian')));
});
test('actor control exists in visible voice studio and docs prohibit exposed permanent keys',()=>{
 const studio=fs.readFileSync('js/voice/tusk-studio.js','utf8');
 const guide=fs.readFileSync('docs/tusk-gemini-live-voice-integration.md','utf8');
 assert.match(studio,/data-action="actor"/);
 assert.match(studio,/rwTuskCycleActorVoice/);
 assert.match(guide,/Never ship the permanent key/);
 assert.match(guide,/not a deployed service/);
});
