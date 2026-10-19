/* Homepage "Painting of the week": keeps the static card in index.html in sync with `spotlight` in artists-data.json. */
(function () {
  'use strict';
  var card = document.getElementById('rwaSpot'); if (!card) return;
  (function reveal() {
    var els = [].slice.call(document.querySelectorAll('#brand-ambassador .rwa-r, #joinBand .rw-card'));
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('rwa-js');
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var d = (parseInt(e.target.getAttribute('data-i'), 10) || 0) * 90; setTimeout(function () { e.target.classList.add('in'); }, d); io.unobserve(e.target); } }); }, { threshold: .12 });
    els.forEach(function (el, i) { el.setAttribute('data-i', i % 4); io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { el.classList.add('in'); }); }, 6000);
  })();
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  fetch('/creators/artists-data.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    var s = d.spotlight; if (!s) return;
    var a = d.artists.filter(function (x) { return x.id === s.artistId; })[0], w = a && (a.artworks || []).filter(function (x) { return x.id === s.artworkId; })[0];
    if (!w || !w.image || w.image.indexOf('/assets/') !== 0) return;
    card.href = a.page || ('/creators/artist.html?a=' + encodeURIComponent(a.id));
    card.innerHTML = '<div class="rwa-imgw"><img src="' + esc(w.image) + '" width="900" height="900" alt="' + esc(w.title) + ', an original painting by ' + esc(a.name) + '" loading="lazy"></div><div class="rwa-b"><span class="rwa-k">' + esc((s.label || 'Painting of the week').toUpperCase()) + '</span><h3>' + esc(w.title) + '</h3><p>' + esc(s.note || (a.name + ', ' + a.studio)) + '</p><p class="rwa-pr">' + esc(w.type || 'Original') + ' &middot; ' + esc(w.price || '') + '</p><span class="rwa-go">See the painting &rarr;</span></div>';
  }).catch(function () {});
})();
