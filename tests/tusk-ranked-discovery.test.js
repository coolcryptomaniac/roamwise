const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/copilot/connected-discovery.js','utf8');
function load(){const w={RW_PARTNER_SEED:[
{id:'almora-nomad',name:'Remote Work Retreat',cat:'stay',zone:'Almora',area:'Kasar Devi',verified:'signed',listingReady:true,nomad:{enabled:true,minNights:15,desk:'basic',backup:'full',rate15:25000,rate30:40000}},
{id:'almora-short',name:'Short Stay',zone:'Almora',area:'Mall Road',verified:'signed',listingReady:true}
]};w.window=w;vm.createContext(w);vm.runInContext(src,w);return w.RWConnectedDiscovery;}
test('parses INR budget, duration, and remote-work intent',()=>{
 const p=load().preferences('Almora workation 30 days under ₹45,000',{});
 assert.equal(p.days,30);assert.equal(p.budget,45000);assert.equal(p.remote,true);
});
test('workation prioritizes 30-night nomad stay with explicit host price caveat',()=>{
 const x=load().picks('30 days remote workation under ₹45,000 in Almora',{dest:'Almora'});
 assert.equal(x[0].id,'almora-nomad');
 assert.match(x[0].priceHint,/Host-stated.*40,000/);
 assert.match(x[0].priceHint,/reconfirm/);
});
test('short stays are not presented as matching min 15-night nomad terms',()=>{
 const x=load().picks('book hotel 2 days Almora',{dest:'Almora'});
 assert.notEqual(x[0].id,'almora-nomad');
});
test('no invented prices when stored host rates are missing',()=>{
 const x=load().picks('Almora stay under ₹5000',{dest:'Almora'});
 assert.ok(x.every(p=>!p.priceHint));
});
