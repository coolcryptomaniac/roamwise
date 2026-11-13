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
  assert.match(html,/amor-checkout\.html\?stay=milan/);
  assert.doesNotMatch(html,/917302315845|919105334889/);
  assert.match(html,/not a reservation/);
  assert.doesNotMatch(s.rwTuskStayHTML('stay in Manali','Manali'),/Milan Heights/);
});
test('dated room enquiry includes exact trip details and does not invent a price',()=>{
  const s=load(),a=s.rwStayDeskAnswer('book a room 12 to 15 Nov for 3 guests','Almora',new Date('2026-10-28'));
  const html=decodeURIComponent(a.html);
  const dates = html.match(/checkin=(20\\d\\d)-11-12&amp;checkout=(20\\d\\d)-11-15/);
  assert.ok(dates, 'keep exact 12–15 November dates in booking link');
  assert.equal(dates[1], dates[2], 'check-in and check-out years must match');
  assert.ok(new Date(dates[1] + '-11-12T23:59:59Z') >= new Date(), 'never suggest a past stay date');
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
