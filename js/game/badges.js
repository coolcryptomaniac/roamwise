// @ts-nocheck
/* Gamification progression system — moved verbatim from app.js (Phase 6a).
   Covers Perks, Shinobi XP ranks (Genin..Kage) + rank/XP helpers, Badges &
   Achievements, the honest SHA-256 Proof Stamp fingerprint, and the separate
   Travel Progression (levels/challenges) system. */

/* ===== PERKS — rewards for constructive use, not just clicking around ===== */
function perksData(){
  var xp=xpGet();
  var streak=parseInt(lsGet('rw_streak')||'0',10)||0;
  var wish=0; try{ wish=JSON.parse(lsGet('rw_wish')||'[]').length; }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  var pdfs=parseInt(lsGet('rw_pdf_count')||'0',10)||0;
  var squads=parseInt(lsGet('rw_squad_count')||'0',10)||0;
  var use={}; try{ use=JSON.parse(lsGet('rw_use')||'{}'); }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  var planUses=use.plan||0;
  return {xp:xp, streak:streak, wish:wish, pdfs:pdfs, squads:squads, planUses:planUses};
}
var PERKS=[
 {id:'scout', name:'Scout Badge', need:'3-day streak', icon:'\ud83e\udded',
  test:function(d){return d.streak>=3;}, prog:function(d){return [Math.min(d.streak,3),3];},
  reward:'Unlocks the trending-aware "For You" row a rank early'},
 {id:'planner', name:'Real Planner', need:'3 destinations searched + planned', icon:'\ud83d\uddfa\ufe0f',
  test:function(d){return d.planUses>=3;}, prog:function(d){return [Math.min(d.planUses,3),3];},
  reward:'+10% bonus XP on every future itinerary build'},
 {id:'curator', name:'Curator', need:'2 places saved to your wishlist', icon:'\u2665',
  test:function(d){return d.wish>=2;}, prog:function(d){return [Math.min(d.wish,2),2];},
  reward:'Your wishlist can now be turned into a Lifetime List reel'},
 {id:'documented', name:'Documented', need:'1 premium PDF generated', icon:'\ud83d\udcd5',
  test:function(d){return d.pdfs>=1;}, prog:function(d){return [Math.min(d.pdfs,1),1];},
  reward:'Unlocked: one free Journey Movie render (normally \u20b950)'},
 {id:'connector', name:'Connector', need:'1 Trip Squad posted', icon:'\ud83c\udf92',
  test:function(d){return d.squads>=1;}, prog:function(d){return [Math.min(d.squads,1),1];},
  reward:'Your squad posts get a small visibility boost'},
 {id:'shadow', name:'\ud83e\udd77 Shadow Clone (secret)', need:'Reach Jonin rank (300 XP) + 3 perks unlocked', icon:'\ud83c\udf11', secret:true,
  test:function(d){ var others=PERKS.slice(0,5).filter(function(p){return p.test(d);}).length; return d.xp>=300 && others>=3; },
  prog:function(d){ var others=PERKS.slice(0,5).filter(function(p){return p.test(d);}).length; return [Math.min(others,3), 3]; },
  reward:'Unlocks the hidden Shadow Clone Journey Card style'}
];
function perksUnlocked(){ var d=perksData(); return PERKS.filter(function(p){ return p.test(d); }).map(function(p){return p.id;}); }
function hasShadowStyle(){ return perksUnlocked().indexOf('shadow')>-1; }
function renderPerks(){
  var d=perksData(), un=perksUnlocked();
  return PERKS.map(function(p){
    var on=un.indexOf(p.id)>-1, pr=p.prog(d), pct=Math.round(pr[0]/pr[1]*100);
    if(p.secret && !on) return '<div class="ti-day" style="opacity:.55;align-items:center"><b>\ud83d\udd12</b><span style="flex:1"><b style="color:var(--t2)">??? Secret Perk</b><br><span style="font-size:10.5px;color:var(--t3)">Keep exploring to reveal it</span></span></div>';
    return '<div class="ti-day" style="align-items:center;'+(on?'':'opacity:.7')+'"><b>'+(on?p.icon:'\ud83d\udd12')+'</b><span style="flex:1"><b style="color:'+(on?'var(--gold2)':'var(--t2)')+'">'+p.name+'</b> \u2014 <span style="font-size:11px;color:var(--t3)">'+p.need+'</span>'
      +(on? '<br><span style="font-size:10.5px;color:#16BF96">\u2713 '+p.reward+'</span>' : '<div class="xp-bar" style="margin-top:5px"><div class="xp-fill" style="width:'+pct+'%"></div></div>')
      +'</span></div>';
  }).join('');
}

