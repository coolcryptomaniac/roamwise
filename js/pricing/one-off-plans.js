// @ts-check
/* ============================================================================
   js/pricing/one-off-plans.js
   ----------------------------------------------------------------------------
   ONE-OFF / ONE-TIME PURCHASE half of the RWPricing engine — split out of
   the former js/pricing/tiers.js (subscription-vs-one-off separation pass).
   VERBATIM move: zero logic changes vs. the code this was extracted from —
   only the file it lives in changed.

   Owns every purchase in this app that is a single payment granting a
   fixed, non-renewing benefit (never a recurring charge):
     - CONFIG.FOUNDER_OFFER — the ₹100 launch-offer lifetime pass
     - CONFIG.LONG_TERM — tier-specific 3/5/10-year and lifetime passes
     - CONFIG.SHORT_TERM — single-trip day/week/3-month Pro passes
     - CONFIG.LAUNCH_DATE — the founder-offer window's start date
   plus the founder-offer gate helpers (founderOfferOpen/founderGateLoad/
   founderGate/founderGateSnap/daysSinceLaunch) and proPriceLabel(), the
   founder-price display helper every "Unlock Pro — ₹100" call site uses.

   (NMIMS partner-code redemption — the third one-off purchase path per
   CLAUDE.md's category mapping — has no CONFIG entry of its own: it's a
   Firestore code-redemption flow with no price/tier config to speak of, see
   js/payments/partner-redeem.js. It still grants the same 'elite'-equivalent
   benefit set as the Founder offer, via the shared users/{uid}.pro flag.)

   IMPLEMENTATION NOTE: this file does NOT redefine `RWPricing` — it EXTENDS
   the singleton js/pricing/subscription-plans.js already created, adding
   this category's config onto the same CONFIG object and these functions
   onto the same RWPricing object. This is deliberate: every existing call
   site across the app (js/payments/plan-picker.js, js/boot/init.js, etc.)
   reads `RWPricing.CONFIG.FOUNDER_OFFER`/`RWPricing.founderOfferOpen()` etc.
   as members of ONE object — splitting the underlying source file in two
   without splitting the object those call sites depend on needed zero call-
   site changes, per this task's "verbatim move" requirement. Loaded AFTER
   js/pricing/subscription-plans.js in index.html for exactly this reason.
   ========================================================================= */
/**
 * @typedef {Object} RWFounderGate
 * @property {boolean} [closed]
 * @property {number} [count]
 * @property {string} [closesOn] YYYY-MM-DD
 */
