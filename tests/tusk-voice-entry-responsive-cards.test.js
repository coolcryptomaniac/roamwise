const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
test('Voice Mode appears before answers on both home and chat surfaces',()=>{
 const h=read('index.html'),c=read('js/copilot/core.js');
 assert.match(h,/<div class="rw-tusk-hero-tools">[\s\S]*?RWTuskVoiceStudio\.start\(\)/);
 assert.match(c,/sheet-head[\s\S]*?rw-tusk-voice-entry[\s\S]*?RWTuskVoiceStudio\.start\(\)/);
});
test('local card size toggle is available in text and voice card surfaces',()=>{
 const src=read('js/copilot/connected-discovery.js'),w={};w.window=w;
 vm.createContext(w);vm.runInContext(src,w);const fn=w.RWConnectedDiscovery.toggleSize;
 const box={dataset:{size:'compact'}};
 const button={closest:()=>box,setAttribute:(k,v)=>{button[k]=v}};
 assert.equal(fn(button),'comfortable');assert.equal(button['aria-pressed'],'true');
 assert.equal(fn(button),'compact');assert.equal(button['aria-pressed'],'false');
 assert.match(src,/rwTuskToggleCardSize\(this\)/);
});
test('CSS contains cards and images inside mobile viewport',()=>{
 const css=read('css/base/08-tusk-motion.css');
 for(const token of ['.rw-connected-grid','minmax(0,1fr)','.rw-connected-item img','.rw-orb-cards','.rw-tusk-voice-entry','[data-size="comfortable"]'])assert.ok(css.includes(token),token);
 assert.match(css,/\.rw-connected\{width:100%;max-width:100%;min-width:0;overflow:hidden/);
});
test('voice studio offers friendly, educational, Kumaoni-inspired style without claiming neural accent',()=>{
 const source=read('js/voice/tusk-studio.js');
 const dom=()=>({textContent:'',dataset:{},isConnected:true,hidden:true,appendChild(){},replaceChildren(){},setAttribute(){},focus(){},
 querySelectorAll(){return []},addEventListener(){},querySelector(){return dom();},set innerHTML(v){this.textContent=v.replace(/<[^>]+>/g,' ')}});
 const context={document:{body:{appendChild(){}},createElement:dom},rwVoiceStart(){},rwVoiceStop(){},tuskStopSpeech(){},console};
 context.window=context;vm.createContext(context);vm.runInContext(source,context);
 const studio=context.RWTuskVoiceStudio;
 assert.equal(studio.spokenStyle('Kanatal is a village').includes('Nice!'),true);
 studio.state.style='guide';assert.equal(studio.spokenStyle('Kanatal is a village'),'Kanatal is a village');
 studio.state.style='kumaoni-style';assert.match(studio.spokenStyle('Almora'),/Bhula, suno zara/);
 assert.match(studio.spokenStyle('अल्मोड़ा'),/भुला/);
 assert.match(source,/data-action="style"/);
});
