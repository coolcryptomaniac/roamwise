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

/* Collapsible nav groups: the "More" group stays closed until it holds the open tab. */
(function () {
  var nav = document.querySelector('.nav'); if (!nav) return;
  function set(g, open) { var h = nav.querySelector('.navh[data-group="' + g + '"]'), b = nav.querySelector('.navg[data-g="' + g + '"]'); if (!h || !b) return; b.classList.toggle('closed', !open); h.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  nav.addEventListener('click', function (e) {
    var h = e.target.closest && e.target.closest('.navh'); if (h) { set(h.dataset.group, h.getAttribute('aria-expanded') !== 'true'); return; }
    var b = e.target.closest && e.target.closest('button[data-page]'); var g = b && b.closest('.navg'); if (g) set(g.dataset.g, true);
  });
})();
