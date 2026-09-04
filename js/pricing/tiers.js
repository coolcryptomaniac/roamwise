// @ts-check
/* ============================================================================
   js/pricing/tiers.js
   ----------------------------------------------------------------------------
   The RWPricing engine (CONFIG + tier/feature helpers) — moved verbatim out
   of app.js (Phase 1 of the app.js modularization). Pure data/config plus
   its accessor functions, no logic changes. Loaded as a plain classic
   <script> (not a module) in index.html, before app.js, so RWPricing stays
   a bare global exactly as before — app.js reads RWPricing.* throughout.
   ========================================================================= */
/* ============================================================================
   RW PRICING ENGINE — single source of truth for every price, tier, and offer.
   Isolated deliberately: nothing else in the app should hardcode a price or a
   feature-gate decision. Everything reads through RWPricing.* so the entire
   business model can change by editing ONE config object below. This is the
   literal implementation of "pricing can change anytime" — there's exactly
   one place it lives.
   ========================================================================= */
/**
 * @typedef {Object} RWTier
 * @property {string} id
 * @property {string} label
 * @property {number} priceMonthly
 * @property {number} priceYearly
 * @property {string[]} features
 */
/**
 * @typedef {Object} RWFounderGate
 * @property {boolean} [closed]
 * @property {number} [count]
 * @property {string} [closesOn] YYYY-MM-DD
 */
