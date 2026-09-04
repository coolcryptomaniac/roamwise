// @ts-nocheck
/* Moved from app.js (Phase 3 modularization) — local rides + stranded/
   emergency helpers: openSOS/rwSOSShare and rwRidesHTML/openDriverHire.
   Pure code motion, zero logic changes. Depends on globals defined
   elsewhere in app.js (rwPageOpen, esc2, showToast, rwForm, RW_TERRAIN,
   rwTerrainOf), already loaded by the time these are invoked at runtime. */

/* ---------------- STRANDED / EMERGENCY ----------------
   For the moment a trip goes wrong: last bus gone, landslide, phone dying,
   nobody around. Works OFFLINE because that is exactly when you need it. */
function openSOS(){
  rwPageOpen('sos', function(body){
    body.innerHTML=
       '<div class="sos-top">'
      +'<b>You\u2019re not stuck. Work down this list.</b>'
      +'<span class="note">This page works without internet. Everything here is stored on your phone.</span>'
      +'</div>'
      +'<div class="sos-nums">'
      +'<a class="sos-n" href="tel:112"><b>112</b><span>All emergencies</span></a>'
      +'<a class="sos-n" href="tel:108"><b>108</b><span>Ambulance</span></a>'
      +'<a class="sos-n" href="tel:1363"><b>1363</b><span>Tourist helpline</span></a>'
      +'<a class="sos-n" href="tel:1073"><b>1073</b><span>Road accident</span></a>'
      +'</div>'
      +'<div class="sos-block"><b>\ud83d\ude8c Last transport gone</b>'
      +'<div>Ask at a dhaba or petrol pump for a shared jeep \u2014 in the hills they run later than buses and locals always know.</div>'
      +'<div>Cargo and milk trucks take passengers on hill routes. Offer fare, sit up front, share the vehicle number with someone.</div>'
      +'<div>Bus depots often let stranded travellers wait inside overnight. Ask the depot manager, not a conductor.</div></div>'
      +'<div class="sos-block"><b>\ud83c\udfd4\ufe0f Road blocked or landslide</b>'
      +'<div>Do not walk past a fresh slide \u2014 second falls are common in the first hours.</div>'
      +'<div>Ask locals when it usually clears; they will know better than any app.</div>'
      +'<div>Turn back to the last village with rooms before dark. Sleeping in a vehicle on a hill road is the bigger risk.</div></div>'
      +'<div class="sos-block"><b>\ud83d\udcb8 No money or phone dying</b>'
      +'<div>Dhabas and small shops will usually let you charge a phone for free. Ask.</div>'
      +'<div>UPI works when cards do not, and works with very little signal. Keep one app installed.</div>'
      +'<div>Write one emergency number on paper. A dead phone means a memorised number is worthless.</div></div>'
      +'<div class="sos-block"><b>\ud83d\ude28 Feeling unsafe</b>'
      +'<div>Go where there are lights and people \u2014 a dhaba, a hotel lobby, a petrol pump, a temple or gurudwara.</div>'
      +'<div>Gurudwaras take anyone in, at any hour, for free. Across most of North India this is the reliable answer.</div>'
      +'<div>Tell one person your live location and when you will next check in.</div></div>'
      +'<button class="bk-go" onclick="rwSOSShare()">\ud83d\udccd Share my location with someone</button>'
      +'<div class="gr-foot">We are not an emergency service and cannot send help. This is the advice a local friend would give \u2014 use official numbers for anything serious.</div>';
  });
}
function rwSOSShare(){
  if(!navigator.geolocation){ showToast('Location not available on this device'); return; }
  navigator.geolocation.getCurrentPosition(function(pos){
    var u='https://maps.google.com/?q='+pos.coords.latitude+','+pos.coords.longitude;
    var t='I need help. My location: '+u;
    try{
      if(navigator.share) navigator.share({ text:t });
      else window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener');
    }catch(e){ showToast(u); }
  }, function(){ showToast('Could not get your location \u2014 try again with GPS on'); }, {timeout:8000});
}