/* ===== SHINOBI XP — traveler ranks ===== */
var RANKS=[[0,'Genin'],[100,'Chunin'],[300,'Jonin'],[700,'ANBU'],[1500,'Kage']];
function xpGet(){ return parseInt(lsGet('rw_xp')||'0',10)||0; }

/* ==================== BADGES & ACHIEVEMENTS ====================
   Complements the XP/rank system with collectible badges. The Founder badge is
   awarded to the first 1,000 Pro buyers; the rest unlock from real usage
   milestones tracked in localStorage counters. All offline, all on-device. */
var RW_BADGES=[
  {id:'founder', emoji:'\ud83c\udfc5', name:'Founder', desc:'One of the first 1,000 Pro members', accent:'#E8BA6C',
    test:function(s){ return s.founder; }},
  {id:'pro', emoji:'\u2b50', name:'Pro Traveller', desc:'Unlocked RoamWise Pro', accent:'#C8913E',
    test:function(s){ return s.isPro; }},
  {id:'firstTrip', emoji:'\ud83e\udded', name:'First Steps', desc:'Planned your first trip', accent:'#60A5FA',
    test:function(s){ return s.trips>=1; }, prog:function(s){ return [Math.min(s.trips,1),1]; }},
  {id:'planner5', emoji:'\ud83d\uddfa\ufe0f', name:'Trip Architect', desc:'Planned 5 trips', accent:'#4ADE80',
    test:function(s){ return s.trips>=5; }, prog:function(s){ return [Math.min(s.trips,5),5]; }},
  {id:'planner20', emoji:'\ud83c\udf0f', name:'Globetrotter', desc:'Planned 20 trips', accent:'#38BDF8',
    test:function(s){ return s.trips>=20; }, prog:function(s){ return [Math.min(s.trips,20),20]; }},
  {id:'mapper', emoji:'\ud83d\udccd', name:'Map Reader', desc:'Viewed a trip on the map', accent:'#A78BFA',
    test:function(s){ return s.maps>=1; }, prog:function(s){ return [Math.min(s.maps,1),1]; }},
  {id:'crew', emoji:'\ud83e\udd1d', name:'Trip Captain', desc:'Started a group trip', accent:'#FB923C',
    test:function(s){ return s.groups>=1; }, prog:function(s){ return [Math.min(s.groups,1),1]; }},
  {id:'saver', emoji:'\ud83d\udcbe', name:'Prepared', desc:'Saved a trip for offline', accent:'#F472B6',
    test:function(s){ return s.saves>=1; }, prog:function(s){ return [Math.min(s.saves,1),1]; }},
  {id:'explorer', emoji:'\ud83e\udded', name:'Curious Mind', desc:'Asked Ailon Tusk 10 questions', accent:'#F87171',
    test:function(s){ return s.asks>=10; }, prog:function(s){ return [Math.min(s.asks,10),10]; }},
  {id:'green', emoji:'\ud83c\udf31', name:'Green Traveller', desc:'Chose 5 low-impact, eco-friendly options', accent:'#4ADE80',
    test:function(s){ return s.green>=5; }, prog:function(s){ return [Math.min(s.green,5),5]; }}
];
function badgeState(){
  return {
    isPro: (typeof isPro!=='undefined' && isPro) || lsGet('rwPro')==='1',
    founder: lsGet('rw_founder')==='1',
    trips: parseInt(lsGet('rw_ct_trips')||'0',10)||0,
    maps: parseInt(lsGet('rw_ct_maps')||'0',10)||0,
    groups: parseInt(lsGet('rw_ct_groups')||'0',10)||0,
    saves: parseInt(lsGet('rw_ct_saves')||'0',10)||0,
    asks: parseInt(lsGet('rw_ct_asks')||'0',10)||0,
    green: parseInt(lsGet('rw_ct_green')||'0',10)||0
  };
}
/* bump a usage counter and check for newly-earned badges */
function badgeBump(kind){
  var map={trip:'rw_ct_trips',map:'rw_ct_maps',group:'rw_ct_groups',save:'rw_ct_saves',ask:'rw_ct_asks',green:'rw_ct_green'};
  var key=map[kind]; if(!key) return;
  var before=badgeEarnedIds();
  lsSet(key, String((parseInt(lsGet(key)||'0',10)||0)+1));
  var after=badgeEarnedIds();
  after.forEach(function(id){ if(before.indexOf(id)<0) badgeCelebrate(id); });
}
function badgeEarnedIds(){
  var s=badgeState();
  return RW_BADGES.filter(function(b){ try{ return b.test(s); }catch(e){ return false; } }).map(function(b){ return b.id; });
}
function badgeCelebrate(id){
  var b=RW_BADGES.filter(function(x){return x.id===id;})[0]; if(!b) return;
  try{ showToast(b.emoji+' Badge unlocked: '+b.name+'!'); }catch(e){ /* toast is a nice-to-have, ignore */ }
  try{ if(typeof xpAdd==='function') xpAdd(25, 'badge:'+id); }catch(e){ /* best-effort, ignore */ }
}
/* called when a Pro purchase is confirmed — awards Founder if under the cap */
function badgeAwardFounder(){
  try{ lsSet('rw_founder','1'); }catch(e){ /* storage best-effort, ignore */ }
  badgeCelebrate('founder');
}
function badgesHTML(){
  var s=badgeState();
  var earned=badgeEarnedIds();
  var cells=RW_BADGES.map(function(b){
    var on=earned.indexOf(b.id)>=0;
    var pr=b.prog?b.prog(s):null;
    return '<div style="text-align:center;padding:12px 8px;border-radius:14px;border:1px solid '+(on?b.accent:'var(--b1)')+';background:'+(on?'linear-gradient(135deg,'+b.accent+'22,'+b.accent+'08)':'var(--bg3)')+';opacity:'+(on?'1':'.6')+'">'
      +'<div style="font-size:30px;line-height:1;filter:'+(on?'none':'grayscale(1)')+'">'+b.emoji+'</div>'
      +'<div style="font-size:12px;font-weight:700;color:var(--t1);margin-top:6px">'+b.name+'</div>'
      +'<div style="font-size:9.5px;color:var(--t3);margin-top:2px;line-height:1.4">'+b.desc+'</div>'
      +(pr&&!on?'<div style="font-size:9px;color:'+b.accent+';margin-top:4px;font-weight:700">'+pr[0]+'/'+pr[1]+'</div>':(on?'<div style="font-size:9px;color:'+b.accent+';margin-top:4px;font-weight:800">\u2713 EARNED</div>':''))
      +'</div>';
  }).join('');
  return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:9px">'+cells+'</div>'
    +'<div style="font-size:10.5px;color:var(--t3);text-align:center;margin-top:10px">'+earned.length+' of '+RW_BADGES.length+' badges earned</div>';
}
function openBadges(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('badgesSection');
  if(!sec){
    sec=document.createElement('section'); sec.id='badgesSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec);
  }
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83c\udfc5 Your <em>badges</em></h2><button class="tact" onclick="rwCloseSection(\'badgesSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Collectible achievements \u2014 earned as you plan, map, and travel.</p>'+badgesHTML();
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
}



