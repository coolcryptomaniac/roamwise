// @ts-nocheck
// GLOBAL ERROR GUARD moved to js/core/error-guard.js (must load FIRST, not with the rest of boot, so it protects every other module's load too)

/* Subtle haptic feedback — makes taps feel responsive & premium. No-op where
   unsupported. Called on key actions (send, pin, pay-success). */
function rwHaptic(kind){
  try{
    if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics){
      Capacitor.Plugins.Haptics.impact({style: kind==='heavy'?'HEAVY':'LIGHT'});
    } else if(navigator.vibrate){ navigator.vibrate(kind==='heavy'?18:8); }
  }catch(e){}
  /* Every rwHaptic() call already marks a "key action" (send, pin, toggle,
     pay-success…) — reuse that same call graph to play the matching
     tap/success sting from the RoamWise audio manifest instead of adding
     ad-hoc Audio() calls at each of these sites. */
  try{ rwPlayCue(kind==='heavy' ? 'success_feedback' : 'tap_feedback'); }catch(e){}
}
// RW_CUE_FILES, rwAudioThemeEnabled, rwAudioThemeVolume, rwPlayCue moved to js/audio/cues.js


// DB destinations array moved to js/data/destinations.js
// RW_IATA lookup table and rwIata() resolver moved to js/data/iata.js
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
// COUNTRY_INFO + ALL_COUNTRIES (static country reference data) moved to js/data/country-info.js

/* RoamWise Pro — app logic. Built with template literals to avoid quote-escaping bugs. */

// LS, lsGet, lsSet moved to js/core/storage-utils.js

// PUSH + LOCAL NOTIFICATIONS (rwInitPush/rwSaveDeviceToken/rwLocalNotifySchedule) moved to js/boot/init.js







// AILON TUSK AGENT (RW_AGENT_TOOLS/RW_AGENT_IMPL/rwAgentRun/openAgent/rwAgentGo/rwAgentRenderTrace) moved to js/copilot/agent.js

// AGENT EVAL HARNESS (RW_EVALS/rwEvalRun/rwEvalScore/openEval/rwEvalGo/rwEvalRender) moved to js/copilot/agent-evals.js

/* ===== PRIVACY TRUST ANCHOR + WEB-TO-APP HANDOFF (rw-v51) =================
   Two conversion levers from the strategy review:
   1) Web visitors ASSUME they're being tracked. Say plainly that they aren't.
   2) Desktop planners should finish on their phone \u2014 a QR beats "download our app". */
