// @ts-nocheck
/* booking-platform-compare.js — Booking Platform Comparison: a deliberately
   static, structural comparison of what each booking platform is actually good at
   and where it stings, since none publish a public pricing API (RW_PLATFORMS,
   rwPlatformsHTML). Split out of js/misc/misc-features-3.js (an 8-feature
   grab-bag left over from Phase 6a modularization) as an SRP cleanup; verbatim
   move, zero logic changes. */

/* ==================== BOOKING PLATFORM COMPARISON ====================
   STATIC and dated on purpose. Live comparison would need each platform's
   pricing API — none of which are public — and the only alternative is
   scraping, which we've ruled out. What IS honest and useful is a structural
   comparison: what each is genuinely good at, and where each tends to sting.
   Every row is checkable from their own published terms. Prices move; the
   structural strengths don't, which is why this ages well. */
var RW_PLATFORMS = [
  {n:'MakeMyTrip', ico:'\ud83c\uddee\ud83c\uddf3', best:'Domestic India flights + hotel bundles',
   watch:'Convenience fee and "assured" add-ons pre-ticked at checkout \u2014 untick them',
   url:'https://www.makemytrip.com/'},
  {n:'ixigo', ico:'\ud83d\ude82', best:'Trains and PNR tracking \u2014 the best rail UX in India',
   watch:'Flight prices are usually fine but always cross-check the airline direct',
   url:'https://www.ixigo.com/'},
  {n:'Skyscanner', ico:'\ud83d\udd0d', best:'Comparing every airline at once; "everywhere" search for cheap dates',
   watch:'It is a search engine \u2014 you book on the airline/OTA it sends you to',
   url:'https://www.skyscanner.co.in/', aff:'skyscanner'},
  {n:'Google Flights', ico:'\ud83d\udee9\ufe0f', best:'Fastest date-grid and price tracking alerts',
   watch:'Does not show every budget carrier; check IndiGo/Akasa direct too',
   url:'https://www.google.com/travel/flights'},
  {n:'Booking.com', ico:'\ud83c\udfe8', best:'Largest stay inventory; free-cancellation filter is excellent',
   watch:'Prices exclude taxes until late in the flow \u2014 compare the final page',
   url:'https://www.booking.com/', aff:'booking'},
  {n:'Agoda', ico:'\ud83c\udf0f', best:'Often cheapest across Asia for the same room',
   watch:'Check whether breakfast/taxes are included before comparing',
   url:'https://www.agoda.com/', aff:'agoda'},
  {n:'Airbnb', ico:'\ud83c\udfe1', best:'Homestays and longer stays; kitchens for budget trips',
   watch:'Cleaning + service fees can add 20\u201330% \u2014 judge on the total, not the nightly',
   url:'https://www.airbnb.co.in/'},
  {n:'Thomas Cook / SOTC', ico:'\ud83e\uddf3', best:'Packaged group tours, visa assistance, forex',
   watch:'Packages bundle margin \u2014 price the same trip independently before committing',
   url:'https://www.thomascook.in/'},
  {n:'IRCTC', ico:'\ud83c\uddee\ud83c\uddf3', best:'The only official source for Indian Railways tickets',
   watch:'Tatkal opens 10\u201311am one day ahead; agents charging extra are unnecessary',
   url:'https://www.irctc.co.in/'}
];
function rwPlatformsHTML(){
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#1E3A8A,#0A0A0C)">'
    +'<div class="tk-place">Where to book</div>'
    +'<div class="tk-meta">What each platform is actually good at \u2014 and where it stings</div></div>'
    +'<div class="tk-sec">'
    + RW_PLATFORMS.map(function(p){
        var href = p.aff ? rwAffLink(p.aff, p.url) : p.url;
        return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
          +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
          +'<b style="font-size:13px">'+p.ico+' '+esc2(p.n)+'</b>'
          +'<a class="tk-chip" style="font-size:10.5px;padding:4px 9px;text-decoration:none" target="_blank" rel="noopener" href="'+href+'">Open \u2197</a></div>'
          +'<div style="font-size:11.5px;color:var(--t2);margin-top:3px;line-height:1.5">\u2714\ufe0f '+esc2(p.best)+'</div>'
          +'<div style="font-size:11.5px;color:#E8BA6C;margin-top:2px;line-height:1.5">\u26a0\ufe0f '+esc2(p.watch)+'</div>'
          +'</div>';
      }).join('')
    +'<div style="font-size:10px;color:var(--t3);margin-top:9px">Structural comparison, not live prices \u2014 none of these publish a public pricing API. Always compare the FINAL checkout total, taxes and fees included. Reviewed periodically; last review July 2026.</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Rules that beat any platform</div>'
    +'<div class="tk-bul">Search in an incognito window, then book on the airline\u2019s own site \u2014 it is often the same fare without the OTA fee, and changes are far easier.</div>'
    +'<div class="tk-bul">Compare the FINAL page, not the headline. Convenience fees, seat charges and taxes appear late.</div>'
    +'<div class="tk-bul">Tuesday/Wednesday departures booked 3\u20136 weeks out are usually the cheapest band on Indian routes.</div>'
    +'<div class="tk-bul">For a package, price the same flights + hotel separately first. If the package is not clearly cheaper, it is selling convenience.</div>'
    +'</div></div>';
}
