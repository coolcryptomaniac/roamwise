const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/voice/tusk-studio.js','utf8');
function load(){
 const elems=[];
 function node(){
  const n={textContent:'',hidden:false,isConnected:true,dataset:{},children:[],refs:{},
   setAttribute(){},focus(){},addEventListener(){},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]},
   querySelectorAll(){return []},querySelector(k){return this.refs[k]||(this.refs[k]=node())},
   set innerHTML(v){this.textContent=String(v).replace(/<[^>]+>/g,' ')},get innerHTML(){return ''}};
  elems.push(n);return n;
 }
 const spoken=[],root={console,document:{body:{appendChild(){}},createElement:node},
  rwVoiceStart(){},rwVoiceStop(){},tuskStopSpeech(){},tuskSpeak:s=>spoken.push(s),
  rwVoiceEnabled:()=>true,el:()=>({id:'heroInput'})};
 root.window=root;vm.createContext(root);vm.runInContext(src,root);
 return {api:root.RWTuskVoiceStudio,elems,spoken};
}
test('full detail is shown inside studio, while TTS remains short',()=>{
 const x=load(),s=x.api;s.start();s.transcript('10 days in Delhi');
 const long='Day one museums. '+'Visit the cultural quarter. '.repeat(75);
 s.answer(long,'10 days in Delhi',{dest:'Delhi',days:10});
 assert.ok(x.elems.some(n=>n.textContent.length>1000&&n.textContent.includes('cultural quarter')));
 assert.ok(x.spoken.length===1&&x.spoken[0].length<850);
});
test('AI rate limit never gets narrated as a successful travel plan',()=>{
 const x=load(),s=x.api;s.start();s.transcript('Delhi');
 s.answer('AI engines unreachable right now (Too many requests).','Delhi',{dest:'Delhi'});
 assert.equal(x.spoken.length,0);assert.equal(s.state.phase,'ready');
});
test('responsive header is sticky and safe-area adjusted',()=>{
 const css=fs.readFileSync('css/base/08-tusk-motion.css','utf8');
 assert.match(css,/\.rw-orb-head\{position:sticky;top:0/);
 assert.match(css,/\.rw-orb-layout\{position:relative/);
 assert.match(css,/env\(safe-area-inset-top\)/);
 assert.match(css,/\.rw-orb-full-content\{white-space:pre-wrap/);
 assert.match(src,/rw-orb-full-answer/);
 assert.match(src,/rw-orb-brand/);
});
test('existing individual travel result type remains usable',()=>{
 const x=load();const model=x.api.resultModel('Kausani weather',{dest:'Kausani'});
 assert.equal(model.type,'weather');
});
