// @ts-nocheck
/* destination-vibe.js — Destination Vibe: each place's curated character for the
   card header — colours, a one-line read of what it feels like, and who it suits
   (RW_VIBES, rwVibe, rwVibeHTML). Split out of js/misc/misc-features-3.js (an
   8-feature grab-bag left over from Phase 6a modularization) as an SRP cleanup;
   verbatim move, zero logic changes. */

/* ==================== DESTINATION VIBE ====================
   Each place gets its own character in the card header — colours, a one-line
   read of what it actually feels like, and what it suits. Curated rather than
   generated: a wrong vibe is worse than none. */
var RW_VIBES = {
  goa:        {t:'Dreamy · Party · Coastal', g:['#F97316','#7C2D12'], line:'Two Goas in one state — the north is a party that never quite ends, the south is a hammock and a book.', suits:'First-timers, groups, anyone who wants both options open'},
  rishikesh:  {t:'Calm · Spiritual · Scenic', g:['#0EA5E9','#0C4A6E'], line:'Bells at dawn, rapids by noon. The Ganga sets the pace and nobody argues with it.', suits:'Solo travellers, yoga, quiet resets with an adrenaline option'},
  manali:     {t:'Alpine · Backpacker · Crisp', g:['#38BDF8','#1E3A5F'], line:'Apple orchards below, snow above, and Maggi at every altitude.', suits:'Mountain first-timers, road trips, snow'},
  leh:        {t:'Stark · High · Otherworldly', g:['#A78BFA','#312E81'], line:'Thin air, enormous silence, and light that makes everything look unreal.', suits:'Riders, photographers, people who like being small'},
  mumbai:     {t:'Bustling · Nightlife · Relentless', g:['#EC4899','#4C1D95'], line:'The city that genuinely does not sleep — and will not wait for you either.', suits:'Nightlife, food, art, anyone who likes momentum'},
  delhi:      {t:'Layered · Historic · Loud', g:['#F59E0B','#7C2D12'], line:'Seven cities stacked on each other, and all of them still open for business.', suits:'History, food, and using it as a hub for the north'},
  jaipur:     {t:'Regal · Colourful · Grand', g:['#F43F5E','#831843'], line:'Pink sandstone, rooftop sunsets, and forts that were built to be seen from far away.', suits:'First trips to Rajasthan, families, photographers'},
  udaipur:    {t:'Romantic · Serene · Filmy', g:['#60A5FA','#1E3A8A'], line:'Lakes, palaces and the softest evening light in Rajasthan.', suits:'Couples, slow trips, anyone tired of noise'},
  varanasi:   {t:'Ancient · Intense · Sacred', g:['#FB923C','#7C2D12'], line:'The oldest living city on earth, and it does not soften itself for visitors.', suits:'Travellers who want the real thing over the comfortable one'},
  kerala:     {t:'Green · Slow · Restorative', g:['#22C55E','#14532D'], line:'Backwaters, tea hills and a pace that lowers your heart rate within a day.', suits:'Families, monsoon travel, recovering from a hard year'},
  darjeeling: {t:'Misty · Colonial · Tea', g:['#34D399','#064E3B'], line:'Cloud in the streets, Kanchenjunga on a clear morning, and tea that ruins you for other tea.', suits:'Slow mornings, trains, tea people'},
  jaisalmer:  {t:'Golden · Desert · Cinematic', g:['#FBBF24','#78350F'], line:'A living fort in the middle of the Thar, gold at sunset, freezing by midnight.', suits:'Desert camps, forts, dramatic photographs'},
  bali:       {t:'Lush · Spiritual · Social', g:['#10B981','#064E3B'], line:'Rice terraces and temples in the middle, surf and crowds at the edges.', suits:'Long stays, remote work, surf'},
  bangkok:    {t:'Electric · Street · 24-hour', g:['#F472B6','#581C87'], line:'The best street food on earth, moving at the speed of a scooter.', suits:'Food, nightlife, and using it as a SEA hub'},
  kyoto:      {t:'Refined · Seasonal · Still', g:['#F87171','#7F1D1D'], line:'Temples, wooden lanes and an almost unfair sense of order.', suits:'Slow walkers, autumn and cherry season, culture'}
};
function rwVibe(place){
  var k=String(place||'').toLowerCase().trim();
  return RW_VIBES[k] || null;
}
function rwVibeHTML(place){
  var v=rwVibe(place); if(!v) return '';
  return '<div style="background:linear-gradient(135deg,'+v.g[0]+'22,'+v.g[1]+'11);border:1px solid '+v.g[0]+'44;border-radius:12px;padding:11px 13px">'
    +'<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:'+v.g[0]+';font-weight:800">'+esc2(v.t)+'</div>'
    +'<div style="font-size:12.5px;line-height:1.6;color:var(--t1);margin-top:5px">'+esc2(v.line)+'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:5px">Suits: '+esc2(v.suits)+'</div></div>';
}
