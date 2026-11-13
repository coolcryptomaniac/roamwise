/* Home discovery rail: no fabricated sale, radio-mesh or benefit claim. */
(function(){
'use strict';
function build(){
  var anchor=document.getElementById('rwSalesTreks');
  if(!anchor || document.getElementById('rwPioneerRail'))return;
  var parent=anchor.parentElement, heading=anchor.previousElementSibling;
  if(heading && !heading.classList.contains('rw-trackheading'))heading=heading.previousElementSibling;
  if(!parent || !heading || !heading.classList.contains('rw-trackheading'))return;
  var sec=document.createElement('div');sec.id='rwPioneerRail';
  sec.innerHTML='<div class="rw-trackheading"><h2>🌌 Pioneer Circle · Trail Mesh · Treks</h2><div><button class="rw-arrow" data-rw-prev="rwPioneerTrack" aria-label="Previous discovery card">‹</button> <button class="rw-arrow" data-rw-next="rwPioneerTrack" aria-label="Next discovery card">›</button></div></div>'+
  '<p style="color:#dac9dc;margin:3px 0 9px">Build better journeys together. Rewards require verification; offline tools never replace emergency equipment.</p>'+
  '<div class="rw-sales-track" id="rwPioneerTrack" tabindex="0" aria-label="Swipeable RoamWise features">'+
  '<a class="rw-sales-card" href="/pioneer/"><span class="rw-sales-copy"><strong>🪙 Pioneer Circle</strong><small>Your place in RoamWise history, not a crypto token. Early-member recognition and verified, budget-funded perks.</small><b>Explore the Circle →</b></span></a>'+
  '<a class="rw-sales-card" id="rwTrailMeshCard" href="/trailmesh/index.html" onclick="return rwOpenTrailMesh(\'connect\',event)"><span class="rw-sales-copy"><strong>📡 Trail Mesh</strong><small>Android app: offline phone-to-phone chat, SOS and team roll call over Bluetooth and Wi-Fi. Any phone: trek plan, checklists, journal and safety briefing.</small><b>Open Trail Mesh →</b></span></a>'+
  '<a class="rw-sales-card" href="/treks/"><span class="rw-sales-copy"><strong>🏔️ Trekking departures</strong><small>Swipe verified operator cards below for upcoming dates and itinerary details. No unverified checkout promises.</small><b>Discover treks →</b></span></a>'+
  '</div>';
  var wrap=document.getElementById('rwTreksRail');
  if(wrap&&wrap.parentElement)wrap.parentElement.insertBefore(sec,wrap);else parent.insertBefore(sec,heading);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
