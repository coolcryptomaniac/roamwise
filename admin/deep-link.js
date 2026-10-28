/* admin/deep-link.js - lets links such as /admin/#operations open that tab once signed in
   (the Command Center uses these). Clicks the existing nav button, so each tab's own start hook still runs. */
(function () {
  var app = document.getElementById('app'); if (!app) return;
  var last = '';
  function go() {
    var h = location.hash.slice(1);
    if (!h || h === last || app.classList.contains('hidden')) return;
    var b = document.querySelector('.nav button[data-page="' + h.replace(/[^a-z-]/g, '') + '"]');
    if (b) { last = h; b.click(); }
  }
  window.addEventListener('hashchange', function () { last = ''; go(); });
  new MutationObserver(go).observe(app, { attributes: true, attributeFilter: ['class'] });
  go();
})();
