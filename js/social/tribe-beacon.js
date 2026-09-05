// @ts-nocheck
/* ==================== SOCIAL: TRIBE + BEACON + TRIP SQUADS ====================
   Extracted verbatim from app.js (Phase 4 modularization). Three related but
   independent opt-in social-discovery features:
     - Trip Squads: anchored, zero built-in chat, safe-by-design meetup board.
     - Tribe Travel: profession/passion affinity -> destination suggestions.
     - Beacon: opt-in, blurred-location, time-boxed nearby-tribe matching.
   No shared state between them; kept together per the Phase 4 module plan
   (js/social/tribe-beacon.js). ==================================== */

/* ===== TRIP SQUADS — safe, anchored, zero built-in chat ===== *
 * Modeled on how Zostel/goSTOPS/The Hosteller stay safe: they never run an open
 * DM system between strangers — social anchors to a real place + real dates,
 * and the traveler themself decides what contact info (if any) to publish.
 * RoamWise can't provide the "real staffed hostel" safety net, so it goes
 * further the other direction: NO forced info exchange, NO in-app messaging
 * to build/moderate, a visible report button, a daily post cap, and posts
 * auto-expire. That is the whole safety model — simple by design. */
var SQUAD_CAP_PER_DAY = 3;
function squadKey(name,month){ return (name+'_'+month).toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,60); }
function openSquads(name, month){
  if(!AUTH_READY || !user){ showToast('Sign in first \u2014 Trip Squads is for real accounts'); return; }
  var ov=el('squadOv');
  if(!ov){ ov=document.createElement('div'); ov.id='squadOv'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:440px;max-height:88vh;overflow:auto"><button class="modal-close" onclick="el(\'squadOv\').classList.remove(\'open\')">\u00d7</button>'
     +'<div class="modal-head"><div class="modal-title">\ud83c\udf92 Trip Squads</div><div class="modal-sub" id="squadSub"></div></div>'
     +'<div class="modal-body"><div style="font-size:11px;color:var(--t3);background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:10px 12px;margin-bottom:12px">\ud83d\udee1\ufe0f No chat here on purpose. Posts show only what the traveler chooses to share. Never send money or OTPs before meeting in person \u2014 verify at a public place first.</div>'
     +'<div id="squadList"></div>'
     +'<div style="border-top:1px solid var(--b2);margin-top:14px;padding-top:14px">'
     +'<div style="font-size:12.5px;font-weight:700;color:var(--t1);margin-bottom:8px">Post your own squad</div>'
     +'<textarea id="squadNote" maxlength="140" placeholder="e.g. 2 of us, budget backpacking, flexible dates ± 4 days" style="width:100%;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:10px;color:var(--t1);font-family:Outfit;font-size:13px;min-height:60px"></textarea>'
     +'<input id="squadContact" maxlength="80" placeholder="Optional \u2014 how to reach you (Insta handle, WhatsApp link\u2026) \u2014 leave blank to stay private" style="width:100%;margin-top:8px;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:10px;color:var(--t1);font-family:Outfit;font-size:13px">'
     +'<button class="rzp-main-btn" style="margin-top:10px" onclick="postSquad()">\ud83d\udce2 Post to this Squad board</button>'
     +'</div></div></div>';
    document.body.appendChild(ov); }
  el('squadSub').textContent=name+' \u00b7 '+month;
  window._squadCtx={name:name, month:month};
  loadSquads(name,month);
  ov.classList.add('open');
}
function loadSquads(name,month){
  var list=el('squadList'); list.innerHTML='<div style="font-size:12px;color:var(--t3)">Loading\u2026</div>';
  var key=squadKey(name,month);
  var cutoff=Date.now()-45*864e5; /* auto-expire: only show posts from the last 45 days */
  db.collection('squads').where('key','==',key).orderBy('created','desc').limit(20).get().then(function(qs){
    var rows=qs.docs.map(function(d){ return {id:d.id, data:d.data()}; })
      .filter(function(r){ var c=r.data.created; return !c || c.toMillis()>cutoff; });
    if(!rows.length){ list.innerHTML='<div class="mode-box">No squads posted yet for '+name+' in '+month+' \u2014 be the first \ud83e\udd1d<div style="font-size:11px;color:var(--t3);margin-top:6px">Posts you and others make appear right here on this board, grouped by destination + month.</div></div>'; return; }
    list.innerHTML=rows.map(function(r){
      var d2=r.data, mine=(d2.uid===((user||{}).uid));
      return '<div class="ti-day" style="align-items:flex-start;flex-direction:column;gap:4px;padding:12px;border:1px solid var(--b2);border-radius:12px;margin-bottom:8px">'
        +'<div style="font-size:13px;color:var(--t1)">'+String(d2.note||'').replace(/[<>]/g,'')+'</div>'
        +(d2.contact? '<div style="font-size:11.5px;color:var(--gold2)">\ud83d\udcac '+String(d2.contact).replace(/[<>]/g,'')+'</div>' : '<div style="font-size:11px;color:var(--t3)">No contact shared \u2014 poster stays private</div>')
        +'<div style="display:flex;gap:8px;margin-top:2px">'
        +(mine? '<button class="tact" style="font-size:10.5px;padding:5px 10px" onclick="delSquad(\''+r.id+'\')">Remove mine</button>'
              : '<button class="tact" style="font-size:10.5px;padding:5px 10px;color:var(--t3)" onclick="reportSquad(\''+r.id+'\')">\u26a0 Report</button>')
        +'</div></div>';
    }).join('');
  }).catch(function(){ list.innerHTML='<div class="mode-box">Squad board needs the Firestore rules published \u2014 see admin console.</div>'; });
}
function postSquad(){
  var C=window._squadCtx||{}; if(!C.name) return;
  var note=(el('squadNote').value||'').trim().slice(0,140);
  if(note.length<6) return showToast('Add a real one-liner \u2014 destination, dates, party size');
  var contact=(el('squadContact').value||'').trim().slice(0,80);
  var todayKey='rw_squadday_'+new Date().toISOString().slice(0,10);
  var postedToday=parseInt(lsGet(todayKey)||'0',10);
  if(postedToday>=SQUAD_CAP_PER_DAY) return showToast('Daily post limit reached ('+SQUAD_CAP_PER_DAY+') \u2014 try again tomorrow');
  db.collection('squads').add({
    key:squadKey(C.name,C.month), destination:C.name, month:C.month, note:note, contact:contact,
    uid:user.uid, created:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    lsSet(todayKey, String(postedToday+1));
    el('squadNote').value=''; el('squadContact').value='';
    showToast('\ud83c\udf92 Posted to the Squad board'); xpAdd(8,'Posted a Trip Squad'); lsSet('rw_squad_count', String((parseInt(lsGet('rw_squad_count')||'0',10)||0)+1));
    loadSquads(C.name,C.month);
  }).catch(function(){ showToast('Could not post \u2014 check Firestore rules'); });
}
function delSquad(id){ if(!confirm('Remove this squad post?')) return;
  db.collection('squads').doc(id).delete().then(function(){ var C=window._squadCtx||{}; if(C.name) loadSquads(C.name,C.month); }); }
function reportSquad(id){
  db.collection('reports').add({type:'squad', targetId:id, by:(user&&user.uid)||'anon', created:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){ showToast('Reported \u2014 thank you, our team will review'); })
    .catch(function(){ showToast('Report failed \u2014 try again'); });
}

/* ===================== TRIBE TRAVEL =====================
   Travel with your kind. Match by profession / passion / vibe to the trips and
   destinations that community actually gravitates to, then connect via Trip
   Squads. Curated tribe->destination affinities (real communities/scenes),
   honest that these are starting points, not a guarantee of who you'll meet. */
var RW_TRIBES=[
  {id:'devs', ic:'\ud83d\udcbb', name:'Developers & Tech', spots:['Bali (Canggu/Ubud)','Bangalore','Lisbon','Chiang Mai','Goa'], why:'Digital-nomad hubs with fast wifi, coworking & meetups.'},
  {id:'founders', ic:'\ud83d\ude80', name:'Founders & Startups', spots:['Bangalore','Dubai','Singapore','San Francisco','Gurugram'], why:'Startup density, investor networks, demo-day energy.'},
  {id:'musicians', ic:'\ud83c\udfb8', name:'Musicians & Artists', spots:['Rishikesh','Goa (Arambol)','Kasol','McLeod Ganj','Varanasi'], why:'Jam circles, open mics, spiritual-creative scenes.'},
  {id:'yogis', ic:'\ud83e\uddd8', name:'Yoga & Wellness', spots:['Rishikesh','Mysore','Dharamshala','Gokarna','Auroville'], why:'Ashrams, teacher-training, wellness retreats.'},
  {id:'trekkers', ic:'\u26f0\ufe0f', name:'Trekkers & Adventurers', spots:['Manali','Leh-Ladakh','Spiti','Munsiyari','Sikkim'], why:'High passes, base camps, adventure-sport crews.'},
  {id:'writers', ic:'\u270d\ufe0f', name:'Writers & Creators', spots:['Pondicherry','Landour','Goa','Shillong','Kasauli'], why:'Quiet, literary towns & creator retreats.'},
  {id:'photographers', ic:'\ud83d\udcf8', name:'Photographers', spots:['Varanasi','Ladakh','Hampi','Jaisalmer','Ziro Valley'], why:'Iconic light, festivals, landscapes & street life.'},
  {id:'foodies', ic:'\ud83c\udf5c', name:'Foodies', spots:['Delhi','Lucknow','Amritsar','Kolkata','Hyderabad'], why:'Legendary street food & regional cuisines.'}
];
function openTribeTravel(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('tribeSection');
  if(!sec){ sec=document.createElement('section'); sec.id='tribeSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  var cards=RW_TRIBES.map(function(t){
    return '<button class="tribe-card" onclick="rwTribePick(\''+t.id+'\')">'
      +'<span class="tribe-ic">'+t.ic+'</span>'
      +'<span class="tribe-name">'+t.name+'</span></button>';
  }).join('');
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83e\udd1d Tribe <em>travel</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'tribeSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Travel with your kind. Pick your tribe \u2014 see where that community goes, and find travel buddies who get you.</p>'
    +'<div class="tribe-grid">'+cards+'</div>'
    +'<div id="tribeOut" style="margin-top:14px"></div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
}
function rwTribeSquad(city){ var m=new Date().toISOString().slice(0,7); try{ openSquads(city, m); }catch(e){ showToast('Open Trip Squads from the group menu'); } }
function rwTribePick(id){
  var t=RW_TRIBES.filter(function(x){return x.id===id;})[0]; if(!t) return;
  var out=el('tribeOut');
  var spots=t.spots.map(function(s){
    var city=s.split(' (')[0];
    return '<div class="tribe-spot">'
      +'<span class="tribe-spot-name">\ud83d\udccd '+esc2(s)+'</span>'
      +'<span class="tribe-spot-acts"><button class="tribe-mini" onclick="cpFollow(\''+esc2(city)+'\')">Plan</button>'
      +'<button class="tribe-mini" onclick="rwTribeSquad(\''+esc2(city)+'\')">Find buddies</button></span>'
      +'</div>';
  }).join('');
  out.innerHTML='<div class="tribe-result"><div class="tribe-rh">'+t.ic+' '+esc2(t.name)+'</div>'
    +'<div class="tribe-why">'+esc2(t.why)+'</div>'
    +'<div class="tribe-label">Where your tribe goes:</div>'+spots
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:10px;line-height:1.5">These are the destinations this community gravitates to \u2014 a starting point, not a guarantee of who you\u2019ll meet. Use \u201cFind buddies\u201d to post in Trip Squads for that city.</div></div>';
  try{ badgeBump('group'); }catch(e){ /* badge/progression update is a nice-to-have, ignore */ }
}

