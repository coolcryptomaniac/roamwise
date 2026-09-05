// @ts-nocheck
/* Moved from app.js (Phase 3 modularization) — the central affiliate/deep-link
   system: stayUrl/stayUrlAgoda/thingsUrl, the AFF_* constants, rwAffLink() and
   the booking-platform comparison grid (rwBookGridHTML). Pure code motion,
   zero logic changes. Depends on: rwIata() (js/data/iata.js), rwAffLink's
   network-wrap helpers rwTpWrap/rwCuelinksWrap/rwEarnKaroWrap/rwAdmitadWrap
   and RW_AFFILIATE_PROGRAMS (affiliate-config.js) — both already load before
   this file in index.html. */

var AFF_BOOKING=''; /* Booking.com affiliate aid (optional) */
function stayUrl(place){
  return rwAffLink('booking', 'https://www.booking.com/searchresults.html?ss='+encodeURIComponent(place));
}

/* ==================== FREE AFFILIATE / DEEP LINKS ====================
   Every link here is a plain public search URL that works with NO partnership,
   NO approval and NO traffic minimum. Where a programme exists, the affiliate
   ID is an optional constant appended only if set — so revenue can be switched
   on later by filling one string, with zero code changes. */
var AFF_SKYSCANNER='', AFF_AGODA='', AFF_GYG='', AFF_TRAVELPAYOUTS='';
function affTpUrl(domain,path){ if(!AFF_TRAVELPAYOUTS) return 'https://'+domain+(path||''); return 'https://tp.media/click?shmarker='+AFF_TRAVELPAYOUTS+'&target_url='+encodeURIComponent('https://'+domain+(path||'')); }

/* ==================== CENTRAL AFFILIATE LINK SYSTEM (rw-v95) ====================
   Every new affiliate slot (see affiliate-config.js for the registry + the
   network-wrap helpers rwTpWrap/rwCuelinksWrap/rwEarnKaroWrap/rwAdmitadWrap)
   lives behind ONE function so a link is never accidentally wrapped twice.
   All of these start empty — zero revenue, zero behaviour change — until an
   admin fills the matching key in Firestore config/app. */
var AFF_VIATOR='', AFF_SAFETYWING='', AFF_KLOOK='', AFF_12GO='', AFF_TRIPCOM='',
    AFF_HOSTELWORLD='', AFF_AMAZON='', AFF_FLIPKART='', AFF_YATRA='', AFF_CLEARTRIP='',
    AFF_CUELINKS='', AFF_EARNKARO='', AFF_ADMITAD='';
var RW_AFF_VARMAP = {
  booking:'AFF_BOOKING', agoda:'AFF_AGODA', gyg:'AFF_GYG', skyscanner:'AFF_SKYSCANNER',
  klook:'AFF_KLOOK', '12go':'AFF_12GO', viator:'AFF_VIATOR', safetywing:'AFF_SAFETYWING',
  tripcom:'AFF_TRIPCOM', hostelworld:'AFF_HOSTELWORLD', amazonin:'AFF_AMAZON',
  flipkart:'AFF_FLIPKART', yatra:'AFF_YATRA', cleartrip:'AFF_CLEARTRIP'
};
/* rwAffLink(programId, destUrl) — the ONE place every outbound booking link
   should route through. Picks exactly one mechanism, in this priority order,
   and never combines two:
     1. direct-ID param on the merchant's own domain, if the program has one
        AND its config key is filled in (e.g. Booking's aid=)
     2. the Travelpayouts marker wrap, but ONLY for programs we've actually
        checked are reachable through Travelpayouts (prog.tpPartner===true),
        and only if a marker id is configured
     3. a generic network wrap (Admitad, then Cuelinks, then EarnKaro — first
        one with a config key set wins), which can wrap ANY destination URL
     4. the plain, unwrapped URL — always a safe fallback, never broken */
function rwAffLink(programId, destUrl){
  try{
    var prog = (window.RW_AFFILIATE_PROGRAMS||[]).filter(function(p){ return p.id===programId; })[0];
    if(!prog || !destUrl) return destUrl;
    var varName = RW_AFF_VARMAP[programId];
    var directId = varName ? window[varName] : '';
    if(prog.paramName && directId){
      var sep = destUrl.indexOf('?')>-1 ? '&' : '?';
      return destUrl + sep + prog.paramName + '=' + encodeURIComponent(directId);
    }
    if(prog.tpPartner && typeof AFF_TRAVELPAYOUTS!=='undefined' && AFF_TRAVELPAYOUTS){
      return rwTpWrap(destUrl);
    }
    if(typeof AFF_ADMITAD!=='undefined' && AFF_ADMITAD) return rwAdmitadWrap(destUrl);
    if(typeof AFF_CUELINKS!=='undefined' && AFF_CUELINKS) return rwCuelinksWrap(destUrl);
    if(typeof AFF_EARNKARO!=='undefined' && AFF_EARNKARO) return rwEarnKaroWrap(destUrl);
    return destUrl;
  }catch(e){ return destUrl; }
}
function flightUrl(place){
  return 'https://www.google.com/travel/flights?q=' + encodeURIComponent('flights to '+place);
}
function trainBusUrl(place){
  /* Rome2Rio covers trains, buses and ferries worldwide with no signup. */
  return 'https://www.rome2rio.com/s/' + encodeURIComponent(place);
}
function stayUrlAgoda(place){
  return rwAffLink('agoda', 'https://www.agoda.com/search?city='+encodeURIComponent(place));
}
function thingsUrl(place){
  return rwAffLink('gyg', 'https://www.getyourguide.com/s/?q='+encodeURIComponent(place));
}
function travelLinksHTML(place){
  var L=[
    ['🏨 Stays', stayUrl(place)],
    ['✈️ Flights', flightUrl(place)],
    ['🚆 Trains & buses', trainBusUrl(place)],
    ['🎫 Things to do', thingsUrl(place)]
  ];
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">'
    + L.map(function(x){
        return '<a class="tact" style="text-align:center;text-decoration:none;font-size:12px;padding:10px 6px" target="_blank" rel="noopener" href="'+x[1]+'" onclick="try{track(\'aff_click\')}catch(e){}">'+x[0]+'</a>';
      }).join('')
    + '</div>';
}

