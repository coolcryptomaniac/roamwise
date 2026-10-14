/* Explicit admin-only rollout, separate from membership and partner settings. */
(function (root) {
  'use strict';
  var URL = 'https://roamwise-api.founder-f53.workers.dev/bhakti/access';
  function status(text) { document.getElementById('bhaktiAdminStatus').textContent = text; }
  function admin() { return typeof CURRENT_ADMIN !== 'undefined' && CURRENT_ADMIN && typeof db !== 'undefined' && db; }
  async function check() {
    if (!admin()) throw new Error('Admin sign-in is required.');
    var token = await CURRENT_ADMIN.getIdToken(), res = await fetch(URL, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
    if (!res.ok) throw new Error('The reviewed digital checkout Worker is not ready. Deploy and check it first.');
    var d = await res.json(), prices = { bhakti_mantra: 10, bhakti_aarti: 30, bhakti_paath: 60, bhakti_katha: 100, bhakti_yajna: 200, bhakti_parthiv: 300 };
    if (d.version !== 1 || d.uid !== CURRENT_ADMIN.uid || d.environment !== 'live') throw new Error('Live digital checkout could not be verified.');
    if (!Object.keys(prices).every(function (id) { return d.products && d.products[id] && d.products[id].price === prices[id]; })) throw new Error('Reviewed programme prices do not match the Worker.');
    return d;
  }
  root.rwBhaktiInspect = async function () { try { var d = await check(); status(d.checkoutEnabled ? 'Digital programme checkout is enabled. Pro and partner payment settings are unchanged.' : 'The digital Worker responds; new programme purchases are paused.'); } catch (e) { status(e.message); } };
  root.rwBhaktiSetEnabled = async function (enabled) {
    if (!admin()) return status('Admin sign-in is required.');
    try {
      if (enabled) {
        await check();
        var cfg = await db.collection('config').doc('app').get(), data = cfg.exists ? cfg.data() : {};
        if (data.PAYMENT_PROVIDER !== 'cashfree' || data.CASHFREE_ENVIRONMENT !== 'live') throw new Error('Existing live Cashfree configuration must be verified first.');
      }
      if (!root.confirm(enabled ? 'Enable real ₹10–₹300 one-time digital programme purchases after reviewing this release and testing checkout on a device? This does not sell temple services.' : 'Pause new digital programme purchases? Paid access and purchase recovery remain available.')) return;
      var batch = db.batch(), stamp = FV.serverTimestamp();
      batch.set(db.collection('config').doc('app'), { BHAKTI_CHECKOUT_ENABLED: enabled === true }, { merge: true });
      batch.set(db.collection('adminAuditLog').doc(), { action: 'bhakti.checkout-config', enabled: enabled === true, at: stamp, adminUid: CURRENT_ADMIN.uid });
      await batch.commit(); status(enabled ? 'Digital programme purchases enabled. Membership settings preserved.' : 'New digital purchases paused. Purchase recovery remains available.');
    } catch (e) { status(e.message); }
  };
})(window);
