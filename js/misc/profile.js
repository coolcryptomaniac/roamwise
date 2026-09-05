// @ts-nocheck
/* ==================== PROFILE + LIFETIME LIST ====================
   Moved verbatim from app.js (modularization round 5) — plain functions
   (no top-level DOM queries or other order-sensitive code), so this
   file can load anywhere before app.js. Depends on the XP/rank/perks
   helpers from js/game/badges.js (xpGet/rankOf/nextRank/perksUnlocked/
   renderPerks/PERKS/xpAdd) and js/ui/card-painter.js's useBump(), all
   resolved at call time (openProfile() only ever runs from a user tap). */
/* ===== PROFILE + LIFETIME LIST ===== */
var STYLE_POOL={
 adventure:[['Patagonia, Chile-Argentina','the planet\u2019s wildest trekking finale'],['Ladakh, India','high-altitude freedom on two wheels'],['Iceland ring road','fire, ice and zero guardrails'],['Nepal (EBC)','the pilgrimage every adventurer owes themselves'],['New Zealand South Island','adrenaline\u2019s home address'],['Kyrgyzstan','the last untamed horse country']],
 culture:[['Kyoto, Japan','a thousand years, perfectly kept'],['Varanasi, India','the oldest living city on Earth'],['Rome, Italy','walk inside a history book'],['Istanbul, Turkey','two continents, one table'],['Cairo, Egypt','stand where 4,500 years stare back'],['Uzbekistan (Samarkand)','the Silk Road\u2019s blue-tiled heart']],
 chill:[['Bali, Indonesia','slow mornings perfected'],['Kerala backwaters','float through green silence'],['Santorini, Greece','sunsets as a lifestyle'],['Maldives','the pause button of the planet'],['Amalfi Coast','lemon-scented la dolce vita'],['Goa in monsoon','India\u2019s softest secret season']],
 party:[['Tokyo, Japan','neon nights that never repeat'],['Berlin, Germany','the world\u2019s dance-floor capital'],['Rio de Janeiro','carnival is a warm-up here'],['Bangkok, Thailand','the night owns this city'],['Ibiza, Spain','the pilgrimage of sound'],['Goa NYE','India\u2019s beach party crown']]};
