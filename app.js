// @ts-nocheck
// GLOBAL ERROR GUARD moved to js/core/error-guard.js (must load FIRST, not with the rest of boot, so it protects every other module's load too)

// rwHaptic moved to js/core/app-utils.js (modularization round 5)
// RW_CUE_FILES, rwAudioThemeEnabled, rwAudioThemeVolume, rwPlayCue moved to js/audio/cues.js


// DB destinations array moved to js/data/destinations.js
// RW_IATA lookup table and rwIata() resolver moved to js/data/iata.js
// rwSkyscannerUrl/rwSkyscannerToUrl moved to js/booking/affiliate-links.js (modularization round 5)
// COUNTRY_INFO + ALL_COUNTRIES (static country reference data) moved to js/data/country-info.js

/* RoamWise Pro — app logic. Built with template literals to avoid quote-escaping bugs. */

// LS, lsGet, lsSet moved to js/core/storage-utils.js

// PUSH + LOCAL NOTIFICATIONS (rwInitPush/rwSaveDeviceToken/rwLocalNotifySchedule) moved to js/boot/init.js







// AILON TUSK AGENT (RW_AGENT_TOOLS/RW_AGENT_IMPL/rwAgentRun/openAgent/rwAgentGo/rwAgentRenderTrace) moved to js/copilot/agent.js

// AGENT EVAL HARNESS (RW_EVALS/rwEvalRun/rwEvalScore/openEval/rwEvalGo/rwEvalRender) moved to js/copilot/agent-evals.js

// PRIVACY TRUST ANCHOR + WEB-TO-APP HANDOFF (openPrivacyBadge/rwHandoffToPhone) moved to js/misc/trust-conversion.js (modularization round 5)

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
// proPriceLabel/fmtMoney moved to js/pricing/tiers.js (modularization round 5)

// Currency grid + budget slider wiring moved to js/ui/currency-budget.js (modularization round 5)
rwInitCurrencyBudget();

el('tagsContainer').addEventListener('click', function(e){
  if(e.target.classList.contains('tag')) e.target.classList.toggle('on');
});

// DEST_NAMES build-up + destination autocomplete IIFE moved to js/ui/dest-autocomplete.js (modularization round 5)
rwInitDestAutocomplete();

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

// PROFILE + LIFETIME LIST (STYLE_POOL/openProfile/profAv/profUpload/profPick/profSave) moved to js/misc/profile.js (modularization round 5)

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

// RATINGS & TESTIMONIALS (PLAYSTORE_URL/renderRatings/openRateForm/paintStars/submitRating) moved to js/misc/ratings.js (modularization round 5)

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


// TRAVELER DNA (DNA_QS/openDna/dnaPick/dnaSave/applyDna) moved to js/misc/traveler-dna.js (modularization round 5)
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

// offerOpen/_doOpenNow/saveOrDownload moved to js/core/app-utils.js (modularization round 5)
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

// VIEW_OF/scrollToId moved to js/core/app-utils.js (modularization round 5)

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



// showToast moved to js/core/app-utils.js (modularization round 5)

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
  terms: {t:'Terms & Refunds', h:'<h4>The deal</h4>Pro is a one-time purchase that unlocks all Pro features on the device/browser where it is activated. No subscription, no recurring charges.<h4>Refunds</h4>If Pro does not work for you, contact us within 7 days of purchase with your payment or license ID and we\u2019ll make it right. Gumroad purchases also follow Gumroad\u2019s buyer protection.<h4>Estimates</h4>All prices, budgets and crowd levels shown are estimates for planning \u2014 always verify visas, prices and conditions before you travel.<h4>Fair use</h4>One purchase = one traveler. Please don\u2019t redistribute license keys.'}
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

