const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/voice/tusk-studio.js','utf8');
const css=fs.readFileSync('css/base/08-tusk-motion.css','utf8');
function boot(){
 const created=[],saved={},voiceListeners={};let calls=0;
 function node(){
  const n={textContent:'',dataset:{},children:[],hidden:false,isConnected:true,
   refs:{},setAttribute(k,v){this[k]=v},focus(){},addEventListener(){},
   appendChild(child){this.children.push(child)},replaceChildren(){this.children=[]},
   querySelectorAll(){return []},querySelector(k){return this.refs[k]||(this.refs[k]=node());},
   set innerHTML(s){this._html=s;this.textContent=String(s).replace(/<[^>]+>/g,' ')},
   get innerHTML(){return this._html||''}};
  created.push(n);return n;
 }
 const voices=[{name:'Hindi One',lang:'hi-IN',voiceURI:'hi1'},{name:'Hindi Two',lang:'hi-IN',voiceURI:'hi2'}];
 const root={console,document:{body:{appendChild(){}},createElement:node},
 localStorage:{setItem:(k,v)=>saved[k]=v,getItem:k=>saved[k]||null},
 rwTuskVoicePreference:()=>saved.rw_tusk_voice_lang||'auto',
 rwTuskSelectedVoice:()=>saved.rw_tusk_voice_actor||'',
 rwTuskInstalledVoices:()=>voices,
 speechSynthesis:{addEventListener:(k,fn)=>voiceListeners[k]=fn},
 rwVoiceStart(){calls++},rwVoiceStop(){},tuskStopSpeech(){},el:()=>({id:'heroInput'}),
 rwVoiceEnabled:()=>true,tuskSpeak(){},showToast(){}};
 root.window=root;vm.createContext(root);vm.runInContext(src,root);
 const studio=root.RWTuskVoiceStudio;studio.start();
 const panel=created[0],picker=panel.querySelector('.rw-orb-picker');
 const opts=picker.querySelector('.rw-orb-picker-options');
 return {studio,created,saved,voiceListeners,voices,picker,opts,root,panel};
}
test('language picker opens visibly and updates persisted locale',()=>{
 const x=boot();
 assert.equal(x.studio.openVoicePicker('language'),true);
 assert.equal(x.picker.hidden,false);
 assert.equal(x.opts.children.length,4);
 x.opts.children[1].onclick();
 assert.equal(x.saved.rw_tusk_voice_lang,'hi-IN');
 assert.equal(x.picker.hidden,true);
 assert.match(x.panel.querySelector('[data-action="language"]').textContent,/Hindi/);
});
test('actor picker reflects installed voices and handles voiceschanged refresh',()=>{
 const x=boot();x.studio.openVoicePicker('actor');
 assert.equal(x.opts.children.length,3);
 x.opts.children[2].onclick();
 assert.equal(x.saved.rw_tusk_voice_actor,'hi2');
 x.studio.openVoicePicker('actor');
 assert.equal(x.opts.children[2]['aria-pressed'],'true');
 x.voices.push({name:'Indian English',lang:'en-IN',voiceURI:'en1'});
 x.voiceListeners.voiceschanged();
 assert.equal(x.opts.children.length,4);
});
test('unavailable voices still shows system default and helpful guidance',()=>{
 const x=boot();x.voices.length=0;x.studio.openVoicePicker('actor');
 assert.equal(x.opts.children.length,2);
 assert.match(x.opts.children[1].textContent,/No Indian/);
});
test('AI failure gives actionable recovery and no invented destination card',()=>{
 const x=boot();x.studio.transcript('10 days plan to Delhi');
 x.studio.answer('AI engines unreachable (Too many requests)','10 days plan to Delhi',{dest:'Delhi',days:10});
 const cards=x.panel.querySelector('.rw-orb-cards');
 assert.equal(cards.children.length,1);
 assert.equal(cards.children[0].className,'rw-orb-fallback');
 assert.ok(x.created.some(n=>n.textContent==='↻ Retry answer'));
 assert.equal(x.studio.state.phase,'ready');
});
test('cinematic layers and reduced-motion support are present',()=>{
 for(const token of ['rw-orb-stars','rw-orb-route','rw-orb-nodes','rw-orb-emblem','rw-orb-mountain','rw-orb-picker']) assert.ok(src.includes(token),token);
 assert.match(css,/@keyframes rwRouteSpin/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.rw-orb-picker\[hidden\]/);
});
