// @ts-nocheck
/* Deterministic event-to-Ailon bridge.
 * No live fares, unverified ticket access or generic destination card append.
 * The BTS plan is useful even when managed AI providers are unavailable.
 */
(function(root){
'use strict';
function installStyles(){
 if(typeof document==='undefined'||document.getElementById('rwEventHandoffCSS'))return;
 var sheet=document.createElement('style');sheet.id='rwEventHandoffCSS';
 sheet.textContent='.rw-event-answer .rw-event-plan-grid{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;padding:8px 2px 13px;scrollbar-width:thin}'+
 '.rw-event-answer .rw-event-mini{flex:0 0 clamp(170px,60vw,235px);scroll-snap-align:start;border:1px solid rgba(221,185,251,.35);border-radius:13px;background:linear-gradient(145deg,#211b3f,#142b3b);padding:13px;color:#f9f5ff}'+
 '.rw-event-answer .rw-event-mini b{display:block;margin:0 0 7px;font-size:13px}'+
 '.rw-event-answer .rw-event-mini p{font-size:12px;line-height:1.5;color:#d8def0;margin:0}'+
 '.rw-event-answer .rw-event-links{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}'+
 '.rw-event-answer .tk-chip{display:inline-flex;text-decoration:none;font-weight:750}';
 document.head.appendChild(sheet);
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function summit(q){return /\b(bengaluru tech summit|bangalore tech summit|bts[ -]?2026|biec)\b/i.test(String(q||''));}
function intent(q){return /\b(plan|trip|attend|visit|travel|going|go to|itinerary|reach|budget|conference)\b/i.test(String(q||''));}
function find(t){
 var list=(typeof root.RW_EVENTS!=='undefined'&&Array.isArray(root.RW_EVENTS))?root.RW_EVENTS:[];
 var query=String(t||'').toLowerCase();
 if(summit(query)&&intent(query))return list.find(function(x){return x.id==='bts-2026';})||{id:'bts-2026',name:'Bengaluru Tech Summit 2026',start:'2026-11-17',end:'2026-11-19',place:'Bangalore International Exhibition Centre (BIEC), Bengaluru',country:'India'};
 return null;
}
function links(){
 return '<div class="rw-event-links">'
  +'<a href="/summit/" class="tk-chip">⚡ Summit guide & voice</a>'
  +'<a href="/summit/#rwBtsTools" class="tk-chip">₹ Editable cost builder</a>'
  +'<a href="/summit/field-kit.html" class="tk-chip">▦ Print QR kit</a>'
  +'<a href="https://www.bengalurutechsummit.com/programme_at_a_glance.php" target="_blank" rel="noopener" class="tk-chip">Official timetable ↗</a>'
  +'<a href="https://www.google.com/maps/dir/?api=1&amp;destination=Bangalore+International+Exhibition+Centre+Madavara" target="_blank" rel="noopener" class="tk-chip">Directions ↗</a>'
  +'</div>';
}
function plan(event, origin){
 installStyles();
 var e=event||{};
 if(e.id==='bts-2026'){
 var originLabel=origin?'<p style="font-size:12px"><b>Starting from:</b> '+esc(origin)+' · Compare live train/air prices and total transfers before choosing a route.</p>'
 :'<p style="font-size:12px"><b>Starting point?</b> Add your origin to the cost builder for an accurate breakdown; air/rail costs are not live here.</p>';
 return '<section class="tk-card rw-event-answer" aria-label="Bengaluru Tech Summit itinerary">'
  +'<div class="tk-head" style="background:linear-gradient(130deg,#3a235a,#142e45)"><div class="tk-place">🚀 Bengaluru Tech Summit 2026 · Plan your visit</div><div class="tk-meta">17–19 November · BIEC, Tumkur Road · Confirmed event dates</div></div>'
  +'<div class="tk-sec"><p><b>Recommended:</b> arrive 16 November evening if attending all three days. Prioritise the conference programme only if your ticket includes it. Otherwise, the <b>free exhibition visitor</b> category covers 18–19 November subject to organiser registration and access rules.</p>'+originLabel
  +'<div class="rw-event-plan-grid">'
  +'<article class="rw-event-mini"><b>🗓 17 Nov · Conference</b><p>Arrive and collect the correct badge; schedule only sessions actually included in your pass. Reserve breaks and check the official session programme.</p></article>'
  +'<article class="rw-event-mini"><b>🤝 18 Nov · Exhibition + leads</b><p>Explore startup and tourism/AI exhibitors, test Ailon with visitors, collect consent-based introductions, and record next actions. Investor Connect requires separate approval.</p></article>'
  +'<article class="rw-event-mini"><b>🌳 19 Nov · Wrap + culture</b><p>Finish priority meetings and explore Bengaluru after the summit. Choose one city stop, such as ISKCON Rajajinagar; verify opening hours and travel time.</p></article>'
  +'<article class="rw-event-mini"><b>🚇 Getting to BIEC</b><p>Madavara metro on the Green Line serves BIEC. Check official wayfinding, service status and entry gate. From BLR airport allow a substantial transfer buffer.</p></article>'
  +'</div><p><b>Budget checklist:</b> return transport + hotel nights + meals + airport/metro/taxi + actual ticket category and taxes + a 10% contingency. Never treat illustrative rates as quotes.</p>'
  +'<p><b>Before paying:</b> verify visitor/delegate eligibility, registration, the meeting programme, hotel availability and refunds. No free QR or delegate pass guarantees an investor appointment.</p>'
  +links()
  +'<p class="rw-note" style="font-size:11px">Curated event guidance · real-time transport, prices, weather and investor access are not verified here.</p></div></section>';
 }
 var date=(e.start&&e.end&&e.start!==e.end)?e.start+' – '+e.end:(e.start||'Date not verified');
 return '<section class="tk-card rw-event-answer"><div class="tk-head"><div class="tk-place">🗓 '+esc(e.name||'Event')+'</div><div class="tk-meta">'+esc(date)+' · '+esc(e.place||'Venue not confirmed')+'</div></div><div class="tk-sec">'
 +'<p>Plan around the event, not just the destination. Confirm official ticket availability and entry rules first. Allow an arrival buffer, choose accommodation near the venue and keep flexible time for a local visit.</p>'
 +(origin?'<p>Starting city: <b>'+esc(origin)+'</b>. Check live transport connections for the exact dates.</p>':'<p>Share your departure city to compare routes.</p>')
 +'<p>Budget: event ticket + return travel + accommodation + meals + local transport + contingency. Live prices are not available in this offline answer.</p>'
 +'<a class="tk-chip" href="/#copilotHero">Ask Ailon to refine this trip</a></div></section>';
}
function originFrom(q){var m=String(q||'').match(/(?:starting city is|travelling from|traveling from|from)\s+([A-Za-z ,.'-]{2,50})(?:\.|,\s*(?:for|to)|\s+to\s+|$)/i);return m?m[1].trim().slice(0,50):'';}
function moveToAilon(){
 if(typeof document==='undefined')return;
 var hero=document.getElementById('copilotHero'),log=document.getElementById('heroLog');
 if(log)log.style.display='block';
 if(hero){
  hero.style.scrollMarginTop='70px';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{hero.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});}catch(e){hero.scrollIntoView();}
 }
}
function fromCarousel(e){
 if(!e)return false;
 installStyles();
 var message='Plan my trip to '+String(e.name||'this event')+' ('+String(e.start||'')+').';
 var html=plan(e,'');
 try{
   if(typeof root.tabGo==='function')root.tabGo('home');
   if(typeof root.rwCloseSection==='function')root.rwCloseSection('eventsSection');
   root._cpTargetLog='heroLog';
   var log=document.getElementById('heroLog');if(log)log.style.display='block';
   if(typeof root.cpBubble==='function'){root.cpBubble(esc(message),'me');root.cpBubble(html,'bot');}
   else {return false;}
   if(typeof root.rwHaptic==='function')root.rwHaptic('light');
   moveToAilon();
   // The shell can animate its tab change; repeat positioning after one paint.
   // Only scroll once more if the hero is still mounted and visible.
   if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(function(){
     var hero=document.getElementById('copilotHero');
     if(hero&&hero.getClientRects&&hero.getClientRects().length)moveToAilon();
   });
   try{if(typeof root.track==='function')root.track('event_plans');}catch(e){}
   return true;
 }catch(err){return false;}
}
function answerInCopilot(t,fromHero){
 var event=find(t);
 if(!event||typeof root.cpBubble!=='function')return false;
 var html=plan(event,originFrom(t));
 root.cpBubble(html,'bot');
 try{if(root.RWTuskVoiceStudio)root.RWTuskVoiceStudio.answer(html,t,{});}catch(e){}
 if(fromHero)moveToAilon();
 return true;
}
root.RWEventHandoff={summit:summit,intent:intent,find:find,plan:plan,originFrom:originFrom,fromCarousel:fromCarousel,moveToAilon:moveToAilon,answerInCopilot:answerInCopilot};
})(typeof window!=='undefined'?window:globalThis);