var RWPricing = (function(){
  var CONFIG = {
    /* The app's public launch date — the founder offer expires at whichever
       comes first: 1000 signups, or 365 days after this date. */
    LAUNCH_DATE: '2026-06-01',
    /* FOUNDER OFFER: Rs 100 one-time = lifetime Pro, capped at 1000 members
       (500 free NMIMS seats + 500 paid founders). Once the 1000-seat cap (or
       the 365-day window) is hit, the founder offer closes permanently and the
       STANDARD post-founder Pro pricing ladder below applies:
         Daily Rs 19 / Weekly Rs 99 / Monthly Rs 299 / Quarterly Rs 749 /
         Yearly Rs 2,499 (30% off Rs 299x12=Rs 3,588) / Lifetime Rs 14,999.
       Longer duration = bigger discount, so per-day cost falls monotonically. */
    FOUNDER_OFFER: { priceINR:100, maxUsers:1000, maxDays:365, label:'Founder Pro \u2014 \u20b9100 lifetime' },

    /* Ongoing freemium tiers, once the founder offer window closes.
       Feature keys are free-form strings — hasFeature() just checks
       inclusion, so adding a new gated feature anywhere is a one-line
       addition to a tier's `features` array, never a new isPro-style flag. */
    TIERS: [
      { id:'free',  label:'Free',  priceMonthly:0,   priceYearly:0,
        features:['smartAI'] },
      { id:'plus',  label:'Plus',  priceMonthly:99,  priceYearly:999,
        features:['smartAI','proAI','pdfExport','cardStylesBasic'] },
      { id:'pro',   label:'Pro',   priceMonthly:299, priceYearly:2499,
        features:['smartAI','proAI','pdfExport','cardStylesBasic','cardStylesAll','adFree','squadsPost','unlimitedPdf'] },
      { id:'elite', label:'Elite', priceMonthly:499, priceYearly:4999,
        features:['smartAI','proAI','pdfExport','cardStylesBasic','cardStylesAll','adFree','squadsPost','unlimitedPdf','movieFree','earlyAccess','prioritySupport'] }
    ],
    /* Long-term one-time passes — now tier-specific (not one universal price):
       each is priced as a discount off THAT tier's yearly rate, discount
       growing with commitment length (3yr ≈2.5x yearly, 5yr ≈3.5x, 10yr ≈5x
       instead of 3x/5x/10x) — the whole point of a long-term pass is a
       genuine bulk discount versus paying yearly repeatedly. */
    LONG_TERM: [
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
    ],
    /* Short-term Pro passes for a single trip or a quick trial. Priced on the
       standard post-founder ladder — per-day cost falls as the window grows:
       Day Rs 19 (Rs 19/day), Week Rs 99 (~Rs 14/day), 3-Month Rs 749
       (~Rs 8/day). Monthly (Rs 299) and Yearly (Rs 2,499) live in TIERS.pro. */
    SHORT_TERM: [
      { id:'day',     days:1,  priceINR:19,  label:'Day Pass' },
      { id:'week',    days:7,  priceINR:99,  label:'Week Pass' },
      { id:'quarter', days:90, priceINR:749, label:'3-Month Pass' }
    ]
  };

  /* Short, human-readable display strings for every feature key used across
     TIERS[*].features — kept here, next to TIERS, so a new feature key added
     to a tier is a two-line change (the key + its label) instead of a key
     that silently renders as nothing in the pay modal's feature checklist. */
  var FEATURE_LABELS = {
    smartAI:         'Smart AI itinerary builder',
    proAI:           'Pro AI trip enhancement',
    pdfExport:       'PDF export',
    cardStylesBasic: 'Basic card styles',
    cardStylesAll:   'All card styles',
    adFree:          'Ad-free',
    squadsPost:      'Post to Squads',
    unlimitedPdf:    'Unlimited PDF exports',
    movieFree:       'Free trip movie/reel',
    earlyAccess:     'Early access to new features',
    prioritySupport: 'Priority support'
  };

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
    if(_founderGate && typeof _founderGate.count === 'number'
       && _founderGate.count >= CONFIG.FOUNDER_OFFER.maxUsers) return false;
    if(_founderGate && _founderGate.closesOn){
      var closes = Date.parse(_founderGate.closesOn + 'T23:59:59Z');
      if(!isNaN(closes) && Date.now() > closes) return false;
    }
    return (typeof signupCountSoFar!=='number' || signupCountSoFar<CONFIG.FOUNDER_OFFER.maxUsers)
      && daysSinceLaunch() < CONFIG.FOUNDER_OFFER.maxDays;
  }

  /**
   * Look up a tier by id, falling back to the first entry in CONFIG.TIERS
   * (the 'free' tier) when the id isn't found.
   * @param {string} id
   * @returns {RWTier}
   */
  function tierById(id){ return CONFIG.TIERS.find(function(t){return t.id===id;}) || CONFIG.TIERS[0]; }

  /* The user's active tier, derived from what's actually stored — legacy
     one-time ₹100 Pro buyers are grandfathered at 'elite' forever, exactly
     as promised when they bought it. New purchases store an explicit
     tier id; nothing here assumes only one possible paid state. */
  /**
   * @returns {RWTier}
   */
  function currentTier(){
    if(lsGet('rw_tier')) return tierById(lsGet('rw_tier'));
    if(isPro) return tierById('elite'); /* legacy ₹100 lifetime / founder offer buyers */
    return tierById('free');
  }

  /**
   * @param {string} name Feature key, e.g. one of FEATURE_LABELS' keys.
   * @returns {boolean}
   */
  function hasFeature(name){ return currentTier().features.indexOf(name) > -1; }

  /**
   * @param {RWTier} tier
   * @returns {number} Rounded percent saved by paying yearly vs. monthly x12.
   */
  function yearlySavingsPct(tier){
    if(!tier.priceMonthly) return 0;
    var fullYear = tier.priceMonthly*12;
    return Math.round((1 - tier.priceYearly/fullYear)*100);
  }

  return {
    CONFIG: CONFIG,
    FEATURE_LABELS: FEATURE_LABELS,
    founderOfferOpen: founderOfferOpen,
    founderGateLoad: founderGateLoad,
    founderGate: function(){ return _founderGate; },
    daysSinceLaunch: daysSinceLaunch,
    tierById: tierById,
    currentTier: currentTier,
    hasFeature: hasFeature,
    yearlySavingsPct: yearlySavingsPct
  };
})();
