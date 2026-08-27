/* ============================================================================
   RW_FINANCE — the books
   ============================================================================
   WHAT THIS IS: a proper append-only ledger with double-entry discipline, so
   every rupee has a source, a category and a date, and nothing can be edited
   after the fact. That is the part software can guarantee.

   WHAT THIS IS NOT, and it matters: this is NOT statutory accounting, and it
   does not make you compliant with anything. A chartered accountant files your
   returns; this gives them clean books to work from instead of a shoebox.
   Anyone who tells you software alone makes you "audit-proof" is selling you
   something. What it DOES do is make sure that when the CA, an investor or the
   IT department asks a question, the answer already exists and cannot have
   been quietly changed.

   THE ONE RULE: entries are immutable. A mistake is corrected by posting a
   REVERSING entry, never by editing history. That is what an auditor looks
   for, and it is enforced in the Firestore rules, not just here.
   ========================================================================= */

window.RW_ACCOUNTS = {
  /* Money coming in */
  rev_pro:      { type:'income',  label:'Pro subscriptions',      gst:'18' },
  rev_commission:{type:'income',  label:'Booking commission',     gst:'18' },
  rev_partner:  { type:'income',  label:'Partner onboarding fees',gst:'18' },
  rev_merch:    { type:'income',  label:'Merchandise',            gst:'12' },
  rev_ads:      { type:'income',  label:'Advertising',            gst:'18' },
  rev_other:    { type:'income',  label:'Other income',           gst:'18' },

  /* Money going out */
  exp_referral: { type:'expense', label:'Referral commission paid', tds:'194H' },
  exp_stipend:  { type:'expense', label:'Intern stipends',          tds:'192' },
  exp_contract: { type:'expense', label:'Contractors & verifiers',  tds:'194C' },
  exp_infra:    { type:'expense', label:'Hosting & software' },
  exp_travel:   { type:'expense', label:'Travel & field work' },
  exp_marketing:{ type:'expense', label:'Marketing & partnerships' },
  exp_legal:    { type:'expense', label:'Legal, CA & compliance' },
  exp_bank:     { type:'expense', label:'Payment gateway & bank charges' },
  exp_other:    { type:'expense', label:'Other expenses' },

  /* Not income or expense — money in and out that is not yours to keep */
  liab_gst:     { type:'liability', label:'GST collected (payable)' },
  liab_tds:     { type:'liability', label:'TDS deducted (payable)' },
  cap_invest:   { type:'equity',    label:'Investment received' }
};

/* Thresholds that actually matter for an Indian startup. Stated so the app can
   warn BEFORE a limit is crossed rather than after. Verify current values with
   your CA — these move with each Budget. */
window.RW_TAX_FLAGS = [
  { id:'gst_reg', label:'GST registration threshold',
    limit:2000000,
    note:'Services turnover above Rs 20 lakh in a financial year generally requires GST registration (Rs 10 lakh in some special-category states).' },
  { id:'tds_194h', label:'TDS on commission (194H)',
    limit:20000,
    note:'Commission or brokerage above roughly Rs 20,000 to one person in a year attracts TDS (Finance Act 2025 threshold). This applies to your referral payouts — confirm applicability to staff/creator payouts with your CA.' },
  { id:'tds_194c', label:'TDS on contractors (194C)',
    limit:30000,
    note:'A single contractor payment above Rs 30,000, or Rs 1,00,000 in aggregate for the year, attracts TDS.' },
  { id:'audit', label:'Tax audit threshold',
    limit:10000000,
    note:'Turnover above Rs 1 crore may require a tax audit under section 44AB (higher limit where cash transactions are minimal).' },
  { id:'prize_tds', label:'Prize / winnings TDS (194B)',
    limit:10000,
    note:'Prizes above Rs 10,000 attract TDS. This is why RoamWise contest prizes are set at Rs 5,000 / 3,000 / 2,000.' }
];

/* What a clean set of books needs for every single entry. */
window.RW_ENTRY_REQUIRED = ['date','account','amount','description','method'];
