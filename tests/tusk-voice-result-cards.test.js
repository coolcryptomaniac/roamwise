const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('js/voice/tusk-studio.js','utf8');
function setup(){
 const hooks=[],events={plan:[],follow:[]};
 function node(){const n={textContent:'',dataset:{},hidden:false,isConnected:true,children:[],
   setAttribute(){},focus(){},addEventListener(name,fn){this.handlers=this.handlers||{};this.handlers[name]=fn;},
   appendChild(child){this.children.push(child)},replaceChildren(){this.children=[]},
   querySelectorAll(){return []},querySelector(k){this.map=this.map||{};return this.map[k]||(this.map[k]=node());},
   set innerHTML(s){this._html=s;this.textContent=String(s).replace(/<[^>]*>/g,' ')},get innerHTML(){return this._html||''}};
  hooks.push(n);return n;
 }
 const document={body:{appendChild(){}},createElement:()=>node()};
 const s={window:null,document,console,rwVoiceStart(){},rwVoiceStop(){},tuskStopSpeech(){},
 rwVoiceEnabled(){return true},tuskSpeak(){},el(){return {id:'cpInput'};},
 cpFollow(q){events.follow.push(q)},cpGoPlan(name,days){events.plan.push({name,days})}};
 s.window=s;vm.createContext(s);vm.runInContext(code,s);
 return {api:s.RWTuskVoiceStudio,hooks,events};
}
test('destination result category is deterministic and never invents availability',()=>{
 const x=setup(),fn=x.api.resultModel;
 assert.equal(fn('Chakrata road blocked?',{dest:'Chakrata'}).type,'road');
 assert.equal(fn('कनाताल का मौसम',{dest:'Kanatal'}).type,'weather');
 assert.equal(fn('Find a homestay',{dest:'Almora'}).type,'stay');
 assert.equal(fn('Kausani local food',{dest:'Kausani'}).type,'food');
 assert.equal(fn('plan a week',{dest:'Binsar'}).type,'trip');
 assert.equal(fn('plan a week',{}),null);
});
test('voice answer creates text-only result card and safe actions',()=>{
 const x=setup();x.api.start();x.api.transcript('Road Chakrata');
 x.api.answer('<b>Road advisory not verified</b>','road Chakrata',{dest:'Chakrata'});
 const title=x.hooks.find(n=>n.textContent==='Chakrata');
 assert.ok(title,'destination heading');
 const action=x.hooks.find(n=>n.textContent==='⚠️ Check road alerts');
 assert.ok(action,'safety button rendered');
 action.handlers.click();assert.match(x.events.follow[0],/dated official road/);
});
test('untrusted destination text is assigned as text, not HTML',()=>{
 const x=setup();x.api.start();x.api.transcript('trip');
 x.api.answer('Plan', 'trip',{dest:'<img src=x onerror=alert(1)>'});
 assert.ok(x.hooks.some(n=>n.textContent==='<img src=x onerror=alert(1)>'));
 assert.ok(!x.hooks.some(n=>String(n.innerHTML||'').includes('<img src=x')));
});
