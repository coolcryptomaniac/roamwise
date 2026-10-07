/* Public payment address and MASKED operational defaults only. Never put bank
 * credentials, a full account number, statements or tax identifiers here. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RWBusinessAccount = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var profile = Object.freeze({
    id: 'hdfc-current-8061', label: 'HDFC current account •••• 8061',
    bank: 'HDFC Bank', branch: 'Almora', type: 'current',
    maskedAccount: '•••• 8061', ifsc: 'HDFC0001919',
    accountHolder: 'MOHIT PANDEY', upiId: 'roamwisepay@ybl',
    cutoverDate: '2026-10-07', currency: 'INR',
    entityStage: 'pre_incorporation',
    evidence: 'Founder-supplied Cashfree and linked-account screenshots, 2026-10-07',
    cashfreeSettlementState: 'active_in_supplied_screenshot',
    easySplitState: 'under_review', bankFeedConnected: false,
    transferVerificationState: 'not_recorded'
  });
  function paymentConfig(config) {
    var out = Object.assign({}, config || {});
    // Migrate only the retired platform VPA; preserve a future deliberate change.
    var vpa = String(out.publicUpiId || '').trim().toLowerCase();
    if (!vpa || vpa === 'roamwise@ybl') {
      out.publicUpiId = profile.upiId;
      out.publicPayeeName = profile.accountHolder;
    }
    if (!out.easySplitState || out.easySplitState === 'not_requested')
      out.easySplitState = profile.easySplitState;
    // No provider, environment, manual-UPI enablement or split activation here.
    return out;
  }
  function entryDefaults(date, method) {
    // This is a nominated source/destination, never bank-credit evidence.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || date < profile.cutoverDate ||
        !/^(upi|bank|cashfree)$/i.test(String(method || ''))) return {};
    return { businessAccountId: profile.id, businessAccountMasked: profile.maskedAccount,
      bankReconciliationState: 'pending', accountAttribution: 'default_unreconciled' };
  }
  function summary() {
    return profile.label + ' · UPI ' + profile.upiId +
      ' · operating default from 7 Oct 2026 until an explicit account/entity migration. ' +
      'Cashfree settlement active in supplied screenshot; Easy Split requested, awaiting approval. ' +
      'Bank feed not connected; bank credits and payouts require reconciliation.';
  }
  function mount() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('[data-rw-business-account]').forEach(function (el) {
      el.textContent = summary();
    });
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
  }
  return { profile: profile, paymentConfig: paymentConfig, entryDefaults: entryDefaults, summary: summary };
});
