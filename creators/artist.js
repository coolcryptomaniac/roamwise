/* Generic artist page: /creators/artist.html?a=<artist id>. Everything comes from artists-data.json, so a new artist needs no code.
   Markup lives in artist-render.js (shared with tools/build-artist-pages.js, which writes the crawlable /creators/<id>/ pages). */
(function () {
  'use strict';
  var R = window.RWArtistRender, root = document.getElementById('artistRoot');
  var id = new URLSearchParams(location.search).get('a') || '';
  function render(d) {
    var a = R.find(d, id);
    if (!a) { root.innerHTML = '<section class="art-section"><h1>Artist not found</h1><p>We could not find that artist. <a href="/creators/gallery.html">See all artists</a>.</p></section>'; return; }
    if (a.page && a.page.indexOf('artist.html') < 0) { location.replace(a.page); return; }
    document.title = R.title(a); var m = document.querySelector('meta[name=description]'); if (m) m.setAttribute('content', R.description(a));
    root.innerHTML = R.html(d, a);
  }
  fetch('/creators/artists-data.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(render).catch(function () { root.innerHTML = '<p class="sa-note">This page could not load. <a href="/creators/gallery.html">See all artists</a>.</p>'; });
})();