function openPrivacyBadge(){
  var ov=el('privBadgeOv');
  if(!ov){ ov=document.createElement('div'); ov.id='privBadgeOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('privBadgeOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:400px"><div class="sheet-h"><b>\ud83d\udd12 Your data stays yours</b>'
    +'<button onclick="rwOverlayClose(\'privBadgeOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:13px;color:var(--t2);line-height:1.7;margin-top:6px">'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">\u2713 On your device</b><br>Your saved trips, itineraries, journal, budgets and preferences never leave this device.</div>'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">\u2713 Only when you invite people</b><br>The only things that reach our servers are group chats you create and beacons you deliberately light.</div>'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">\u2713 No background tracking</b><br>Location is read once, when you tap a feature that needs it. Never in the background. Never sold.</div>'
    +'<div><b style="color:#4ADE80">\u2713 No signup required</b><br>You can plan an entire trip without giving us an email address.</div>'
    +'</div><a class="tact" style="display:block;text-align:center;margin-top:14px;text-decoration:none" href="/legal/privacy.html" target="_blank">Read the full privacy policy \u2197</a></div>';
  ov.classList.add('open');
}
/* QR handoff: finish planning on the phone. Uses a public QR image service so
   there's no library to bundle; falls back to a copyable link. */
function rwHandoffToPhone(){
  var url='https://www.roamwise.co.in/';
  try{
    var t=(window._lastItin&&window._lastItin.name)||'';
    if(t) url+='?plan='+encodeURIComponent(t);
  }catch(e){}
  var qr='https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data='+encodeURIComponent(url);
  var ov=el('handoffOv');
  if(!ov){ ov=document.createElement('div'); ov.id='handoffOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('handoffOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:340px;text-align:center"><div class="sheet-h" style="text-align:left"><b>\ud83d\udcf1 Continue on your phone</b>'
    +'<button onclick="rwOverlayClose(\'handoffOv\')" class="tact">\u2715</button></div>'
    +'<div style="background:#fff;border-radius:14px;padding:10px;display:inline-block;margin:8px 0">'
    +'<img src="'+qr+'" alt="QR code" width="220" height="220" style="display:block"></div>'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.6">Scan with your phone camera to open this plan there \u2014 maps, Near Me and your group chat all work better on mobile.</div>'
    +'<button class="tact" style="width:100%;margin-top:12px" onclick="rwCopy(\''+url+'\');showToast(\'Link copied\')">Copy link instead</button></div>';
  ov.classList.add('open');
}

// INDIA GROUND-TRUTH LAYER + CYCLE MODE SAFETY (RW_TERRAIN/rwTerrainOf/rwRoadTime/rwGroundTruth/rwCycleSafety/rwCycleCard) moved to js/itinerary/ground-truth.js

// PNR / BOOKING SMS PARSER (rwParsePNR/openPnrPaste) moved to js/booking/pnr-parser.js

// UPI SETTLEMENT (rwUpi*/rwCopy) moved to js/social/upi-settle.js

// PAGE ROUTER (rwCloseSection/RW_PAGES/rwPageOpen/rwPageClose/rwPageShare/rwRouteTo/RW_SECTION_TITLES/rwOpenSection) moved to js/ui/page-router.js




// LAYOUT MODES (RW_MODES/rwMode/rwApplyMode/rwSetMode/openModePicker) moved to js/ui/layout-modes.js






// INSTANT BOOKING ENGINE (openStays, rwStaysRender, openRoomBook, rwBookPay,
// rwBookConfirm, rwBookOwnerMsg, rwBookDone, rwShareMyBooking, rwBookShare)
// moved to js/booking/form.js




// TRAVEL COMPATIBILITY ENGINE (rwCompatPair/rwCompatGroup/openCompat/rwCompatEcho/rwCompatMine/rwCompatSave/rwCompatShow) moved to js/social/compat.js

// THE LISTING (rwBadge/rwHue/rwCardArt/openListing/rwListingAll/rwBadgeRank/rwListingFor/rwListCard/rwListOpen) moved to js/misc/listings.js

// ROAMWISE EXPERIENCES (openExperiences/rwExpRender/rwExpPlan) moved to js/misc/experiences.js

/* ============================================================================
   BOOKING ENGINE + GREEN + SOS (rw-v83)
   ========================================================================= */

// REQUEST TO BOOK (rwBasket*, rwBookTotal, rwCommissionOn, openBooking, rwBookRequest)
// moved to js/booking/form.js

// ROAMWISE GREEN (openGreen/rwGreenPlan) moved to js/misc/green-trip.js

// STRANDED / EMERGENCY (openSOS, rwSOSShare) moved to js/booking/local-rides.js

/* ============================================================================
   B2B PARTNERS + LOCAL RIDES (rw-v81)
   ============================================================================
   Two things travellers keep asking for that we didn't have:
     1. "where do I actually stay / who runs the rafting"  -> partner directory
     2. "how do I get around"                              -> rides

   RANKING is honest and explainable: signed partners first (we've verified
   them), then by a confidence-weighted rating — a 5.0 from 12 people should
   not outrank a 4.8 from 900. We show the reasoning, never a black-box score.
   ========================================================================= */

/* Bayesian-ish weighting so review COUNT matters, not just the average. */

/* Partners come from Firestore (config/partners), seeded by partners-data.js.
   Same pattern as referrers: the file is a fallback so the directory works
   offline, Firestore keeps it fresh, and no code file is ever edited. */

// CONFIG SYNC (RW_SYNCED/rwConfigApply/rwConfigSyncAll) moved to js/data-sync/config-sync.js

// B2B PARTNERS (rwPartnersSync/rwPartnerScore/rwPartnersFor/openPartners/rwPartnersRender/rwPartnerById/rwPartnerMaps/rwPartnerBook/rwPartnerPlan) moved to js/misc/partners.js

// LOCAL RIDES (rwRidesHTML, openDriverHire) moved to js/booking/local-rides.js

// EVENT RADAR + ROI ENGINE (RW_ROI_DIMS/rwEventROI/openEvents/rwEventsRender/rwEventPlan/etc) moved to js/misc/events.js

// Moved to js/ui/site-search.js (Phase 5b) — menu search (drFilter)

// THE OPENING (RW_DREAMS/rwOpeningSeen/rwOpeningShow/rwOpeningGo/rwOpeningEnter/rwOpeningDone/rwOpeningReplay) moved to js/ui/opening.js

// Moved to js/ui/onboarding.js (Phase 5b) — first-launch walkthrough (RW_ONBOARD, rwMaybeOnboard/Show/Done, rwReplayOnboard)

// Moved to js/ui/settings-modal.js (Phase 5b) — text + icon size accessibility controls (rwApplyUIScale, rwSetTextScale/IconScale, openSizeSettings)
// el() moved to js/core/dom-utils.js (Phase 6a — load-order leaf extraction)

// Moved to js/ui/settings-modal.js (Phase 5b) — i18n language system (RW_LANGS, RW_I18N, rwLang/t/rwSetLang/rwApplyLang/rwToggleLangMenu/rwInitLang)
// Moved to js/ui/adaptive-shell.js (Phase 5b) — device detection & adaptive UI (RW_DEVICE, rwDetectDevice, rwInitDevice)
// Moved to js/ui/themes.js (Phase 5b) — theme engine (RW_UI_THEMES, rwSetTheme/rwToggleThemeMenu/rwInitTheme) + drawer theme/lang pickers (drThemePick, drLangPick, drThemeSync)

var AC = 'INR';
var AUTH_ENABLED = (typeof FIREBASE_CONFIG!=='undefined') && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey!=='PASTE_ME';
/* Pro is account-bound. With accounts ON, never trust the local flag at boot —
   the auth snapshot re-grants it for the right account. Without accounts
   (pure device mode) the local flag is all we have. */
// RWPricing (pricing engine CONFIG + tier/feature helpers) moved to js/pricing/tiers.js

// rwStatusLabel (honest Pro/tier status label) moved to js/ui/status-tier.js (Phase 5c)

// CONTINENT_BY_CC/continentForCC/continentForLatLon/continentFor (only used by the Atlas Certificate's N/7-continents stat) moved to js/itinerary/atlas-certificate.js

var isPro = AUTH_ENABLED ? false : (lsGet('rwPro')==='1');
var freeLeft = 5;
var activeProv = lsGet('rwProv')||'smart';
var spends = {};
var itinBuilt = {};
var qrBuilt = false;

var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

var CURR = [
  {c:'INR',s:'₹',r:83.5},{c:'USD',s:'$',r:1},{c:'EUR',s:'€',r:.92},
  {c:'GBP',s:'£',r:.79},{c:'JPY',s:'¥',r:149},{c:'AUD',s:'A$',r:1.53},
  {c:'CAD',s:'C$',r:1.36},{c:'SGD',s:'S$',r:1.34},{c:'AED',s:'AED',r:3.67},{c:'THB',s:'฿',r:35}
];


/* ============================================================================
   PRO PRICE LABEL (rw-v80) — Febin's currency bug
   ============================================================================
   The Pro price genuinely IS 100 rupees, charged over UPI. But showing a bare
   "₹100" to someone who has selected USD looks like the currency switch is
   broken. So: show their currency with the rupee price alongside, because the
   amount they are actually charged is in rupees and hiding that would be worse.
   ========================================================================= */
function proPriceLabel(inr){
  inr = inr || 100;
  try{
    if(typeof AC==='undefined' || AC==='INR') return '\u20b9'+inr;
    var cu=CURR.find(function(x){ return x.c===AC; });
    if(!cu || !cu.r) return '\u20b9'+inr;
    var usd = inr/83.5;                     /* INR -> USD base */
    var v = usd*cu.r;
    var shown = v<1 ? v.toFixed(2) : (v<10? v.toFixed(1) : Math.round(v));
    return cu.s+shown+' (\u20b9'+inr+')';
  }catch(e){ return '\u20b9'+inr; }
}

function fmtMoney(usd){
  var cu = CURR.find(function(x){return x.c===AC;});
  var v = Math.round(usd*(cu?cu.r:1));
  var s = cu?cu.s:'$';
  if(AC==='INR'){
    if(v>=10000000) return s+(v/10000000).toFixed(2)+'Cr';
    if(v>=100000) return s+(v/100000).toFixed(1)+'L';
    if(v>=1000) return s+(v/1000).toFixed(0)+'k';
    return s+v;
  }
  if(v>=1000) return s+(v/1000).toFixed(1)+'k';
  return s+v;
}

/* CURRENCIES UI */
(function(){
  var cg = el('currGrid');
  CURR.forEach(function(cu){
    var b = document.createElement('button');
    b.className = 'cbtn'+(cu.c==='INR'?' on':'');
    b.dataset.c = cu.c;
    b.innerHTML = `<span class="sym">${cu.s}</span><span class="code">${cu.c}</span>`;
    b.onclick = function(){
      AC = cu.c;
      document.querySelectorAll('.cbtn').forEach(function(x){ x.classList.toggle('on', x.dataset.c===cu.c); });
      updateBudget();
    };
    cg.appendChild(b);
  });
})();

var slider = el('budgetSlider');
slider.addEventListener('input', function(){ updateBudget(true); });
/* BUG FIX (reported by team, Ladakh 40k case): the slider moves in fixed USD
   steps, so at typical currency rates a single step could jump the DISPLAYED
   INR value by 4000+, making round numbers like exactly 40,000 nearly
   impossible to land on by dragging. Fix: a real "type an exact amount" field
   that's always the source of truth for precision, alongside a finer slider
   step for anyone who prefers to drag. */
function updateBudget(fromSlider){
  var v = parseInt(slider.value);
  el('budgetDisplay').innerHTML = v>=10000 ? fmtMoney(10000)+'+' : fmtMoney(v);
  slider.style.setProperty('--pct', ((v-200)/9800*100).toFixed(1)+'%');
  var cu = CURR.find(function(x){return x.c===AC;}) || {s:'\u20b9', r:1};
  var ex = el('budgetExact'), sym = el('budgetExactSym');
  if(sym) sym.textContent = cu.s;
  if(ex && document.activeElement!==ex){ ex.value = Math.round(v*cu.r); }
}
(function(){
  var ex = el('budgetExact');
  if(ex){
    ex.addEventListener('input', function(){
      var cu = CURR.find(function(x){return x.c===AC;}) || {r:1};
      var shown = parseFloat(ex.value); if(isNaN(shown) || shown<0) return;
      var usd = Math.round(shown/cu.r);
      usd = Math.max(200, Math.min(10000, usd));
      slider.value = usd;
      updateBudget(false);
    });
  }
})();
updateBudget();

el('tagsContainer').addEventListener('click', function(e){
  if(e.target.classList.contains('tag')) e.target.classList.toggle('on');
});

/* DESTINATION AUTOCOMPLETE */
var DEST_NAMES = [];
DB.forEach(function(d){ DEST_NAMES.push(d.name+', '+d.country); });
DEST_NAMES.push('Anywhere in the world','Southeast Asia','Europe','South America','Middle East','East Asia','North America','Africa','Oceania','Caucasus','Central Europe','Southern Europe','South Asia','North Africa','Western Asia');
ALL_COUNTRIES.forEach(function(c){ if(DEST_NAMES.indexOf(c)<0) DEST_NAMES.push(c); });

(function(){
  var inp = el('destInput'), dd = el('destDD'), sv = '', liveTimer = null, lastQ = '';
  var TYPE_ICON = {city:'\ud83c\udfd9\ufe0f', town:'\ud83c\udfd8\ufe0f', village:'\ud83c\udfe1', hamlet:'\ud83c\udfe1',
    country:'\ud83c\udf0f', state:'\ud83d\uddfa\ufe0f', region:'\ud83d\uddfa\ufe0f', island:'\ud83c\udfdd\ufe0f',
    peak:'\u26f0\ufe0f', mountain:'\u26f0\ufe0f', volcano:'\ud83c\udf0b', beach:'\ud83c\udfd6\ufe0f',
    attraction:'\ud83c\udfaf', monument:'\ud83c\udfdb\ufe0f', castle:'\ud83c\udff0', temple:'\u26e9\ufe0f',
    national_park:'\ud83c\udfde\ufe0f', waterfall:'\ud83d\udca7', lake:'\ud83c\udf0a', museum:'\ud83c\udfdb\ufe0f',
    viewpoint:'\ud83d\udcf8', zoo:'\ud83e\udd81', theme_park:'\ud83c\udfa1'};
  function addOpt(label, value, meta, cls){
    var opt = document.createElement('div');
    opt.className = 'cddo' + (cls?' '+cls:'');
    opt.innerHTML = label + (meta? ' <span style="color:var(--t3);font-size:10px">'+meta+'</span>' : '');
    opt.onmousedown = function(){ inp.value=value; sv=value; dd.classList.remove('open'); };
    dd.appendChild(opt);
  }
  function renderLocal(q){
    dd.innerHTML = '';
    var m = q ? DEST_NAMES.filter(function(n){ return n.toLowerCase().indexOf(q.toLowerCase())>=0; }) : DEST_NAMES;
    m.slice(0, q?4:8).forEach(function(n){ addOpt('\u26a1 '+n, n, 'crowd data ready'); });
    return m.length;
  }
  function renderLive(q, feats){
    if(q !== (inp.value||'').trim()) return; /* stale response */
    var seen = {};
    dd.querySelectorAll('.cddo').forEach(function(o){ seen[o.textContent.replace(/\u26a1 |\ud83c[\udf00-\udfff]|\s+crowd data ready/g,'').trim().toLowerCase()]=1; });
    feats.slice(0,7).forEach(function(f){
      var p = f.properties||{};
      if(!p.name) return;
      var parts = [p.name];
      if(p.city && p.city!==p.name) parts.push(p.city);
      else if(p.state && p.state!==p.name) parts.push(p.state);
      if(p.country) parts.push(p.country);
      var label = parts.join(', ');
      if(seen[label.toLowerCase()]) return; seen[label.toLowerCase()]=1;
      var icon = TYPE_ICON[p.osm_value] || TYPE_ICON[p.type] || '\ud83c\udf0d';
      var kind = (p.osm_value||p.type||'').replace(/_/g,' ');
      addOpt(icon+' '+label, label, kind);
    });
    if(dd.children.length) dd.classList.add('open'); else dd.classList.remove('open');
  }
  function showDD(q){
    q = (q||'').trim();
    var localHits = renderLocal(q);
    if(dd.children.length) dd.classList.add('open'); else if(!q) dd.classList.remove('open');
    clearTimeout(liveTimer);
    if(q.length < 2) return;
    /* live worldwide places — Photon (OpenStreetMap), free, made for autocomplete */
    liveTimer = setTimeout(function(){
      if(q===lastQ) return; lastQ=q;
      fetch('https://photon.komoot.io/api/?limit=8&q='+encodeURIComponent(q))
        .then(function(r){ return r.json(); })
        .then(function(j){ renderLive(q, j.features||[]); })
        .catch(function(){ /* offline / blocked: curated list still works */ });
    }, 280);
  }
  inp.addEventListener('input', function(){ sv=''; lastQ=''; showDD(inp.value); });
  inp.addEventListener('focus', function(){ lastQ=''; showDD(inp.value); });
  inp.addEventListener('blur', function(){ setTimeout(function(){ dd.classList.remove('open'); },150); });
  window.getDestVal = function(){ return sv || inp.value || 'Anywhere'; };
})();

// refreshProUI (Pro button/free-bar/promo-bar paint) moved to js/ui/status-tier.js (Phase 5c)

(function(){
  var today = new Date().toDateString();
  if(lsGet('rwFDay')!==today){ freeLeft=5; lsSet('rwFLeft','5'); lsSet('rwFDay',today); }
  else freeLeft = parseInt(lsGet('rwFLeft')||'5');
  refreshProUI();
})();

/* Provisional-Pro is account-bound now (see auth snapshot). At boot, if a
   provisional token exists but has expired, clear it. */
(function(){ try{
  var t=parseInt(lsGet('rw_pro_temp')||'0',10);
  if(t && Date.now()>t){ lsSet('rw_pro_temp',''); lsSet('rw_pro_temp_uid',''); }
}catch(e){} })();
// Moved to js/ui/site-search.js (Phase 5b) — site search (ssIndex/ssOpen/ssClose/ssRun/_ssGo)
// Moved to js/ui/card-painter.js (Phase 5b) — adaptive "for you" rendering (useBump, FORYOU_DEFS, renderForYou) + shared card photo painter (RW_PHOTOS, rwLoadPhotoMap, rwPaintPhotos)
/* ===== TRAVEL ECONOMY LIVE TICKER ===== */
function renderTicker(){
  var host=el('brief'); if(!host) return;
  var t=document.createElement('div');
  t.style.cssText='text-align:center;font-size:11px;color:var(--t2);margin:6px 0 2px';
  t.innerHTML='\ud83c\udf0d Global travel economy this year: <b id="ecoTick" style="color:#16BF96;font-variant-numeric:tabular-nums">$0</b> <span style="color:var(--t3)">and counting (WTTC-basis)</span>';
  host.insertBefore(t, host.firstChild);
  var Y=new Date(new Date().getFullYear(),0,1).getTime(), RATE=11.5e12/31536000; /* ~$11.5T/yr */
  setInterval(function(){ var v=(Date.now()-Y)/1000*RATE;
    el('ecoTick').textContent = v>=1e12? '$'+(v/1e12).toFixed(3)+' Trillion' : '$'+(v/1e9).toFixed(1)+' Billion';
  }, 1000);
}

/* ===== PROFILE + LIFETIME LIST ===== */
var STYLE_POOL={
 adventure:[['Patagonia, Chile-Argentina','the planet\u2019s wildest trekking finale'],['Ladakh, India','high-altitude freedom on two wheels'],['Iceland ring road','fire, ice and zero guardrails'],['Nepal (EBC)','the pilgrimage every adventurer owes themselves'],['New Zealand South Island','adrenaline\u2019s home address'],['Kyrgyzstan','the last untamed horse country']],
 culture:[['Kyoto, Japan','a thousand years, perfectly kept'],['Varanasi, India','the oldest living city on Earth'],['Rome, Italy','walk inside a history book'],['Istanbul, Turkey','two continents, one table'],['Cairo, Egypt','stand where 4,500 years stare back'],['Uzbekistan (Samarkand)','the Silk Road\u2019s blue-tiled heart']],
 chill:[['Bali, Indonesia','slow mornings perfected'],['Kerala backwaters','float through green silence'],['Santorini, Greece','sunsets as a lifestyle'],['Maldives','the pause button of the planet'],['Amalfi Coast','lemon-scented la dolce vita'],['Goa in monsoon','India\u2019s softest secret season']],
 party:[['Tokyo, Japan','neon nights that never repeat'],['Berlin, Germany','the world\u2019s dance-floor capital'],['Rio de Janeiro','carnival is a warm-up here'],['Bangkok, Thailand','the night owns this city'],['Ibiza, Spain','the pilgrimage of sound'],['Goa NYE','India\u2019s beach party crown']]};
function openProfile(){
  useBump('profile');
  var ov=el('profOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='profOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:440px;max-height:88vh;overflow:auto"><button class="modal-close" onclick="el(\'profOverlay\').classList.remove(\'open\')">\u00d7</button><div class="modal-head"><div class="modal-title">\ud83d\udc64 My Traveler Profile</div><div class="modal-sub">Tell RoamWise who\u2019s traveling</div></div><div class="modal-body" id="profBody"></div></div>';
    document.body.appendChild(ov); }
  var P2={}; try{P2=JSON.parse(lsGet('rw_profile')||'{}');}catch(e){}
  var avs=['adventurer','ninja','fox','owl','bear','robot'].map(function(s,i){
    var u2='https://api.dicebear.com/9.x/'+(i<2?'adventurer':'bottts')+'/svg?seed='+s;
    return '<img src="'+u2+'" data-u="'+u2+'" onclick="profAv(this)" style="width:52px;height:52px;border-radius:50%;cursor:pointer;border:2px solid '+((P2.av===u2)?'var(--gold)':'var(--b2)')+'">';
  }).join('');
  var xpNow=xpGet(), rNow=rankOf(xpNow), nxR=nextRank(xpNow);
  var pctR=nxR? Math.min(100,Math.round((xpNow-rNow[0])/(nxR[0]-rNow[0])*100)) : 100;
  var unlockedCount=perksUnlocked().length;
  var trialUntilNow=parseInt(lsGet('rw_trial_until')||'0',10);
  var trialBadge = (trialUntilNow && trialUntilNow>Date.now())?
    '<div style="background:linear-gradient(135deg,#16BF9622,#16BF9611);border:1px solid #16BF9655;border-radius:12px;padding:9px 12px;margin-bottom:10px;font-size:12px;color:#16BF96">\u23f3 Founding traveler trial \u2014 '+Math.ceil((trialUntilNow-Date.now())/864e5)+' day(s) of Pro left</div>' : '';
  var rankHead=
   trialBadge+
   '<div style="background:linear-gradient(135deg,rgba(232,186,108,.12),rgba(196,48,43,.08));border:1px solid rgba(232,186,108,.3);border-radius:16px;padding:14px 16px;margin-bottom:14px">'
   +'<div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-size:17px;font-weight:800;color:var(--gold2)">\ud83e\udd77 '+rNow[1]+'</div><div style="font-size:11.5px;color:var(--t3)">'+xpNow+' XP</div></div>'
   +'<div class="xp-bar" style="margin-top:8px"><div class="xp-fill" style="width:'+pctR+'%"></div></div>'
   +'<div style="font-size:10.5px;color:var(--t3);margin-top:5px">'+(nxR? (nxR[0]-xpNow)+' XP to '+nxR[1] : 'Maximum rank reached')+' \u00b7 '+unlockedCount+'/'+PERKS.length+' perks unlocked</div></div>'
   +'<div style="font-size:12.5px;font-weight:700;color:var(--t1);margin:0 0 8px">\ud83c\udfc6 Your Perks \u2014 earned by doing, not just tapping</div>'
   +'<div style="margin-bottom:16px">'+renderPerks()+'</div>';
  el('profBody').innerHTML=
   rankHead
   +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><img id="profPic" src="'+(P2.av||'https://api.dicebear.com/9.x/adventurer/svg?seed=ninja')+'" style="width:64px;height:64px;border-radius:50%;border:2px solid var(--gold2)"><div style="flex:1"><div style="font-size:11px;color:var(--t2);margin-bottom:5px">Pick an avatar or upload</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+avs+'</div><input type="file" accept="image/*" id="profUp" style="font-size:10px;margin-top:6px" onchange="profUpload(this)"></div></div>'
   +'<div class="dna-q"><div class="qt">Name</div><input class="txn-inp" id="pfName" style="width:100%" value="'+(P2.name||lsGet('rw_name')||'')+'"></div>'
   +'<div style="display:flex;gap:8px"><div class="dna-q" style="flex:1"><div class="qt">Work</div><input class="txn-inp" id="pfWork" style="width:100%" value="'+(P2.work||'')+'"></div>'
   +'<div class="dna-q" style="flex:1"><div class="qt">Location</div><input class="txn-inp" id="pfLoc" style="width:100%" value="'+(P2.loc||'')+'"></div></div>'
   +'<div style="display:flex;gap:8px"><div class="dna-q" style="flex:1"><div class="qt">Age (optional, stays on device)</div><input class="txn-inp" id="pfAge" type="number" style="width:100%" value="'+(P2.age||'')+'"></div>'
   +'<div class="dna-q" style="flex:1"><div class="qt">WhatsApp (optional)</div><input class="txn-inp" id="pfWa" style="width:100%" placeholder="+91\u2026" value="'+(P2.wa||'')+'"></div></div>'
   +'<div class="dna-q"><div class="qt">Travel style</div><div class="dna-opts">'+['adventure','culture','chill','party'].map(function(s){return '<button class="dna-opt'+(P2.style===s?' on':'')+'" onclick="profPick(this,\'style\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Dream terrain</div><div class="dna-opts">'+['mountains','beaches','cities','deserts'].map(function(s){return '<button class="dna-opt'+(P2.terr===s?' on':'')+'" onclick="profPick(this,\'terr\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Trip length you love</div><div class="dna-opts">'+['weekend','1 week','2+ weeks'].map(function(s){return '<button class="dna-opt'+(P2.len===s?' on':'')+'" onclick="profPick(this,\'len\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Favourite destinations so far</div><input class="txn-inp" id="pfFav" style="width:100%" value="'+(P2.fav||'')+'"></div>'
   +'<div class="dna-q"><div class="qt">Hobbies</div><input class="txn-inp" id="pfHob" style="width:100%" value="'+(P2.hob||'')+'"></div>'
   +'<div class="dna-q"><div class="qt">Bio</div><input class="txn-inp" id="pfBio" style="width:100%" maxlength="120" value="'+(P2.bio||'')+'"></div>'
   +'<label style="display:flex;gap:8px;font-size:11.5px;color:var(--t2);margin:4px 0 12px"><input type="checkbox" id="pfNews" '+(P2.news?'checked':'')+'> Send me weekly travel drops (email)</label>'
   +'<button class="rzp-main-btn" onclick="profSave()">\u2728 Save & reveal my Lifetime List</button>'
   +'<div id="pfOut" style="margin-top:12px"></div>';
  window._prof=P2;
  ov.classList.add('open');
}
function profAv(img){ window._prof.av=img.dataset.u; el('profPic').src=img.dataset.u;
  img.parentNode.querySelectorAll('img').forEach(function(x){x.style.borderColor='var(--b2)';}); img.style.borderColor='var(--gold)'; }
function profUpload(inp){ var f=inp.files[0]; if(!f) return;
  var fr=new FileReader(); fr.onload=function(){ if(fr.result.length>400000) return showToast('Pick a smaller image');
    window._prof.av=fr.result; el('profPic').src=fr.result; }; fr.readAsDataURL(f); }
function profPick(b,k,v){ window._prof[k]=v; b.parentNode.querySelectorAll('.dna-opt').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); }
function profSave(){
  var P2=window._prof;
  ['Name','Work','Loc','Age','Wa','Fav','Hob','Bio'].forEach(function(k){ P2[k.toLowerCase()]=el('pf'+k).value.trim(); });
  P2.news=el('pfNews').checked;
  lsSet('rw_profile', JSON.stringify(P2)); lsSet('rw_name', P2.name||lsGet('rw_name')||'');
  if(AUTH_READY && user){ db.collection('users').doc(user.uid).set({name:P2.name||'',whatsapp:P2.wa||'',newsletter:!!P2.news,style:P2.style||'',location:P2.loc||''},{merge:true}); }
  var style=P2.style||'adventure', pool=STYLE_POOL[style]||STYLE_POOL.adventure;
  var extra = P2.terr==='beaches'? STYLE_POOL.chill[3] : P2.terr==='deserts'? ['Jaisalmer + Wadi Rum','gold dunes twice over'] : P2.terr==='cities'? STYLE_POOL.party[0] : STYLE_POOL.adventure[1];
  var list=pool.slice(0,5).concat([extra]);
  el('pfOut').innerHTML='<div class="mode-box" style="border-color:rgba(232,186,108,.5)"><b>\ud83c\udf1f '+(P2.name||'Traveler')+'\u2019s Lifetime List \u2014 the '+style+' soul edition</b><br><span style="font-size:10.5px;color:var(--t3)">Based on your style, terrain and trip length. Plan any of them in one tap.</span></div>'
   + list.map(function(x){ return '<div class="ti-day" style="align-items:center"><b>\u272a</b><span style="flex:1"><b style="color:var(--t1)">'+x[0]+'</b><br><span style="font-size:10.5px;color:var(--t2)">'+x[1]+'</span></span><button class="tact" onclick="el(\'profOverlay\').classList.remove(\'open\');el(\'destInput\').value=\''+x[0].split(',')[0].replace(/'/g,'')+'\';tabGo(\'plan\')">Plan</button></div>'; }).join('');
  showToast('Profile saved \u2014 your Lifetime List is ready \u2b50'); xpAdd(15,'Identity forged');
}

// PROMO FILM + MUSIC PANEL (renderPromo/rwOpenSite/openExternally/filmPlayerHTML/filmAttachDiagnostics/playPromo/openMusic/musRender) moved to js/misc/promo-music.js

/* ===== ADSENSE (gated) + WHATSAPP (gated) ===== */
var ADSENSE_ID='ca-pub-4943859484482348'; /* live */
var ADSENSE_SLOT=''; /* set in admin Config once you create an ad unit */
// AFF_BOOKING and stayUrl moved to js/booking/affiliate-links.js
var WA_NUMBER='', WA_CHANNEL='', WA_GROUP='';
(function(){
  /* AdSense loads on the WEBSITE ONLY — never inside the app WebView.
     AdSense-for-Content is websites-only by policy (AdMob is the in-app
     product); serving it inside a wrapper app risks the entire AdSense
     account, which also carries the website's revenue. Detection: the
     native app injects the window.RW bridge before the page loads, and
     Play builds set PLAY_MODE=true — either signal disables ads. Deferred
     to DOMContentLoaded because PLAY_MODE is declared later in this file
     (var hoisting would make an immediate check read undefined). */
  function loadAds(){
    var inApp = !!window.RW || (typeof PLAY_MODE!=='undefined' && PLAY_MODE);
    if(ADSENSE_ID && !inApp){
      var s=document.createElement('script'); s.async=true;
      s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+ADSENSE_ID;
      s.crossOrigin='anonymous'; document.head.appendChild(s);
      /* A display unit needs BOTH data-ad-client and data-ad-slot. Without a
         slot id the <ins> can never fill, which looks identical to "not
         approved yet" and wastes days of debugging. Set ADSENSE_SLOT in the
         admin Config tab once the ad unit exists in your AdSense account. */
      var slot = (typeof ADSENSE_SLOT!=='undefined' && ADSENSE_SLOT) ? ADSENSE_SLOT : '';
      document.querySelectorAll('.rw-ad').forEach(function(a){
        if(slot) a.setAttribute('data-ad-slot', slot);
        if(!a.getAttribute('data-ad-slot')){ return; }  /* skip: would never fill */
        a.style.display='block';
        try{ (adsbygoogle=window.adsbygoogle||[]).push({}); }catch(e){}
      });
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', loadAds); else loadAds();
  ensureWaButton();
})();
/* Global + idempotent so remote config can create it after the fact. */
function ensureWaButton(){
  try{ rwRefCapture(); rwRefStickUrl(); }catch(e){}
  try{ setTimeout(rwBasketBadge, 600); }catch(e){}
  try{ setTimeout(rwConfigSyncAll, 1200); }catch(e){}
  if(!WA_NUMBER || document.getElementById('waFab')) return;
  var w=document.createElement('a');
  w.id='waFab';
  w.href='https://wa.me/'+WA_NUMBER.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent('Hi RoamWise!');
  w.target='_blank';
  w.style.cssText='position:fixed;right:14px;bottom:86px;z-index:200;width:48px;height:48px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 6px 20px rgba(0,0,0,.4);text-decoration:none';
  w.textContent='\ud83d\udcac';
  document.body.appendChild(w);
}

/* ===== RATINGS & TESTIMONIALS ===== */
var PLAYSTORE_URL=''; /* paste your Play Store listing URL once published — unlocks the "Rate on Play Store" nudge */
function renderRatings(){
  var wall=el('ratingsWall'), sum=el('ratingsSummary'); if(!wall||!sum) return;
  db.collection('ratings').orderBy('created','desc').limit(60).get().then(function(qs){
    var rows=qs.docs.map(function(d){ return d.data(); }).filter(function(r){ return r.stars>0; });
    if(!rows.length){
      sum.innerHTML='<div style="font-size:13px;color:var(--t3)">Be the first to rate RoamWise \u2b50</div>';
      wall.innerHTML=''; return;
    }
    var avg=(rows.reduce(function(t,r){return t+r.stars;},0)/rows.length);
    var stars=''; for(var i=1;i<=5;i++) stars+= i<=Math.round(avg)? '\u2b50':'\u2606';
    sum.innerHTML='<div style="font-size:34px;font-weight:800;color:var(--gold2)">'+avg.toFixed(1)+'</div>'
      +'<div style="font-size:19px;letter-spacing:2px">'+stars+'</div>'
      +'<div style="font-size:11.5px;color:var(--t3);margin-top:2px">from '+rows.length+' traveler'+(rows.length===1?'':'s')
      +(PLAYSTORE_URL? ' &middot; <a href="'+PLAYSTORE_URL+'" target="_blank" rel="noopener" style="color:var(--gold2)">rate us on Play Store \u2192</a>':'')+'</div>';
    wall.innerHTML = rows.filter(function(r){ return r.text; }).slice(0,12).map(function(r){
      var st=''; for(var i=1;i<=5;i++) st+= i<=r.stars? '\u2b50':'\u2606';
      return '<div class="exp"><div style="font-size:14px;letter-spacing:1px">'+st+'</div>'
        +'<div class="exp-desc" style="margin-top:6px">\u201c'+String(r.text).slice(0,180).replace(/[<>]/g,'')+'\u201d</div>'
        +'<div style="font-size:11px;color:var(--t3);margin-top:8px">\u2014 '+String(r.name||'A traveler').replace(/[<>]/g,'')+'</div></div>';
    }).join('');
  }).catch(function(){ sum.innerHTML='<div class="mode-box">Ratings need the Firestore rules published \u2014 see admin console.</div>'; });
}
function openRateForm(){
  if(!AUTH_READY || !user){ showToast('Sign in first \u2014 one honest rating per traveler'); return; }
  var ov=el('rateOv');
  if(!ov){ ov=document.createElement('div'); ov.id='rateOv'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:400px"><button class="modal-close" onclick="el(\'rateOv\').classList.remove(\'open\')">\u00d7</button>'
     +'<div class="modal-head"><div class="modal-title">\u2b50 Rate RoamWise</div><div class="modal-sub">Your honest take helps other travelers find us</div></div>'
     +'<div class="modal-body">'
     +'<div id="starPicker" style="font-size:34px;text-align:center;letter-spacing:6px;margin-bottom:14px;cursor:pointer"></div>'
     +'<textarea id="rateText" maxlength="180" placeholder="What made your trip planning easier? (optional)" style="width:100%;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:10px;color:var(--t1);font-family:Outfit;font-size:13px;min-height:70px"></textarea>'
     +'<button class="rzp-main-btn" style="margin-top:10px" onclick="submitRating()">Submit rating</button>'
     +(PLAYSTORE_URL? '<div style="font-size:10.5px;color:var(--t3);text-align:center;margin-top:8px">Loved it? A Play Store review helps even more \u2192 <a href="'+PLAYSTORE_URL+'" target="_blank" rel="noopener" style="color:var(--gold2)">rate there too</a></div>':'')
     +'</div></div>';
    document.body.appendChild(ov); }
  window._rateStars=5;
  paintStars();
  ov.classList.add('open');
}
function paintStars(){
  var s=window._rateStars||5, html='';
  for(var i=1;i<=5;i++) html+='<span onclick="window._rateStars='+i+';paintStars()" style="color:'+(i<=s?'var(--gold2)':'var(--t3)')+'">\u2605</span>';
  el('starPicker').innerHTML=html;
}
function submitRating(){
  var stars=window._rateStars||5, text=(el('rateText').value||'').trim().slice(0,180);
  var name=(function(){ try{ return (JSON.parse(lsGet('rw_profile')||'{}').name)||lsGet('rw_name')||'A traveler'; }catch(e){ return 'A traveler'; } })();
  db.collection('ratings').doc(user.uid).set({
    stars:stars, text:text, name:name, created:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    el('rateOv').classList.remove('open');
    showToast('\u2b50 Thank you for rating RoamWise!'); xpAdd(10,'Rated the app');
    renderRatings();
  }).catch(function(){ showToast('Could not submit \u2014 check Firestore rules'); });
}

/* ===== SYNC CIRCLE — anonymous "I'm going" intent counts (no PII) ===== */
function syncGo(name){
  if(!AUTH_READY || !user){ showToast('Sign in first \u2014 Sync Circle is for real accounts'); return; }
  var m=(el('month')||{}).value||'soon';
  var key=(name+'_'+m).toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,60);
  var inc={}; inc[key]=firebase.firestore.FieldValue.increment(1);
  var ref=db.collection('pulse').doc('intents');
  ref.set(inc,{merge:true}).then(function(){ return ref.get(); }).then(function(d2){
    var n=(d2.exists && d2.data()[key])||1;
    showToast('\ud83e\udd1d You + '+(n-1)+' traveler'+(n===2?'':'s')+' planning '+name+' in '+m+' \u2014 open Trip Squads to find them');
    xpAdd(5,'Joined a Sync Circle');
    openSquads(name, m);
  }).catch(function(){ showToast('Sync Circle needs the pulse rules published'); });
}

// Trip Squads moved to js/social/tribe-beacon.js

// 60-SECOND AI KEY WIZARD + MODEL COMPARISON ARENA (WIZ/keyProvider/openProvider/openWizard/wizPaint/wizNext/wizTest/wizSave/wizSmartPaste/compareModels) moved to js/ui/key-wizard.js

// PREMIUM PDF ITINERARY EXPORT (openPdfFlow/genPdf and friends) moved to js/itinerary/pdf-export.js

// EVENT RADAR + TRAVEL PULSE NEWS (EVENTS/activeEvents/renderEventBanner/eventPlan/renderEvents/renderSpotlight/renderNewsPulse/rwNewsPulseFallback) moved to js/misc/event-radar-news.js

// Main page-render DOMContentLoaded handler (device/lang/theme init, home page wiring) moved to js/boot/init.js


/* ===== FUNNEL TRACKER — anonymous daily counters for the owner dashboard ===== */
function track(ev){
  if(!AUTH_READY) return;
  try{
    var day = new Date().toISOString().slice(0,10);
    var inc = {}; inc[ev] = firebase.firestore.FieldValue.increment(1);
    /* .set() rejects ASYNCHRONOUSLY — the surrounding try/catch never sees it,
       so a blocked write used to fail completely silently and the admin funnel
       just stayed empty with no clue why. Record the last failure so it can be
       surfaced instead of guessed at. */
    db.collection('stats').doc(day).set(inc, {merge:true})
      .catch(function(e){ try{ lsSet('rw_track_err', (e.code||'')+' '+(e.message||e)); }catch(_){} });
  }catch(e){}
}
/* Per-response thumbs up/down on Ailon Tusk bot bubbles (see cpFinish). No
   per-message record and no user identity — just bumps the same anonymous
   daily counter track() already writes, under two new event names. Also
   visually locks the row so a bubble can't be voted twice. */
function rwTuskFeedback(btn, helpful){
  try{
    var row = btn && btn.closest ? btn.closest('.tk-fb') : (btn && btn.parentNode);
    if(row){
      if(row.dataset && row.dataset.voted) return; /* already voted, ignore repeat taps */
      if(row.dataset) row.dataset.voted='1';
      [].forEach.call(row.querySelectorAll('button'), function(b){
        b.disabled = true; b.style.cursor='default'; b.style.opacity = (b===btn)? '1':'.3';
      });
      if(btn && btn.style) btn.style.transform='scale(1.3)';
    }
    track(helpful? 'tusk_helpful' : 'tusk_unhelpful');
  }catch(e){}
}
/* Closes the loop the daily tusk-daily.yml Action was built for but never
   received data for: log the place name whenever Ailon Tusk's curated engine
   recognises a destination-shaped query but has nothing for it. Anonymous —
   place name only, keyed by a slug, so repeats just increment a counter
   instead of piling up per-user records. An admin can export this collection
   into data/misses.txt to feed the existing OpenStreetMap resolver. */
function rwTuskMiss(place){
  if(!AUTH_READY || !place) return;
  try{
    var slug = String(place).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
    if(!slug) return;
    db.collection('tuskMisses').doc(slug).set({
      place: String(place).slice(0,80),
      count: firebase.firestore.FieldValue.increment(1),
      lastAsked: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true}).catch(function(){});
  }catch(e){}
}
(function(){ try{
  if(!sessionStorage.getItem('rw_v')){ sessionStorage.setItem('rw_v','1'); setTimeout(function(){ track('visits'); }, 1500); }
}catch(e){} })();

/* ===== CONVERSION NUDGE — one-time, after the user has felt the value ===== */
function maybeNudge(){
  try{
    if(isPro || PLAY_MODE || lsGet('rw_nudged')) return;
    var n = parseInt(lsGet('rw_searches')||'0',10)+1; lsSet('rw_searches', String(n));
    if(n === 2){
      lsSet('rw_nudged','1');
      setTimeout(function(){
        var d=document.createElement('div');
        d.id='nudgeSheet';
        d.style.cssText='position:fixed;left:12px;right:12px;bottom:76px;z-index:900;background:linear-gradient(135deg,#171227,#1B0F14);border:1px solid rgba(232,186,108,.45);border-radius:18px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.6);animation:fadeup .4s ease';
        d.innerHTML='<div style="font-size:14px;font-weight:700;margin-bottom:4px">\ud83e\udd77 You just planned like a shinobi.</div>'
          +'<div style="font-size:12px;color:#B8B4A8;line-height:1.6;margin-bottom:11px">Lock <b style="color:#E8BA6C">lifetime Pro at the \u20b9100 launch price</b> \u2014 unlimited searches, full itineraries, every hack. One payment, forever.</div>'
          +'<div style="display:flex;gap:8px"><button onclick="track(\'nudge_yes\');document.getElementById(\'nudgeSheet\').remove();openPay()" style="flex:2;padding:12px;border-radius:11px;border:none;background:linear-gradient(135deg,#E8BA6C,#C8913E);color:#0A0A12;font-weight:800;font-family:Outfit;font-size:13px;cursor:pointer">Unlock \u20b9100</button>'
          +'<button onclick="document.getElementById(\'nudgeSheet\').remove()" style="flex:1;padding:12px;border-radius:11px;border:1px solid #2A2A34;background:transparent;color:#8A8880;font-family:Outfit;font-size:12px;cursor:pointer">Later</button></div>';
        document.body.appendChild(d);
        track('nudge_shown');
      }, 2500);
    }
  }catch(e){}
}

/* ===== TRAVEL PULSE — anonymous aggregate demand (no identities, no contact) ===== */
function pulseKey(name,month){ return (name+'_'+month).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80); }
function pulseBump(name,month){
  if(!AUTH_READY || !user) return;
  try{ db.collection('pulse').doc(pulseKey(name,month)).set({
    n:String(name).slice(0,60), m:month, count: firebase.firestore.FieldValue.increment(1),
    at: firebase.firestore.FieldValue.serverTimestamp()},{merge:true}); }catch(e){}
}
function pulseShow(name,month,elId){
  if(!AUTH_READY) return;
  try{ db.collection('pulse').doc(pulseKey(name,month)).get().then(function(d){
    if(!d.exists) return;
    var c=d.data().count||0; if(c<2) return;
    var t=el(elId); if(t){ t.style.display=''; t.innerHTML='\ud83d\udd25 <b>'+c+' travelers</b> planned '+name+' for '+month+' recently \u2014 you\u2019re in good company'; }
  }); }catch(e){}
}
/* ===== TRAILER ===== */
function killIntro(){ var i=el('intro'); if(i){ i.classList.add('bye'); setTimeout(function(){ i.remove(); },700);} }
(function(){ try{
  if(sessionStorage.getItem('rw_intro')){ var i=el('intro'); if(i) i.remove(); return; }
  sessionStorage.setItem('rw_intro','1'); setTimeout(killIntro, 2600);
}catch(e){ killIntro(); } })();

// Perks, Shinobi XP ranks, and Badges & Achievements moved to js/game/badges.js

/* ==================== JOURNEY CERTIFICATE ====================
   A premium, shareable "Atlas Edition" certificate generated from the user's
   trip: route on a world map, journey stats, stops timeline, cultural notes,
   badges. Renders as an on-page artifact you can screenshot/share; also
   exportable. All offline once the map tiles cache. */
// GREEN / ECO TRAVEL (RW_GREEN_CATS) moved to js/misc/eco-safety.js

// POST-TRIP MEMORIES STUDIO (openMemories/rwMemTab/rwGenBlog/rwBlogCopy/rwBlogCrosspost/rwCollagePreview/rwDrawCollage/rwRoundRect/rwCollageSave/rwCollageShare/rwSaveMemory) moved to js/itinerary/memories-studio.js

// EMOTIONAL JOURNEY LOG moved to js/itinerary/journey-log.js
// FUNCTIONAL GREEN NUDGE (rwGreenNudge/rwGreenPickInline) moved to js/misc/eco-safety.js

// Tribe Travel moved to js/social/tribe-beacon.js
// Money Layer moved to js/social/coordkit.js
// FITNESS-FIRST STAYS (openFitnessStays/rwFitnessFind/rwFitnessRender) moved to js/misc/misc-features.js

// NEAR ME (openNearMe/rwNearMeLocate/rwNearMeSearch/rwNearMeRender) moved to js/misc/misc-features.js


// Green Travel UI (openGreenTravel/rwGreenPick) moved to js/misc/eco-safety.js

// openJourneyCert + certShare moved to js/itinerary/journey-certificate.js
// rwShareSheet/rwCloseShare/rwShareTrip/rwShareGo moved to js/itinerary/share.js
// certDownload moved to js/itinerary/journey-certificate.js

// rankOf/nextRank/xpAdd/xpPaint + daily streak XP bonus moved to js/game/badges.js


// SHARE / VIRALITY (doShare, shareApp, shareTrek) moved to js/itinerary/share.js
// HUB & SPOKE INDIA (HS/renderHS) moved to js/misc/misc-features.js

// BASECAMP (BC/renderBC/PACK/packTog) moved to js/misc/misc-features.js

// STRAVA profile link (stravaConnect) + requestFeature moved to js/misc/misc-features.js

// LEGENDARY CIRCUITS (CIRCUITS/renderCircs) moved to js/misc/misc-features.js

// EV VAULT (EVS/renderEvs) moved to js/misc/misc-features.js


/* ===== TRAVELER DNA ===== */
var DNA_QS=[
 ['Your age band',['<20','20\u201330','30\u201345','45+']],
 ['Your travel vibe',['Adventure','Culture','Chill','Party']],
 ['Money style',['Shoestring','Smart value','Comfort','Luxury']],
 ['Pace',['Slow \u2014 few places, deep','Balanced','Fast \u2014 see it all']],
 ['Big goal',['All 7 continents','Himalayan mastery','Food pilgrimage','Digital-nomad life']]
];
function openDna(){
  var b=el('dnaBody'), dna=JSON.parse(lsGet('rw_dna')||'[]');
  b.innerHTML = DNA_QS.map(function(q,qi){
    return '<div class="dna-q"><div class="qt">'+(qi+1)+'. '+q[0]+'</div><div class="dna-opts">'
      +q[1].map(function(o,oi){return '<button class="dna-opt'+(dna[qi]===oi?' on':'')+'" onclick="dnaPick(this,'+qi+','+oi+')">'+o+'</button>';}).join('')+'</div></div>';
  }).join('') + '<button class="rzp-main-btn" onclick="dnaSave()">Save my DNA (+30 XP)</button>';
  el('dnaOverlay').classList.add('open');
}
function dnaPick(btn,qi,oi){
  var dna=JSON.parse(lsGet('rw_dna')||'[]'); dna[qi]=oi; lsSet('rw_dna',JSON.stringify(dna));
  btn.parentNode.querySelectorAll('.dna-opt').forEach(function(b){b.classList.remove('on');}); btn.classList.add('on');
}
function dnaSave(){
  var dna=JSON.parse(lsGet('rw_dna')||'[]');
  if(dna.filter(function(x){return x!==undefined&&x!==null;}).length<5) return showToast('Answer all 5 \u2014 20 seconds!');
  el('dnaOverlay').classList.remove('open');
  if(!lsGet('rw_dna_xp')){ lsSet('rw_dna_xp','1'); xpAdd(30,'DNA decoded'); }
  applyDna(); showToast('App tuned to your DNA \ud83e\uddec');
}
function applyDna(){
  var dna=JSON.parse(lsGet('rw_dna')||'null'); if(!dna) return;
  var st=el('style'), tm=el('tmode');
  if(st){ if(dna[1]===0) st.value='Adventure seeker'; if(dna[1]===1) st.value='Culture explorer'; if(dna[2]===3) st.value='Luxury traveler'; }
  if(tm){ if(dna[2]===0) tm.value='walk'; if(dna[2]===3) tm.value='lux'; if(dna[4]===1) tm.value='hybrid'; }
}
try{ applyDna(); }catch(e){}

// JOURNEY LOG + DIGITAL CARD moved to js/itinerary/journey-log.js — except the
// initial logPaint() call below, kept here because it must run after el() (defined
// earlier in this file) and journey-log.js loads before app.js.
logPaint();

// PARTNER CODE REDEMPTION (openPartnerRedeem) moved to js/payments/partner-redeem.js

/* ---- Crowd Spotter (Travel & Earn) ---- */
function openCrowdSpot(place,lat,lon){
  var labels=['&#127881; Empty','&#129300; Quiet','&#128513; Moderate','&#128548; Busy','&#128561; Very crowded'];
  rwForm('&#128205; Report crowd now',[
    {key:'level',label:'How crowded is it right now?',widget:'buttons',options:labels.map(function(l,i){return {value:String(i+1),label:l};})},
    {key:'note',label:'Anything unusual? (optional)',placeholder:'festival, roadblock, weather event\u2026'}
  ],function(v){
    var level=parseInt(v.level||'3',10);
    if(!level||level<1||level>5){showToast('Pick a crowd level');return;}
    var rec={level:level,place:String(place||'').slice(0,80),lat:lat||null,lon:lon||null,at:Date.now(),note:String(v.note||'').slice(0,120)};
    if(window.user) rec.uid=window.user.uid;
    if(window.db){
      db.collection('crowdReports').doc(String(place||'spot').replace(/[^a-z0-9]/gi,'_').slice(0,40)+'_'+Date.now()).set(rec)
        .then(function(){ xpAdd(5,'Crowd Spotter report'); showToast('Report logged \u2014 +5 XP! Thank you from everyone planning this trip.'); })
        .catch(function(){ showToast('Saved locally \u2014 will sync when connection is back'); });
    } else { xpAdd(5,'Crowd Spotter report (offline)'); showToast('+5 XP! Report will sync when connected.'); }
  },'Your report helps other travellers and earns you Shinobi XP.');
}

function offerOpen(label){
  var ov=el('openPromptOv');
  if(!ov){ ov=document.createElement('div'); ov.id='openPromptOv'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:340px;text-align:center"><div class="modal-body" id="openPromptBody"></div></div>';
    document.body.appendChild(ov); }
  el('openPromptBody').innerHTML=
     '<div style="font-size:34px;margin-bottom:8px">\ud83d\udcd5</div>'
    +'<div style="font-weight:700;font-size:15.5px;color:var(--t1);margin-bottom:4px">'+label+' saved</div>'
    +'<div style="font-size:12.5px;color:var(--t3);margin-bottom:16px">to Downloads/RoamWise</div>'
    +'<div style="display:flex;gap:8px">'
    +'<button class="tact" style="flex:1" onclick="el(\'openPromptOv\').classList.remove(\'open\')">Later</button>'
    +'<button class="rzp-main-btn" style="flex:1;margin:0" onclick="_doOpenNow()">\ud83d\udc41 Open now</button>'
    +'</div>';
  ov.classList.add('open');
}
function _doOpenNow(){
  el('openPromptOv').classList.remove('open');
  try{ if(window.RW && RW.openLastSaved) RW.openLastSaved(); else showToast('Check Downloads/RoamWise to open it'); }
  catch(e){ showToast('Check Downloads/RoamWise to open it'); }
}
function saveOrDownload(dataUrl, filename){
  if(window.RW && RW.saveCard){ RW.saveCard(dataUrl); showToast('Saving to Downloads/RoamWise\u2026'); return; }
  var a=document.createElement('a'); a.href=dataUrl; a.download=filename; a.click();
}
// ATLAS CERTIFICATE moved to js/itinerary/atlas-certificate.js; JOURNEY MOVIE moved to js/itinerary/journey-movie.js

// CHEAP/LUXE hack pools moved to js/itinerary/ninja-hacks.js

// DAILY BRIEFING (dayBriefing/briefPlan) moved to js/misc/misc-features-2.js

// House ad slots (ADS/adCard) moved to js/misc/misc-features-2.js

// TREK VAULT + FRESH EXPERIENCES (shared WISH list) moved to js/misc/misc-features-2.js

// TRAVEL MODES (MODES/EV_BENCH/modeBox) moved to js/misc/misc-features-2.js

// COMMUTE & TRACK moved to js/misc/misc-features-2.js

// FESTIVALS / EVENTS (FESTS/festLine) moved to js/misc/misc-features-2.js


// POLLUTION + HAPPINESS METERS (METERS/metersBlock) moved to js/itinerary/meters.js

// #tmode change-listener DOMContentLoaded handler moved to js/boot/init.js

var VIEW_OF={promofilm:'film',creator:'film',store:'store',ratings:'extras',treks:'explore',exps:'explore',circuits:'explore',ev:'explore',events:'explore',hubspoke:'explore',basecamp:'explore',jlog:'explore',app:'plan',brief:'home',aipulse:'explore',newspulse:'explore'};
function scrollToId(id){
  if(document.body.classList.contains('shell') && VIEW_OF[id]){
    tabGo(VIEW_OF[id]);
    setTimeout(function(){ var s=el(id); if(s) window.scrollTo({top:s.offsetTop-56,behavior:'smooth'}); },60);
    return;
  }
  var s=el(id); if(s) window.scrollTo({top:s.offsetTop-56,behavior:'smooth'});
}

// Ninja Hacks engine (REGION_FACTS, MO_FULL, nameHash, buildHacks) moved to js/itinerary/ninja-hacks.js

// UPI PAYMENT + PLAN PICKER (UPI_VPA/_selectedPlan/_renderPlanFeatures/pickPlan/backToPlanPicker/upiParams/payVia/buildQR) moved to js/payments/plan-picker.js

// SMART SEARCH + DESTINATION/PHOTO RESOLUTION HELPERS (smartSearch/flagEmoji/lookupCountryInfo/buildGenericDestination/isSafePhotoTitle/bestSrcFromSrcset/picsumUrl/loadPhotosForCard) moved to js/itinerary/search-engine.js

/* OPTIONAL AI ENHANCEMENT */
/* Static per-provider fallback chains. NOTE on groq: llama-3.3-70b-versatile
   and llama-3.1-8b-instant were BOTH deprecated by Groq on 2026-08-16 for
   free/developer-tier keys (still usable on enterprise committed-spend
   plans, hence kept as a last-resort entry here) — a key that only ever
   tried those two used to exhaust this list and surface a scary "model does
   not exist" error even though the KEY itself was perfectly valid. The
   current recommended replacements are the openai/gpt-oss models. This list
   is only the fallback of last resort, though: testKey()/aiCall() prefer a
   LIVE model list fetched from Groq's own /openai/v1/models endpoint with
   the user's key when possible, since that's always current. */
var AI_MODELS = {
  groq: ['openai/gpt-oss-120b','openai/gpt-oss-20b','llama-3.3-70b-versatile'],
  cerebras: ['llama-3.3-70b','llama3.1-8b'],
  github: ['gpt-4o','Meta-Llama-3.1-70B-Instruct'],
  gemini: ['gemini-2.5-flash','gemini-flash-latest'],
  openrouter: ['meta-llama/llama-3.3-70b-instruct:free','mistralai/mistral-small-3.1-24b-instruct:free','google/gemma-3-27b-it:free'],
  mistral: ['mistral-small-latest','open-mistral-nemo'],
  anthropic: ['claude-sonnet-5']
};
var lastAiSource = null; /* {prov, model} of the last successful AI call, or null */
// extractJSON/aiRequest/aiCall/aiCallAny/testKeyFallbackChain/testKey (AI provider request layer) moved to js/copilot/ai-providers.js

// MAIN SEARCH EXECUTION + RESULT CARDS (runSearch/renderCards/swTab/swSub/addSpend/togPack) moved to js/itinerary/result-cards.js


// FOUNDER-OFFER COUNTDOWN + PAY/SUCCESS OVERLAY (rwFounderDeadline/rwCountdownParts/rwFounderBannerHTML/rwCountdownCells/rwStartCountdown/rwStopCountdown/RW_TESTIMONIALS/rwRotateTesti/openPay/renderPlanGrid/closePay/_adminUnlock/activatePro/closeSuccess/goHome/confetti) moved to js/payments/plan-picker.js

// LIGHTBOX (openLbox/closeLbox) moved to js/itinerary/result-cards.js

/* SETTINGS */

// Encrypted Key Sync (end-to-end API key backup/restore via Firestore) moved to js/data-sync/key-sync.js

// Moved to js/ui/settings-modal.js (Phase 5b) — settings modal (PROV_META, renderKeyBoxes, openSettings, closeSettings, setProv, saveKey, clearKey)



/* TOAST */
function showToast(msg){
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:62px;left:50%;transform:translateX(-50%);background:#9B59F5;color:#fff;padding:10px 18px;border-radius:10px;font-weight:600;font-size:13px;z-index:9999;box-shadow:0 4px 20px rgba(155,89,245,.4);max-width:92vw;text-align:center;pointer-events:none;white-space:nowrap';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 2800);
}

document.addEventListener('keydown', function(ev){
  if(ev.key==='Escape'){
    closeLbox(); closePay(); closeSettings();
    el('successOverlay').classList.remove('open');
    el('legalOverlay').classList.remove('open');
  }
});

// Firebase SDK init + firebase.auth().onAuthStateChanged UI wiring (sign-in button state, account drawer trigger, device cap, trial grant, account-bound Pro listener) and auth helper functions (openAuth/closeAuth/loginGoogle/loginEmail/etc.) moved to js/boot/auth-init.js


// REFERRAL TRACKING (RW_REF_KEY/RW_REF_AT, rwSanitizeRefCode, rwRefSync,
// rwRefLookup, rwRefCapture, rwRefStickUrl, rwRefPersist, rwRefActive,
// rwRefStamp, rwRefLink, rwRefLiveCheck, rwRefApply, openRefCode,
// rwRefBadgeHTML) moved to js/pricing/referral.js

/* Free UPI flow: user submits UTR, owner approves in the admin console */
function submitUtr(){
  if(!requireLogin()) return;
  var utr = (el('utrInput').value||'').trim().replace(/\s/g,'');
  var msg = el('utrMsg');
  function say(t, ok){ msg.textContent=t; msg.style.display='block'; msg.style.color=ok?'#16BF96':'#D84F4F'; msg.style.background=ok?'rgba(22,191,150,.08)':'rgba(216,79,79,.08)'; }
  if(!/^\d{12}$/.test(utr)) return say('A real UPI UTR is exactly 12 digits \u2014 find it in your payment app under the \u20b9100 transaction\u2019s details.', false);
  if(!AUTH_READY) return say('Owner hasn\u2019t enabled account unlocks yet \u2014 hold on to your UTR and try again soon.', false);
  var b = el('utrBtn'); b.disabled=true; b.textContent='Sending\u2026';
  /* anti-bot: email accounts must be verified before claiming */
  if(user.providerData && user.providerData.some(function(p){return p.providerId==='password';}) && !user.emailVerified){
    b.disabled=false; b.textContent='Submit \u27A4';
    user.sendEmailVerification().catch(function(){});
    return say('Verify your email first \u2014 we just sent (or re-sent) the link. Tap it, reopen the app, then submit your UTR.', false);
  }
  /* fraud gate: rejected-before accounts and duplicate UTRs are blocked */
  db.collection('claims').where('uid','==',user.uid).get().then(function(snap){
    var mine = snap.docs.map(function(d){return d.data();});
    if(mine.some(function(c){return c.status==='rejected';})){
      b.disabled=false; b.textContent='Submit \u27A4';
      return say('A previous claim from this account was rejected. Contact the owner via YouTube @mohucool with payment proof to unlock.', false);
    }
    if(mine.some(function(c){return c.utr===utr;})){
      b.disabled=false; b.textContent='Submit \u27A4';
      return say('You already submitted this UTR \u2014 it\u2019s in the verification queue.', false);
    }
    var _ref = {};
    try{ _ref = rwRefStamp(); }catch(e){}
    var _bonusDays=0;
    try{
      var _terms=window.RW_REFERRAL_TERMS||{};
      if(_ref.refCode && _terms.active!==false){ _bonusDays=parseInt(_terms.buyerBonusDays||30,10)||30; _ref.buyerBonusDays=_bonusDays; }
    }catch(e){}
    return db.collection('claims').doc(user.uid+'_'+utr).set(Object.assign({
    uid:user.uid, email:user.email||user.phoneNumber||'', utr:utr, amount:parseInt(UPI_AMT,10)||100,
    tier:(UPI_AMT==='299'?'supporter':'pro'), plan:(_selectedPlan&&_selectedPlan.id)||'legacy100', planLabel:(_selectedPlan&&_selectedPlan.label)||'Legacy ₹100',
    status:'pending', created:firebase.firestore.FieldValue.serverTimestamp()
  }, _ref)).then(function(res){
    if(res===undefined) return; /* gated above */
    b.disabled=false; b.textContent='Submit \u27A4'; el('utrInput').value='';
    try{ track('utr_submits'); }catch(e){}
    try{ if(_bonusDays>0&&_ref.refCode){ var _who=rwRefLookup(_ref.refCode); setTimeout(function(){ showToast('Referred by '+(_who?_who.name:'your friend')+' - you get '+_bonusDays+' bonus days of Pro when verified!'); },2200); } }catch(e){}
    /* INSTANT provisional unlock — bound to THIS ACCOUNT (not the device) */
    if(user){
      lsSet('rw_pro_temp', String(Date.now()+864e5));
      lsSet('rw_pro_temp_uid', user.uid);
      /* Store which plan was actually bought so RWPricing.currentTier() reflects
         it correctly — a founder/legacy buyer is 'elite' forever as promised;
         anyone buying a specific tier gets exactly that tier, not everything. */
      var boughtTierId = 'elite'; /* default: founder / long-term / short-term passes all grant full access */
      if(_selectedPlan){
        var pid = _selectedPlan.id;
        if(pid.indexOf('plus')===0) boughtTierId='plus';
        else if(pid.indexOf('pro')===0) boughtTierId='pro';
        else if(pid.indexOf('elite')===0) boughtTierId='elite';
      }
      lsSet('rw_tier', boughtTierId);
      isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',user.uid); refreshProUI();
      say('\ud83c\udf89 Pro unlocked INSTANTLY for your account! Verification completes in the background \u2014 nothing more to do.', true);
    } else {
      say('Submitted \u2713 Verification completes shortly \u2014 Pro activates on your account automatically.', true);
    }
    setTimeout(closePay, 1800);
    if(OWNER_NOTIFY_EMAIL){
      fetch('https://formsubmit.co/ajax/'+OWNER_NOTIFY_EMAIL, {method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify({_subject:'RoamWise: new \u20b9100 UPI claim', user:(user&&user.email)||'', utr:utr})
      }).catch(function(){});
    }
  }); }).catch(function(){
    b.disabled=false; b.textContent='Submit \u27A4';
    say('Could not send \u2014 check your connection and try again.', false);
  });
}

// Moved to js/ui/adaptive-shell.js (Phase 5b) — adaptive shell + RW icon system (IS_APP/IS_STANDALONE/IS_TOUCH_MOBILE, applyShell, rwSetIconTheme, openIconThemePicker, rwIcon, RW_ICON_PATHS)
// Central boot DOMContentLoaded handler (rwApplyMode/UIScale/renderTabbar/opening sequence/status bar/back button/push init/speech synthesis warm-up) moved to js/boot/init.js

// Moved to js/ui/adaptive-shell.js (Phase 5b) — back-button confirmation + customizable bottom nav + drawer (rwInitStatusBar, rwInitBackButton, rwCloseTopOverlay, RW_TABS, renderTabbar, rwTabGo, tabGo, openDrawer/drToggle/closeDrawer/drawerAccount)
// Account drawer's onAuthStateChanged registration moved to js/boot/auth-init.js
// Moved to js/ui/adaptive-shell.js (Phase 5b) — drawer Escape-key close listener

/* ===== GLOBAL COMMERCE ===== */
var PRICE_IN = '\u20B9100', PRICE_WW = '$4.99';
var payRegion = 'in';
function detectRegion(){
  try{
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    var lang = (navigator.language||'').toLowerCase();
    if(tz==='Asia/Calcutta'||tz==='Asia/Kolkata'||lang.endsWith('-in')) return 'in';
  }catch(e){}
  return 'ww';
}
function setPayRegion(r){
  payRegion = r;
  var isIN = r==='in';
  el('payTabIN').className = 'pay-tab'+(isIN?' on':'');
  el('payTabWW').className = 'pay-tab'+(isIN?'':' on');
  el('payIndiaSec').style.display = isIN?'':'none';
  el('payIntlSec').style.display = isIN?'none':'';
  el('bigPrice').textContent = isIN?PRICE_IN:PRICE_WW;
  el('priceOld').textContent = isIN?('Worth \u20B9999/year \u2014 yours for \u20B9100 forever'):('Worth $29/year \u2014 yours for $4.99 forever');
}
function applyRegionUI(){
  var r = detectRegion();
  var p = r==='in'?PRICE_IN:PRICE_WW;
  var hb = el('heroProBtn'); if(hb) hb.innerHTML = 'Unlock Pro \u2014 '+p;
  var pa = el('promoAmt'); if(pa) pa.textContent = p;
  var dl = el('drProLbl'); if(dl) dl.textContent = isPro ? (rwStatusLabel().text+' \u2713') : ('Unlock Pro \u2014 '+p);
  setPayRegion(r);
}
// Gumroad international checkout (openGumroad/verifyGumroad) moved to js/payments/checkout.js
var LEGAL = {
  privacy: {t:'Privacy Policy', h:'<h4>What we collect</h4>Nothing on a server. RoamWise runs entirely in your browser \u2014 your searches, budgets and preferences are stored only on your device (localStorage) and never sent to us.<h4>Payments</h4>Payments happen directly over UPI to the owner (India) or via Gumroad (worldwide). We never see or store your card, UPI or bank details \u2014 only a payment/license ID used to unlock Pro on your device.<h4>Third-party data</h4>Destination photos and descriptions come from Wikipedia\u2019s public API. Optional AI features call the provider you configure (Gemini, Groq or Anthropic) using your own key, directly from your browser.<h4>Contact</h4>Questions? Reach us via YouTube @mohucool.'},
  terms: {t:'Terms & Refunds', h:'<h4>The deal</h4>The \u20b9100 Founder offer is a one-time purchase, capped at the first 1,000 launch seats, that unlocks all Pro features for life on the account it is activated on \u2014 no subscription, no recurring charges, ever, for that purchase. Outside the Founder offer, Plus/Pro/Elite are ongoing subscriptions billed monthly or yearly, and separate, higher-priced one-time lifetime and long-term passes are also available \u2014 see the Pricing page for the current list.<h4>Refunds</h4>If Pro does not work for you, contact us within 7 days of purchase with your payment or license ID and we\u2019ll make it right. Gumroad purchases also follow Gumroad\u2019s buyer protection.<h4>Estimates</h4>All prices, budgets and crowd levels shown are estimates for planning \u2014 always verify visas, prices and conditions before you travel.<h4>Fair use</h4>One purchase = one traveler. Please don\u2019t redistribute license keys.'}
};
function openLegal(which){
  var L = LEGAL[which]; if(!L) return;
  el('legalTitle').textContent = L.t;
  el('legalBody').innerHTML = L.h;
  el('legalOverlay').classList.add('open');
}
applyRegionUI();

(function(){
  var chip = el('modeChip');
  if(chip && activeProv!=='smart'){
    var labels = {gemini:'Gemini AI (free)', groq:'Groq AI (free)', anthropic:'Claude AI'};
    chip.textContent = labels[activeProv]||activeProv;
    chip.className = 'mode-chip '+(activeProv==='anthropic'?'mode-ai':'mode-free');
  }
})();


// AI Travel Copilot core (openCopilot/copilotSend, deterministic parser, intent memory, world place resolver, mini web lookup) moved to js/copilot/core.js








// HOW-TO GUIDE with voice narration (RW_GUIDE/openGuide/rwGuide*) moved to js/ui/how-to-guide.js



// WEB PUSH (rwInitWebPush) moved to js/boot/init.js

// Realms of Roam / Journey Passport game system moved to js/game/realms.js

// TATKAL PREP (openTatkal/rwTatkal*) moved to js/booking/tatkal-prep.js

// ARRIVAL MODE (RW_STATIONS/openArrival/rwArrival*) moved to js/booking/arrival-mode.js

// SMART TRAVEL MATCHING ENGINE (RW_MATCH_ROLES/RW_MATCH_INTENT/openMatchEngine/rwMatch*) moved to js/social/travel-matching.js

// Tusk Rich Reply System (rwTuskRail, escHtmlAttr, rwTuskAsk, rwTuskNeedsClarity, rwStartAnywhere, cpFinish, cpGoPlan, cpActionsHTML) moved to js/copilot/rich-reply.js
// escHtml() moved to js/core/text-utils.js (deduped; was reused by js/copilot/core.js)

// vaultGet/vaultSave/saveTripOffline moved to js/itinerary/trip-vault.js
// Overlay history stack (rwOverlayOpen/rwOverlayClose) moved to js/core/overlay-stack.js
// openVault/closeVault/deleteVaultTrip/openVaultTrip/loadTripExtras moved to js/itinerary/trip-vault.js
// FREE AFFILIATE / DEEP LINKS + CENTRAL AFFILIATE LINK SYSTEM (AFF_* constants,
// affTpUrl, rwAffLink, flightUrl, trainBusUrl, stayUrlAgoda, thingsUrl,
// travelLinksHTML, rwBookGridHTML) moved to js/booking/affiliate-links.js

// Trip countdown notifications (notifyEnable/tripReminderCheck) moved to js/audio/reminders.js
// proofStamp (verifiable journey fingerprint) moved to js/game/badges.js

// Crypto payment panel (CRYPTO_WALLETS/cryptoConfigured/cryptoPanelHTML/copyText) moved to js/payments/checkout.js

// PWA (service worker registration + install prompts) moved to js/boot/init.js







// Group Compromise Engine (RW_INTERESTS, grpMembers/grpTagsFor/grpScoreMember/grpCompromise, openGroupPlanner/grpRender/grpAdd/grpRemove/grpResults) moved to js/social/group-compromise.js
// Shared trip-chat room state (_chatUnsub, _chatRoom, _chatMsgs, chatPost) moved to js/social/group-state.js
// Secure Trip Group Chat (openGroupChat/tripChatOpen and friends, plus reactions/streak/presence/members/vibe/chatBubble/moderation) moved to js/social/group-chat.js and js/social/group-chat-social.js
// Live Kitty (expense split) moved to js/social/expense-split.js; Group Train Picker
// moved to js/social/train-picker.js; "When can everyone go?" moved to
// js/social/trip-scheduling-poll.js; remaining Trip Board coordination layer
// (polls, board, plan, Tusk facilitator) moved to js/social/trip-board.js

// Tusk persona (smalltalk, masala framing, tkClarifyHTML/tkMiniCard/tkRouteCard) moved to js/copilot/tusk-persona.js

// IN-APP FORM MODAL (rwForm/rwFormSubmit) moved to js/ui/form-modal.js

// CoordKit settle engine (rwSettleEngine) moved to js/social/coordkit.js

// TRIP MERCH moved to js/misc/misc-features-2.js





// Travel Progression (RW_XP_LEVELS/RW_CHALLENGES/rwXp*/rwProgress*) moved to js/game/badges.js






// OFF-GRID SAFETY (RW_OFFGRID/rwOffgridHTML) moved to js/misc/eco-safety.js


// SOUND OF PLACE moved to js/misc/sound-of-place.js

// SIGNATURE FOOD moved to js/misc/signature-food.js


// RESPONSIBLE TRAVEL (RW_RESPONSIBLE/rwResponsibleHTML) moved to js/misc/eco-safety.js


// GREEN HUB (RW_GREEN/rwGreenHubHTML) moved to js/misc/eco-safety.js


// MONKEY SAFETY (RW_MONKEY/rwMonkeyFor/rwMonkeyHTML) moved to js/misc/eco-safety.js


// DESTINATION VIBE moved to js/misc/destination-vibe.js

// TREKKING (RW_TREKS/rwTrekListHTML/rwTrekOps) moved to js/misc/trek-vault.js

// ATHLETE MODE (medical + fitness POI lookups) moved to js/misc/athlete-mode.js

// LIVE LOCATION ("near me" geolocation answer) moved to js/misc/live-location.js

// BOOKING PLATFORM COMPARISON moved to js/misc/booking-platform-compare.js

// LOCAL ECOSYSTEM moved to js/misc/local-ecosystem.js


// LOW-CARBON TRAVEL (RW_EMIT/rwCO2/rwGreenSwapHTML/eco ledger+badges) moved to js/misc/eco-safety.js




// CERTIFICATE VERIFICATION (rwCertHash, rwVerifyPanelHTML, rwVerifyRun) moved to js/itinerary/certificate-verify.js
// ECO CERTIFICATE (rwEcoCert, rwCertShare) moved to js/itinerary/eco-certificate.js

// ON-TRIP ACTION HUB (RW_ACTIONS, rwActionIntent, rwActionQuery, rwActionHubHTML)
// moved to js/booking/actions.js

// OVER-TOURISM FLAG (RW_TOURIST_PRESSURE/rwPressureHTML) moved to js/misc/eco-safety.js





// RULES VERSION CHECK (RW_RULES_VERSION/rwRulesCheck) moved to js/runtime/rules-check.js

// PLACE DISAMBIGUATION (RW_FC/rwPlaceType/rwCandidates/rwIsAmbiguous/rwDisambigHTML) moved to js/itinerary/place-disambiguation.js

// RW_STATES and RW_STATE_ALIAS (Indian states/regions circuit data) moved to js/data/regions.js
// STATE/COUNTRY CIRCUIT ROUTES (rwDetectState/rwStateHTML/rwMergeExtData/rwDetectCountry/rwCountryRouteHTML) moved to js/copilot/region-routes.js

// CROSS-QUESTIONING (RW_COMMON_WORDS/rwNeedsClarify/rwClarifyWordHTML) moved to js/copilot/clarify.js

// Tusk Answer Cards (wvStructured, tkBullets/tkThemeGrad/tkHeadStyle, cpFollow, tkFollowChips/tkItinChips/tkCredits, rwIntlHTML, rwStyledSheet/rwBudgetFit/rwBudgetFitHTML) moved to js/copilot/answer-cards.js

// ON-THE-GROUND COSTS & STREET SMARTS (RW_GROUND/rwGroundFor/groundHTML) moved to js/itinerary/ground-costs.js

// REAL ATTRACTIONS / OpenStreetMap-Overpass (OSM_KINDS/osmCacheKey/osmAttractions/osmAttractionsHTML) moved to js/itinerary/real-attractions.js

// Tusk personality & voice notes (TUSK_QUIPS, tuskQuip, tuskVoiceNoteHTML) moved to js/copilot/tusk-persona.js

// Tusk knowledge + learning layer (Wikivoyage guide/section fetch+cache, rwLearn/rwTopInterests) moved to js/copilot/tusk-knowledge.js

// SHADOW BUDGET (TIP_BY_REGION/RW_COST_HINTS/RW_REGION_DEFAULT/costEntryForPlace/shadowBudget/shadowBudgetHTML) moved to js/itinerary/shadow-budget.js

// RAIN CONTINGENCY (OUTDOOR_RE/INDOOR_RE/dayIsOutdoor/rainSwapHTML/rainSwapApply) moved to js/itinerary/rain-contingency.js

// CAMERA -> ITINERARY (scanImageOpen/scanImageRun) moved to js/itinerary/camera-itinerary.js

// LIVE WORLD MAP + MAP-FIRST ITINERARY VIEW moved to js/itinerary/map-view.js

// Moved to js/ui/themes.js (Phase 5b) — Living Themes (RW_THEMES, rwPickTheme, rwApplyTheme, rwStartFx/rwStopFx)

// REMOTE CONFIG (applyRemoteConfig + boot fetch) + Cinematic Itinerary bridges moved to js/boot/init.js

