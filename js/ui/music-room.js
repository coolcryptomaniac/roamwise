/* Home "Music Room": a swipeable row of album covers from /music/releases.json. Links into /music/#<id>. Text via textContent; no tracking. */
(function () {
  'use strict';
  var row = document.getElementById('rwmRow');
  if (!row) return;
  fetch('/music/releases.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    var list = Array.isArray(d) ? d : (d && d.releases) || [];
    var seen = {};
    list.filter(function (r) { return r && /^[A-Za-z0-9_-]{11}$/.test(r.id || '') && r.title && !seen[r.id] && (seen[r.id] = 1); })
      .sort(function (a, b) { return String(b.published || '').localeCompare(String(a.published || '')); })
      .slice(0, 14).forEach(function (r) {
        var a = document.createElement('a'); a.className = 'rwm-it'; a.href = '/music/#' + r.id; a.setAttribute('role', 'listitem');
        var c = document.createElement('div'); c.className = 'rwm-cov';
        var i = document.createElement('img'); i.loading = 'lazy'; i.alt = ''; i.src = 'https://i.ytimg.com/vi/' + r.id + '/hqdefault.jpg'; c.appendChild(i);
        var p = document.createElement('span'); p.className = 'rwm-play'; p.setAttribute('aria-hidden', 'true'); p.textContent = '▶'; c.appendChild(p);
        var t = document.createElement('div'); t.className = 'rwm-t'; t.textContent = r.title;
        a.appendChild(c); a.appendChild(t); row.appendChild(a);
      });
    if (!row.children.length) document.getElementById('rwMusic').hidden = true;
  }).catch(function () { var s = document.getElementById('rwMusic'); if (s) s.hidden = true; });
})();
