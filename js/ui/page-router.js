// @ts-nocheck
/* ===== rwCloseSection — THE FIX for dead X buttons (rw-v49) ===============
   BUG: app.css has `body.shell[data-view="home"] .v-home{display:revert!important}`.
   Sections built with class "xsec v v-home" therefore IGNORE an inline
   style.display='none', so every X button on the newer features did nothing.
   Fix: strip the v/v-home classes (removing them from the !important rule's
   reach) as well as setting display, and remember the classes so reopening
   restores them. ======================================================== */
function rwCloseSection(id){
  var s=el(id); if(!s) return;
  try{
    s.dataset.rwcls = s.className;              /* remember for reopen */
    s.className = s.className.replace(/\bv-[a-z]+\b/g,'').replace(/(^|\s)v(\s|$)/g,' ').trim();
  }catch(e){}
  s.style.display='none';
  s.setAttribute('hidden','');
}

/* ============================================================================
   PAGE ROUTER (rw-v82) — stop cramming everything into the home screen
   ============================================================================
   THE PROBLEM: every feature (Events, Partners, Modes, Beacon...) injected a
   <section> into the HOME view. Home became an endless scroll-pile, nothing
   felt like a real destination, and nothing was linkable.

   THE FIX: real pages. Each major feature gets:
     · its own URL hash (#/partners) — shareable, and the BACK button works
     · a full-screen shell with its own header, not a card wedged into home
     · focus: the page is the only thing on screen

   Everything is additive — the existing open* functions still build their
   content; they just render into a page shell instead of the home feed.
   ========================================================================= */
var RW_PAGES = {
  partners: { title:'Stay & do',      sub:'Boutique stays and local operators we\u2019ve actually researched', icon:'\ud83e\udd1d', build:function(){ return _pageWrap('partnersSection'); } },
  events:   { title:'Event radar',    sub:'Music, startup, sport and motoring \u2014 with a trip built around each', icon:'\ud83d\udcc5', build:function(){ return _pageWrap('eventsSection'); } },
  compat:   { title:'Travel style',   sub:'Who you actually travel well with', icon:'\u2699\ufe0f', build:function(){} },
  listing:  { title:'Stay & do',      sub:'Every place, ranked by how much we can vouch for it', icon:'\ud83c\udfe1', build:function(){} },
  experiences: { title:'Experiences', sub:'Certified \u00b7 curated \u00b7 actually tested', icon:'\u2728', build:function(){} },
  stays:    { title:'Book a stay',    sub:'Verified rooms \u00b7 you pay the property directly', icon:'\ud83c\udfe1', build:function(){} },
  booked:   { title:'Confirmed',      sub:'', icon:'\u2705', build:function(){} },
  booking:  { title:'Your trip',      sub:'Everything you\u2019re booking, in one request', icon:'\ud83e\uddf3', build:function(){} },
  green:    { title:'RoamWise Green',  sub:'Electric, solar, vegan \u2014 verified, not claimed', icon:'\u26a1', build:function(){} },
  sos:      { title:'Stranded?',       sub:'Works offline \u2014 the advice a local friend would give', icon:'\ud83c\udd98', build:function(){} },
  modes:    { title:'Layout',         sub:'Three genuinely different ways to use RoamWise', icon:'\ud83e\udded', build:function(){ return _pageWrap('modeSection'); } }
};
function _pageWrap(id){ return id; }

