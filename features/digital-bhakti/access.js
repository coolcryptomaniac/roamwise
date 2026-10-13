/* Verify account access against the existing Worker. No dedication names or local grants. */
(function (root) {
  'use strict';
  var API = 'https://roamwise-api.founder-f53.workers.dev', generation = 0, auth = null;
  var api = root.RWBhaktiAccess = { user: null, level: 0, checkoutEnabled: false, ready: false, error: '', environment: '', checkedAt: 0 };
  var CONFIG = { apiKey: 'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU', authDomain: 'roamwisepro.firebaseapp.com', projectId: 'roamwisepro', appId: '1:299014744987:web:d5c316743e6d7a10904f3e' };
  function announce() { root.dispatchEvent(new root.CustomEvent('rw-bhakti-access')); }
  api.allowed = function (level) { return !!api.user && api.ready && !api.error && api.level >= level && Date.now() - api.checkedAt < 3600000; };
  api.request = async function (path, options) {
    var user = api.user, at = generation; if (!user) throw new Error('Sign in to the same RoamWise account first.');
    var token = await user.getIdToken(), controller = new root.AbortController(), timeout = root.setTimeout(function () { controller.abort(); }, 15000);
    try {
      var settings = Object.assign({}, options || {}, { credentials: 'omit', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } });
      if (at !== generation || api.user !== user) throw new Error('Account changed. Check access again.');
      var response = await root.fetch(API + '/' + path, settings), text = await response.text();
      if (text.length > 30000) throw new Error('Could not verify the payment response.');
      var data; try { data = JSON.parse(text); } catch (e) { throw new Error('Secure payment service is unavailable. Please retry.'); }
      if (at !== generation || api.user !== user) throw new Error('Account changed. Check access again.');
      if (!response.ok) throw new Error(data.message || 'Secure access could not be verified. Please retry.');
      return data;
    } finally { root.clearTimeout(timeout); }
  };
  api.refresh = async function () {
    var at = generation; api.ready = false; api.level = 0; api.error = ''; announce();
    if (!api.user) { api.ready = true; announce(); return; }
    try {
      var d = await api.request('bhakti/access');
      if (at !== generation) return;
      if (d.version !== 1 || d.uid !== api.user.uid || !Number.isInteger(d.level) || d.level < 0 || d.level > 6) throw new Error('Programme access could not be verified.');
      if (!['live', 'sandbox'].includes(d.environment)) throw new Error('Checkout environment could not be verified.');
      for (var p of root.RWBhakti.products) {
        var server = d.products && d.products[p.id];
        if (!server || server.price !== p.price || server.level !== p.level) throw new Error('Programme prices are being updated. Please retry later.');
      }
      api.level = d.level; api.checkoutEnabled = d.checkoutEnabled === true; api.environment = d.environment; api.checkedAt = Date.now();
    } catch (e) { if (at !== generation) return; api.error = e.name === 'AbortError' ? 'Access check timed out. Please retry.' : e.message; api.checkoutEnabled = false; }
    api.ready = true; announce();
  };
  api.google = async function () {
    if (!auth) throw new Error('Sign-in is unavailable. Open RoamWise in your browser.');
    return auth.signInWithPopup(new root.firebase.auth.GoogleAuthProvider());
  };
  api.email = async function (email, password) {
    if (!auth) throw new Error('Sign-in is unavailable. Open RoamWise in your browser.');
    return auth.signInWithEmailAndPassword(email, password);
  };
  api.signout = function () { return auth ? auth.signOut() : Promise.resolve(); };
  if (root.firebase) {
    try {
      if (!root.firebase.apps.length) root.firebase.initializeApp(CONFIG); auth = root.firebase.auth();
      auth.onAuthStateChanged(function (user) { generation += 1; api.user = user && user.isAnonymous !== true ? user : null; api.checkoutEnabled = false; api.refresh(); });
    } catch (e) { api.error = 'Sign-in is unavailable. Open RoamWise in your browser.'; api.ready = true; announce(); }
  } else { api.ready = true; api.error = 'Sign-in is unavailable. Open RoamWise in your browser.'; }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && api.user && Date.now() - api.checkedAt > 60000) api.refresh(); });
  root.addEventListener('pagehide', function () { generation += 1; api.level = 0; api.ready = false; });
  root.addEventListener('pageshow', function (e) { if (e.persisted) api.refresh(); });
})(window);
