const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/copilot/connected-discovery.js','utf8');
function load(items){const s={RW_PARTNER_SEED:[{id:'p_woodbook_devine',name:'Woodbook',zone:'Tirthan Valley',verified:'signed',listingReady:true}]};
 if(items!==undefined)s.RW_PARTNERS=items;
 s.window=s;s.rwStayPublicEligible=p=>p.listingReady===true&&(p.verified==='signed'||(p.verified==='founder-approved'&&p.enquiryOnly===true&&!!p.founderApproval));
 vm.createContext(s);vm.runInContext(source,s);return s.RWConnectedDiscovery;}
test('runtime admin-approved stay is discovered without hardcoded id',()=>{
 const p={id:'new-2026',name:'New Verified Manali Retreat',zone:'Manali',area:'Himachal',verified:'signed',listingReady:true};
 const x=load([p]).picks('stays near Manali',{dest:'Manali'});
 assert.ok(x.some(y=>y.id==='new-2026'));
 assert.ok(!x.some(y=>y.id==='p_woodbook_devine'));
});
test('pending and revoked properties are not promoted',()=>{
 const p={id:'bad',name:'Not approved',zone:'Manali',verified:'listed',listingReady:true};
 assert.ok(!load([p]).picks('hotel Manali',{dest:'Manali'}).some(x=>x.id==='bad'));
});
test('public artists can refresh from published catalog without private CRM',()=>{
 const x=load([]);
 const n=x.updatePublishedArtists({artists:[{id:'natasha-guleria',name:'Natasha Guleria',studio:'Bhavitavya Kala',state:'Himachal Pradesh',page:'/creators/artists.html',photo:{src:'/assets/img/natasha/natasha-with-painting.jpg'}},
 {id:'sneaky',name:'Not public',state:'Himachal Pradesh',page:'https://example.com/secret'},
 {id:'other',name:'Public Himachal Painter',state:'Himachal Pradesh',page:'/creators/other-painter/'}]});
 assert.equal(n,2);
 const a=x.picks('Himachal culture',{dest:'Himachal'});
 assert.ok(a.some(p=>p.id==='other'));
 assert.ok(!a.some(p=>p.id==='sneaky'));
});
