// @ts-nocheck
// SMART SEARCH + DESTINATION/PHOTO RESOLUTION HELPERS — extracted verbatim
// from app.js (modularization round 4). smartSearch() is the zero-API-key
// destination scorer/matcher used against js/data/destinations.js's `DB`;
// flagEmoji/lookupCountryInfo/buildGenericDestination build a usable
// destination card for any free-text place the user types that isn't in
// the curated DB; isSafePhotoTitle/bestSrcFromSrcset/picsumUrl/
// loadPhotosForCard fetch and content-filter real photos for a result card
// from Wikipedia's REST API, with a Picsum fallback. Called from
// runSearch()/renderCards() (still in app.js). Depends on runtime globals
// from app.js (DB, MONTHS, COUNTRY_INFO) — resolved at call time, so load
// order relative to app.js doesn't matter.
/* SMART SEARCH — works with zero API keys */
function smartSearch(month, budUSD, ctryQuery, crowd, interests){
  var mi = MONTHS.indexOf(month);
  var ctry = (ctryQuery||'').toLowerCase().trim();
  /* If the destination is an autocomplete-style "City, Country" value (the common/default
     flow — see DEST_NAMES and the live Photon-typeahead dropdown), the part before the first
     comma IS the city the user actually picked. Match against d.name specifically in that case
     so a query like "Rishikesh, India" doesn't match every other destination in India via the
     country segment. A bare, comma-free query (e.g. just "India") keeps the broader OR-based
     name/country/region matching so browsing-by-country still works. */
  var ctryCity = ctry.indexOf(',')>=0 ? ctry.split(',')[0].trim() : '';
  var scores = [];
  DB.forEach(function(d){
    var budgetGap = Math.max(0, d.cost.budget - budUSD);
    var budgetPenalty = budgetGap / 25; /* soft penalty, never excludes */
    var nameLc = d.name.toLowerCase();
    var exactCityMatch = false;
    if(ctry && ctry!=='anywhere in the world' && ctry.indexOf('anywhere')<0){
      var hit;
      if(ctryCity){
        hit = nameLc.indexOf(ctryCity)>=0 || ctryCity.indexOf(nameLc)>=0;
        if(hit) exactCityMatch = true;
      } else {
        hit = nameLc.indexOf(ctry)>=0
           || d.country.toLowerCase().indexOf(ctry)>=0
           || d.region.toLowerCase().indexOf(ctry)>=0
           || ctry.indexOf(d.country.toLowerCase())>=0
           || ctry.indexOf(nameLc)>=0;
      }
      if(!hit) return;
    }
    var sc=0, cs=d.crowd[mi];
    if(crowd==='avoid') sc += (100-cs)*0.6;
    else if(crowd==='some') sc += cs<50 ? (100-cs)*0.5 : cs*0.35;
    else sc += 50;
    interests.forEach(function(iv){
      var kw = iv.toLowerCase().split(' ')[0];
      if(d.interests.some(function(di){ return di.toLowerCase().indexOf(kw)>=0; })) sc+=18;
    });
    sc += Math.max(0, 60 - Math.abs(d.cost.mid-budUSD)/30);
    sc -= budgetPenalty;
    if(d.bestM.indexOf(mi+1)>=0) sc += 28; /* mi is 0-based (MONTHS.indexOf), bestM is 1-based */
    /* Defense-in-depth: strongly favor an exact/near-exact city-name match against the parsed
       "City, Country" query so the destination the user actually asked for always ranks first,
       even in edge cases where multiple destinations legitimately pass the filter above.
       Bonus is well above the realistic combined max of the other bonuses (~50 crowd + 18*few
       interests + 60 budget-fit + 28 month-fit) so it always wins. */
    if(exactCityMatch) sc += 500;
    scores.push({d:d, sc:sc, cs:cs});
  });
  scores.sort(function(a,b){ return b.sc-a.sc; });
  var picked=[], regions=[];
  scores.forEach(function(s){
    if(picked.length>=3) return;
    if(!regions.length || regions.indexOf(s.d.region)<0 || picked.length===2){ picked.push(s); regions.push(s.d.region); }
  });
  if(picked.length<3) scores.forEach(function(s){ if(picked.length<3 && picked.indexOf(s)<0) picked.push(s); });
  return picked.slice(0,3);
}

/* ── UNIVERSAL DESTINATION SUPPORT ── */
/* Pure-JS flag emoji — zero network calls, works for any ISO-3166 alpha-2 code */
function flagEmoji(iso2){
  if(!iso2 || iso2.length!==2) return '🌍';
  var cc = iso2.toUpperCase();
  var c1 = cc.charCodeAt(0), c2 = cc.charCodeAt(1);
  if(c1<65||c1>90||c2<65||c2>90) return '🌍';
  return String.fromCodePoint(127397+c1, 127397+c2);
}

function lookupCountryInfo(name){
  var key = (name||'').toLowerCase().trim();
  return COUNTRY_INFO[key] || null;
}

