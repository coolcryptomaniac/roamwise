// @ts-nocheck
/* Realms of Roam / Journey Passport game system — moved verbatim from
   app.js (Phase 6a modularization). Covers seasons/glory/verified claims,
   houses/realms map, and the Journey Passport (stamp/verify) flow. */

/* ============ REALMS: SEASONS, GLORY & VERIFIED CLAIMS (rw-v47) ============
   Makes the game genuinely competitive AND safe to attach real prizes to.
   THE FRAUD PROBLEM: a self-declared stamp is fine for a badge, worthless the
   moment money is involved. So a stamp can now be GPS-VERIFIED — we check the
   device's position against the geocoded place at the moment of stamping.
   Only verified claims earn Glory and count for prizes. Unverified stamps still
   live in your passport as personal memories, just worth zero on the ladder.
   ========================================================================== */

/* --- Season: monthly, everyone resets, so a newcomer can win --- */
function rwSeason(){
  var d=new Date();
  var id=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  var names=['Frostfall','Thawtide','Bloomrise','Highsun','Monsoon Run','Cloudbreak',
             'Emberfall','Longlight','Duskwind','Harvestmoon','Starfall','Deepwinter'];
  var end=new Date(d.getFullYear(), d.getMonth()+1, 1);
  return {id:id, name:names[d.getMonth()], endsIn:Math.ceil((end-d)/86400000)};
}
/* --- Difficulty: remote/hard realms are worth more, so the game rewards
       genuinely adventurous travel rather than repeat trips to the nearest city --- */