/* ================= BEACON — nearby tribe matching (rw-v46) =================
   SAFETY-FIRST BY DESIGN. Broadcasting a traveller's live position to strangers
   is a stalking vector, so this deliberately does NOT do that:
     - opt-in only, never automatic
     - location is BLURRED to ~1km grid before it ever leaves the device
     - beacons EXPIRE (2h default) — no continuous tracking, ever
     - you choose your tags and your own contact handle; nothing is scraped
     - one tap to go dark, and a report path
   NOTE ON LINKEDIN/INSTAGRAM: their APIs do not expose profile interests to
   third parties (LinkedIn returns only name/email/photo; IG Basic Display was
   retired). So users optionally paste THEIR OWN profile link to share — which
   is honest, consented, and works today.
   ========================================================================== */
var RW_TRIBE_TAGS=['\ud83d\ude80 Founder','\ud83d\udcbc Investor','\ud83d\udcbb Engineer','\ud83c\udfa8 Artist','\ud83c\udfa5 Creator',
  '\ud83e\uddd8 Yoga','\ud83c\udfc3 Runner','\ud83e\uddd7 Trekker','\ud83c\udfb8 Musician','\ud83d\udcf7 Photographer',
  '\ud83c\udf7d\ufe0f Foodie','\ud83c\udfc4 Surfer','\ud83d\udcda Writer','\ud83e\uddd1\u200d\ud83c\udf93 Student'];
