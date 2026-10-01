'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.join(__dirname,'..');
const destCode=fs.readFileSync(path.join(root,'js/data/destinations.js'),'utf8');
const cardCode=fs.readFileSync(path.join(root,'js/itinerary/result-cards.js'),'utf8');
const bookingCode=fs.readFileSync(path.join(root,'js/booking/form.js'),'utf8');

function costState(){
  const state={
    CURR:[{c:'INR',s:'₹',r:83.5},{c:'USD',s:'$',r:1}],AC:'INR',
    fmtMoney(usd){
      const v=Math.round(usd*83.5);
      if(v>=100000)return '₹'+(v/100000).toFixed(1)+'L';
      if(v>=1000)return '₹'+(v/1000).toFixed(0)+'k';
      return '₹'+v;
    },
    esc2:s=>String(s)
  };
  vm.runInNewContext(destCode,state);
  vm.runInNewContext(cardCode,state);
  return state;
}

test('Spiti 14-day mid budget uses INR/day once, not INR converted as USD',()=>{
  const s=costState(),d=s.DB.find(x=>x.id==='spiti');
  assert.equal(d._priceCurrency,'INR');
  assert.equal(d._pricePeriod,'day');
  const tripInr=Math.round(s.rwCostUSD(d,d.cost.mid,14)*83.5);
  assert.equal(tripInr,53200);
  assert.ok(tripInr<100000,'14-day ground model must not regress to multi-lakh FX inflation');
});

test('Paro Indian-traveller model includes current SDF scale without USD/week inflation',()=>{
  const s=costState(),d=s.DB.find(x=>x.id==='paro_bhutan');
  assert.equal(d._priceCurrency,'INR');
  assert.equal(d._pricePeriod,'day');
  assert.equal(Math.round(s.rwCostUSD(d,d.cost.mid,6)*83.5),45000);
  assert.match(d.visa.cost,/1,200\/night/);
  assert.match(d.local.sdf,/1,200/);
});

test('local-price renderer treats legacy prose as prose, never character rows',()=>{
  const s=costState();
  const html=s.rwLocalPricesHTML({local:'Roads are slow in the mountains.'});
  assert.match(html,/Roads are slow/);
  assert.doesNotMatch(html,/<tr><td>0<\/td>/);
  const table=s.rwLocalPricesHTML({local:{meal:'₹150–300',stay:'₹1,000–2,000'}});
  assert.equal((table.match(/<tr>/g)||[]).length,2);
});

test('Ailon stay matcher ranks typed or voice constraints and current rooms cannot charge by default',()=>{
  const state={
    window:{RW_ROOMS:[
      {id:'cheap',property:'Hill Hostel',zone:'Manali',area:'Old Manali',room:'Dorm',price:900,maxGuests:2,inc:['Breakfast','Wi-Fi']},
      {id:'high',property:'Peak Hotel',zone:'Manali',area:'Aleo',room:'Suite',price:4500,maxGuests:4,inc:['Breakfast','Balcony']}
    ]},
    esc2:s=>String(s),showToast:()=>{},isFinite,Number,String,Date
  };
  vm.runInNewContext(bookingCode,state);
  const rows=state.rwTuskStayMatches('Manali room under ₹3000 for 2 guests with breakfast','Manali');
  assert.equal(rows.length,1);
  assert.equal(rows[0].id,'cheap');
  assert.match(bookingCode,/r\.bookable!==true \|\| r\.paymentEnabled!==true/);
});

test('typed or voice plan booking resumes the exact trip with guarded supplier handoffs',()=>{
  const state={
    window:{RW_ROOMS:[]},esc2:s=>String(s),showToast:()=>{},isFinite,Number,String,Date,
    encodeURIComponent
  };
  state.window.window=state.window;
  vm.runInNewContext(bookingCode,state);
  const html=state.rwTuskPlanBookingHTML('book this plan','Ranikhet',3);
  assert.match(html,/Booking assistant/);
  assert.match(html,/Ranikhet · 3 days/);
  assert.match(html,/confirmed inventory and enabled payment/);
  assert.match(html,/nothing has been reserved or charged/i);
  assert.match(bookingCode,/bookable===true&&r\.paymentEnabled===true/);
});


test('India destination bands carry explicit estimate semantics and dated provenance',()=>{
  const s=costState();
  ['goa','leh','auli'].forEach(id=>{
    const d=s.DB.find(x=>x.id===id);
    assert.ok(d,id+' must exist');
    assert.equal(d._priceCurrency,'INR');
    assert.equal(d._pricePeriod,'day');
    assert.equal(d._priceKind,'indicative-estimate');
    assert.equal(d._priceBookable,false);
    assert.match(d._priceObservedAt,/^2026-10-01$/);
    assert.match(d._priceSourceUrl,/^https:\/\//);
  });
});

test('booking UI never calls a missing room price a live rate',()=>{
  assert.doesNotMatch(bookingCode,/Live rate<span>date-checked/);
  assert.match(bookingCode,/Price on request<span>availability \+ final rate must be confirmed/);
});

test('legacy search path normalizes destination units before USD budget comparison',()=>{
  const search=fs.readFileSync(path.join(root,'js/itinerary/search-engine.js'),'utf8');
  assert.match(search,/rwCostUSD\(d,d\.cost\.mid,7\)/);
  assert.match(search,/rwCostUSD\(d,d\.cost\.budget,7\)/);
});