/* Build a usable destination card for ANY place the user types, even ones not in our curated 15. */
function buildGenericDestination(query, budUSD){
  var raw = (query||'').trim();
  var parts = raw.split(',');
  var place = parts[0].trim() || raw;
  var maybeCountry = parts.length>1 ? parts[parts.length-1].trim() : '';
  var cinfo = lookupCountryInfo(maybeCountry) || lookupCountryInfo(place) || lookupCountryInfo(raw);
  var resolvedCountryName = maybeCountry || (lookupCountryInfo(place) ? place : (lookupCountryInfo(raw) ? raw : ''));
  /* If the user typed just a bare country name (no city), show that name as the place too */
  var displayName = place;
  var id = 'generic_' + raw.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,40);

  var mid = Math.max(300, budUSD);
  var budget = Math.round(mid*0.62);
  var luxury = Math.round(mid*2.1);

  return {
    id: id,
    name: displayName,
    country: resolvedCountryName,
    region: 'Worldwide',
    lat: null, lon: null,
    crowd: [50,50,52,55,55,52,50,50,52,55,52,50],
    cost: { budget:budget, mid:mid, luxury:luxury },
    brk: { flights:Math.round(mid*0.34), stay:Math.round(mid*0.27), food:Math.round(mid*0.16), act:Math.round(mid*0.15), misc:Math.round(mid*0.08) },
    visa: { type:'Check requirements', cost:'Varies', days:'—', note:'Visa rules vary by nationality — check the nearest embassy, consulate, or VFS Global centre for current Indian-passport requirements before booking.' },
    bestM: [],
    interests: [],
    food: ['Try the local specialities — ask your accommodation host for their personal favourites'],
    gems: ['Wander beyond the main square — the best finds are rarely the first search result'],
    tags: [],
    cur: cinfo ? cinfo.currency : 'Local currency',
    sym: '',
    rate: 1,
    local: { 'Note':'Exact local prices vary — use a currency converter on arrival' },
    photos: [place+' city', place+' landmark', place+' travel'],
    yt: place+' travel guide',
    wiki: raw.replace(/\s+/g,'_'),
    flag: cinfo ? cinfo.iso : null,
    isGeneric: true,
    capital: cinfo ? cinfo.capital : '',
    language: cinfo ? cinfo.language : ''
  };
}

/* ── SAFE IMAGE PIPELINE ──
   Unsplash Source and REST Countries are both dead/paywalled (verified). 
   We use Wikipedia's free, CORS-enabled REST API for real contextual photos,
   with a strict content-safety filename filter, and Picsum as a guaranteed fallback. */
var UNSAFE_IMAGE_TERMS = ['flag','coat_of_arms','locator','projection','anthem','emblem','seal_of','map_of','_map','topographic',
  'war','hitler','nazi','military','weapon','gun','missile','conflict','protest','riot','massacre','attack','terror','genocide',
  'nude','naked','nsfw','porn','sex','fascist','soldier','battle','bomb','corpse','dead_body','execution'];

function isSafePhotoTitle(title){
  var t = (title||'').toLowerCase();
  if(t.indexOf('.svg')>=0 || t.indexOf('.gif')>=0) return false;
  for(var i=0;i<UNSAFE_IMAGE_TERMS.length;i++){
    if(t.indexOf(UNSAFE_IMAGE_TERMS[i])>=0) return false;
  }
  return true;
}

function bestSrcFromSrcset(srcset){
  if(!srcset || !srcset.length) return null;
  var best = srcset[srcset.length-1].src || srcset[0].src;
  if(best.indexOf('//')===0) best = 'https:'+best;
  return best;
}

function picsumUrl(seed, w, h){
  return 'https://picsum.photos/seed/'+encodeURIComponent(seed)+'/'+w+'/'+h;
}

function loadPhotosForCard(d, ci){
  var wikiTitle = d.wiki || d.name.replace(/\s+/g,'_');
  var urls = [];

  function finish(){
    while(urls.length<5) urls.push(picsumUrl(d.id+'_'+urls.length, urls.length===0?900:400, urls.length===0?500:300));
    var imgIds = ['photo_main_'+ci, 'photo_sm_'+ci+'_0', 'photo_sm_'+ci+'_1'];
    var elMain = document.getElementById(imgIds[0]);
    if(elMain) elMain.src = urls[0];
    var elS0 = document.getElementById(imgIds[1]);
    if(elS0) elS0.src = urls[1];
    var elS1 = document.getElementById(imgIds[2]);
    if(elS1) elS1.src = urls[2];
  }

  fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(wikiTitle))
    .then(function(r){ if(!r.ok) throw new Error('404'); return r.json(); })
    .then(function(s){
      var img = (s.originalimage||s.thumbnail||{}).source;
      if(img && isSafePhotoTitle(img)) urls.push(img);
      return fetch('https://en.wikipedia.org/api/rest_v1/page/media-list/'+encodeURIComponent(wikiTitle));
    })
    .then(function(r){ if(!r || !r.ok) throw new Error('no media'); return r.json(); })
    .then(function(ml){
      (ml.items||[]).forEach(function(item){
        if(urls.length>=5) return;
        if(item.type!=='image' || !item.showInGallery) return;
        if(!isSafePhotoTitle(item.title)) return;
        var src = bestSrcFromSrcset(item.srcset);
        if(src && urls.indexOf(src)<0) urls.push(src);
      });
      finish();
    })
    .catch(function(){ finish(); });
}
