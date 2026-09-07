// @ts-check
/* ============================================================================
   js/pricing/subscription-plans.js
   ----------------------------------------------------------------------------
   RECURRING SUBSCRIPTION half of the RWPricing engine — split out of the
   former js/pricing/tiers.js (subscription-vs-one-off separation pass) so
   the two purchase categories this app actually sells are cleanly separated
   in the codebase, per CLAUDE.md's "file location may change, only behavior
   changes are sensitive" rule. VERBATIM move: zero logic changes vs. the
   code this was extracted from — only the file it lives in changed.

   Owns: CONFIG.TIERS (Free/Plus/Pro/Elite, priceMonthly + priceYearly — the
   only recurring, auto-renewing-by-intent purchases in this app) and every
   RWPricing.* helper that operates on a tier: tierById/currentTier/
   hasFeature/yearlySavingsPct. Defines the RWPricing global itself — loaded
   FIRST (before js/pricing/one-off-plans.js) in index.html, since that file
   extends this same RWPricing object with the one-off/one-time purchase
   config (Founder offer, long-term passes, short-term passes) rather than
   redefining it.

   tierById()/currentTier()/hasFeature() are used by BOTH purchase
   categories — every one-off pass (Founder/long-term/short-term) still
   grants its benefits by resolving to one of these same TIERS entries (see
   js/pricing/one-off-plans.js's header and js/payments/plan-picker.js's
   _renderPlanFeatures()) — so they stay here as the one shared tier lookup,
   rather than being duplicated in the one-off file.

   Loaded as a plain classic <script> (not a module) in index.html, before
   app.js, so RWPricing stays a bare global exactly as before — app.js reads
   RWPricing.* throughout.
   ========================================================================= */
/**
 * @typedef {Object} RWTier
 * @property {string} id
 * @property {string} label
 * @property {number} priceMonthly
 * @property {number} priceYearly
 * @property {string[]} features
 */
var RWPricing = (function(){
  var CONFIG = {
    /* Ongoing freemium tiers — the recurring subscription ladder. Feature
       keys are free-form strings — hasFeature() just checks inclusion, so
       adding a new gated feature anywhere is a one-line addition to a
       tier's `features` array, never a new isPro-style flag. */
    TIERS: [
      { id:'free',  label:'Free',  priceMonthly:0,   priceYearly:0,
        features:['smartAI'] },
      { id:'plus',  label:'Plus',  priceMonthly:99,  priceYearly:999,
        features:['smartAI','proAI','pdfExport','cardStylesBasic'] },
      { id:'pro',   label:'Pro',   priceMonthly:299, priceYearly:2499,
        features:['smartAI','proAI','pdfExport','cardStylesBasic','cardStylesAll','adFree','squadsPost','unlimitedPdf'] },
      { id:'elite', label:'Elite', priceMonthly:499, priceYearly:4999,
        features:['smartAI','proAI','pdfExport','cardStylesBasic','cardStylesAll','adFree','squadsPost','unlimitedPdf','movieFree','earlyAccess','prioritySupport'] }
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
    tierById: tierById,
    currentTier: currentTier,
    hasFeature: hasFeature,
    yearlySavingsPct: yearlySavingsPct
  };
})();

/* ============================================================================
   MONEY DISPLAY HELPER — moved verbatim from app.js (modularization round 5),
   then from js/pricing/tiers.js (subscription-vs-one-off split). Global
   function (not an RWPricing.* member) because every existing call site
   across the codebase calls it bare, as `fmtMoney(...)`. Reads `CURR`/`AC`
   (the currency table + active-currency code), which remain core app state
   declared in app.js — reading another file's `var` by name from inside a
   function body is resolved at call time, long after every script has
   loaded, so this relocation carries no load-order risk (see
   ARCHITECTURE.md's "Load order: why it's load-bearing" section). Generic
   currency formatting, not specific to either purchase category — kept here
   (the "primary" pricing file) rather than a third file, to avoid splitting
   a single-purpose helper across yet another module.
   ========================================================================= */
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
