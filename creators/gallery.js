/* Artists gallery: every artist in artists-data.json, filterable by theme. Classic script, same-origin fetch. */
(function () {
  'use strict';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var safeImg = function (u) { return typeof u === 'string' && (u.indexOf('/assets/') === 0 || u.indexOf('https://') === 0) ? u : ''; };
  var grid = document.getElementById('hubGrid'), bar = document.getElementById('hubFilters'), all = [], active = '';
  function href(a) { return a.page || ('/creators/artist.html?a=' + encodeURIComponent(a.id)); }
  function badge(a) { var p = a.plan || 'free'; return '<span class="hub-badge' + (p === 'free' ? ' free' : '') + '">' + ({ ambassador: 'BRAND AMBASSADOR', featured: 'FEATURED ARTIST', founding: 'FOUNDING ARTIST', premium: 'PREMIUM', autopilot: 'ARTIST', free: 'ARTIST' }[p] || 'ARTIST') + '</span>'; }
  function card(a) {
    var img = a.photo && safeImg(a.photo.src) || ((a.artworks || []).filter(function (w) { return safeImg(w.image); })[0] || {}).image || '';
    var n = (a.artworks || []).length, themes = (a.themes || []).slice(0, 4).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    return '<a class="hub-card" href="' + esc(href(a)) + '">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(a.name) + ', ' + esc(a.studio) + '" loading="lazy" width="400" height="300">' : '<div class="hub-ph" aria-hidden="true">&#127912;</div>') +
      '<div class="hub-b">' + badge(a) + '<h3>' + esc(a.name) + '</h3><p>' + esc(a.studio) + ' · ' + esc(a.state) + (n ? ' · ' + n + ' paintings' : '') + '</p><div class="hub-chips">' + themes + '</div><span class="sa-link">View page &rarr;</span></div></a>';
  }
  function draw() {
    var list = all.filter(function (a) { return !active || (a.themes || []).some(function (t) { return String(t).toLowerCase() === active; }); });
    grid.innerHTML = list.length ? list.map(card).join('') : '<p class="sa-note">No artists with this theme yet.</p>';
  }
  function chips() {
    var seen = {}; all.forEach(function (a) { (a.themes || []).forEach(function (t) { seen[String(t).toLowerCase()] = String(t); }); });
    var keys = Object.keys(seen).sort(); bar.innerHTML = ['<button type="button" aria-pressed="true" data-t="">All</button>'].concat(keys.map(function (k) { return '<button type="button" aria-pressed="false" data-t="' + esc(k) + '">' + esc(seen[k]) + '</button>'; })).join('');
    bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; active = b.getAttribute('data-t'); Array.prototype.forEach.call(bar.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); draw(); });
  }
  fetch('/creators/artists-data.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    var rank = { ambassador: 0, featured: 1, premium: 2, founding: 3, autopilot: 4, free: 5 };
    all = d.artists.slice().sort(function (a, b) { return (rank[a.plan || 'free'] - rank[b.plan || 'free']); }); chips(); draw();
  }).catch(function () { grid.innerHTML = '<p class="sa-note">The artists could not load. Please try again.</p>'; });
})();
