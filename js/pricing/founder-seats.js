// @ts-check
/* ============================================================================
   js/pricing/founder-seats.js
   ----------------------------------------------------------------------------
   PUBLIC Founder-offer seat-counter math — isolated in one small, auditable
   place because this exact number was wrong in production (showed "1,000
   seats left" while real Founder passes had already been claimed).

   ROOT CAUSE (fixed alongside this file, see app.js):
   The public counter used to read meta/founderSeats.count. That doc's
   firestore.rules `update` rule is isAdmin()-only — so any seat granted
   through a path that ISN'T the admin console's manual-payment tool (most
   importantly: openPartnerRedeem(), the NMIMS partner-code redemption flow,
   which runs as an ordinary signed-in user, never an admin) had no legal way
   to ever increment it. Those seats were granted (users/{uid}.pro flips to
   true) but silently invisible to the public tally, which never moves for
   them and keeps looking "more open" than it really is.

   firestore.rules already anticipated this and carved out pricing/founder
   .count specifically so a non-admin redemption could bump a SHARED counter
   by exactly +1 (see that file's "FIXED: partner-redeemed seats ... never
   counted toward the combined 1000-account founder-era cap" comment) — it
   just was never wired up to any caller. openPartnerRedeem() now performs
   that write, and this module reads pricing/founder.count (not
   meta/founderSeats) as the one shared, authoritative total that BOTH grant
   paths (admin-approved manual payment, and partner-code redemption) can
   legally move — so the count stays correct going forward no matter which
   path a seat comes from.

   NMIMS RESERVATION LAYER (business rule, see CLAUDE.md task notes):
   partnerships/nmims2026 is the same doc the "Proposed vs Official" badge on
   /nmims/index.html already reads (loadSeats(), G7 work) — its live field is
   `officialConfirmed` (a boolean, admin-write-only per firestore.rules), NOT
   `signed` — reused here verbatim rather than inventing a second flag.
     - officialConfirmed !== true ("Proposed"): show the full remaining pool.
       Nothing is reserved yet because there is no confirmed partnership to
       reserve seats FOR.
     - officialConfirmed === true ("Official"): subtract the 500 seats
       earmarked for the NMIMS campaign from the PUBLIC number. NMIMS's own
       /nmims/index.html counter keeps tracking its reserved 500
       independently (partnerships/nmims2026.claimed, capped by
       firestore.rules) — this module does not touch that pool, it only
       hides those 500 from the general-public count once they're spoken
       for.
   ========================================================================= */
var RWFounderSeats = (function(){
  var TOTAL_SEATS = 1000;
  var NMIMS_RESERVED = 500;

  /**
   * Pure seats-left math. Never throws, never returns a negative number,
   * and coerces any non-finite/negative claimed count to 0 rather than
   * letting bad input produce a nonsense (or misleadingly large) total.
   * @param {number} claimedCount Live count of Founder seats already
   *   granted, from ANY grant path (admin-approved manual payment OR NMIMS
   *   partner-code redemption) — see pricing/founder.count in app.js.
   * @param {boolean} [nmimsSigned] partnerships/nmims2026.officialConfirmed === true
   * @returns {number} Seats to show publicly as "left" — never negative.
   */
  function computeSeatsLeft(claimedCount, nmimsSigned){
    var claimed = (typeof claimedCount === 'number' && isFinite(claimedCount) && claimedCount > 0)
      ? claimedCount : 0;
    var reserved = nmimsSigned === true ? NMIMS_RESERVED : 0;
    return Math.max(0, TOTAL_SEATS - claimed - reserved);
  }

  /**
   * Live version: reads pricing/founder (the shared claimed-count) and
   * partnerships/nmims2026 (the Proposed/Official flag) and returns the
   * public seats-left number — or an explicit "not safe to show" result on
   * any read failure, so a caller never renders a fabricated/misleading
   * count. Never throws and never rejects.
   * @param {*} [dbRef] Firestore instance (duck-typed: needs .collection().
   *   doc().get()). Defaults to window.db (matches every other Firestore
   *   call in app.js) — untyped here since this file, like the rest of
   *   js/, loads as a classic script with no firebase type declarations.
   * @returns {Promise<{ok:true, left:number}|{ok:false, left:null}>}
   */
  function loadPublicSeatsLeft(dbRef){
    var _db = dbRef || (typeof window !== 'undefined' ? window.db : null);
    if(!_db) return Promise.resolve({ ok:false, left:null });
    return Promise.all([
      _db.collection('pricing').doc('founder').get().then(function(s){ return s; }, function(){ return null; }),
      _db.collection('partnerships').doc('nmims2026').get().then(function(s){ return s; }, function(){ return null; })
    ]).then(function(results){
      return computeFromSnapshots(results[0], results[1]);
    }).catch(function(){ return { ok:false, left:null }; });
  }

  /**
   * Same computation as loadPublicSeatsLeft, but taking already-fetched
   * Firestore DocumentSnapshot-shaped objects — the seam unit tests mock
   * against, so the live Firestore round trip never needs to run in CI.
   * A missing/failed claimed-count read (`founderSnap` null/undefined) is
   * NOT safe to guess at — 0 would make the offer look wide open when the
   * truth is unknown — so that case reports {ok:false}. A missing/failed
   * NMIMS-flag read is treated as "not signed" (the same conservative
   * default /nmims/index.html's own badge already uses), since the claimed
   * count itself is still trustworthy and withholding the whole number over
   * one optional flag would be a worse user experience than a bounded,
   * explainable (at most 500-seat) undercount of the reservation.
   * @param {{exists:boolean, data:()=>any}|null|undefined} founderSnap
   * @param {{exists:boolean, data:()=>any}|null|undefined} nmimsSnap
   * @returns {{ok:true, left:number}|{ok:false, left:null}}
   */
  function computeFromSnapshots(founderSnap, nmimsSnap){
    try{
      if(!founderSnap) return { ok:false, left:null };
      var claimed = founderSnap.exists ? (founderSnap.data().count || 0) : 0;
      var nmimsSigned = false;
      try{ nmimsSigned = !!(nmimsSnap && nmimsSnap.exists && nmimsSnap.data().officialConfirmed === true); }catch(e){ nmimsSigned = false; }
      return { ok:true, left: computeSeatsLeft(claimed, nmimsSigned) };
    }catch(e){
      return { ok:false, left:null };
    }
  }

  return {
    TOTAL_SEATS: TOTAL_SEATS,
    NMIMS_RESERVED: NMIMS_RESERVED,
    computeSeatsLeft: computeSeatsLeft,
    computeFromSnapshots: computeFromSnapshots,
    loadPublicSeatsLeft: loadPublicSeatsLeft
  };
})();