var RW_REALM_WEIGHT={north:5, east:4, hills:3, central:3, desert:3, south:2, west:2};
function rwClaimGlory(rec){
  if(!rec || !rec.verified) return 0;              /* unverified = zero */
  var w=RW_REALM_WEIGHT[rwRealmOf(rec.place)||'']||2;
  return 10*w;
}
/* --- Weekly bounties: a reason to open the app on a Tuesday --- */
function rwBounties(){
  var wk=Math.floor(Date.now()/(7*86400000));
  var pool=[
    {t:'Claim any realm you have never held', g:60, icon:'\ud83c\udff4'},
    {t:'Verify a claim above 2,000m altitude country', g:80, icon:'\ud83c\udfd4\ufe0f'},
    {t:'Take a realm currently held by a rival house', g:100, icon:'\u2694\ufe0f'},
    {t:'Claim two realms in one week', g:90, icon:'\ud83d\udd25'},
    {t:'Bring a friend \u2014 they light a beacon near you', g:50, icon:'\ud83d\udce1'},
    {t:'Stamp a journey with a photo-worthy note', g:40, icon:'\u270d\ufe0f'}
  ];
  return [pool[wk%pool.length], pool[(wk+2)%pool.length], pool[(wk+4)%pool.length]];
}
/* --- Verified claim: prove you are actually there --- */
async function rwVerifyHere(place){
  /* returns {ok, km, why} — compares device position to the geocoded place */
  var pos=null;
  try{
    if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Geolocation){
      pos=await Capacitor.Plugins.Geolocation.getCurrentPosition({enableHighAccuracy:true,timeout:15000});
    } else if(navigator.geolocation){
      pos=await new Promise(function(res,rej){
        navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
      });
    }
  }catch(e){ return {ok:false, why:'Location unavailable \u2014 allow location to earn Glory'}; }
  if(!pos||!pos.coords) return {ok:false, why:'Could not read your location'};
  var geo=null; try{ geo=await gcode(place); }catch(e){ /* best-effort, ignore */ }
  if(!geo) return {ok:false, why:'Could not place "'+place+'" on the map'};
  var km=rwHaversine(pos.coords.latitude, pos.coords.longitude, geo.lat, geo.lon);
  if(km<=60) return {ok:true, km:km};
  return {ok:false, km:km, why:'You look about '+Math.round(km)+'km away. Claims must be made while you are there.'};
}
/* --- The competitive dashboard --- */
function rwRealmsLadder(){
  var host=el('realmLadder'); if(!host) return;
  if(typeof db==='undefined'||!db){ host.innerHTML=''; return; }
  var S=rwSeason();
  db.collection('passports').limit(500).get().then(function(qs){
    var people={}, houses={};
    RW_HOUSES.forEach(function(H){ houses[H.id]=0; });
    qs.forEach(function(d){
      var r=d.data()||{};
      var iso=r.issued&&r.issued.seconds? new Date(r.issued.seconds*1000) : null;
      if(!iso) return;
      var sid=iso.getFullYear()+'-'+String(iso.getMonth()+1).padStart(2,'0');
      if(sid!==S.id) return;                       /* this season only */
      var g=rwClaimGlory(r); if(!g) return;
      var k=r.uid||'?';
      if(!people[k]) people[k]={name:(r.name||'Traveller').split(' ')[0], g:0, n:0, house:r.house};
      people[k].g+=g; people[k].n++;
      if(r.house && houses[r.house]!==undefined) houses[r.house]+=g;
    });
    var top=Object.keys(people).map(function(k){ return people[k]; })
              .sort(function(a,b){ return b.g-a.g; }).slice(0,10);
    var myUid=(user&&user.uid)||'';
    var meRank=Object.keys(people).sort(function(a,b){ return people[b].g-people[a].g; }).indexOf(myUid)+1;
    var hRank=RW_HOUSES.slice().sort(function(a,b){ return houses[b.id]-houses[a.id]; });
    host.innerHTML='<div style="background:var(--bg2,#12151F);border:1px solid var(--gold,#E8BA6C);border-radius:16px;padding:15px;margin-bottom:12px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">'
      +'<b style="font-size:15px">\ud83c\udfc6 Season of '+S.name+'</b>'
      +'<span style="font-size:11.5px;color:'+(S.endsIn<=5?'#E05B5B':'var(--t3)')+';font-weight:700">'+S.endsIn+' days left</span></div>'
      +'<div style="font-size:11.5px;color:var(--t2)">Everyone resets each month \u2014 a newcomer can top the ladder.'
      + (meRank?' You\u2019re <b style="color:var(--gold,#E8BA6C)">#'+meRank+'</b> this season.':'')+'</div></div>'
      +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:15px;margin-bottom:12px">'
      +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:9px">HOUSES THIS SEASON</div>'
      + hRank.map(function(H,i){
          var pct=hRank[0]&&houses[hRank[0].id]? Math.round(houses[H.id]/houses[hRank[0].id]*100) : 0;
          return '<div style="margin-bottom:8px"><div style="display:flex;gap:7px;font-size:12.5px;margin-bottom:3px">'
            +'<span>'+H.sigil+'</span><b style="flex:1;color:'+H.color+'">'+H.name+'</b>'
            +'<span style="color:var(--t3);font-weight:700">'+houses[H.id]+'</span></div>'
            +'<div style="height:6px;border-radius:6px;background:var(--bg3,#1A1A20);overflow:hidden">'
            +'<div class="rw-sheen" style="height:100%;width:'+Math.max(3,pct)+'%;background:'+H.color+'"></div></div></div>';
        }).join('')+'</div>'
      +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:15px;margin-bottom:12px">'
      +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:9px">TOP TRAVELLERS</div>'
      + (top.length? top.map(function(t,i){
          var medal=['\ud83e\udd47','\ud83e\udd48','\ud83e\udd49'][i]||('#'+(i+1));
          var H=RW_HOUSES.filter(function(x){return x.id===t.house;})[0];
          return '<div style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:1px solid var(--b1,rgba(255,255,255,.05))">'
            +'<span style="width:26px;font-size:13px">'+medal+'</span>'
            +'<span style="flex:1;font-size:13px"><b>'+esc2(t.name)+'</b>'+(H?' <span style="font-size:11px">'+H.sigil+'</span>':'')+'</span>'
            +'<span style="font-size:12px;color:var(--gold,#E8BA6C);font-weight:800">'+t.g+'</span></div>';
        }).join('') : '<div style="font-size:12.5px;color:var(--t3)">No verified claims yet this season. First one takes the crown.</div>')
      +'</div>'
      +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:15px;margin-bottom:12px">'
      +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:9px">THIS WEEK\u2019S BOUNTIES</div>'
      + rwBounties().map(function(b){
          return '<div style="display:flex;align-items:center;gap:9px;padding:7px 0">'
            +'<span style="font-size:17px">'+b.icon+'</span>'
            +'<span style="flex:1;font-size:12.5px;color:var(--t2)">'+b.t+'</span>'
            +'<span style="font-size:11.5px;color:#4ADE80;font-weight:800">+'+b.g+'</span></div>';
        }).join('')+'</div>'
      +'<button class="tact" style="width:100%;font-weight:800" onclick="openRewards()">\ud83c\udf81 Season rewards &amp; rules</button>';
  }).catch(function(){ host.innerHTML=''; });
}
/* --- Rewards page: honest about how prizes actually work --- */
function openRewards(){
  var S=rwSeason();
  var ov=el('rewardsOv');
  if(!ov){ ov=document.createElement('div'); ov.id='rewardsOv'; ov.className='overlay'; ov.style.zIndex='3000';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('rewardsOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:430px"><div class="sheet-h"><b>\ud83c\udf81 Season rewards</b>'
    +'<button onclick="rwOverlayClose(\'rewardsOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:12.5px;color:var(--t2);margin:4px 0 12px">Season of <b>'+S.name+'</b> \u00b7 ends in '+S.endsIn+' days</div>'
    +'<div style="border:1px solid var(--gold,#E8BA6C);border-radius:12px;padding:13px;margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>\ud83e\udd47 Top traveller</span><b style="color:var(--gold,#E8BA6C)">\u20b95,000</b></div>'
    +'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>\ud83e\udd48 Runner-up</span><b style="color:var(--gold,#E8BA6C)">\u20b93,000</b></div>'
    +'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>\ud83e\udd49 Third</span><b style="color:var(--gold,#E8BA6C)">\u20b92,000</b></div>'
    +'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>\ud83c\udfc5 Top 10</span><b>RoamWise goodies</b></div>'
    +'<div style="display:flex;justify-content:space-between;font-size:13px"><span>\ud83c\udff4 Winning house</span><b>Sigil badge, all members</b></div></div>'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin:12px 0 6px">HOW TO WIN</div>'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.65">Glory comes only from <b>verified</b> claims \u2014 you must be at the place when you stamp it. Remote realms are worth more: the Frozen North pays 5\u00d7 what the coast does. Weekly bounties stack on top.</div>'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin:14px 0 6px">THE FINE PRINT</div>'
    +'<div style="font-size:11.5px;color:var(--t3);line-height:1.6">Free to enter \u2014 no purchase, no entry fee, ever. Winners are decided purely on verified travel, so this is a contest of skill, not chance. Every prize is kept under \u20b910,000, so no TDS is deducted under Section 194B. Open to residents of India aged 18+. Faked or duplicate claims are removed and forfeit prizes. <a href="/legal/contest-rules.html" target="_blank" style="color:var(--gold,#E8BA6C)">Full official rules \u2197</a></div>'
    +'</div>';
  ov.classList.add('open');
}

// Beacon (nearby tribe matching) moved to js/social/tribe-beacon.js

/* ================= REALMS OF ROAM (rw-v45) — the travel conquest game =======
   WHY THIS IS GENUINELY NEW: every travel app's "gamification" is fake points
   for tapping buttons. Here the GAME BOARD IS THE REAL MAP OF INDIA, and the
   only way to take territory is to ACTUALLY GO THERE and stamp a verified
   Journey Passport. You cannot grind it, buy it, or fake it — a region is held
   by the House whose members have really been there most recently.
   That also makes it uncopyable for the same reason the passport is: the map
   state lives in RoamWise's network, not in the code.
   ========================================================================== */
var RW_HOUSES=[
  {id:'himal', name:'House Himalaya',  sigil:'\ud83c\udfd4\ufe0f', words:'The Peaks Remember',      color:'#7DD3FC', home:'north'},
  {id:'tide',  name:'House Tidewater', sigil:'\ud83c\udf0a', words:'Salt in Every Story',   color:'#38BDF8', home:'west'},
  {id:'ember', name:'House Ember',     sigil:'\ud83d\udd25', words:'We Ride at Dawn',       color:'#FB923C', home:'desert'},
  {id:'verdant',name:'House Verdant',  sigil:'\ud83c\udf3f', words:'Green Grows the Road',  color:'#4ADE80', home:'south'},
  {id:'stone', name:'House Stonewatch',sigil:'\ud83d\udfe4', words:'Older Than Kings',      color:'#C084FC', home:'central'}
];
var RW_REALMS=[
  {id:'north',  name:'The Frozen North',   emoji:'\u2744\ufe0f', places:'Ladakh, Spiti, Sikkim, Tawang'},
  {id:'hills',  name:'The Cloud Hills',    emoji:'\ud83c\udf2b\ufe0f', places:'Himachal, Uttarakhand, Meghalaya'},
  {id:'west',   name:'The Salt Coast',     emoji:'\ud83c\udfd6\ufe0f', places:'Goa, Konkan, Gujarat coast'},
  {id:'desert', name:'The Sunlands',       emoji:'\ud83c\udfdc\ufe0f', places:'Rajasthan, Kutch'},
  {id:'south',  name:'The Green Reaches',  emoji:'\ud83c\udf34', places:'Kerala, Karnataka, Tamil Nadu'},
  {id:'east',   name:'The River Marches',  emoji:'\ud83d\udea3', places:'Bengal, Odisha, Assam'},
  {id:'central',name:'The Old Stones',     emoji:'\ud83c\udfef', places:'MP, Hampi, Maharashtra forts'}
];
/* region matching: a stamped place name decides which realm it belongs to */
var RW_REALM_KEYS={
  north:['ladakh','leh','spiti','sikkim','tawang','kaza','nubra','gangtok','arunachal','zanskar'],
  hills:['himachal','uttarakhand','manali','shimla','kasol','mcleod','dharamshala','rishikesh','mussoorie','nainital','almora','meghalaya','shillong','darjeeling','bir','kausani','munsiyari','chopta','auli','dalhousie','khajjiar'],
  west:['goa','konkan','gujarat','diu','daman','alibaug','ratnagiri','gokarna','dwarka','somnath','mumbai'],
  desert:['rajasthan','jaisalmer','jodhpur','udaipur','jaipur','pushkar','bikaner','kutch','rann','mount abu','ajmer'],
  south:['kerala','karnataka','tamil','munnar','alleppey','varkala','kochi','wayanad','coorg','chikmagalur','ooty','kodaikanal','pondicherry','madurai','mahabalipuram','bangalore','bengaluru','chennai','hampi'],
  east:['bengal','odisha','assam','kolkata','puri','konark','guwahati','kaziranga','sundarban','majuli','digha'],
  central:['madhya','hampi','maharashtra','khajuraho','orchha','pachmarhi','bhopal','indore','pune','nashik','ajanta','ellora','gwalior','satpura','panna']
};
function rwRealmOf(place){
  var t=String(place||'').toLowerCase();
  for(var i=0;i<RW_REALMS.length;i++){
    var rid=RW_REALMS[i].id, keys=RW_REALM_KEYS[rid]||[];
    for(var k=0;k<keys.length;k++){ if(t.indexOf(keys[k])>-1) return rid; }
  }
  return null;
}
function rwHouse(){ try{ return lsGet('rw_house')||''; }catch(e){ return ''; } }
function rwHouseObj(){ var h=rwHouse(); return RW_HOUSES.filter(function(x){return x.id===h;})[0]||null; }

function openRealms(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('realmsSection');
  if(!sec){ sec=document.createElement('section'); sec.id='realmsSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  var h=rwHouseObj();
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\u2694\ufe0f Realms of <em>Roam</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'realmsSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Seven realms. Five houses. The only way to take territory is to actually go there \u2014 every claim must be a verified journey. No grinding, no shortcuts.</p>'
    + (h? rwRealmsHome(h) : rwRealmsPickHouse());
  if(h){ rwRealmsLoadMap(); rwRealmsLadder(); }
}
function rwRealmsPickHouse(){
  return '<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:16px">'
    +'<div style="font-weight:800;font-size:15px;margin-bottom:3px">Choose your house</div>'
    +'<div style="font-size:12.5px;color:var(--t2);margin-bottom:14px">This is permanent-ish \u2014 your journeys will earn glory for them. Pick the one that sounds like how you travel.</div>'
    + RW_HOUSES.map(function(H){
      return '<button onclick="rwRealmsJoin(\''+H.id+'\')" style="display:block;width:100%;text-align:left;margin-bottom:9px;padding:13px;border-radius:13px;cursor:pointer;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);color:var(--t1)">'
        +'<div style="display:flex;align-items:center;gap:10px">'
        +'<span style="font-size:26px">'+H.sigil+'</span>'
        +'<span style="flex:1"><b style="font-size:14.5px;color:'+H.color+'">'+H.name+'</b>'
        +'<div style="font-size:11.5px;color:var(--t3);font-style:italic">\u201c'+H.words+'\u201d</div></span></div></button>';
    }).join('')
    +'</div>';
}
function rwRealmsJoin(id){
  try{ lsSet('rw_house', id); }catch(e){ /* storage best-effort, ignore */ }
  var H=RW_HOUSES.filter(function(x){return x.id===id;})[0];
  try{ rwHaptic('heavy'); }catch(e){ /* haptic feedback is a nice-to-have, ignore */ }
  showToast(H.sigil+' You have sworn to '+H.name);
  openRealms();
}
function rwRealmsHome(H){
  return '<div style="background:linear-gradient(135deg,'+H.color+'22,transparent);border:1px solid '+H.color+';border-radius:16px;padding:16px;margin-bottom:14px">'
    +'<div style="display:flex;align-items:center;gap:12px">'
    +'<span style="font-size:34px">'+H.sigil+'</span>'
    +'<span style="flex:1"><b style="font-size:16px;color:'+H.color+'">'+H.name+'</b>'
    +'<div style="font-size:12px;color:var(--t2);font-style:italic">\u201c'+H.words+'\u201d</div></span>'
    +'<button class="tact" style="padding:5px 10px;font-size:11px" onclick="rwRealmsLeave()">Switch</button></div>'
    +'<div id="realmGlory" style="font-size:12.5px;color:var(--t2);margin-top:10px"></div></div>'
    +'<div id="realmLadder"></div>'
    +'<div id="realmMap"><div class="note">Reading the map\u2026</div></div>'
    +'<div style="margin-top:14px;background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:14px;padding:14px">'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:6px">HOW TO TAKE A REALM</div>'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.65">Travel there, then stamp it in your \ud83d\udee1\ufe0f Journey Passport. The stamp is verified against the RoamWise network, so a realm can only be held by someone who genuinely went. Most recent verified claims hold the territory.</div>'
    +'<button class="tact" style="width:100%;margin-top:11px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="openPassport()">\ud83d\udee1\ufe0f Stamp a journey to claim</button></div>';
}
function rwRealmsLeave(){ try{ lsSet('rw_house',''); }catch(e){ /* storage best-effort, ignore */ } openRealms(); }
/* Build the live map from real verified passports across the whole network. */
function rwRealmsLoadMap(){
  var host=el('realmMap'); if(!host) return;
  if(typeof db==='undefined' || !db){ host.innerHTML='<div class="note">Offline \u2014 the map needs a connection.</div>'; return; }
  db.collection('passports').limit(400).get().then(function(qs){
    var hold={}, glory={}, mine=0;
    RW_REALMS.forEach(function(R){ hold[R.id]=null; });
    RW_HOUSES.forEach(function(H){ glory[H.id]=0; });
    var rows=[]; qs.forEach(function(d){ rows.push(d.data()); });
    rows.sort(function(a,b){ return ((a.issued&&a.issued.seconds)||0)-((b.issued&&b.issued.seconds)||0); });
    rows.forEach(function(r){
      var rid=rwRealmOf(r.place); if(!rid) return;
      var hid=r.house||null;
      if(hid && glory[hid]!==undefined){ glory[hid]+=1; }
      if(hid) hold[rid]={house:hid, by:(r.name||'a traveller').split(' ')[0], place:r.place};
      if(user && r.uid===user.uid) mine++;
    });
    var myH=rwHouse();
    var g=el('realmGlory');
    if(g){
      var ranked=RW_HOUSES.slice().sort(function(a,b){ return glory[b.id]-glory[a.id]; });
      var pos=ranked.map(function(x){return x.id;}).indexOf(myH)+1;
      var held=Object.keys(hold).filter(function(k){ return hold[k]&&hold[k].house===myH; }).length;
      g.innerHTML='Glory <b>'+(glory[myH]||0)+'</b> \u00b7 holding <b>'+held+'</b> of '+RW_REALMS.length+' realms \u00b7 ranked <b>#'+(pos||'-')+'</b> of '+RW_HOUSES.length
        +' \u00b7 your claims: <b>'+mine+'</b>';
    }
    host.innerHTML='<div style="display:grid;grid-template-columns:1fr;gap:8px">'
      + RW_REALMS.map(function(R){
        var h=hold[R.id];
        var H=h? RW_HOUSES.filter(function(x){return x.id===h.house;})[0] : null;
        var col=H?H.color:'#3A3A46';
        return '<div style="border:1px solid '+col+';border-left:4px solid '+col+';border-radius:12px;padding:12px;background:var(--bg2,#12151F)">'
          +'<div style="display:flex;align-items:center;gap:9px">'
          +'<span style="font-size:20px">'+R.emoji+'</span>'
          +'<span style="flex:1"><b style="font-size:13.5px">'+R.name+'</b>'
          +'<div style="font-size:10.5px;color:var(--t3)">'+R.places+'</div></span>'
          + (H? '<span style="text-align:right"><span style="font-size:18px">'+H.sigil+'</span>'
                +'<div style="font-size:10px;color:'+H.color+';font-weight:700">held</div></span>'
             : '<span style="font-size:10.5px;color:var(--t3);font-style:italic">unclaimed</span>')
          +'</div>'
          + (h? '<div style="font-size:11px;color:var(--t3);margin-top:6px">Last claimed by '+esc2(h.by)+' \u00b7 '+esc2(String(h.place||'').slice(0,42))+'</div>' : '')
          +'</div>';
      }).join('')
      +'</div>';
  }).catch(function(){ host.innerHTML='<div class="note">Could not read the map right now.</div>'; });
}

/* ================= JOURNEY PASSPORT (rw-v45) =================
   THE DEFENSIBILITY ANSWER, honestly framed:
   Code cannot be made uncopyable — anyone can clone this repo. What CANNOT be
   copied is the NETWORK: a passport is only real if the record exists in
   RoamWise's own Firestore, written by an authenticated RoamWise account.
   Clone the app and you can render the same UI, but every passport you issue
   verifies as UNRECOGNISED, because verification queries the real network, not
   the local code. The moat is the accumulated graph of verified journeys and
   the single canonical verifier at roamwise.co.in/verify.html — both of which a
   copycat starts with zero of, forever.
   ========================================================================== */
function rwPassportId(){
  /* Human-readable, checkable, hard to guess: RW-<base36 time>-<random> */
  var t=Date.now().toString(36).toUpperCase();
  var r=''; var A='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  for(var i=0;i<5;i++) r+=A[Math.floor(Math.random()*A.length)];
  return 'RW-'+t+'-'+r;
}
function openPassport(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('passportSection');
  if(!sec){ sec=document.createElement('section'); sec.id='passportSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\udee1\ufe0f Journey <em>passport</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'passportSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Verified proof of where you\u2019ve actually been. Each stamp is issued into the RoamWise network and can be checked by anyone \u2014 employers, hosts, communities, or fellow travellers.</p>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--gold,#E8BA6C);border-radius:16px;padding:16px;margin-bottom:14px">'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<button class="tact" style="flex:1;min-width:150px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwPassportIssue()">\u2795 Stamp a journey</button>'
    +'<button class="tact" style="flex:1;min-width:150px" onclick="rwPassportVerifyAsk()">\ud83d\udd0d Verify a passport</button>'
    +'</div></div>'
    +'<div id="passportOut"><div class="note">Loading your stamps\u2026</div></div>';
  rwPassportLoad();
}
function rwPassportIssue(){
  if(!user){ showToast('Sign in first \u2014 a stamp has to be tied to a real account'); try{ openAuth(); }catch(e){ /* best-effort, ignore */ } return; }
  if(typeof db==='undefined' || !db){ showToast('You\u2019re offline \u2014 stamping needs a connection'); return; }
  var last=(window._lastItin&&window._lastItin.name)||'';
  rwForm('\ud83d\udee1\ufe0f Stamp a journey', [
    {key:'place', label:'Where did you go?', value:last, placeholder:'e.g. Spiti Valley, Himachal'},
    {key:'when', label:'When?', placeholder:'e.g. June 2026'},
    {key:'note', label:'One line about it', placeholder:'e.g. 9 days, 4 passes, no wifi'}
  ], function(v){
    if(!v.place){ showToast('Where did you go?'); return; }
    var id=rwPassportId();
    showToast('\ud83d\udccd Checking you\u2019re actually there\u2026');
    /* GPS verification: only a claim made AT the place earns Glory / prize
       eligibility. Unverified stamps still save as a personal memory. */
    rwVerifyHere(v.place).then(function(chk){
      var rec={ id:id, place:v.place, when:v.when||'', note:v.note||'',
        uid:user.uid, name:(user.displayName||'Traveller'), house:rwHouse()||null,
        verified: !!chk.ok,
        issued: firebase.firestore.FieldValue.serverTimestamp(),
        issuer:'roamwise.co.in' };
      return db.collection('passports').doc(id).set(rec).then(function(){
        try{ badgeBump('passport'); rwHaptic('heavy'); }catch(e){ /* haptic feedback is a nice-to-have, ignore */ }
        if(chk.ok){
          var g=rwClaimGlory(rec);
          showToast('\ud83d\udee1\ufe0f Verified claim \u00b7 +'+g+' Glory');
        } else {
          showToast('\ud83d\udcd6 Saved to your passport \u2014 '+(chk.why||'not verified, so no Glory'));
        }
        rwPassportLoad();
      });
    }).catch(function(){ showToast('Could not stamp right now \u2014 try again'); });
  });
}
function rwPassportLoad(){
  var host=el('passportOut'); if(!host) return;
  if(!user){ host.innerHTML='<div class="note" style="text-align:center;padding:20px;color:var(--t3)">Sign in to start your passport. Each stamp is permanent, verifiable, and yours.</div>'; return; }
  if(typeof db==='undefined' || !db){ host.innerHTML='<div class="note">Offline \u2014 connect to see your stamps.</div>'; return; }
  db.collection('passports').where('uid','==',user.uid).limit(50).get().then(function(qs){
    var rows=[]; qs.forEach(function(d){ rows.push(d.data()); });
    rows.sort(function(a,b){ return ((b.issued&&b.issued.seconds)||0)-((a.issued&&a.issued.seconds)||0); });
    if(!rows.length){ host.innerHTML='<div class="note" style="text-align:center;padding:20px;color:var(--t3)">No stamps yet. Tap <b>Stamp a journey</b> after your next trip \u2014 it becomes permanent, verifiable proof you were there.</div>'; return; }
    host.innerHTML='<div style="font-size:12px;color:var(--t3);margin-bottom:9px">'+rows.length+' verified journey'+(rows.length>1?'s':'')+'</div>'
      + rows.map(function(r){
        var d=r.issued&&r.issued.seconds? new Date(r.issued.seconds*1000).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : '';
        return '<div style="border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:14px;margin-bottom:10px;background:var(--bg2,#12151F);position:relative;overflow:hidden">'
          +'<div style="position:absolute;top:-8px;right:-8px;font-size:52px;opacity:.07">\ud83d\udee1\ufe0f</div>'
          +'<div style="font-weight:800;font-size:15px">'+esc2(r.place||'')+'</div>'
          +'<div style="font-size:12px;color:var(--t2);margin-top:2px">'+esc2(r.when||d)+(r.note?' \u00b7 '+esc2(r.note):'')+'</div>'
          +'<div style="display:flex;align-items:center;gap:6px;margin-top:9px;flex-wrap:wrap">'
          +'<code style="font-size:11px;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:6px;padding:3px 7px;color:var(--gold,#E8BA6C)">'+esc2(r.id||'')+'</code>'
          + (r.verified
              ? '<span style="font-size:10.5px;color:#4ADE80;font-weight:700">\u2713 verified on location \u00b7 +'+rwClaimGlory(r)+' Glory</span>'
              : '<span style="font-size:10.5px;color:var(--t3);font-weight:700">\u25cb personal memory \u00b7 no Glory</span>')
          +'<button class="tact" style="padding:4px 10px;font-size:11px;margin-left:auto" onclick="rwPassportShare(\''+esc2(r.id||'')+'\',\''+esc2((r.place||'').replace(/\x27/g,''))+'\')">Share proof</button>'
          +'</div></div>';
      }).join('');
  }).catch(function(){ host.innerHTML='<div class="note">Couldn\u2019t load your stamps \u2014 try again in a moment.</div>'; });
}
function rwPassportShare(id, place){
  var url='https://www.roamwise.co.in/verify.html?id='+encodeURIComponent(id);
  var txt='I travelled to '+place+' \u2014 verified on RoamWise.\nCheck it yourself: '+url;
  if(navigator.share){ navigator.share({title:'RoamWise verified journey', text:txt, url:url}).catch(function(){}); return; }
  try{ navigator.clipboard.writeText(txt); showToast('Proof link copied'); }catch(e){ showToast(url); }
}
function rwPassportVerifyAsk(){
  rwForm('\ud83d\udd0d Verify a passport', [
    {key:'id', label:'Passport ID', placeholder:'RW-XXXXX-XXXXX'}
  ], function(v){ rwPassportVerify((v.id||'').trim().toUpperCase()); });
}
function rwPassportVerify(id){
  var host=el('passportOut');
  if(!id){ showToast('Paste a passport ID'); return; }
  if(host) host.innerHTML='<div class="note">\ud83d\udd0d Checking '+esc2(id)+' against the RoamWise network\u2026</div>';
  if(typeof db==='undefined' || !db){ if(host) host.innerHTML='<div class="note">Offline \u2014 verification needs a connection.</div>'; return; }
  db.collection('passports').doc(id).get().then(function(d){
    if(!d.exists){
      if(host) host.innerHTML='<div style="border:1px solid #E05B5B;background:rgba(224,91,91,.08);border-radius:14px;padding:16px">'
        +'<div style="font-weight:800;color:#E05B5B">\u2717 Not recognised</div>'
        +'<div style="font-size:12.5px;color:var(--t2);margin-top:5px">No journey with ID <b>'+esc2(id)+'</b> exists in the RoamWise network. Either the ID is mistyped, or it was not issued by RoamWise.</div>'
        +'<button class="tact" style="margin-top:10px" onclick="rwPassportLoad()">Back to my passport</button></div>';
      return;
    }
    var r=d.data()||{};
    var dt=r.issued&&r.issued.seconds? new Date(r.issued.seconds*1000).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'unknown date';
    if(host) host.innerHTML='<div style="border:1px solid #4ADE80;background:rgba(74,222,128,.07);border-radius:14px;padding:16px">'
      +'<div style="font-weight:800;color:#4ADE80">\u2713 Verified journey</div>'
      +'<div style="font-size:16px;font-weight:800;margin-top:7px">'+esc2(r.place||'')+'</div>'
      +'<div style="font-size:12.5px;color:var(--t2);margin-top:3px">Traveller: '+esc2(r.name||'RoamWise member')+'</div>'
      +'<div style="font-size:12.5px;color:var(--t2)">'+esc2(r.when||'')+(r.note?' \u00b7 '+esc2(r.note):'')+'</div>'
      +'<div style="font-size:11.5px;color:var(--t3);margin-top:7px">Stamped '+dt+' \u00b7 issued by roamwise.co.in</div>'
      +'<button class="tact" style="margin-top:10px" onclick="rwPassportLoad()">Back to my passport</button></div>';
  }).catch(function(){ if(host) host.innerHTML='<div class="note">Verification failed \u2014 try again.</div>'; });
}
/* deep-link: /?verify=RW-... opens straight into a verification result */
(function(){
  try{
    var m=location.search.match(/[?&]verify=([^&]+)/);
    if(m){ setTimeout(function(){ openPassport(); setTimeout(function(){ rwPassportVerify(decodeURIComponent(m[1]).toUpperCase()); }, 500); }, 1200); }
  }catch(e){ /* best-effort, ignore */ }
})();

