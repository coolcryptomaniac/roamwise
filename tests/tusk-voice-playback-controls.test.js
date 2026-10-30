const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/voice/tusk-speak.js','utf8');
function ready(extra){
 const notes=[],events=[],s={console,showToast:x=>notes.push(x),rwVoiceEnabled:()=>true,
  speechSynthesis:{speaking:false,paused:false,cancel(){},getVoices(){return []},speak(u){events.push(u);this.speaking=true;},pause(){this.paused=true},resume(){this.paused=false}},
  SpeechSynthesisUtterance:function(t){this.text=t},...extra};
 s.window=s;vm.createContext(s);vm.runInContext(source,s);return {s,notes,events};
}
test('replay uses last narrated text and stops after empty initial state',()=>{
 const x=ready();assert.equal(x.s.rwTuskReplaySpeech(),false);
 x.s.tuskSpeak('Kanatal trip');assert.equal(x.events.length,1);
 assert.equal(x.s.rwTuskReplaySpeech(),true);assert.equal(x.events.length,2);
 assert.equal(x.events[1].text,'Kanatal trip');
});
test('speed cycles through supported rates and applies to subsequent playback',()=>{
 const x=ready();assert.equal(x.s.rwTuskCycleSpeechRate(),1.2);
 x.s.tuskSpeak('Hello');assert.equal(x.events[0].rate,1.2);
 assert.equal(x.s.rwTuskCycleSpeechRate(),0.8);
 x.s.tuskSpeak('Again');assert.equal(x.events[1].rate,0.8);
 assert.equal(x.s.rwTuskCycleSpeechRate(),1);
});
test('pause and resume only offered when Web Speech controls playback',()=>{
 const x=ready();x.s.tuskSpeak('Hello');
 assert.equal(x.s.rwTuskSpeechControls().canPause,true);
 assert.equal(x.s.rwTuskPauseResume(),true);assert.equal(x.s.speechSynthesis.paused,true);
 assert.equal(x.s.rwTuskPauseResume(),true);assert.equal(x.s.speechSynthesis.paused,false);
});
test('native Capacitor playback does not claim Web Speech pause',()=>{
 const x=ready({Capacitor:{Plugins:{TextToSpeech:{speak(){return Promise.resolve();}}}}});
 x.s.tuskSpeak('Hello');assert.equal(x.s.rwTuskSpeechControls().canPause,false);
 assert.equal(x.s.rwTuskPauseResume(),false);
});
test('Tusk rail exposes playback commands without altering booking controls',()=>{
 const rail=fs.readFileSync('js/copilot/rich-reply.js','utf8');
 for(const method of ['rwTuskReadLast','rwTuskPauseResume','rwTuskReplaySpeech','rwTuskCycleSpeechRate']){
  assert.ok(rail.includes(method+'()'),method);
 }
});
