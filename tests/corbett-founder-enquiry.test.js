const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function context() {
  const overlay = { classList: { add() {} } };
  const w = {};
  const c = { window:w, console, URL, Number, isFinite, encodeURIComponent,
    document:{createElement(){return overlay;},body:{appendChild(){}}},
    el(id){return id==='lstOv'?overlay:null;},lsGet(){return null;},
    esc2(s){return String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));}
  };
  vm.createContext(c);
  for(const file of ['partners-data.js','badges-data.js','features/trust/property-compliance.js','js/misc/partners.js','js/booking/routes.js','js/misc/listings.js','partner/stays-hub.js']) {
    vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});
    if(file.includes('property-compliance')) w.RWTrust=c.RWTrust;
  }
  return {c,w,overlay,p:w.RW_PARTNER_SEED.find(x=>x.id==='p_corbett_jungle_view')};
}
test('Corbett is a clearly labelled founder introduction on both public stay surfaces',()=>{
  const {c,w,overlay,p}=context();
  assert.ok(c.rwListingAll().some(x=>x.id===p.id));
  assert.ok(w.RWStaysHub.allStays().some(x=>x.id===p.id));
  assert.equal(p.ownerMouAccepted,false);
  c.rwListOpen(p.id);
  assert.match(overlay.innerHTML,/Founder introduced/);
  assert.match(overlay.innerHTML,/property agreement is pending/);
  assert.match(overlay.innerHTML,/wa\.me\/917037365263/);
  assert.match(overlay.innerHTML,/tel:\+919867012129/);
  assert.doesNotMatch(overlay.innerHTML,/Signed Partner|RoamWise Checked|GST Verified|See rooms &amp; book|Cashfree/);
  assert.equal(p.price,undefined);
  for(const photo of p.photos) assert.ok(fs.existsSync(photo.src));
});
test('enquiry-only introductions cannot expose direct or OTA payments even with live-looking room data',()=>{
  const {c,w,p}=context();
  w.RW_ROOMS=[{partnerId:p.id,bookable:true,paymentEnabled:true,price:2000}];
  for(const mode of ['direct','ota','website']) {
    const altered={...p,bookingMode:mode,bookingUrl:'https://www.airbnb.co.in/rooms/1662787644512775118'};
    assert.ok(c.rwBookingRoutes(altered).every(r=>r.type==='whatsapp'||r.type==='phone'));
  }
  p.bookingMode='direct';
  assert.equal(c.rwRoomsLive().length,0);
});
test('research-only, incomplete and ready=false introductions remain excluded',()=>{
  const {w,p}=context();
  for(const bad of [{...p,verified:'listed'},{...p,founderApproval:''},{...p,enquiryOnly:false},{...p,listingReady:false}]) {
    assert.equal(w.rwStayPublicEligible(bad),false);
  }
});
test('stale cached signed claims cannot upgrade the founder introduction',()=>{
  const {c,w,p}=context();
  const merged=c.rwPartnersMerge([{...p,verified:'signed',enquiryOnly:false,ownerMouAccepted:true,badges:['partner','checked']}]);
  const x=merged.find(x=>x.id===p.id);
  assert.equal(x.verified,'founder-approved');
  assert.equal(x.enquiryOnly,true);
  assert.equal(x.ownerMouAccepted,false);
  w.RW_PARTNERS=merged;c.rwListingAll();
  assert.ok(!x.badges.includes('partner'),'stale signed badges must not survive merge');
  assert.ok(!x.badges.includes('checked'));
});

test('Lansdowne search renders the enquiry status and attributed owner contact without signed claims',()=>{
  const {w}=context();
  const host={innerHTML:'',querySelectorAll(){return [];}};
  w.RWStaysHub.render(host,{destination:'Lansdowne',checkin:'2026-11-01',checkout:'2026-11-02',guests:2},'stay');
  assert.match(host.innerHTML,/Corbett Jungle View Homestay/);
  assert.match(host.innerHTML,/Founder introduced/);
  assert.match(host.innerHTML,/Enquiry only/);
  assert.match(host.innerHTML,/wa\.me\/917037365263/);
  assert.match(host.innerHTML,/I%20found%20your%20stay%20through%20RoamWise/);
  assert.doesNotMatch(host.innerHTML,/RoamWise Partner|Checked|Trusted|Cashfree|Book now/);
});
