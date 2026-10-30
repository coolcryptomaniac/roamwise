const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('js/copilot/connected-discovery.js','utf8');
function setup(overrides){
 const seed=[
  {id:'p_corbett_jungle_view',verified:'founder-approved',listingReady:true,enquiryOnly:true,founderApproval:'Mohit Pandey · 2026-10-18'},
  {id:'p_woodbook_devine',verified:'signed',listingReady:true},
  {id:'p_big_bro_hotel',verified:'signed',listingReady:true}
 ];
 const win={RW_PARTNER_SEED:seed,rwStayPublicEligible:p=>p.listingReady && (p.verified==='signed'||(p.verified==='founder-approved'&&p.enquiryOnly && !!p.founderApproval)),...overrides};
 win.window=win;vm.createContext(win);vm.runInContext(source,win);
 return win.RWConnectedDiscovery;
}
test('Lansdowne recommends Corbett Jungle View accurately as enquiry only',()=>{
 const x=setup().picks('plan a quiet trip to Lansdowne',{dest:'Lansdowne'});
 assert.equal(x.length,1);assert.equal(x[0].name,'Corbett Jungle View Homestay');
 assert.match(x[0].status,/Enquiry only/);
 assert.equal(x[0].href,'/stays/lansdowne/');
});
test('Himachal recommends Natasha artist and only eligible signed stays',()=>{
 const x=setup().picks('Himachal travel and culture',{dest:'Himachal Pradesh'});
 assert.ok(x.some(p=>p.id==='natasha-guleria'));
 assert.ok(x.some(p=>p.id==='p_woodbook_devine'));
 assert.ok(x.every(p=>!p.status.includes('Booked')));
});
test('nomad Almora matches workation and Aipan artist when relevant',()=>{
 const x=setup().picks('remote workation in Almora',{dest:'Almora'});
 assert.ok(x.some(p=>p.id==='p_big_bro_hotel'));
 const art=setup().picks('Kumaoni art in Almora',{dest:'Almora'});
 assert.ok(art.some(p=>p.id==='aipan-art-rakhi'));
});
test('explicit hotel query does not push unrelated art',()=>{
 const x=setup().picks('book hotel in Manali',{dest:'Manali'});
 assert.ok(x.some(p=>p.id==='p_woodbook_devine'));
 assert.ok(!x.some(p=>p.id==='natasha-guleria'));
});
test('pending or missing property never appears as signed supply',()=>{
 const x=setup({RW_PARTNER_SEED:[{id:'p_corbett_jungle_view',verified:'listed',listingReady:true}]});
 assert.equal(x.picks('Lansdowne',{dest:'Lansdowne'}).length,0);
 const y=setup({RW_PARTNER_SEED:[]});
 assert.ok(!y.picks('Himachal',{dest:'Himachal'}).some(p=>p.category==='stay'));
 assert.ok(y.picks('Himachal',{dest:'Himachal'}).some(p=>p.category==='artist'));
});
test('unrelated, sensitive and unknown destinations show no promoted listings',()=>{
 const x=setup();
 assert.deepEqual(Array.from(x.picks('OTP password help',{dest:'Lansdowne'})),[]);
 assert.deepEqual(Array.from(x.picks('city center',{dest:'Berlin'})),[]);
});
test('HTML never embeds a user-supplied destination or raw response',()=>{
 const x=setup(),h=x.html('Look at <script>alert(1)</script> in Lansdowne',{dest:'Lansdowne'});
 assert.match(h,/Corbett Jungle View/);assert.doesNotMatch(h,/<script>|alert\(1\)/);
});
test('text and animated voice render paths both integrated',()=>{
 const t=fs.readFileSync('js/copilot/rich-reply.js','utf8');
 const v=fs.readFileSync('js/voice/tusk-studio.js','utf8');
 const i=fs.readFileSync('index.html','utf8');
 assert.match(t,/RWConnectedDiscovery\.html\(raw,intents\)/);
 assert.match(v,/RWConnectedDiscovery\.renderInto\(cards,raw,intents\)/);
 assert.ok(i.indexOf('connected-discovery.js')<i.indexOf('rich-reply.js'));
});
