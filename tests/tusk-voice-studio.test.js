const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/voice/tusk-studio.js','utf8');
function build(){
 const calls={listen:0,speak:[],stop:0,timer:null};
 const nodes={};
 function node(){return {textContent:'',dataset:{},hidden:true,isConnected:true,
   setAttribute(){},focus(){},querySelectorAll(){return []},
   querySelector(selector){if(!nodes[selector])nodes[selector]=node();return nodes[selector];},
   addEventListener(){},set innerHTML(s){this._html=s;this.textContent=s.replace(/<[^>]+>/g,' ');},get innerHTML(){return this._html||''}};}
 const dom={body:{appendChild(){}},createElement:()=>node()};
 const root={document:dom,rwVoiceStart(){calls.listen++;},rwVoiceStop(){calls.stop++;},
   tuskStopSpeech(){},tuskSpeak(s){calls.speak.push(s);},rwVoiceEnabled(){return true;},
   el(){return {id:'cpInput'};},setTimeout(fn){calls.timer=fn;},console};
 root.window=root;vm.createContext(root);vm.runInContext(source,root);
 return {api:root.RWTuskVoiceStudio,calls};
}
test('studio does not start microphone until explicit opt-in',()=>{
 const x=build();assert.equal(x.calls.listen,0);
 assert.equal(x.api.start(),true);assert.equal(x.calls.listen,1);
});
test('a completed voice turn speaks safely then listens again after browser end',()=>{
 const x=build();x.api.start();x.api.transcript('Kanatal kahan hai');
 assert.equal(x.api.state.phase,'thinking');
 x.api.answer('<b>Kanatal</b> is in Uttarakhand.','Kanatal kahan hai');
 assert.equal(x.calls.speak.length,1);assert.match(x.calls.speak[0],/Kanatal/);
 x.api.speechEnd();assert.equal(x.api.state.phase,'ready');
 x.calls.timer();assert.equal(x.calls.listen,2);
});
test('stopping prevents scheduled microphone restart',()=>{
 const x=build();x.api.start();x.api.transcript('Hello');
 x.api.answer('Hello','Hello');x.api.speechEnd();
 x.api.stop();x.calls.timer();assert.equal(x.calls.listen,1);assert.equal(x.api.state.active,false);
});
test('sensitive payment requests never auto-speak details',()=>{
 const x=build();x.api.start();x.api.transcript('payment');
 x.api.answer('<b>Pay here</b>','payment method');
 assert.equal(x.calls.speak.length,0);assert.equal(x.api.state.phase,'ready');
});
test('eight turns cap automatic re-listening',()=>{
 const x=build();x.api.start();
 for(let i=0;i<8;i++){x.api.transcript('Trip');x.api.answer('Hello','trip');}
 x.api.speechEnd();assert.equal(x.api.state.phase,'ready');assert.equal(x.calls.timer,null);
});