(function(){
  var CONFIG = RWPricing.CONFIG;

  /* The app's public launch date — the founder offer expires at whichever
     comes first: 1000 signups, or 365 days after this date. */
  CONFIG.LAUNCH_DATE = '2026-06-01';
  /* FOUNDER OFFER: Rs 100 one-time = lifetime Pro, capped at 1000 members
     (500 free NMIMS seats + 500 paid founders). Once the 1000-seat cap (or
     the 365-day window) is hit, the founder offer closes permanently and the
     STANDARD post-founder Pro pricing ladder below applies:
       Daily Rs 19 / Weekly Rs 99 / Monthly Rs 299 / Quarterly Rs 749 /
       Yearly Rs 2,499 (30% off Rs 299x12=Rs 3,588) / Lifetime Rs 14,999.
     Longer duration = bigger discount, so per-day cost falls monotonically. */
  CONFIG.FOUNDER_OFFER = { priceINR:100, maxUsers:1000, maxDays:365, label:'Founder Pro — ₹100 lifetime' };

  /* Long-term one-time passes — now tier-specific (not one universal price):
     each is priced as a discount off THAT tier's yearly rate, discount
     growing with commitment length (3yr ≈2.5x yearly, 5yr ≈3.5x, 10yr ≈5x
     instead of 3x/5x/10x) — the whole point of a long-term pass is a
     genuine bulk discount versus paying yearly repeatedly. */
  CONFIG.LONG_TERM = [
    { tier:'plus',  tierLabel:'Plus',  options:[
      { id:'plus_y3',  years:3,  priceINR:2499 },
      { id:'plus_y5',  years:5,  priceINR:3499 },
      { id:'plus_y10', years:10, priceINR:4999 } ] },
    { tier:'pro',   tierLabel:'Pro',   options:[
      { id:'pro_y3',   years:3,  priceINR:7499 },
      { id:'pro_y5',   years:5,  priceINR:9999 },
      /* The Pro "longest one-time" is a true LIFETIME pass at Rs 14,999 — the
         headline post-founder lifetime price. It replaces the old 10-year
         pass so nothing longer/cheaper undercuts it. Rendered as "Lifetime"
         via the optional `label`/`lifetime` fields (see renderPlanGrid). */
      { id:'pro_life', years:99, lifetime:true, label:'Lifetime', priceINR:14999 } ] },
    { tier:'elite', tierLabel:'Elite', options:[
      { id:'elite_y3', years:3,  priceINR:12499 },
      { id:'elite_y5', years:5,  priceINR:17499 },
      { id:'elite_y10',years:10, priceINR:24999 } ] }
  ];
  /* Short-term Pro passes for a single trip or a quick trial. Priced on the
     standard post-founder ladder — per-day cost falls as the window grows:
     Day Rs 19 (Rs 19/day), Week Rs 99 (~Rs 14/day), 3-Month Rs 749
     (~Rs 8/day). Monthly (Rs 299) and Yearly (Rs 2,499) live in TIERS.pro
     (js/pricing/subscription-plans.js). */
  CONFIG.SHORT_TERM = [
    { id:'day',     days:1,  priceINR:19,  label:'Day Pass' },
    { id:'week',    days:7,  priceINR:99,  label:'Week Pass' },
    { id:'quarter', days:90, priceINR:749, label:'3-Month Pass' }
  ];

  /**
   * Fractional days elapsed since CONFIG.LAUNCH_DATE, per the local device
   * clock (see the SERVER TRUTH note below for why this is a fallback only).
   * @returns {number}
   */
  function daysSinceLaunch(){ return (Date.now()-new Date(CONFIG.LAUNCH_DATE).getTime())/864e5; }

  /* Founder offer is open only while BOTH conditions hold: under the user
     cap AND within the first year — closes the instant either is exceeded. */
  /* SERVER TRUTH. daysSinceLaunch() reads the DEVICE clock, so rolling a phone's
     date back reopened the Rs 100 lifetime offer indefinitely. The authoritative
     answer now comes from pricing/founder in Firestore (admin-writable only);
     the local check is kept as a fallback for offline, and is deliberately the
     STRICTER of the two — offline can only ever close the offer, never open it. */
  /** @type {RWFounderGate|null} */
  var _founderGate = null;
  /* PERF (2026-09-06): also keep the raw DocumentSnapshot this resolved from,
     not just its .data(). js/pricing/founder-seats.js's loadPublicSeatsLeft()
     needs a {exists, data()} snapshot shape (it's what computeFromSnapshots()
     is unit-tested against), and the plan-picker pay-modal open flow used to
     call founderGateLoad() then loadPublicSeatsLeft() right after it — two
     separate live reads of the exact same pricing/founder document on every
     single pay-modal open. Exposing the snapshot here (founderGateSnap())
     lets that caller reuse this one read instead of firing a second,
     wasteful one — see js/pricing/founder-seats.js's
     loadPublicSeatsLeftFromFounderSnap() and js/payments/plan-picker.js's
     call site. */
  var _founderGateSnap = null;
  /**
   * Load the server-side founder-offer gate from Firestore (`pricing/founder`),
   * caching the result in `_founderGate`. Resolves to `null` (never rejects)
   * when Firestore isn't available or the read fails, so callers can treat a
   * missing gate as "fall back to the local, stricter check".
   * @returns {Promise<RWFounderGate|null>}
   */
  function founderGateLoad(){
    if(!window.db) return Promise.resolve(null);
    return db.collection('pricing').doc('founder').get().then(function(d){
      _founderGateSnap = d;
      _founderGate = d.exists ? d.data() : null;
      return _founderGate;
    }).catch(function(){ return null; });
  }
  /**
   * Whether the founder offer is still open, combining the server-side gate
   * (authoritative, closes-only) with the local device-clock/signup-count
   * fallback checks.
   * @param {number} [signupCountSoFar]
   * @returns {boolean}
   */
  function founderOfferOpen(signupCountSoFar){
    /* explicit server verdict wins outright */
    if(_founderGate && _founderGate.closed === true) return false;
    if(_founderGate && typeof _founderGate.count==='number'
       && _founderGate.count >= CONFIG.FOUNDER_OFFER.maxUsers) return false;
    if(_founderGate && _founderGate.closesOn){
      var closes = Date.parse(_founderGate.closesOn + 'T23:59:59Z');
      if(!isNaN(closes) && Date.now() > closes) return false;
    }
    return (typeof signupCountSoFar!=='number' || signupCountSoFar<CONFIG.FOUNDER_OFFER.maxUsers)
      && daysSinceLaunch() < CONFIG.FOUNDER_OFFER.maxDays;
  }

  RWPricing.founderOfferOpen = founderOfferOpen;
  RWPricing.founderGateLoad = founderGateLoad;
  RWPricing.founderGate = function(){ return _founderGate; };
  RWPricing.founderGateSnap = function(){ return _founderGateSnap; };
  RWPricing.daysSinceLaunch = daysSinceLaunch;
})();

/* ============================================================================
   PRO PRICE LABEL (rw-v80) — Febin's currency bug — moved verbatim from
   app.js (round 5), then from js/pricing/tiers.js (subscription-vs-one-off
   split). Every call site passes the Founder offer's ₹100 (the app's one
   one-time flat price used in generic "Unlock Pro" prompts elsewhere in the
   UI), which is why this lives in the one-off file rather than the
   subscription one.
   ============================================================================
   The Pro price genuinely IS 100 rupees, charged over UPI. But showing a bare
   "₹100" to someone who has selected USD looks like the currency switch is
   broken. So: show their currency with the rupee price alongside, because the
   amount they are actually charged is in rupees and hiding that would be worse.
   ========================================================================= */
function proPriceLabel(inr){
  inr = inr || 100;
  try{
    if(typeof AC==='undefined' || AC==='INR') return '₹'+inr;
    var cu=CURR.find(function(x){ return x.c===AC; });
    if(!cu || !cu.r) return '₹'+inr;
    var usd = inr/83.5;                     /* INR -> USD base */
    var v = usd*cu.r;
    var shown = v<1 ? v.toFixed(2) : (v<10? v.toFixed(1) : Math.round(v));
    return cu.s+shown+' (₹'+inr+')';
  }catch(e){ return '₹'+inr; }
}
