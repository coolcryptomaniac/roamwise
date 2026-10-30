const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const code=fs.readFileSync('js/voice/tusk-speak.js','utf8');
function setup(extra){
 const notices=[],s={window:{},showToast:x=>notices.push(x),rwVoiceEnabled:()=>true,console,...extra};
 s.window=s;vm.createContext(s);vm.runInContext(code,s);return {s,notices};
}
test('Hindi script selects Hindi TTS, Latin text follows user setting',()=>{
 const {s}=setup();assert.equal(s.rwSpeechOutputLang('नैनीताल की यात्रा'),'hi-IN');
 assert.equal(s.rwSpeechOutputLang('Kanatal trip'),'en-IN');
 s.rwLang=()=> 'hi';assert.equal(s.rwSpeechOutputLang('Kanatal trip'),'hi-IN');
});
test('speech voice preference chooses exact locale over generic Indian voice',()=>{
 const {s}=setup();const voices=[{lang:'en-IN',name:'English India'},{lang:'hi-IN',name:'Hindi India'}];
 assert.equal(s.rwSpeechPickVoice(voices,'hi-IN').name,'Hindi India');
 assert.equal(s.rwSpeechPickVoice(voices,'en-IN').name,'English India');
 assert.equal(s.rwSpeechPickVoice([], 'hi-IN'),null);
});
test('native TTS synchronous failure falls back to Web Speech',()=>{
 let spoken=0;const {s}=setup({Capacitor:{Plugins:{TextToSpeech:{speak(){throw Error('native unavailable')}}}},},
 SpeechSynthesisUtterance:function(txt){this.text=txt;},
 speechSynthesis:{cancel(){},getVoices(){return []},speak(){spoken++;}}});
 s.tuskSpeak('Kanatal');assert.equal(spoken,1);
});
test('native promise rejection reports failure, not a successful playback',async()=>{
 const {s,notices}=setup({Capacitor:{Plugins:{TextToSpeech:{speak(){return Promise.reject(Error('unavailable'));}}}}});
 s.tuskSpeak('Hello');await new Promise(resolve=>setTimeout(resolve,0));
 assert.ok(notices.some(x=>/unavailable/.test(x)));
});
