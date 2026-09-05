// @ts-nocheck
// Moved verbatim from app.js — Arrival Mode: the arrival station/time
// becomes the trigger for a full trip build, instead of ending at the
// ticket. Called from index.html and js/booking/pnr-parser.js/js/copilot/agent.js.
/* ============ ARRIVAL MODE — "your ticket is the start, not the end" (rw-v44)
   The strategic wedge vs ixigo/ConfirmTkt/IRCTC: on those apps the journey ENDS
   when the ticket is booked. Here, the arrival station + time is the TRIGGER
   for a full trip. We deliberately do NOT book tickets (that needs authorised
   IRCTC partner access) — we own everything around the ticket instead, and
   deep-link out for the booking itself.
   ========================================================================== */
var RW_STATIONS=[
  {q:'New Delhi (NDLS)', city:'Delhi'},{q:'Haridwar (HW)', city:'Haridwar'},
  {q:'Rishikesh (RKSH)', city:'Rishikesh'},{q:'Madgaon Goa (MAO)', city:'Goa'},
  {q:'Bengaluru (SBC)', city:'Bangalore'},{q:'Mumbai CSMT', city:'Mumbai'},
  {q:'Varanasi (BSB)', city:'Varanasi'},{q:'Jaipur (JP)', city:'Jaipur'},
  {q:'Kalka (KLK)', city:'Shimla'},{q:'Chennai Central (MAS)', city:'Chennai'},
  {q:'Kochi (ERS)', city:'Kochi'},{q:'Guwahati (GHY)', city:'Guwahati'}
];
function openArrival(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('arrivalSection');
  if(!sec){ sec=document.createElement('section'); sec.id='arrivalSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\ude82 Arrival <em>mode</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'arrivalSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Booked a train? Tell us where you land and when \u2014 we\u2019ll build the trip around your arrival, not around a search box.</p>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:16px;margin-bottom:14px">'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:7px">ARRIVING AT</div>'
    +'<input id="arrStation" list="arrStationList" placeholder="Station or city \u2014 e.g. Haridwar (HW)" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:11px;color:var(--t1);font:inherit;margin-bottom:10px">'
    +'<datalist id="arrStationList">'+RW_STATIONS.map(function(x){return '<option value="'+x.q+'">';}).join('')+'</datalist>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<div style="flex:1;min-width:110px"><div style="font-size:11px;color:var(--t3);font-weight:700;margin-bottom:5px">ARRIVAL TIME</div>'
    +'<input id="arrTime" type="time" value="06:00" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:10px;color:var(--t1);font:inherit"></div>'
    +'<div style="flex:1;min-width:110px"><div style="font-size:11px;color:var(--t3);font-weight:700;margin-bottom:5px">HOW MANY DAYS</div>'
    +'<input id="arrDays" type="number" min="1" max="14" value="3" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:10px;color:var(--t1);font:inherit"></div></div>'
    +'<button class="tact" style="width:100%;margin-top:12px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:13px" onclick="rwArrivalGo()">Build my trip from this arrival \u2192</button>'
    +'</div>'
    +'<div id="arrivalOut"></div>';
}
function rwArrivalGo(){
  var st=(el('arrStation')&&el('arrStation').value||'').trim();
  var tm=(el('arrTime')&&el('arrTime').value)||'06:00';
  var dy=parseInt((el('arrDays')&&el('arrDays').value)||'3',10)||3;
  if(!st){ showToast('Which station are you arriving at?'); return; }
  var city=st.replace(/\s*\([A-Z]+\)\s*$/,'').trim();
  var known=RW_STATIONS.filter(function(x){ return x.q.toLowerCase()===st.toLowerCase(); })[0];
  if(known) city=known.city;
  var hr=parseInt(tm.split(':')[0],10);
  var slot = hr<5?'pre-dawn' : hr<9?'early morning' : hr<12?'late morning' : hr<16?'afternoon' : hr<20?'evening' : 'late night';
  var out=el('arrivalOut');
  out.innerHTML='<div style="background:var(--bg2,#12151F);border:1px solid var(--gold,#E8BA6C);border-radius:16px;padding:16px;margin-bottom:12px">'
    +'<div style="font-weight:800;font-size:15px;margin-bottom:4px">\ud83d\ude82 Landing in '+esc2(city)+' at '+esc2(tm)+'</div>'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.6">'+esc2(rwArrivalAdvice(slot, city))+'</div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<button class="tact" style="flex:1;min-width:150px;font-weight:800" onclick="rwArrivalPlan(\''+city.replace(/'/g,"\\'")+'\','+dy+',\''+tm+'\')">\ud83d\uddd3\ufe0f Build '+dy+'-day itinerary</button>'
    +'<button class="tact" style="flex:1;min-width:150px" onclick="rwArrivalNear(\''+city.replace(/'/g,"\\'")+'\')">\ud83d\udccd What\u2019s near the station</button>'
    +'<button class="tact" style="flex:1;min-width:150px" onclick="openFitnessStays()">\ud83c\udfcb\ufe0f Gyms &amp; stays nearby</button>'
    +'<button class="tact" style="flex:1;min-width:150px" onclick="rwArrivalBookOut(\''+city.replace(/'/g,"\\'")+'\')">\ud83c\udfab Book the train</button>'
    +'</div>';
}
/* Genuinely useful, non-obvious arrival guidance — the thing a booking app
   never tells you. Deliberately generic-but-true rather than invented specifics. */
function rwArrivalAdvice(slot, city){
  if(slot==='pre-dawn'||slot==='late night')
    return 'You land when most of '+city+' is asleep. Pre-book your stay for the night BEFORE you arrive so you can check in straight away \u2014 arriving at 3am without a booked room is the classic Indian-rail mistake. Prepaid taxi counters and station retiring rooms are your friends here.';
  if(slot==='early morning')
    return 'The best possible arrival slot. Drop bags, get chai, and hit the main sight before the crowds and heat \u2014 you effectively gain a whole extra day.';
  if(slot==='late morning')
    return 'Check in first, eat a proper lunch, then start with something indoors or shaded \u2014 the midday sun will eat your energy otherwise.';
  if(slot==='afternoon')
    return 'Treat today as a soft start: settle in, walk the local market, eat well. Save the big sights for a full morning tomorrow.';
  return 'You arrive as '+city+' switches to evening mode \u2014 perfect for a food street and an early night, so tomorrow starts properly.';
}
function rwArrivalPlan(city, days, tm){
  var q='I arrive in '+city+' by train at '+tm+'. Plan '+days+' days starting from that arrival \u2014 account for the arrival time on day 1 (do not plan a full morning if I land in the afternoon).';
  var inp=el('heroInput')||el('cpInput');
  if(inp){ inp.value=q; try{ copilotSend(!!el('heroInput')); }catch(e){ /* best-effort, ignore */ } }
  rwCloseSection('arrivalSection');
}
function rwArrivalNear(city){
  try{ openNearMe(); }catch(e){ /* best-effort, ignore */ }
  setTimeout(function(){
    var mi=el('nearManualInp');
    if(mi){ mi.value=city+' railway station'; try{ rwNearMeManualGo(); }catch(e){ /* best-effort, ignore */ } }
    else { try{ rwNearMeManual('Searching around '+city+' station.'); setTimeout(function(){ var m2=el('nearManualInp'); if(m2){ m2.value=city+' railway station'; rwNearMeManualGo(); } },250); }catch(e){ /* best-effort, ignore */ } }
  }, 400);
}
/* We don't book tickets (that needs authorised IRCTC partner access) — we send
   users out to the real booking sites, honestly labelled. */
function rwArrivalBookOut(city){
  var ov=el('bookOutOv');
  if(!ov){ ov=document.createElement('div'); ov.id='bookOutOv'; ov.className='overlay'; ov.style.zIndex='3000';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('bookOutOv'); }; document.body.appendChild(ov); }
  function lk(name, url, note){
    return '<a href="'+url+'" target="_blank" rel="noopener" class="tact" style="display:flex;align-items:center;gap:10px;text-decoration:none;padding:13px;margin-bottom:8px;border-radius:12px">'
      +'<span style="flex:1"><b style="font-size:14px">'+name+'</b><div style="font-size:11.5px;color:var(--t3)">'+note+'</div></span><span>\u2197</span></a>';
  }
  ov.innerHTML='<div class="sheet" style="max-width:400px"><div class="sheet-h"><b>\ud83c\udfab Book your train</b>'
    +'<button onclick="rwOverlayClose(\'bookOutOv\')" class="tact">\u2715</button></div>'
    +'<p style="font-size:12px;color:var(--t2);margin:2px 0 12px">RoamWise plans the trip \u2014 booking happens on the official platforms, so you always get real fares and real availability.</p>'
    + lk('IRCTC', 'https://www.irctc.co.in/', 'The official Indian Railways booking site')
    + lk('ixigo trains', 'https://www.ixigo.com/trains', 'PNR status, availability prediction')
    + lk('ConfirmTkt', 'https://www.confirmtkt.com/', 'Confirmation-chance prediction')
    +'<div style="font-size:11px;color:var(--t3);margin-top:6px;line-height:1.5">Come back after booking and tap \ud83d\ude82 Arrival mode \u2014 we\u2019ll build the trip around your arrival time.</div></div>';
  ov.classList.add('open');
}
