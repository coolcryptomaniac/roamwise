/* Home discovery rail: no fabricated sale, radio-mesh or benefit claim. */
(function(){
'use strict';
function build(){
  var anchor=document.getElementById('rwSalesTreks');
  if(!anchor || document.getElementById('rwPioneerRail'))return;
  var parent=anchor.parentElement, heading=anchor.previousElementSibling;
  if(!parent || !heading)return;
  var sec=document.createElement('div');sec.id='rwPioneerRail';
  sec.innerHTML='<div class="rw-trackheading"><h2>🌌 Pioneer Circle · TrailMesh · Mountain journeys</h2><div><button class="rw-arrow" data-rw-prev="rwPioneerTrack" aria-label="Previous discovery card">‹</button> <button class="rw-arrow" data-rw-next="rwPioneerTrack" aria-label="Next discovery card">›</button></div></div>'+
  '<p style="color:#dac9dc;margin:3px 0 9px">Build better journeys together. Rewards require verification; offline tools never replace emergency equipment.</p>'+
  '<div class="rw-sales-track" id="rwPioneerTrack" tabindex="0" aria-label="Swipeable RoamWise features">'+
  '<a class="rw-sales-card" href="/pioneer/"><span class="rw-sales-copy"><strong>🪙 Pioneer Circle</strong><small>Your place in RoamWise history, not a crypto token. Early-member recognition and verified, budget-funded perks.</small><b>Explore the Circle →</b></span></a>'+
  '<a class="rw-sales-card" href="/trailmesh/"><span class="rw-sales-copy"><strong>📡 TrailMesh Expedition Kit</strong><small>Offline trek notes, group plan, checklists, safety briefing and local guide avatar. Native mesh radio is under development.</small><b>Open mini app →</b></span></a>'+
  '<a class="rw-sales-card" href="/treks/"><span class="rw-sales-copy"><strong>🏔️ Trekking departures</strong><small>Swipe verified operator cards below for upcoming dates and itinerary details. No unverified checkout promises.</small><b>Discover treks →</b></span></a>'+
  '<a class="rw-sales-card" href="/wallet/"><span class="rw-sales-copy"><strong>🧾 My payments & refunds</strong><small>See the current wallet pilot interface. Settlement and refund status must be confirmed by the payment provider.</small><b>View account →</b></span></a></div>';
  parent.insertBefore(sec,heading);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
