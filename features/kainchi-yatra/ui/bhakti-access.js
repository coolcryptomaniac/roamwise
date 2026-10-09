/* Existing Bhakti entitlement seam, moved verbatim for shared devotional pages. */
(function (root) {
  'use strict';
  root.RWKainchiUI.isBhaktiPro = function () {
      var m = root.RoamWiseMembership || root.RWMembership || root.membership || {};
      var user = m.user || root.RoamWiseUser || root.currentUser || {};
      var localPro = false;
      try {
        localPro = root.localStorage && root.localStorage.getItem('rwPro') === '1';
        var activeUid = user.uid || (root.firebase && root.firebase.auth && root.firebase.auth().currentUser && root.firebase.auth().currentUser.uid);
        var entitlementUid = root.localStorage && root.localStorage.getItem('rw_pro_uid');
        if (activeUid && entitlementUid && entitlementUid !== activeUid) localPro = false;
      } catch (e) { localPro = false; }
      return m.isPro === true || m.plan === 'pro' || m.plan === 'founder' || user.isPro === true || user.plan === 'pro' || user.plan === 'founder' || document.body.getAttribute('data-membership') === 'pro' || localPro;
    };
})(window);