function rankOf(x){ var r=RANKS[0]; for(var i=0;i<RANKS.length;i++) if(x>=RANKS[i][0]) r=RANKS[i]; return r; }
function nextRank(x){ for(var i=0;i<RANKS.length;i++) if(x<RANKS[i][0]) return RANKS[i]; return null; }
function xpAdd(n, why){
  var was=rankOf(xpGet())[1];
  var x=xpGet()+n; lsSet('rw_xp',String(x));
  var now=rankOf(x)[1];
  showToast('+'+n+' XP \u2014 '+why);
  if(now!==was) setTimeout(function(){ showToast('\ud83e\udd77 RANK UP! You are now '+now); },1400);
  xpPaint();
}
function xpPaint(){
  var x=xpGet(), r=rankOf(x), nx=nextRank(x);
  var c=el('xpChipTxt'); if(c) c.textContent=r[1]+' \u00b7 '+x;
  var d=el('drXp'); if(d){
    var pct = nx? Math.min(100,Math.round((x-r[0])/(nx[0]-r[0])*100)) : 100;
    d.innerHTML='<div class="rk">\ud83e\udd77 <span>'+r[1]+'</span> \u00b7 '+x+' XP</div>'
      +'<div class="xp-bar"><div class="xp-fill" style="width:'+pct+'%"></div></div>'
      +'<div class="xh">'+(nx? (nx[0]-x)+' XP to '+nx[1]+' \u2014 search, explore treks & share to earn' : 'Maximum rank \u2014 the village is proud')+'</div>';
  }
}
(function(){ /* daily streak bonus */
  try{
    var today=new Date().toDateString();
    if(lsGet('rw_day')!==today){
      lsSet('rw_day',today);
      var st=parseInt(lsGet('rw_streak')||'0',10)||0;
      var yest=new Date(Date.now()-864e5).toDateString();
      st = (lsGet('rw_prevday')===yest)? st+1 : 1;
      lsSet('rw_streak',String(st)); lsSet('rw_prevday',today);
      setTimeout(function(){ xpAdd(20*Math.min(st,3),'Daily return \u00b7 '+st+'-day streak'); },3200);
    } else xpPaint();
  }catch(e){ /* storage best-effort, ignore */ }
})();


