/* js/ui/amor-offers.js - keeps the homepage Amor offers fresh every day without a deploy:
 * reads /stays/rates (server-side season ranking and prices), puts in-season packages first,
 * marks them "In season now", updates "From" prices and hides offers whose window has closed.
 * Static prices in index.html stay as the no-JS fallback (tools/build-amor-offers.mjs keeps them in sync). */
(function () {
  var API = 'https://roamwise-api.founder-f53.workers.dev/stays/rates';
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function apply(d) {
    var list = (d && d.packages) || [];
    ['rwSalesPackages', 'rwSalesWeddings'].forEach(function (trackId) {
      var track = document.getElementById(trackId); if (!track) return;
      list.forEach(function (k) {
        var card = track.querySelector('[data-rw-pkg="' + k.id + '"]'); if (!card) return;
        if (!k.open) { card.setAttribute('hidden', ''); return; }
        if (k.from) { var p = card.querySelector('.rw-price'); if (p) p.textContent = 'From ' + inr(k.from.total); }
        if (k.hot && !card.querySelector('.rw-hot')) { var b = document.createElement('span'); b.className = 'rw-deal rw-hot'; b.textContent = '🔥 In season now'; var c = card.querySelector('.rw-sales-copy'); if (c) c.insertBefore(b, c.firstChild); }
        track.appendChild(card); // server order: in season first
      });
    });
  }
  function run() { if (!document.getElementById('rwSalesPackages') || !window.fetch) return; fetch(API).then(function (r) { return r.ok ? r.json() : null; }).then(apply).catch(function () {}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