var _rwPageStack=[];
function rwPageOpen(key, builder){
  var P=RW_PAGES[key]||{title:key,sub:'',icon:''};
  var host=el('rwPage');
  if(!host){
    host=document.createElement('div'); host.id='rwPage'; host.className='rw-page';
    document.body.appendChild(host);
  }
  host.innerHTML=
     '<div class="rw-page-bar">'
    +'<button class="rw-back" onclick="rwPageClose()" aria-label="Back">\u2190</button>'
    +'<div class="rw-page-t"><b>'+(P.icon||'')+' '+esc2(P.title)+'</b>'
    +(P.sub?'<span>'+esc2(P.sub)+'</span>':'')+'</div>'
    +'<button class="rw-share" onclick="rwPageShare(\''+key+'\')" aria-label="Share">\u21d7</button>'
    +'</div>'
    +'<div class="rw-page-body" id="rwPageBody"></div>';
  document.body.classList.add('rw-paged');
  host.classList.add('open');
  try{ if(typeof builder==='function') builder(el('rwPageBody')); }catch(e){}
  try{ if(location.hash!=='#/'+key) history.pushState({rwPage:key},'', '#/'+key); }catch(e){}
  window.scrollTo(0,0);
  _rwPageStack.push(key);
}
function rwPageClose(){
  var host=el('rwPage');
  if(host){ host.classList.remove('open'); setTimeout(function(){ if(host) host.innerHTML=''; },260); }
  document.body.classList.remove('rw-paged');
  _rwPageStack.pop();
  try{ if(String(location.hash||'').indexOf('#/')===0) history.pushState({},'', location.pathname); }catch(e){}
}
function rwPageShare(key){
  var url=location.origin+location.pathname+'#/'+key;
  try{
    if(navigator.share) navigator.share({ title:'RoamWise \u2014 '+(RW_PAGES[key]||{}).title, url:url });
    else { navigator.clipboard.writeText(url); showToast('Link copied'); }
  }catch(e){ showToast(url); }
}
/* back button / direct link support */
window.addEventListener('popstate', function(){
  var h=String(location.hash||'');
  if(h.indexOf('#/')===0){ rwRouteTo(h.slice(2)); }
  else if(el('rwPage') && el('rwPage').classList.contains('open')){
    el('rwPage').classList.remove('open');
    document.body.classList.remove('rw-paged');
  }
});
function rwRouteTo(key){
  if(key==='partners' && typeof openPartners==='function') return openPartners();
  if(key==='events'   && typeof openEvents==='function')   return openEvents();
  if(key==='compat'   && typeof openCompat==='function')    return openCompat();
  if(key==='listing'  && typeof openListing==='function')   return openListing();
  if(key==='experiences' && typeof openExperiences==='function') return openExperiences();
  if(key==='stays'    && typeof openStays==='function')     return openStays();
  if(key==='booking'  && typeof openBooking==='function')   return openBooking();
  if(key==='green'    && typeof openGreen==='function')     return openGreen();
  if(key==='sos'      && typeof openSOS==='function')       return openSOS();
  if(key==='modes'    && typeof openModePicker==='function') return openModePicker();
}
// Deep-link-on-first-load DOMContentLoaded handler moved to js/boot/init.js


/* rw-v86: ONE change instead of rewriting 20 open* functions.
   Any section opened through here is MOVED into the page shell, so every
   feature gets its own full screen, its own back button and its own URL —
   without touching the function that built it. */
var RW_SECTION_TITLES = {
  moneySection:['\ud83d\udcb0','Split money','Who owes whom, to the paise'],
  nearSection:['\ud83d\udccd','Near me','Food and things to do around you'],
  beaconSection:['\ud83d\udce1','Beacon','Travellers nearby, safely'],
  realmsSection:['\u2694\ufe0f','Realms of Roam','Claim territory by actually going there'],
  arrivalSection:['\ud83d\ude82','Arrival mode','Land, then plan from where you are'],
  greenSection:['\ud83c\udf3f','Green travel','Lower-impact ways to go'],
  passportSection:['\ud83d\udec2','Journey passport','Your verified travel record'],
  tribeSection:['\ud83d\udc65','Tribe travel','Find your kind of traveller'],
  fitnessSection:['\ud83c\udfcb\ufe0f','Fitness stays','Stay in shape on the road'],
  guideSection:['\ud83c\udfa7','Narrated guide','Listen as you walk'],
  tatkalSection:['\ud83c\udfab','Tatkal prep','Ready before the clock starts'],
  mapSection:['\ud83d\uddfa\ufe0f','Map explorer','See it before you go'],
  tripMapSection:['\ud83d\uddfa\ufe0f','Trip map','Your itinerary on a map'],
  badgesSection:['\ud83c\udfc5','Badges','What you\u2019ve earned'],
  memoriesSection:['\ud83d\udcf7','Memories','Your trips, kept'],
  journalSection:['\ud83d\udcd3','Journey journal','How the trip actually felt'],
  agentSection:['\ud83e\udd16','Tusk agent','Watch it think'],
  evalSection:['\ud83e\uddea','Agent evals','How reliable it really is'],
  matchSection:['\u2728','Smart matching','Trips that fit you'],
  certSection:['\ud83c\udf96\ufe0f','Journey certificate','Proof you were there']
};
function rwOpenSection(id){
  var s=el(id); if(!s) return;
  try{ if(s.dataset.rwcls) s.className=s.dataset.rwcls; }catch(e){}
  s.removeAttribute('hidden');
  s.style.display='';
  /* move it into a page shell */
  try{
    var t=RW_SECTION_TITLES[id];
    if(t && typeof rwPageOpen==='function'){
      RW_PAGES[id]={ title:t[1], sub:t[2], icon:t[0], build:function(){} };
      rwPageOpen(id, function(body){
        s.classList.remove('v','v-home');
        body.appendChild(s);
        s.style.display='';
      });
    }
  }catch(e){}
}
