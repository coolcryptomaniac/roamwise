/* ============================================================================
   RoamWise REFERRAL / COMMISSION REGISTRY
   ============================================================================
   EDIT THIS FILE to add a person. Nothing else needs to change.

   CODE STRUCTURE — deliberately readable at a glance:

        RW-<TYPE><NN>-<NAME>

        TYPE   S = Staff / intern      (sales incentive on top of stipend)
               C = Creator partner     (Instagram / YouTube)
               A = Affiliate / other   (friends, communities, anyone)
        NN     a 2-digit serial within that type
        NAME   3-6 letters, so YOU can read a payout sheet without a lookup

   Examples:  RW-S01-FEBIN     RW-C01-TREKMD     RW-A01-RAHUL

   Why this shape:
     - You can tell WHO and WHAT TYPE from the code alone, in a spreadsheet,
       with no database lookup. That matters at payout time.
     - The type letter means you can total staff vs creator payouts instantly.
     - It is short enough to say out loud on a Reel and type on a phone.
     - It is NOT sequential across types, so nobody can guess the next code
       and no one learns your total partner count from their own code.

   RATE: stored per person as a decimal. 0.30 = 30%.
   Everyone is on 30% as promised. Keeping it per-person means you can honour
   a different deal later without touching code.
   ========================================================================= */
window.RW_REFERRERS = [

  /* ---- STAFF / INTERNS (sales incentive on top of internship) ---- */
  { code:'RW-S01-FEBIN',  name:'Febin',      type:'staff',   rate:0.30, active:true,
    note:'Growth & Community intern' },
  { code:'RW-S02-DEEPA',  name:'Deepanshi',  type:'staff',   rate:0.30, active:true,
    note:'Product & QA intern' },
  { code:'RW-S03-ADARS',  name:'Adarsh',     type:'staff',   rate:0.30, active:true,
    note:'Engineering intern' },

  /* ---- CREATOR PARTNERS (Instagram / YouTube) ---- */
  /* add as you sign them, e.g.:
  { code:'RW-C01-TREKMD', name:'TrekWithMadhu', type:'creator', rate:0.30, active:true,
    note:'IG @trekwithmadhu · 40k · Himalayan treks' },
  */

  /* ---- AFFILIATES / OTHERS ---- */
  /* { code:'RW-A01-RAHUL', name:'Rahul', type:'affiliate', rate:0.30, active:true }, */
];

/* Payout rules, shown to referrers so nothing is ambiguous later. */
window.RW_REFERRAL_TERMS = {
  ratePct: 30,
  currency: 'INR',
  holdDays: 7,          /* payout only after this many days, so refunds settle */
  minPayout: 500,       /* don't process tiny transfers; roll them forward     */
  cookieDays: 30,       /* how long a click stays attributed                   */
  selfReferralAllowed: false
};
