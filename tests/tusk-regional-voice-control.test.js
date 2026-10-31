const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('js/voice/tusk-speak.js','utf8');
function load(){const saved={},notices=[],s={console,rwVoiceEnabled:()=>true,showToast:t=>notices.push(t),
 localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v}};
 s.window=s;vm.createContext(s);vm.runInContext(code,s);return {s,saved,notices};}
test('language preference cycles auto, Hindi and Indian English',()=>{
 const x=load();assert.equal(x.s.rwSpeechOutputLang('Hill trip'),'en-IN');
 assert.equal(x.s.rwTuskCycleVoicePreference(),'hi-IN');
 assert.equal(x.s.rwSpeechOutputLang('Hill trip'),'hi-IN');
 assert.equal(x.s.rwTuskCycleVoicePreference(),'en-IN');
 assert.equal(x.s.rwSpeechOutputLang('अल्मोड़ा'),'en-IN');
 assert.equal(x.s.rwTuskCycleVoicePreference(),'auto');
 assert.equal(x.s.rwSpeechOutputLang('अल्मोड़ा'),'hi-IN');
});
test('invalid stored preference falls back to automatic',()=>{
 const x=load();x.saved.rw_tusk_voice_lang='not-a-real-voice';
 assert.equal(x.s.rwTuskVoicePreference(),'auto');
});
test('voice mode UI exposes preference action and quicker turn transition',()=>{
 const src=fs.readFileSync('js/voice/tusk-studio.js','utf8');
 assert.match(src,/data-action="language"/);
 assert.match(src,/rwTuskCycleVoicePreference/);
 assert.match(src,/\},180\);/);
});
