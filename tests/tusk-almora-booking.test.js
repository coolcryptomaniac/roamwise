const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function load(){
  const s={console,URL,Date,encodeURIComponent,lsGet:()=>null,esc2:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};s.window=s;
  vm.createContext(s);
  for(const file of ['partners-data.js','rooms-data.js','js/booking/routes.js','js/misc/partners.js','js/booking/form.js','js/booking/tusk-stay-desk.js','js/copilot/user-memory.js','js/misc/signature-food.js'])vm.runInContext(fs.readFileSync(file,'utf8'),s,{filename:file});
  return s;
}
test('real Almora partner seeds appear even with zero payment-enabled rooms',()=>{
  const s=load();assert.equal(s.rwRoomsLive().length,0);
  const html=s.rwTuskPlanBookingHTML('Book this trip to Almora','Almora',5);
  for(const name of ['Milan Heights','Soulmate Homestay','Big Bro Hotel'])assert.ok(html.includes(name));
  assert.doesNotMatch(html,/No matching stays|No RoamWise stay inventory|₹\d/);
  assert.match(html,/wa\.me\/917302315845/);
  assert.match(html,/not a reservation/);
  assert.doesNotMatch(s.rwTuskStayHTML('stay in Manali','Manali'),/Milan Heights/);
});
test('dated room enquiry includes exact trip details and does not invent a price',()=>{
  const s=load(),a=s.rwStayDeskAnswer('book a room 12 to 15 Nov for 3 guests','Almora',new Date('2026-10-28'));
  const html=decodeURIComponent(a.html);
  assert.match(html,/Check-in: 2026-11-12/);assert.match(html,/Check-out: 2026-11-15/);assert.match(html,/Guests: 3/);
  assert.match(html,/Soulmate Homestay/);assert.doesNotMatch(html,/No verified|₹\d/);
});
test('unsigned records stay hidden; signed properties without a public number use the enquiry desk',()=>{
  const s=load();s.RW_PARTNERS=[{id:'no',cat:'stay',name:'Hidden',zone:'Almora',verified:'listed',listingReady:true,bookingMode:'whatsapp',bookingWhatsapp:'919999999999'},{id:'noroute',cat:'stay',name:'No route',zone:'Almora',verified:'signed',listingReady:true}];
  const html=s.rwTuskPartnerStayHTML('stay','Almora');assert.doesNotMatch(html,/Hidden/);assert.match(html,/Ask RoamWise to confirm/);assert.match(html,/\/partner\/\?role=customer/);
});
test('book this trip is answered before any AI-dependent pre-answer hook',()=>{
  const s=load();s._cpCtx={dest:'Almora',days:5};s.rwUmAnswer=()=>null;
  s.rwEventTripReply=()=>{throw Error('must not reach AI-dependent hooks');};
  let answer='';s.cpFinish=(b,h)=>{answer=h;};
  const intents={};assert.equal(s.rwTuskPreAnswer({},intents,'Book this trip'),true);
  assert.match(answer,/Almora · 5 days/);assert.match(answer,/Milan Heights/);assert.equal(intents._stayDesk,true);
  assert.equal(s.rwTuskBookingReply({}, {},'book a train to Delhi'),false);
});
test('Bal Mithai uses bundled real photo and attribution without image generation',()=>{
  const s=load();s.rwMergeExtData=()=>{};s.rwArtURL=()=>{throw Error('must not generate Bal Mithai');};
  const html=s.rwFoodHTML('Almora');assert.match(html,/assets\/food\/bal-mithai.jpg/);assert.match(html,/Vkumarzone/);assert.match(html,/creativecommons.org\/licenses\/by\/3.0/);
  assert.equal(fs.readFileSync('assets/food/bal-mithai.jpg').readUInt16BE(0),0xffd8);
});
