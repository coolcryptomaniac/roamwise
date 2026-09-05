// @ts-nocheck
// Moved verbatim from app.js — Tatkal Prep: legitimate (non-automated,
// non-CAPTCHA-bypassing) prep checklist for Indian Railways Tatkal booking.
/* ===== TATKAL PREP (rw-v44) — the LEGITIMATE version of the "Tatkal hack".
   DELIBERATE DESIGN DECISION: this does NOT auto-fill IRCTC, does NOT bypass
   CAPTCHA, and does NOT script the booking. Automating IRCTC violates their
   terms and gets USER ACCOUNTS BANNED — we will not hand our earliest users a
   tool that does that. What actually loses people Tatkal seats is being
   unprepared in the first 40 seconds, so we fix THAT: details ready to copy,
   a synced countdown, and a pre-flight checklist. All on-device. */
function openTatkal(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('tatkalSection');
  if(!sec){ sec=document.createElement('section'); sec.id='tatkalSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\u26a1 Tatkal <em>prep</em></h2>'
    +'<button class="tact" onclick="rwTatkalStopTimer();rwCloseSection(\'tatkalSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Tatkal is won or lost in the first 40 seconds. Have everything ready to paste, and a countdown so you\u2019re logged in before the window opens.</p>'
    +'<div id="tatkalClock" style="background:var(--bg2,#12151F);border:1px solid var(--gold,#E8BA6C);border-radius:16px;padding:16px;text-align:center;margin-bottom:12px"></div>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:16px;margin-bottom:12px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em">PASSENGER LIST</div>'
    +'<button class="tact" style="padding:5px 11px;font-size:11.5px" onclick="rwTatkalAddPax()">+ Add</button></div>'
    +'<div id="tatkalPax"></div></div>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:16px">'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:9px">PRE-FLIGHT CHECKLIST</div>'
    +'<div id="tatkalCheck"></div></div>';
  rwTatkalRenderPax(); rwTatkalRenderCheck(); rwTatkalStartTimer();
}
/* --- countdown to the next Tatkal window (10:00 AC / 11:00 non-AC IST) --- */
var _tatkalTimer=null;
function rwTatkalStopTimer(){ if(_tatkalTimer){ clearInterval(_tatkalTimer); _tatkalTimer=null; } }
function rwTatkalStartTimer(){
  rwTatkalStopTimer();
  function tick(){
    var host=el('tatkalClock'); if(!host){ rwTatkalStopTimer(); return; }
    /* IST regardless of device timezone */
    var now=new Date();
    var ist=new Date(now.getTime() + (now.getTimezoneOffset()*60000) + (5.5*3600000));
    function nextAt(h){
      var t=new Date(ist); t.setHours(h,0,0,0);
      if(t<=ist) t.setDate(t.getDate()+1);
      return t;
    }
    var ac=nextAt(10), nac=nextAt(11);
    var next = ac<nac ? {t:ac,label:'AC classes (10:00 IST)'} : {t:nac,label:'Sleeper / non-AC (11:00 IST)'};
    var ms=next.t-ist, hh=Math.floor(ms/3600000), mm=Math.floor(ms%3600000/60000), ss=Math.floor(ms%60000/1000);
    var soon = ms < 10*60000;
    host.innerHTML='<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em">NEXT TATKAL WINDOW</div>'
      +'<div style="font-size:34px;font-weight:900;color:'+(soon?'#4ADE80':'var(--gold,#E8BA6C)')+';margin:6px 0;font-variant-numeric:tabular-nums">'
      + String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')+'</div>'
      +'<div style="font-size:12.5px;color:var(--t2)">'+next.label+'</div>'
      +(soon?'<div style="font-size:12px;color:#4ADE80;font-weight:700;margin-top:6px">Log in to IRCTC NOW \u2014 be on the booking page before it opens</div>':'')
      +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px;line-height:1.5">Times are IST. RoamWise never books or logs in for you \u2014 automating IRCTC breaks their rules and can get your account banned.</div>';
  }
  tick(); _tatkalTimer=setInterval(tick,1000);
}
/* --- passenger master list (on-device only) --- */
function rwTatkalPax(){ try{ return JSON.parse(lsGet('rw_tatkal_pax')||'[]'); }catch(e){ return []; } }
function rwTatkalSetPax(a){ try{ lsSet('rw_tatkal_pax', JSON.stringify(a.slice(0,6))); }catch(e){ /* storage best-effort, ignore */ } }
function rwTatkalAddPax(){
  rwForm('Add passenger', [
    {key:'name', label:'Full name (as on ID)'},
    {key:'age', label:'Age', type:'number'},
    {key:'gender', label:'Gender (M/F/T)'},
    {key:'berth', label:'Berth preference', placeholder:'Lower / Upper / Side lower / No preference'}
  ], function(v){
    if(!v.name){ showToast('Name is required'); return; }
    var list=rwTatkalPax(); list.push({name:v.name, age:v.age, gender:(v.gender||'').toUpperCase(), berth:v.berth||''});
    rwTatkalSetPax(list); rwTatkalRenderPax();
  });
}
function rwTatkalDelPax(i){ var l=rwTatkalPax(); l.splice(i,1); rwTatkalSetPax(l); rwTatkalRenderPax(); }
function rwTatkalRenderPax(){
  var host=el('tatkalPax'); if(!host) return;
  var list=rwTatkalPax();
  if(!list.length){ host.innerHTML='<div style="font-size:12.5px;color:var(--t3)">Add your regular travellers once. When Tatkal opens you copy them in instead of typing under pressure.</div>'; return; }
  host.innerHTML=list.map(function(p,i){
    return '<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--b1,rgba(255,255,255,.06))">'
      +'<div style="flex:1"><b style="font-size:13.5px">'+esc2(p.name)+'</b>'
      +'<div style="font-size:11.5px;color:var(--t3)">'+esc2(String(p.age||''))+(p.gender?' \u00b7 '+esc2(p.gender):'')+(p.berth?' \u00b7 '+esc2(p.berth):'')+'</div></div>'
      +'<button class="tact" style="padding:4px 9px;font-size:11px" onclick="rwTatkalCopyPax('+i+')">Copy</button>'
      +'<button class="tact" style="padding:4px 8px;font-size:11px" onclick="rwTatkalDelPax('+i+')">\u2715</button></div>';
  }).join('')
  +'<button class="tact" style="width:100%;margin-top:10px;font-weight:700" onclick="rwTatkalCopyAll()">\ud83d\udccb Copy all passengers</button>';
}
function rwTatkalCopyPax(i){
  var p=rwTatkalPax()[i]; if(!p) return;
  var txt=p.name+'\t'+(p.age||'')+'\t'+(p.gender||'')+(p.berth?'\t'+p.berth:'');
  try{ navigator.clipboard.writeText(txt); showToast('Copied \u2014 paste into IRCTC'); }catch(e){ showToast('Copy failed'); }
}
function rwTatkalCopyAll(){
  var txt=rwTatkalPax().map(function(p){ return p.name+'\t'+(p.age||'')+'\t'+(p.gender||'')+(p.berth?'\t'+p.berth:''); }).join('\n');
  if(!txt){ showToast('No passengers saved yet'); return; }
  try{ navigator.clipboard.writeText(txt); showToast('All passengers copied'); }catch(e){ showToast('Copy failed'); }
}
/* --- checklist --- */
var RW_TATKAL_STEPS=[
  'IRCTC username &amp; password remembered (test-login the night before)',
  'Passenger details saved in IRCTC\u2019s own Master List',
  'Payment ready \u2014 UPI app open, or saved card / IRCTC eWallet topped up',
  'Train number &amp; class decided in advance (don\u2019t browse at 10:00)',
  'Boarding &amp; destination stations confirmed',
  'Strong network \u2014 switch to mobile data if wifi is flaky',
  'Logged in and sitting on the booking page 2 minutes early'
];
function rwTatkalRenderCheck(){
  var host=el('tatkalCheck'); if(!host) return;
  var done={}; try{ done=JSON.parse(lsGet('rw_tatkal_check')||'{}'); }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  host.innerHTML=RW_TATKAL_STEPS.map(function(t,i){
    var on=!!done[i];
    return '<button onclick="rwTatkalToggle('+i+')" style="display:flex;align-items:flex-start;gap:9px;width:100%;text-align:left;background:none;border:none;padding:7px 0;cursor:pointer;color:var(--t1)">'
      +'<span style="font-size:15px;flex:0 0 auto">'+(on?'\u2705':'\u2b1c')+'</span>'
      +'<span style="font-size:12.5px;line-height:1.5;'+(on?'color:var(--t3);text-decoration:line-through':'')+'">'+t+'</span></button>';
  }).join('');
}
function rwTatkalToggle(i){
  var done={}; try{ done=JSON.parse(lsGet('rw_tatkal_check')||'{}'); }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  done[i]=!done[i]; try{ lsSet('rw_tatkal_check', JSON.stringify(done)); }catch(e){ /* storage best-effort, ignore */ }
  try{ rwHaptic(); }catch(e){ /* haptic feedback is a nice-to-have, ignore */ }
  rwTatkalRenderCheck();
}