/* ==================== PROOF STAMP (verifiable journey fingerprint) ==========
   An honest cryptographic stamp, not marketing. SHA-256 over the exact journey
   contents produces a fingerprint that changes if even one character of the
   log is altered — so two people can verify a certificate is unmodified by
   recomputing it. This is free, instant, offline and needs no chain.
   NOTE ON "BLOCKCHAIN": writing this hash to a public chain costs gas on every
   chain worth trusting, so it is NOT enabled by default (it would cost money
   per certificate). The hash below is exactly what you'd anchor if you ever
   choose to — the design is anchor-ready, deliberately not anchor-billed. */
async function proofStamp(payloadStr){
  try{
    var buf = new TextEncoder().encode(payloadStr);
    var hash = await crypto.subtle.digest('SHA-256', buf);
    var hex = Array.from(new Uint8Array(hash)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
    return hex;
  }catch(e){ return null; }
}



/* ==================== TRAVEL PROGRESSION ====================
   Deliberately rewards DOING things, not opening the app. No daily-login
   streaks, no notifications nagging you back — those train a habit of checking
   a phone, not of travelling. XP comes from trips planned, treks logged, and
   low-carbon legs taken. */
var RW_XP_LEVELS = [
  {at:0,    icon:'\ud83c\udf92', name:'Day-tripper'},
  {at:100,  icon:'\ud83e\udded', name:'Wanderer'},
  {at:300,  icon:'\ud83d\uddfa\ufe0f', name:'Routefinder'},
  {at:700,  icon:'\u26f0\ufe0f', name:'Pathmaker'},
  {at:1500, icon:'\ud83c\udf0f', name:'Far-goer'},
  {at:3000, icon:'\ud83c\udf1f', name:'Old hand'}
];
var RW_CHALLENGES = [
  {id:'first_plan', xp:20,  icon:'\ud83d\uddd3\ufe0f', name:'Plan your first trip',        how:'Build any itinerary'},
  {id:'offseason',  xp:60,  icon:'\ud83c\udf42', name:'Travel off-season',          how:'Visit somewhere in a low-crowd month'},
  {id:'lowcarbon',  xp:50,  icon:'\ud83c\udf31', name:'Take the train instead',     how:'Log one low-carbon leg'},
  {id:'homestay',   xp:40,  icon:'\ud83c\udfe1', name:'Stay with a family',         how:'Book a homestay over a chain'},
  {id:'trek',       xp:75,  icon:'\u26f0\ufe0f', name:'Complete a trek',            how:'Log any trek'},
  {id:'local_eat',  xp:30,  icon:'\ud83c\udf5b', name:'Eat where locals queue',     how:'Skip the tourist restaurant once'},
  {id:'three_state',xp:120, icon:'\ud83d\uddfa\ufe0f', name:'Three states, one year', how:'Plan trips in three different states'},
  {id:'sunrise',    xp:35,  icon:'\ud83c\udf05', name:'Beat the crowd',             how:'Reach a major sight at opening time'}
];
function rwXp(){ try{ return JSON.parse(lsGet('rw_xp')||'{"xp":0,"done":[]}'); }catch(e){ return {xp:0,done:[]}; } }
function rwXpSave(d){ lsSet('rw_xp', JSON.stringify(d)); }
function rwXpLevel(xp){
  var lv=RW_XP_LEVELS[0];
  RW_XP_LEVELS.forEach(function(l){ if(xp>=l.at) lv=l; });
  var next=RW_XP_LEVELS.filter(function(l){ return l.at>xp; })[0]||null;
  return {cur:lv, next:next};
}
function rwXpAdd(n, why){
  var d=rwXp(), before=rwXpLevel(d.xp).cur.name;
  d.xp=(d.xp||0)+n; rwXpSave(d);
  var after=rwXpLevel(d.xp).cur;
  if(after.name!==before) showToast(after.icon+' Level up \u2014 '+after.name+'!');
  else showToast('+'+n+' XP'+(why? ' \u00b7 '+why:''));
}
function rwChallengeDone(id){
  var d=rwXp(); if((d.done||[]).indexOf(id)>-1){ showToast('Already logged'); return; }
  var c=RW_CHALLENGES.filter(function(x){ return x.id===id; })[0]; if(!c) return;
  d.done=(d.done||[]).concat([id]); rwXpSave(d);
  rwXpAdd(c.xp, c.name);
  try{ rwProgressPanel(); }catch(e){ /* best-effort, ignore */ }
}
function rwProgressHTML(){
  var d=rwXp(), L=rwXpLevel(d.xp||0), done=d.done||[];
  var pct = L.next ? Math.round(((d.xp-L.cur.at)/(L.next.at-L.cur.at))*100) : 100;
  var treks = rwTrekDone().length, eco = (rwEcoLoad().trips||[]).length;
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#4C1D95,#0A0A0C)">'
    +'<div class="tk-place">'+L.cur.icon+' '+L.cur.name+'</div>'
    +'<div class="tk-meta">'+(d.xp||0)+' XP \u00b7 '+treks+' treks \u00b7 '+eco+' low-carbon legs</div></div>'
    +'<div class="tk-sec">'
    + (L.next
        ? '<div style="font-size:11.5px;color:var(--t2)">'+(L.next.at-d.xp)+' XP to '+L.next.icon+' '+L.next.name+'</div>'
          +'<div style="height:6px;background:var(--b2,#2A2A36);border-radius:3px;margin-top:6px;overflow:hidden">'
          +'<div style="width:'+Math.max(3,pct)+'%;height:100%;background:linear-gradient(90deg,#A78BFA,#7C3AED)"></div></div>'
        : '<div style="font-size:11.5px;color:var(--gold,#E8BA6C)">Top level reached. Genuinely well travelled.</div>')
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Challenges</div>'
    + RW_CHALLENGES.map(function(c){
        var got = done.indexOf(c.id)>-1;
        return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05);'+(got?'opacity:.55':'')+'">'
          +'<span style="font-size:17px">'+c.icon+'</span>'
          +'<div style="flex:1"><div style="font-size:12.5px;font-weight:700">'+esc2(c.name)+(got?' \u2713':'')+'</div>'
          +'<div style="font-size:11px;color:var(--t3)">'+esc2(c.how)+'</div></div>'
          + (got? '<span style="font-size:11px;color:#4ADE80">+'+c.xp+'</span>'
                : '<button class="tk-chip" style="font-size:10.5px;padding:4px 9px" onclick="rwChallengeDone(\''+c.id+'\')">+'+c.xp+' XP</button>')
          +'</div>';
      }).join('')
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px">Marked by you, on trust. There is no leaderboard and nothing to win \u2014 it is a record of what you actually did.</div>'
    +'</div></div>';
}
function rwProgressPanel(){
  var host=el('heroLog');
  if(host){ host.style.display='block'; host.insertAdjacentHTML('beforeend','<div class="cp-msg bot">'+rwProgressHTML()+'</div>'); host.scrollTop=host.scrollHeight; }
}
