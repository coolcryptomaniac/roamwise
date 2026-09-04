// @ts-nocheck
/* Moved from app.js (Phase 3 modularization) — the ON-TRIP ACTION HUB:
   RW_ACTIONS map, rwActionIntent, rwActionQuery and the rwActionHubHTML
   comparison-chip renderer. Pure code motion, zero logic changes.
   Depends on: rwAffLink() (js/booking/affiliate-links.js),
   rwSkyscannerToUrl() (top of app.js) and esc2() (app.js) — all already
   loaded by the time these are invoked at runtime. */

/* ==================== ON-TRIP ACTION HUB ====================
   HONEST SCOPE: RoamWise cannot place an order inside itself. Swiggy, Zomato,
   Blinkit, Zepto, Amazon, Flipkart and Myntra publish no public ordering API;
   Ola/Uber's partner APIs need a signed commercial agreement. Automating their
   apps would breach their terms AND mean handling the traveller's saved cards,
   which is a security and PCI problem nobody should take on lightly.

   What genuinely works, and is arguably better: one tap from here into the app
   they already have, already logged in, with their own saved payment and the
   search pre-filled. Deep links are public URL patterns — using them is what
   the web is for. */
var RW_ACTIONS = {
  ride: [
    /* EV-first ordering: BluSmart is an all-electric fleet, Uber Green and Ola
       have EV categories. Cleanest option listed first rather than buried. */
    /* VERIFIED JULY 2026. BluSmart was removed after its domain went dead —
       SEBI action against its promoter ended operations. Services close; the
       link-health agent (agent/link-check.js) now re-verifies these on a
       schedule so a dead partner never sits in the app again. */
    ['Evera (all-EV)', function(){ return 'https://www.evera.co.in/'; }, '\u26a1', 'IN'],
    ['Xanh SM (all-EV)', function(){ return 'https://xanhsm.com/'; }, '\ud83c\udf3f', 'SEA'],
    /* Uber runs a real affiliate program (developer.uber.com/docs/riders/
       affiliate-program) and is also carried as a campaign on Cuelinks and
       EarnKaro \u2014 checked via WebSearch, Aug 2026 \u2014 so it is eligible for the
       central system's generic-network wrap (registry entry in
       affiliate-config.js has no confirmed direct URL param, so this can
       only ever pick up a network wrap, never a fabricated one). Ola's
       "refer and earn" is a rider-to-rider credit scheme, not a publisher
       affiliate program, so its link is left exactly as a plain deep link. */
    ['Uber Green', function(q,lat,lon){ return rwAffLink('uber', lat? 'https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]='+lat+'&dropoff[longitude]='+lon : 'https://m.uber.com/ul/?action=setPickup&pickup=my_location'); }, '\ud83c\udf3f'],
    ['Ola',    function(q,lat,lon){ return lat? 'https://book.olacabs.com/?drop_lat='+lat+'&drop_lng='+lon : 'https://book.olacabs.com/'; }, '\ud83d\ude95'],
    ['Rapido', function(){ return 'https://onelink.to/rapido'; }, '\ud83c\udfcd\ufe0f'],
    ['Porter (goods)', function(){ return 'https://porter.in/'; }, '\ud83d\ude9a']
  ],
  events: [
    ['BookMyShow', function(q){ return 'https://in.bookmyshow.com/explore/home/'+encodeURIComponent(String(q||'').toLowerCase().replace(/\s+/g,'-')); }, '\ud83c\udfad'],
    ['District',   function(q){ return 'https://www.district.in/'; }, '\ud83c\udfab'],
    ['Insider',    function(q){ return 'https://insider.in/'; }, '\ud83c\udfb8']
  ],
  charge: [
    ['PlugShare',  function(){ return 'https://www.plugshare.com/'; }, '\ud83d\udd0c'],
    ['Statiq',     function(){ return 'https://statiq.in/'; }, '\u26a1'],
    ['Tata Power EZ', function(){ return 'https://www.tatapower.com/ev-charging/'; }, '\ud83d\udd0b']
  ],
  food: [
    ['Swiggy', function(q){ return 'https://www.swiggy.com/search?query='+encodeURIComponent(q||''); }, '\ud83c\udf5b'],
    ['Zomato', function(q){ return 'https://www.zomato.com/search?q='+encodeURIComponent(q||''); }, '\ud83c\udf7d\ufe0f']
  ],
  quick: [
    ['Blinkit', function(q){ return 'https://blinkit.com/s/?q='+encodeURIComponent(q||''); }, '\u26a1'],
    ['Zepto',   function(q){ return 'https://www.zeptonow.com/search?query='+encodeURIComponent(q||''); }, '\ud83d\udef5']
  ],
  shop: [
    ['Amazon',   function(q){ return rwAffLink('amazonin', 'https://www.amazon.in/s?k='+encodeURIComponent(q||'')); }, '\ud83d\udce6'],
    ['Flipkart', function(q){ return rwAffLink('flipkart', 'https://www.flipkart.com/search?q='+encodeURIComponent(q||'')); }, '\ud83d\udecd\ufe0f'],
    ['Myntra',   function(q){ return 'https://www.myntra.com/'+encodeURIComponent(String(q||'').replace(/\s+/g,'-')); }, '\ud83d\udc55']
  ],
  stay: [
    ['Booking', function(q){ return 'https://www.booking.com/searchresults.html?ss='+encodeURIComponent(q||''); }, '\ud83c\udfe8'],
    ['Agoda',   function(q){ return 'https://www.agoda.com/search?city='+encodeURIComponent(q||''); }, '\ud83d\udecf\ufe0f']
  ],
  fly: [
    /* Slicing the first 3 letters of a free-text place name (the old code)
       is not a real IATA code \u2014 "Manali" became "man", which is nobody's
       airport. rwSkyscannerToUrl() resolves a real code via RW_IATA and
       returns null when it can't; rwActionHubHTML() below drops any chip
       whose URL is null, so an unresolved place simply loses the Skyscanner
       chip rather than ever linking somewhere wrong \u2014 Google Flights, right
       next to it, always still works. */
    ['Skyscanner', function(q){ return rwSkyscannerToUrl(q||''); }, '\u2708\ufe0f'],
    ['Google Flights', function(q){ return 'https://www.google.com/travel/flights?q='+encodeURIComponent('flights to '+(q||'')); }, '\ud83d\udee9\ufe0f']
  ],
  rail: [
    ['IRCTC', function(){ return 'https://www.irctc.co.in/nget/train-search'; }, '\ud83d\ude82']
  ]
};
/* what is the traveller trying to DO right now? */
function rwActionIntent(t){
  var x = String(t||'').toLowerCase();
  if(/\b(cab|taxi|uber|ola|rapido|auto|ride|pickup|drop)\b/.test(x)) return 'ride';
  if(/\b(order food|hungry|dinner|lunch|breakfast|swiggy|zomato|deliver)\b/.test(x)) return 'food';
  if(/\b(zepto|blinkit|grocery|groceries|medicine|toothpaste|essentials|forgot)\b/.test(x)) return 'quick';
  if(/\b(buy|order|shorts|baniyan|vest|slippers|sunscreen|swimwear|swimsuit|clothes|shirt|tshirt|t-shirt|charger|adapter|powerbank|amazon|flipkart|myntra|shop)\b/.test(x)) return 'shop';
  if(/\b(hotel|stay|room|hostel|check.?in|book a room)\b/.test(x)) return 'stay';
  if(/\b(flight|fly|plane|air ticket)\b/.test(x)) return 'fly';
  if(/\b(train|rail|irctc|tatkal)\b/.test(x)) return 'rail';
  if(/\b(movie|cinema|show|concert|gig|event|events|tickets?|standup|comedy)\b/.test(x)) return 'events';
  if(/\b(charging|charger|ev point|charge point|plug)\b/.test(x)) return 'charge';
  return null;
}
function rwActionQuery(t, kind, dest){
  var x = String(t||'').replace(/\b(order|buy|book|get|need|want|me|a|an|some|please|now|here|there|in|at|from|for)\b/gi,' ')
                       .replace(/\s+/g,' ').trim();
  if(kind==='ride' || kind==='stay' || kind==='fly') return dest||x;
  if(kind==='food' && (!x || x.length<3)) return dest||'restaurants';
  return x || dest || '';
}
function rwActionHubHTML(kind, query, dest, lat, lon, cc){
  var list = RW_ACTIONS[kind]; if(!list) return '';
  /* entries tagged with a region only show in that region */
  if(cc){
    var reg = (['TH','VN','ID','MY','KH','LA','PH','SG','MM'].indexOf(String(cc).toUpperCase())>-1) ? 'SEA'
            : (String(cc).toUpperCase()==='IN' ? 'IN' : null);
    list = list.filter(function(a){ return !a[3] || a[3]===reg; });
  }
  var titles = {ride:'\ud83d\ude95 Get a ride', food:'\ud83c\udf5c Order food', quick:'\u26a1 Quick essentials',
                shop:'\ud83d\udecd\ufe0f Buy it now', stay:'\ud83c\udfe8 Find a room', fly:'\u2708\ufe0f Flights', rail:'\ud83d\ude82 Trains',
                events:'\ud83c\udfad Shows & events', charge:'\ud83d\udd0c EV charging'};
  return '<div class="tk-card tk-mini"><div class="tk-sec">'
    +'<div style="font-weight:800;font-size:13.5px">'+titles[kind]+(query? ' \u2014 '+esc2(query):'')+'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:2px">Opens in the app you already use, search filled in, your saved payment. I can\u2019t take payments inside RoamWise \u2014 and honestly you wouldn\u2019t want me to.</div>'
    +'<div class="tk-chips" style="margin-top:10px">'
    + list.map(function(a){ return {url:a[1](query, lat, lon), label:a[0], icon:a[2]}; })
        .filter(function(x){ return !!x.url; }) /* an unresolvable link (e.g. Skyscanner with no IATA match) never renders rather than pointing somewhere broken */
        .map(function(x){
          return '<a class="tk-chip gold" style="text-decoration:none" target="_blank" rel="noopener" href="'+x.url+'">'+x.icon+' '+x.label+'</a>';
        }).join('')
    +'</div></div></div>';
}