/* Compare Destinations "Book this trip" tab — every link routes through the
   central rwAffLink() system so none is ever wrapped twice, and the
   commission line only claims a real commission when something is actually
   active (Airbnb has no registered program here, so it always stays plain —
   never fabricated). */
function rwBookGridHTML(origin, destName, enc){
  /* Skyscanner needs real IATA codes on both ends (see RW_IATA above). When
     either origin or destination doesn't resolve, we do NOT emit a broken
     Skyscanner link — the working Google Flights search takes that slot
     instead, for this card only. rwSkyscannerUrl() already routes through
     rwAffLink() internally, so it is never wrapped a second time here. */
  /* Build the plain (unwrapped) Skyscanner URL from the SAME IATA-derived
     domain+path as the affiliate-wrapped one, so the only possible
     difference between skyPlain and skyHref is an actual appended affiliate
     value — not a structural mismatch that would always read as "active". */
  var skyO = rwIata(origin), skyD = rwIata(destName);
  var skyIsFallback = !(skyO && skyD);
  var skyPlain = skyIsFallback ? '' : 'https://www.skyscanner.co.in/transport/flights/'+skyO.toLowerCase()+'/'+skyD.toLowerCase()+'/';
  var skyAff = skyIsFallback ? null : rwAffLink('skyscanner', skyPlain);
  var skyHref = skyAff || ('https://www.google.com/travel/flights?q='+encodeURIComponent('flights from '+origin+' to '+destName));

  var plain = {
    booking:    'https://www.booking.com/searchresults.html?ss='+enc,
    gyg:        'https://www.getyourguide.com/s/?q='+enc,
    viator:     'https://www.viator.com/search/'+enc,
    airbnb:     'https://www.airbnb.com/s/'+enc+'/homes',
    safetywing: 'https://www.safetywing.com'
  };
  var hrefs = {
    skyscanner: skyHref,
    booking:    rwAffLink('booking', plain.booking),
    gyg:        rwAffLink('gyg', plain.gyg),
    viator:     rwAffLink('viator', plain.viator),
    airbnb:     plain.airbnb, /* no Airbnb affiliate program registered — plain, not fabricated */
    safetywing: rwAffLink('safetywing', plain.safetywing)
  };
  var anyActive = (!skyIsFallback && skyHref !== skyPlain) ||
    Object.keys(plain).some(function(k){ return hrefs[k] !== plain[k]; });

  var items = [
    [skyIsFallback?'Google Flights':'Skyscanner', skyIsFallback?'🛩️':'✈️', 'Flights', hrefs.skyscanner],
    ['Booking.com','🏨','Hotels', hrefs.booking],
    ['GetYourGuide','🎫','Tours', hrefs.gyg],
    ['Viator','🗺️','Experiences', hrefs.viator],
    ['Airbnb','🏠','Stays', hrefs.airbnb],
    ['SafetyWing','🛡️','Insurance', hrefs.safetywing]
  ];
  var grid = items.map(function(x){
    return '<a class="book-link" href="'+x[3]+'" target="_blank" rel="noopener"><span class="book-ico">'+x[1]+'</span><span class="book-name">'+x[0]+'</span><span class="book-sub">'+x[2]+'</span></a>';
  }).join('');
  var note = anyActive
    ? 'Affiliate links — commission at no extra cost'
    : 'Direct links to each site — no affiliate relationship active yet';
  return '<div class="book-grid">'+grid+'</div>'
    +'<p style="font-size:10px;color:#4A4946;text-align:center;margin-top:7px">'+note+'</p>';
}

/* Moved verbatim from app.js (modularization round 5) — natural fit here since
   both build on rwAffLink() above and rwIata() (js/data/iata.js). */
/* Builds a real Skyscanner route URL, or returns null if either end can't be
   resolved to a real IATA code — callers MUST fall back to Google Flights
   in that case rather than ever emitting a broken Skyscanner link. */
function rwSkyscannerUrl(origin, dest){
  var o = rwIata(origin), d = rwIata(dest);
  if(!o || !d) return null;
  return rwAffLink('skyscanner', 'https://www.skyscanner.co.in/transport/flights/'+o.toLowerCase()+'/'+d.toLowerCase()+'/');
}
/* Destination-only Skyscanner "flights to X" browse URL — needs just the
   destination resolved, no origin. */
function rwSkyscannerToUrl(dest){
  var d = rwIata(dest);
  if(!d) return null;
  return rwAffLink('skyscanner', 'https://www.skyscanner.co.in/transport/flights-to/'+d.toLowerCase()+'/');
}