/* ---------------- LOCAL RIDES ----------------
   We do NOT resell rides or take a cut here — these are deep links into the
   apps people already have. Saying so keeps it honest and keeps us out of
   transport regulation we have no business being in. */
function rwRidesHTML(place, lat, lon){
  var q=encodeURIComponent(place||'');
  var ola  = lat? 'https://book.olacabs.com/?drop_lat='+lat+'&drop_lng='+lon : 'https://book.olacabs.com/';
  var uber = lat? 'https://m.uber.com/ul/?action=setPickup&dropoff[latitude]='+lat+'&dropoff[longitude]='+lon
                : 'https://m.uber.com/ul/?action=setPickup';
  var rapido='https://onelink.to/rapido';
  return '<div class="ride-box">'
    +'<div class="ride-h">\ud83d\ude95 Getting around'+(place?' in '+esc2(place):'')+'</div>'
    +'<div class="ride-btns">'
    +'<a class="ride" href="'+rapido+'" target="_blank" rel="noopener">\ud83c\udfcd\ufe0f Rapido<span>bikes &amp; autos</span></a>'
    +'<a class="ride" href="'+ola+'" target="_blank" rel="noopener">\ud83d\ude96 Ola<span>cabs</span></a>'
    +'<a class="ride" href="'+uber+'" target="_blank" rel="noopener">\ud83d\ude97 Uber<span>cabs</span></a>'
    +'</div>'
    +'<button class="tact" style="width:100%;margin-top:8px" onclick="openDriverHire(\''+esc2(place||'')+'\')">\ud83e\uddd1\u200d\u2708\ufe0f Hire a driver for the day</button>'
    +'<div class="ride-note">We don\u2019t take a cut on rides \u2014 these open the apps you already have. For hill routes a full-day driver usually beats app cabs, which often refuse long mountain trips.</div>'
    +'</div>';
}
/* Full-day driver / sightseeing — the thing Febin's users kept asking for. */
function openDriverHire(place){
  var t=(window.RW_TERRAIN && typeof rwTerrainOf==='function') ? rwTerrainOf(place) : 'plains';
  var rates={ himalayan:[3500,5500], hill:[3000,4500], ghats:[2800,4000],
              coastal:[2500,3800], desert:[2800,4200], plains:[2200,3500], metro:[2500,4000] };
  var r=rates[t]||rates.plains;
  rwForm('\ud83e\uddd1\u200d\u2708\ufe0f Hire a driver'+(place?' \u2014 '+place:''), [], function(){}, 
    '<div style="text-align:left;line-height:1.75;font-size:13px">'
    +'<b>What a full day usually costs here</b><br>'
    +'<span style="font-size:20px;font-weight:800;color:var(--gold)">\u20b9'+r[0].toLocaleString('en-IN')+' \u2013 \u20b9'+r[1].toLocaleString('en-IN')+'</span>'
    +'<span style="color:var(--t3);font-size:12px"> per day, 8h/80km typical</span><br><br>'
    +'<b>Before you agree, settle these five things:</b><br>'
    +'\u2022 Is fuel included? (usually yes)<br>'
    +'\u2022 Are driver food and stay included on multi-day trips? (usually NOT \u2014 budget \u20b9300\u2013500/day)<br>'
    +'\u2022 Are tolls and parking extra?<br>'
    +'\u2022 What happens past 8 hours or 80 km?<br>'
    +'\u2022 Get the driver\u2019s name and vehicle number in writing before you pay anything.<br><br>'
    +'<span style="color:var(--t3);font-size:12px">Rates are typical ranges for '+esc2(t)+' terrain, not quotes. '
    +'Ask your homestay first \u2014 they almost always know a trusted driver and it is usually cheaper than a booking desk.</span></div>');
}
