const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const inputSource=fs.readFileSync('js/voice/voice-input.js','utf8');
const studioSource=fs.readFileSync('js/voice/tusk-studio.js','utf8');
test('browser partial transcripts show live, but only final results submit',()=>{
 const notices=[],speech=[],input={value:''};let submits=0,rec;
 function SR(){rec=this;this.start=()=>{};this.stop=()=>{};}
 const w={window:null,SpeechRecognition:SR,el:()=>input,showToast:s=>notices.push(s),
 copilotSend:()=>{submits++;},RWTuskVoiceStudio:{partialTranscript:s=>speech.push(s),transcript(){}},console};
 w.window=w;vm.createContext(w);vm.runInContext(inputSource,w);
 w.rwVoiceStart('heroInput');
 rec.onresult({resultIndex:0,results:[{isFinal:false,0:{transcript:'Almora ke paas'}}]});
 assert.equal(submits,0);assert.deepEqual(speech,['Almora ke paas']);
 rec.onresult({resultIndex:0,results:[{isFinal:true,0:{transcript:'Almora ke paas kya dekhein'}}]});
 assert.equal(submits,1);assert.equal(input.value,'Almora ke paas kya dekhein');
 rec.onresult({resultIndex:0,results:[{isFinal:true,0:{transcript:'duplicate'}}]});
 assert.equal(submits,1);
});
function studio(){
 let listener=0,utterances=[],timer=null,nodes=[];
 function el(){
   const n={textContent:'',dataset:{},isConnected:true,hidden:false,children:[],
    appendChild(ch){this.children.push(ch)},replaceChildren(){this.children=[]},
    setAttribute(){},focus(){},addEventListener(){},querySelectorAll(){return []},
    querySelector(k){this.refs=this.refs||{};return this.refs[k]||(this.refs[k]=el());},
    set innerHTML(s){this.textContent=String(s).replace(/<[^>]+>/g,' ')}};
   nodes.push(n);return n;
 }
 const w={window:null,document:{body:{appendChild(){}},createElement:el},
 rwVoiceStart:()=>listener++,rwVoiceStop(){},tuskStopSpeech(){},tuskSpeak:s=>utterances.push(s),
 rwVoiceEnabled:()=>true,el:()=>({id:'heroInput'}),setTimeout:fn=>{timer=fn;},console};
 w.window=w;vm.createContext(w);vm.runInContext(studioSource,w);
 return {studio:w.RWTuskVoiceStudio,nodes,utterances,listens:()=>listener,timer:()=>timer};
}
test('stop invalidates next-turn timer even after reopening studio',()=>{
 const x=studio(),s=x.studio;s.start();s.transcript('Trip');s.answer('Go to Almora','Trip');
 s.speechEnd();const oldTimer=x.timer();assert.equal(typeof oldTimer,'function');
 s.stop();s.start();oldTimer();
 assert.equal(x.listens(),2);
});
test('partial transcript is status only and cannot overwrite final result',()=>{
 const x=studio(),s=x.studio;s.start();
 assert.equal(s.partialTranscript('Kumaon trip'),true);
 assert.equal(s.state.interim,'Kumaon trip');
 s.transcript('Kumaon trip kaha se');
 assert.equal(s.state.interim,'');
 assert.equal(s.partialTranscript('late callback'),false);
});
test('topic cards use safe DOM text and informative duration cue',()=>{
 const x=studio(),s=x.studio;s.start();s.transcript('Kausani weather');
 s.answer('Forecast not verified','Weather in Kausani',{dest:'Kausani',days:5});
 assert.ok(x.nodes.some(n=>n.textContent==='🌤️'));
 assert.ok(x.nodes.some(n=>String(n.textContent).includes('5 day trip')));
 assert.ok(x.nodes.some(n=>n.textContent==='Kausani'));
});
test('friendly and educational speech retains original answer and respects topic',()=>{
 const x=studio(),s=x.studio;
 assert.match(s.spokenStyle('The route might be blocked','road safety'),/Safety first/);
 assert.match(s.spokenStyle('A temple history','history of temple'),/travel wisdom/);
 s.state.style='guide';
 assert.equal(s.spokenStyle('Kausani','visit'),'Kausani');
 s.state.style='kumaoni-style';
 assert.match(s.spokenStyle('अल्मोड़ा','trip'),/भुला/);
});
test('narrow phone and reduced motion constraints exist in CSS',()=>{
 const c=fs.readFileSync('css/base/08-tusk-motion.css','utf8');
 for(const part of ['max-height:calc(100dvh - 16px)','max-width:100%','min-width:0',
 '.rw-orb-card-icon','prefers-reduced-motion:reduce','@media(max-width:340px)'])assert.ok(c.includes(part),part);
});
