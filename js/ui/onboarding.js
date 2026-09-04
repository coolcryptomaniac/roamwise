// @ts-nocheck
/* Moved verbatim from app.js (Phase 5b modularization). See js/itinerary/CLAUDE-CODE-MERGE-NOTES.md-style
   convention: this file is loaded via a classic <script> tag before app.js in index.html,
   so its functions/vars are plain globals other files (including app.js) already call. */

/* ---- from app.js lines 2157-2190: first-launch walkthrough (RW_ONBOARD, rwMaybeOnboard/Show/Done, rwReplayOnboard) ---- */
/* ===== FIRST-LAUNCH WALKTHROUGH (onboarding) =====
   Shows once, introduces the key features, has a Skip option. Report-requested. */
var RW_ONBOARD=[
  {ic:'\u2728', t:'Welcome to RoamWise', d:'Your AI travel copilot for smarter trips \u2014 no signup, no subscription.'},
  {ic:'\ud83e\udded', t:'Plan with Ailon Tusk', d:'Just say \u201cchill 4 days near Rishikesh under 12k\u201d and get a full day-by-day itinerary.'},
  {ic:'\ud83d\uddfa\ufe0f', t:'See it on a map', d:'Every trip maps out day-by-day with satellite & terrain views.'},
  {ic:'\ud83d\udc65', t:'Travel together', d:'Group chat with shared money split, decisions, and a trip board \u2014 all in one place.'},
  {ic:'\ud83d\udccd', t:'Discover nearby', d:'Find food, sights & things to do around you, plus fitness-friendly stays.'}
];
function rwMaybeOnboard(){
  try{ if(lsGet('rw_onboarded')==='1') return; }catch(e){}
  rwOnboardShow(0);
}
function rwOnboardShow(i){
  var ov=el('rwOnboardOv');
  if(!ov){ ov=document.createElement('div'); ov.id='rwOnboardOv'; ov.className='overlay'; ov.style.zIndex='4000'; document.body.appendChild(ov); }
  var s=RW_ONBOARD[i]; if(!s){ rwOnboardDone(); return; }
  var dots=RW_ONBOARD.map(function(_,k){ return '<span style="width:7px;height:7px;border-radius:50%;background:'+(k===i?'var(--gold,#E8BA6C)':'rgba(255,255,255,.25)')+'"></span>'; }).join('');
  var last=(i===RW_ONBOARD.length-1);
  ov.innerHTML='<div class="sheet" style="max-width:360px;text-align:center;padding:26px 22px">'
    +'<div style="font-size:52px;margin-bottom:10px">'+s.ic+'</div>'
    +'<div style="font-size:20px;font-weight:800;margin-bottom:8px">'+s.t+'</div>'
    +'<div style="font-size:14px;color:var(--t2);line-height:1.6;margin-bottom:20px">'+s.d+'</div>'
    +'<div style="display:flex;gap:6px;justify-content:center;margin-bottom:20px">'+dots+'</div>'
    +'<button class="tact" style="width:100%;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;margin-bottom:8px" onclick="'+(last?'rwOnboardDone()':'rwOnboardShow('+(i+1)+')')+'">'+(last?'Start exploring \u2192':'Next')+'</button>'
    +'<button class="tact" style="width:100%;background:none;border:none;color:var(--t3);font-size:13px" onclick="rwOnboardDone()">'+(last?'':'Skip')+'</button>'
    +'</div>';
  ov.classList.add('open');
}
function rwOnboardDone(){
  try{ lsSet('rw_onboarded','1'); }catch(e){}
  var ov=el('rwOnboardOv'); if(ov){ ov.classList.remove('open'); }
}
function rwReplayOnboard(){ rwOnboardShow(0); }

