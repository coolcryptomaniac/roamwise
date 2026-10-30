const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/voice/tusk-speak.js','utf8');
function setup(){
 const spoken=[];const s={window:null,rwVoiceEnabled:()=>true,rwLang:()=> 'hi',showToast:()=>{},console,
 speechSynthesis:{cancel(){},getVoices(){return []},speak(u){spoken.push(u);}},
 SpeechSynthesisUtterance:function(t){this.text=t}};
 s.window=s;vm.createContext(s);vm.runInContext(source,s);return {s,spoken};
}
test('Hindi mode renders curated Himalayan names for speech only',()=>{
 const x=setup();
 assert.equal(x.s.rwTuskSpeechPronunciation('Almora aur Kanatal'), 'अल्मोड़ा aur कनाताल');
 assert.equal(x.s.rwTuskSpeechPronunciation('Chakrata, Ranikhet, Kumaon'), 'चकराता, रानीखेत, कुमाऊँ');
 assert.equal(x.s.rwTuskSpeechPronunciation('Unlisted Valley'), 'Unlisted Valley');
});
test('English mode leaves existing English place pronunciation intact',()=>{
 const x=setup();x.s.rwLang=()=> 'en';
 assert.equal(x.s.rwTuskSpeechPronunciation('Kanatal and Binsar'), 'Kanatal and Binsar');
});
test('visible text is unchanged while Hindi TTS gets spoken forms',()=>{
 const x=setup();const input='Almora ke paas Kanatal';
 x.s.tuskSpeak(input);
 assert.equal(x.spoken[0].text,'अल्मोड़ा ke paas कनाताल');
 assert.equal(x.s._rwTuskLastSpeech,input);
});
