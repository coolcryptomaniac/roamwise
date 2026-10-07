'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('join form persists the photo, video, Instagram and WhatsApp-link fields it collects',()=>{
  const html=read('partner/join/index.html');
  for(const k of ['photoUrl','videoUrl','instagramUrl','whatsappUrl']){
    assert.ok(html.includes(k+':safeHttps(d.'+k+')'),k+' must be written to the partner doc');
  }
  assert.match(html,/function safeHttps\(v\)\{[^}]*protocol==='https:'/,'only https links are stored');
  assert.match(html,/forEach\(function\(k\)\{if\(!doc\[k\]\)delete doc\[k\]\}\)/,'blank re-submits never wipe saved links');
});

test('admin partner page exposes full details, editing and Stay & do publishing',()=>{
  const app=read('partner/app.js');
  assert.match(app,/data-livedetail/);
  assert.match(app,/function paintAdminLive\(partners,books\)\{adminCache=partners;/);
  assert.match(app,/async function liveDetailSave\(id\)/);
  assert.match(app,/async function liveListPublish\(id,on\)/);
  assert.match(app,/Approve this property first/,'only approved properties can be published');
  assert.match(app,/The MOU has not been accepted yet/);
  assert.match(app,/Show this WhatsApp number to travellers \(owner agreed\)/,'owner number is public only by explicit opt-in');
  assert.match(app,/collection\('config'\)\.doc\('partners'\)/);
  assert.match(app,/Everything else saved for this property/);
});

test('admin panel functions render details, save edits and publish to config/partners (fake Firestore)',async()=>{
  const vm=require('node:vm');
  const app=read('partner/app.js');
  const a=app.indexOf('var adminCache=[];'),b=app.indexOf('async function liveComplete(id){');
  assert.ok(a>0&&b>a);
  const store={'partners/u1':{status:'active',name:'Soulmate Homestay',zone:'Almora',area:'Kotyura',phone:'98765 43210',ownerName:'Owner',hook:'Kumaoni cooking',mapsUrl:'https://www.google.com/maps/search/?api=1&query=x',onboarding:{mouAcceptedAt:'2026-09-30T00:00:00Z'}},
    'partnerPublicProfiles/u1':{badges:['local','quiet']}};
  const writes=[];
  const docRef=path=>({path,get:async()=>({exists:path in store,data:()=>store[path]}),set:async(v,o)=>{writes.push([path,v]);store[path]=o&&o.merge?Object.assign({},store[path]||{},v):v;}});
  const db={collection:c=>({doc:i=>docRef(c+'/'+i)})};
  const els={};const mk=id=>els[id]||(els[id]={id,hidden:true,innerHTML:'',textContent:'',style:{},checked:false,querySelector(){return{set onclick(f){}}} ,querySelectorAll(){return[]}});
  const ctx={db,esc:s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),friendly:e=>String(e&&e.message),now:()=>'T',
    $:id=>mk(id),URL,Object,Array,String,Number,isFinite,JSON,setTimeout:()=>0};
  vm.runInNewContext(app.slice(a,b)+';this.api={set cache(v){adminCache=v},liveDetail,liveListPublish,liveDetailSave,detUrlOk,detSlug};',ctx);
  const api=ctx.api;
  assert.equal(api.detSlug('New Himank'),'new_himank');
  assert.equal(api.detUrlOk('mapsUrl','https://www.google.com/maps/search/?api=1&query=x'),true);
  assert.equal(api.detUrlOk('mapsUrl','https://evil.example/maps'),false);
  assert.equal(api.detUrlOk('whatsappUrl','https://wa.me/919876543210'),true);
  assert.equal(api.detUrlOk('photoUrl','http://example.com/a.jpg'),false);
  api.cache=[Object.assign({_id:'u1'},store['partners/u1'])];
  mk('pd-u1').hidden=true;
  await api.liveDetail('u1');
  const html=els['pd-u1'].innerHTML;
  assert.match(html,/Soulmate Homestay/);assert.match(html,/Not on Stay &amp; Do|Not on Stay &amp; do/);
  assert.match(html,/Everything else saved/);assert.match(html,/wa\.me\/919876543210/);
  // publish WITHOUT the WhatsApp opt-in: no number goes public
  mk('pdwa-u1').checked=false;
  await api.liveListPublish('u1',true);
  let list=store['config/partners'].list;
  assert.equal(list.length,1);assert.equal(list[0].id,'p_soulmate_homestay');
  assert.equal(list[0].verified,'signed');assert.equal(list[0].listingReady,true);
  assert.equal(list[0].bookingWhatsapp,undefined);assert.deepEqual(list[0].badges,['local','quiet']);
  // publish WITH the opt-in
  mk('pdwa-u1').checked=true;
  await api.liveListPublish('u1',true);
  list=store['config/partners'].list;
  assert.equal(list.length,1,'republishing replaces, never duplicates');
  assert.equal(list[0].bookingWhatsapp,'919876543210');assert.equal(list[0].bookingMode,'whatsapp');
  // saving edits: valid values persist (and mirror phone into ownerWa); bad links are refused
  const inp=(k,v,type)=>({tagName:'INPUT',type:type||'text',value:v,getAttribute:()=>k});
  els['pd-u1'].querySelectorAll=()=>[inp('name','Soulmate Homestay'),inp('phone','+91 98765 43210','text'),inp('roomCount','4','number'),inp('photoUrl','https://example.com/a.jpg'),inp('mapsUrl','https://www.google.com/maps/place/x')];
  await api.liveDetailSave('u1');
  const saved=store['partners/u1'];
  assert.equal(saved.roomCount,4);assert.equal(saved.ownerWa,saved.phone);assert.equal(saved.photoUrl,'https://example.com/a.jpg');
  els['pd-u1'].querySelectorAll=()=>[inp('name','Soulmate Homestay'),inp('photoUrl','http://insecure.example/a.jpg')];
  await api.liveDetailSave('u1');
  assert.match(els['pdmsg-u1'].textContent,/check the photoUrl link/);
  assert.equal(store['partners/u1'].photoUrl,'https://example.com/a.jpg','a refused save changes nothing');
  // unapproved properties cannot be published
  store['partners/u1'].status='pending';
  await api.liveListPublish('u1',true);
  assert.match(els['pdmsg-u1'].textContent,/Approve this property first/);
  // unpublish
  store['partners/u1'].status='active';
  await api.liveListPublish('u1',false);
  assert.equal(store['config/partners'].list.length,0);
});
