// @ts-nocheck
/* ninja-hacks.js — Ninja Hacks engine: deterministic per-destination cheap/luxury
   tips, region facts, and buildHacks() used by renderCards(). Moved verbatim from
   app.js as part of Phase 5a modularization; zero logic changes. */

/* ===== CHEAP TRICKS & LUXURY HACKS ===== */
var CHEAP=[['\ud83c\udf7c','Cheap trick','Book overnight buses/trains for long hops \u2014 transport + one night\u2019s stay for one ticket.'],
['\ud83d\udecf\ufe0f','Cheap trick','Hostels with free breakfast + kitchen cut food costs ~40% \u2014 filter for both.'],
['\ud83d\udcf1','Cheap trick','Buy the local SIM/eSIM at a city shop, not the airport counter \u2014 same plan, half price.'],
['\ud83c\udf9f\ufe0f','Cheap trick','City museums/attractions: student, teacher and press IDs often work internationally \u2014 always ask.'],
['\ud83d\uddd3\ufe0f','Cheap trick','Fly Tue/Wed, book stays Sun\u2013Thu \u2014 the same trip can cost 25% less shifted two days.']];
var LUXE=[['\ud83e\udd42','Luxury hack','Book the cheapest room at a 5-star, then email asking about paid upgrades at check-in \u2014 upgrades sell for a fraction of rack rate.'],
['\ud83d\udecd\ufe0f','Luxury hack','Hotel day-passes: pools, spas and lounges of top hotels without staying \u2014 search \u201cday pass\u201d + hotel name.'],
['\u2708\ufe0f','Luxury hack','Business class via points transfer bonuses costs less than premium economy cash \u2014 start collecting on one alliance only.'],
['\ud83c\udf7e','Luxury hack','Michelin lunch menus run 40\u201360% below dinner \u2014 same kitchen, same stars.'],
['\ud83d\udea2','Luxury hack','Repositioning cruises (one-way seasonal moves) sell luxury ships at hostel prices per night.']];

/* ===== NINJA HACKS ENGINE — deterministic per destination ===== */
var REGION_FACTS = {
  'Southeast Asia':[ ['Temple trick','Carry a sarong in your daypack — rentals at temple gates cost 5–10x the market price.'], ['Street-food radar','Eat where the queue is local office workers at 1pm — highest turnover means the freshest food.'] ],
  'East Asia':[ ['Convenience-store hack','7-Eleven/FamilyMart meals are restaurant-grade here — a full dinner under half the café price.'], ['Transit fact','Regional rail passes usually must be bought BEFORE arrival — check eligibility from India.'] ],
  'South Asia':[ ['Bargain baseline','Open at 40% of the first quoted price in tourist markets; walk away once — the real price follows you.'], ['Train hack','Book train tickets the minute the reservation window opens; tourist-quota seats exist at major stations.'] ],
  'Europe':[ ['Museum hack','Most big museums have one free evening per week or month — plan around it and save €15–25 each.'], ['Water fact','Tap water is drinkable in most of Europe — a refillable bottle saves €4–6 a day.'] ],
  'Middle East':[ ['Friday rule','Weekend is Fri–Sat in much of the region — souks and sights shift hours; plan mosque visits outside prayer times.'], ['Taxi hack','Insist on the meter or agree the fare BEFORE the door closes — or use local ride apps.'] ],
  'Africa':[ ['SIM first','Buy a local SIM at the airport — mobile data is often cheaper than India and card machines are rare.'], ['Tipping fact','Small-note tips open doors everywhere; keep a stash of small denominations from day one.'] ],
  'North America':[ ['Tax surprise','Displayed prices exclude tax and tipping 15–20% is expected — budget ~25% above sticker prices.'], ['City pass math','City attraction passes pay off only from the 3rd big sight — count before buying.'] ],
  'South America':[ ['Cash is king','Many places give 10% discounts for cash — but withdraw from bank ATMs inside branches only.'], ['Altitude hack','Landing above 2,500m? Schedule nothing on day one — acclimatise, hydrate, skip alcohol.'] ],
  'Oceania':[ ['Camper math','For 2+ people, a campervan often beats hostel + car + restaurants combined.'], ['Sun fact','The UV index here is brutal even when cool — SPF50 is a budget item, not a luxury.'] ],
  'Central Asia':[ ['Homestay hack','Family homestays cost less than hotels and include meals — book via community tourism networks.'], ['Border fact','Land borders can close for local holidays without notice — always have a buffer day.'] ]
};
var MO_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function nameHash(s){ var h=0; for(var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; } return h; }
function buildHacks(d, mi, month){
  var out = [], h = nameHash(d.name||'x');
  /* 1. Crowd-dodge hack from real crowd data */
  if(d.crowd && d.crowd.length===12){
    var minI=0; for(var i=1;i<12;i++) if(d.crowd[i]<d.crowd[minI]) minI=i;
    if(typeof mi==='number' && mi>=0 && d.crowd[mi]-d.crowd[minI]>=12){
      out.push({ic:'🥷',t:'Crowd-dodge',x:MO_FULL[minI]+' sees just '+d.crowd[minI]+'% crowds vs '+d.crowd[mi]+'% in '+month+' — same place, half the queues.'});
    } else {
      out.push({ic:'🌅',t:'Golden-hour rule',x:'Hit the #1 sight at opening time or after 4pm — tour buses own 10am–3pm everywhere on Earth.'});
    }
  }
  /* 2. Money hack from currency */
  if(d.cur) out.push({ic:'💴',t:'Money hack',x:'Always pay in '+d.cur+', never in INR/USD when a card machine offers the choice — refusing "dynamic currency conversion" quietly saves 3–5% on every swipe.'});
  /* 3. Region-specific rotating hack */
  var rf = REGION_FACTS[d.region];
  if(rf){ var pick = rf[h % rf.length]; out.push({ic:'🗺️',t:pick[0],x:pick[1]}); }
  /* 4. Visa or capital fact */
  if(d.visa && (d.visa.type||'').toLowerCase().indexOf('free')>=0){
    out.push({ic:'🛂',t:'Visa fact',x:'Visa-free for Indians — but immigration can still ask for a return ticket and hotel booking; keep screenshots offline.'});
  } else {
    var ci2 = lookupCountryInfo(d.country);
    if(ci2 && ci2.capital) out.push({ic:'💡',t:'Did you know',x:(d.country||d.name)+'\u2019s capital is '+ci2.capital+(ci2.language?' and locals speak '+ci2.language:'')+' — even two greeting words in it noticeably drops prices in markets.'});
  }
  var tmv=(el('tmode')||{}).value||'std';
  var extra=(tmv==='lux')? LUXE[h%LUXE.length] : CHEAP[h%CHEAP.length];
  out.push({ic:extra[0],t:extra[1],x:extra[2]});
  return out.slice(0,5);
}