function openProfile(){
  useBump('profile');
  var ov=el('profOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='profOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:440px;max-height:88vh;overflow:auto"><button class="modal-close" onclick="el(\'profOverlay\').classList.remove(\'open\')">\u00d7</button><div class="modal-head"><div class="modal-title">\ud83d\udc64 My Traveler Profile</div><div class="modal-sub">Tell RoamWise who\u2019s traveling</div></div><div class="modal-body" id="profBody"></div></div>';
    document.body.appendChild(ov); }
  var P2={}; try{P2=JSON.parse(lsGet('rw_profile')||'{}');}catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  var avs=['adventurer','ninja','fox','owl','bear','robot'].map(function(s,i){
    var u2='https://api.dicebear.com/9.x/'+(i<2?'adventurer':'bottts')+'/svg?seed='+s;
    return '<img src="'+u2+'" data-u="'+u2+'" onclick="profAv(this)" style="width:52px;height:52px;border-radius:50%;cursor:pointer;border:2px solid '+((P2.av===u2)?'var(--gold)':'var(--b2)')+'">';
  }).join('');
  var xpNow=xpGet(), rNow=rankOf(xpNow), nxR=nextRank(xpNow);
  var pctR=nxR? Math.min(100,Math.round((xpNow-rNow[0])/(nxR[0]-rNow[0])*100)) : 100;
  var unlockedCount=perksUnlocked().length;
  var trialUntilNow=parseInt(lsGet('rw_trial_until')||'0',10);
  var trialBadge = (trialUntilNow && trialUntilNow>Date.now())?
    '<div style="background:linear-gradient(135deg,#16BF9622,#16BF9611);border:1px solid #16BF9655;border-radius:12px;padding:9px 12px;margin-bottom:10px;font-size:12px;color:#16BF96">\u23f3 Founding traveler trial \u2014 '+Math.ceil((trialUntilNow-Date.now())/864e5)+' day(s) of Pro left</div>' : '';
  var rankHead=
   trialBadge+
   '<div style="background:linear-gradient(135deg,rgba(232,186,108,.12),rgba(196,48,43,.08));border:1px solid rgba(232,186,108,.3);border-radius:16px;padding:14px 16px;margin-bottom:14px">'
   +'<div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-size:17px;font-weight:800;color:var(--gold2)">\ud83e\udd77 '+rNow[1]+'</div><div style="font-size:11.5px;color:var(--t3)">'+xpNow+' XP</div></div>'
   +'<div class="xp-bar" style="margin-top:8px"><div class="xp-fill" style="width:'+pctR+'%"></div></div>'
   +'<div style="font-size:10.5px;color:var(--t3);margin-top:5px">'+(nxR? (nxR[0]-xpNow)+' XP to '+nxR[1] : 'Maximum rank reached')+' \u00b7 '+unlockedCount+'/'+PERKS.length+' perks unlocked</div></div>'
   +'<div style="font-size:12.5px;font-weight:700;color:var(--t1);margin:0 0 8px">\ud83c\udfc6 Your Perks \u2014 earned by doing, not just tapping</div>'
   +'<div style="margin-bottom:16px">'+renderPerks()+'</div>';
  el('profBody').innerHTML=
   rankHead
   +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><img id="profPic" src="'+(P2.av||'https://api.dicebear.com/9.x/adventurer/svg?seed=ninja')+'" style="width:64px;height:64px;border-radius:50%;border:2px solid var(--gold2)"><div style="flex:1"><div style="font-size:11px;color:var(--t2);margin-bottom:5px">Pick an avatar or upload</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+avs+'</div><input type="file" accept="image/*" id="profUp" style="font-size:10px;margin-top:6px" onchange="profUpload(this)"></div></div>'
   +'<div class="dna-q"><div class="qt">Name</div><input class="txn-inp" id="pfName" style="width:100%" value="'+(P2.name||lsGet('rw_name')||'')+'"></div>'
   +'<div style="display:flex;gap:8px"><div class="dna-q" style="flex:1"><div class="qt">Work</div><input class="txn-inp" id="pfWork" style="width:100%" value="'+(P2.work||'')+'"></div>'
   +'<div class="dna-q" style="flex:1"><div class="qt">Location</div><input class="txn-inp" id="pfLoc" style="width:100%" value="'+(P2.loc||'')+'"></div></div>'
   +'<div style="display:flex;gap:8px"><div class="dna-q" style="flex:1"><div class="qt">Age (optional, stays on device)</div><input class="txn-inp" id="pfAge" type="number" style="width:100%" value="'+(P2.age||'')+'"></div>'
   +'<div class="dna-q" style="flex:1"><div class="qt">WhatsApp (optional)</div><input class="txn-inp" id="pfWa" style="width:100%" placeholder="+91\u2026" value="'+(P2.wa||'')+'"></div></div>'
   +'<div class="dna-q"><div class="qt">Travel style</div><div class="dna-opts">'+['adventure','culture','chill','party'].map(function(s){return '<button class="dna-opt'+(P2.style===s?' on':'')+'" onclick="profPick(this,\'style\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Dream terrain</div><div class="dna-opts">'+['mountains','beaches','cities','deserts'].map(function(s){return '<button class="dna-opt'+(P2.terr===s?' on':'')+'" onclick="profPick(this,\'terr\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Trip length you love</div><div class="dna-opts">'+['weekend','1 week','2+ weeks'].map(function(s){return '<button class="dna-opt'+(P2.len===s?' on':'')+'" onclick="profPick(this,\'len\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Favourite destinations so far</div><input class="txn-inp" id="pfFav" style="width:100%" value="'+(P2.fav||'')+'"></div>'
   +'<div class="dna-q"><div class="qt">Hobbies</div><input class="txn-inp" id="pfHob" style="width:100%" value="'+(P2.hob||'')+'"></div>'
   +'<div class="dna-q"><div class="qt">Bio</div><input class="txn-inp" id="pfBio" style="width:100%" maxlength="120" value="'+(P2.bio||'')+'"></div>'
   +'<label style="display:flex;gap:8px;font-size:11.5px;color:var(--t2);margin:4px 0 12px"><input type="checkbox" id="pfNews" '+(P2.news?'checked':'')+'> Send me weekly travel drops (email)</label>'
   +'<button class="rzp-main-btn" onclick="profSave()">\u2728 Save & reveal my Lifetime List</button>'
   +'<div id="pfOut" style="margin-top:12px"></div>';
  window._prof=P2;
  ov.classList.add('open');
}
function profAv(img){ window._prof.av=img.dataset.u; el('profPic').src=img.dataset.u;
  img.parentNode.querySelectorAll('img').forEach(function(x){x.style.borderColor='var(--b2)';}); img.style.borderColor='var(--gold)'; }
function profUpload(inp){ var f=inp.files[0]; if(!f) return;
  var fr=new FileReader(); fr.onload=function(){ if(fr.result.length>400000) return showToast('Pick a smaller image');
    window._prof.av=fr.result; el('profPic').src=fr.result; }; fr.readAsDataURL(f); }
function profPick(b,k,v){ window._prof[k]=v; b.parentNode.querySelectorAll('.dna-opt').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); }
function profSave(){
  var P2=window._prof;
  ['Name','Work','Loc','Age','Wa','Fav','Hob','Bio'].forEach(function(k){ P2[k.toLowerCase()]=el('pf'+k).value.trim(); });
  P2.news=el('pfNews').checked;
  lsSet('rw_profile', JSON.stringify(P2)); lsSet('rw_name', P2.name||lsGet('rw_name')||'');
  if(AUTH_READY && user){ db.collection('users').doc(user.uid).set({name:P2.name||'',whatsapp:P2.wa||'',newsletter:!!P2.news,style:P2.style||'',location:P2.loc||''},{merge:true}); }
  var style=P2.style||'adventure', pool=STYLE_POOL[style]||STYLE_POOL.adventure;
  var extra = P2.terr==='beaches'? STYLE_POOL.chill[3] : P2.terr==='deserts'? ['Jaisalmer + Wadi Rum','gold dunes twice over'] : P2.terr==='cities'? STYLE_POOL.party[0] : STYLE_POOL.adventure[1];
  var list=pool.slice(0,5).concat([extra]);
  el('pfOut').innerHTML='<div class="mode-box" style="border-color:rgba(232,186,108,.5)"><b>\ud83c\udf1f '+(P2.name||'Traveler')+'\u2019s Lifetime List \u2014 the '+style+' soul edition</b><br><span style="font-size:10.5px;color:var(--t3)">Based on your style, terrain and trip length. Plan any of them in one tap.</span></div>'
   + list.map(function(x){ return '<div class="ti-day" style="align-items:center"><b>\u272a</b><span style="flex:1"><b style="color:var(--t1)">'+x[0]+'</b><br><span style="font-size:10.5px;color:var(--t2)">'+x[1]+'</span></span><button class="tact" onclick="el(\'profOverlay\').classList.remove(\'open\');el(\'destInput\').value=\''+x[0].split(',')[0].replace(/'/g,'')+'\';tabGo(\'plan\')">Plan</button></div>'; }).join('');
  showToast('Profile saved \u2014 your Lifetime List is ready \u2b50'); xpAdd(15,'Identity forged');
}
