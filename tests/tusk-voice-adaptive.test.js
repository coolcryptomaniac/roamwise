const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('js/voice/voice-input.js','utf8');
function setup(){
 let recognizers=[],sent=0,stops=0,barge=0;
 const input={value:''};
 function Recognition(){recognizers.push(this);this.start=()=>{};this.stop=()=>{stops++;};}
 const s={window:{SpeechRecognition:Recognition},el:()=>input,copilotSend:()=>{sent++;},tuskStopSpeech:()=>{barge++;},showToast:()=>{},console};
 vm.createContext(s);vm.runInContext(source,s);
 return {s,input,recognizers,stats:()=>({sent,stops,barge})};
}
test('mic tap toggles off and interrupts previous spoken reply',()=>{
 const x=setup();x.s.rwVoiceStart('heroInput');
 assert.equal(x.recognizers.length,1);assert.equal(x.stats().barge,1);
 x.s.rwVoiceStart('heroInput');
 assert.equal(x.stats().stops,1);assert.equal(x.stats().sent,0);
});
test('final browser transcript submits exactly once',()=>{
 const x=setup();x.s.rwVoiceStart('heroInput');
 const r=x.recognizers[0];
 r.onresult({results:[[{transcript:'Kanatal jaana hai'}]]});
 r.onresult({results:[[{transcript:'second result'}]]});
 assert.equal(x.input.value,'Kanatal jaana hai');
 assert.equal(x.stats().sent,1);
});
test('late browser error after explicit stop cannot submit',()=>{
 const x=setup();x.s.rwVoiceStart('heroInput');const r=x.recognizers[0];
 x.s.rwVoiceStop();r.onerror({error:'not-allowed'});r.onresult({results:[[{transcript:'late'}]]});
 assert.equal(x.stats().sent,0);
});
test('unsupported browser degrades safely to typing',()=>{
 const input={value:''};let sent=0;
 const s={window:{},el:()=>input,copilotSend:()=>{sent++;},showToast:()=>{},console};
 vm.createContext(s);vm.runInContext(source,s);s.rwVoiceStart('cpInput');
 assert.equal(sent,0);assert.equal(s._rwVoiceActive,false);
});