/* blur to ~1km so an exact position never leaves the device */
function rwBlur(v){ return Math.round(v*100)/100; }
function rwBeaconMine(){ try{ return JSON.parse(lsGet('rw_beacon')||'null'); }catch(e){ return null; } }

function openBeacon(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('beaconSection');
  if(!sec){ sec=document.createElement('section'); sec.id='beaconSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  var mine=rwBeaconMine();
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\udce1 <em>Beacon</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'beaconSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Find your people within about a kilometre \u2014 founders, artists, runners, yogis \u2014 wherever you land. Light a beacon, see who else is lit.</p>'
    +'<div style="background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.4);border-radius:14px;padding:13px;margin-bottom:14px">'
    +'<div style="font-size:12px;color:#4ADE80;font-weight:800;margin-bottom:4px">\ud83d\udd12 How we keep this safe</div>'
    +'<div style="font-size:12px;color:var(--t2);line-height:1.6">Your exact location never leaves your phone \u2014 we blur it to a ~1km area first. Beacons switch off by themselves after 2 hours. You are only visible while your beacon is lit, and only to others who lit theirs.</div></div>'
    + (mine? '' : '<div style="font-size:12.5px;color:var(--t3);margin-bottom:10px">Nothing is shared until you tap the button below.</div>')
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">'
    + (mine
       ? '<button class="tact" style="flex:1;min-width:150px;font-weight:800;background:linear-gradient(135deg,#4ADE80,#22C55E);color:#0A0A0C;border:none" onclick="rwBeaconFind()">\ud83d\udd0d Who\u2019s nearby</button>'
        +'<button class="tact" style="flex:1;min-width:150px" onclick="rwBeaconOff()">\ud83c\udf19 Go dark</button>'
       : '<button class="tact" style="flex:1;min-width:180px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:13px" onclick="rwBeaconLight()">\ud83d\udce1 Light my beacon</button>')
    +'</div><div id="beaconOut"></div>';
  if(mine) rwBeaconFind();
}
function rwBeaconLight(){
  if(!user){ showToast('Sign in first \u2014 beacons are tied to real accounts for safety'); try{ openAuth(); }catch(e){ /* best-effort, ignore */ } return; }
  var chosen=[];
  var chips=RW_TRIBE_TAGS.map(function(t,i){
    return '<button id="btag'+i+'" onclick="rwBeaconTag('+i+')" style="background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:20px;padding:7px 12px;color:var(--t1);font-size:12px;cursor:pointer;margin:3px">'+t+'</button>';
  }).join('');
  var ov=el('beaconSetupOv');
  if(!ov){ ov=document.createElement('div'); ov.id='beaconSetupOv'; ov.className='overlay'; ov.style.zIndex='3000';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('beaconSetupOv'); }; document.body.appendChild(ov); }
  window._beaconTags=[];
  ov.innerHTML='<div class="sheet" style="max-width:420px"><div class="sheet-h"><b>\ud83d\udce1 Light your beacon</b>'
    +'<button onclick="rwOverlayClose(\'beaconSetupOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin:8px 0 6px">I\u2019M INTO\u2026 (pick a few)</div>'
    +'<div>'+chips+'</div>'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin:14px 0 6px">ONE LINE ABOUT YOU</div>'
    +'<input id="beaconBio" placeholder="e.g. building a travel app, up for coffee" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:11px;color:var(--t1);font:inherit">'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin:12px 0 6px">HOW SHOULD THEY REACH YOU?</div>'
    +'<input id="beaconHandle" placeholder="@yourhandle, LinkedIn URL, or email" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:11px;color:var(--t1);font:inherit">'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:6px;line-height:1.5">Share only what you\u2019re comfortable with strangers seeing. You can go dark any time.</div>'
    +'<button class="tact" style="width:100%;margin-top:14px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:13px" onclick="rwBeaconGo()">Light it for 2 hours</button></div>';
  ov.classList.add('open');
}
function rwBeaconTag(i){
  var t=RW_TRIBE_TAGS[i], list=window._beaconTags||[];
  var at=list.indexOf(t); if(at>=0) list.splice(at,1); else list.push(t);
  window._beaconTags=list;
  var b=el('btag'+i); if(b){ var on=list.indexOf(t)>=0;
    b.style.borderColor=on?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)';
    b.style.background=on?'rgba(232,186,108,.14)':'var(--bg3,#1A1A20)'; }
  try{ rwHaptic(); }catch(e){ /* haptic feedback is a nice-to-have, ignore */ }
}
function rwBeaconGo(){
  var tags=window._beaconTags||[];
  if(!tags.length){ showToast('Pick at least one thing you\u2019re into'); return; }
  var bio=(el('beaconBio')&&el('beaconBio').value||'').trim();
  var handle=(el('beaconHandle')&&el('beaconHandle').value||'').trim();
  showToast('\ud83d\udccd Getting your rough area\u2026');
  function place(lat,lon){
    if(typeof db==='undefined'||!db){ showToast('Need a connection to light a beacon'); return; }
    var blat=rwBlur(lat), blon=rwBlur(lon);
    var rec={ uid:user.uid, name:(user.displayName||'Traveller'), tags:tags, bio:bio, handle:handle,
      lat:blat, lon:blon, house:rwHouse()||null,
      expireAt: firebase.firestore.Timestamp.fromMillis(Date.now()+2*60*60*1000),
      lit: firebase.firestore.FieldValue.serverTimestamp() };
    db.collection('beacons').doc(user.uid).set(rec).then(function(){
      try{ lsSet('rw_beacon', JSON.stringify({lat:blat,lon:blon,tags:tags,at:Date.now()})); }catch(e){ /* storage best-effort, ignore */ }
      try{ rwHaptic('heavy'); }catch(e){ /* haptic feedback is a nice-to-have, ignore */ }
      rwOverlayClose('beaconSetupOv');
      showToast('\ud83d\udce1 Beacon lit for 2 hours');
      openBeacon();
    }).catch(function(){ showToast('Could not light your beacon \u2014 try again'); });
  }
  function fail(){ showToast('Need location access to find people near you'); }
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Geolocation){
    Capacitor.Plugins.Geolocation.getCurrentPosition({enableHighAccuracy:false,timeout:12000})
      .then(function(p){ place(p.coords.latitude,p.coords.longitude); }).catch(fail);
  } else if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(p){ place(p.coords.latitude,p.coords.longitude); }, fail,
      {enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  } else fail();
}
function rwBeaconOff(){
  if(user && typeof db!=='undefined' && db){ db.collection('beacons').doc(user.uid).delete().catch(function(){}); }
  try{ lsSet('rw_beacon',''); }catch(e){ /* storage best-effort, ignore */ }
  showToast('\ud83c\udf19 Beacon off \u2014 you\u2019re invisible again');
  openBeacon();
}
function rwBeaconFind(){
  var host=el('beaconOut'); if(!host) return;
  var mine=rwBeaconMine();
  if(!mine){ host.innerHTML=''; return; }
  if(typeof db==='undefined'||!db){ host.innerHTML='<div class="note">Offline \u2014 need a connection.</div>'; return; }
  host.innerHTML='<div class="note">\ud83d\udd0d Looking for lit beacons near you\u2026</div>';
  db.collection('beacons').limit(300).get().then(function(qs){
    var now=Date.now(), rows=[];
    qs.forEach(function(d){
      var b=d.data()||{};
      if(b.uid===user.uid) return;
      var exp=b.expireAt&&b.expireAt.seconds? b.expireAt.seconds*1000 : 0;
      if(exp && exp<now) return;                    /* expired = invisible */
      if(typeof b.lat!=='number'||typeof b.lon!=='number') return;
      var km=rwHaversine(mine.lat,mine.lon,b.lat,b.lon);
      if(km>2.5) return;                            /* ~1km grid + tolerance */
      var shared=(b.tags||[]).filter(function(t){ return (mine.tags||[]).indexOf(t)>=0; });
      rows.push({b:b,km:km,shared:shared});
    });
    rows.sort(function(x,y){ return (y.shared.length-x.shared.length) || (x.km-y.km); });
    if(!rows.length){
      host.innerHTML='<div class="note" style="text-align:center;padding:20px;color:var(--t3)">No one else is lit nearby right now. Your beacon stays on for 2 hours \u2014 check back, or share RoamWise with whoever you\u2019re travelling with.</div>';
      return;
    }
    host.innerHTML='<div style="font-size:12px;color:var(--t3);margin-bottom:9px">'+rows.length+' nearby right now</div>'
      + rows.map(function(r){
        var b=r.b;
        return '<div style="border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:14px;margin-bottom:9px;background:var(--bg2,#12151F)">'
          +'<div style="display:flex;justify-content:space-between;gap:8px;align-items:start">'
          +'<b style="font-size:14.5px">'+esc2(b.name||'Traveller')+'</b>'
          +'<span style="font-size:11px;color:var(--gold,#E8BA6C);font-weight:700">~'+(r.km<1?'under 1':r.km.toFixed(1))+' km</span></div>'
          +(b.bio?'<div style="font-size:12.5px;color:var(--t2);margin-top:4px">'+esc2(b.bio)+'</div>':'')
          +'<div style="margin-top:7px">'+(b.tags||[]).map(function(t){
              var hot=r.shared.indexOf(t)>=0;
              return '<span style="display:inline-block;font-size:11px;border-radius:20px;padding:3px 9px;margin:2px 3px 0 0;'
                +(hot?'background:rgba(74,222,128,.15);color:#4ADE80;border:1px solid rgba(74,222,128,.5);font-weight:700'
                     :'background:var(--bg3,#1A1A20);color:var(--t3);border:1px solid var(--b2,#2A2A36)')+'">'+t+'</span>';
            }).join('')+'</div>'
          +(r.shared.length?'<div style="font-size:11px;color:#4ADE80;margin-top:6px;font-weight:700">\u2713 '+r.shared.length+' shared interest'+(r.shared.length>1?'s':'')+'</div>':'')
          +(b.handle?'<div style="margin-top:9px"><a class="tact" style="padding:6px 12px;font-size:12px;text-decoration:none" href="'+rwHandleHref(b.handle)+'" target="_blank" rel="noopener">\ud83d\udc4b '+esc2(b.handle)+'</a></div>':'')
          +'<div style="margin-top:8px"><button class="tact" style="padding:4px 10px;font-size:11px;color:var(--t3)" onclick="rwBeaconReport(\''+esc2(b.uid||'')+'\')">Report</button></div>'
          +'</div>';
      }).join('');
  }).catch(function(){ host.innerHTML='<div class="note">Could not search right now.</div>'; });
}
function rwHandleHref(h){
  h=String(h||'').trim();
  if(/^https?:\/\//i.test(h)) return h;
  if(h.indexOf('@')>0 && h.indexOf('.')>0) return 'mailto:'+h;
  if(h.charAt(0)==='@') return 'https://instagram.com/'+h.slice(1);
  return '#';
}
function rwBeaconReport(uid){
  if(!uid || typeof db==='undefined' || !db){ showToast('Could not report'); return; }
  rwForm('Report this beacon', [{key:'why', label:'What\u2019s wrong?', placeholder:'Briefly \u2014 this goes to the RoamWise team'}], function(v){
    db.collection('reports').add({ kind:'beacon', target:uid, why:v.why||'', by:(user&&user.uid)||null,
      at: firebase.firestore.FieldValue.serverTimestamp() })
      .then(function(){ showToast('Reported \u2014 thank you, we look at every one'); })
      .catch(function(){ showToast('Could not send the report'); });
  });
}
