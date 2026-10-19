/* Sacred-art shelf for spiritual pages. Classic script, same-origin fetch only.
   Fills every [data-sacred-art] element from creators/artists-data.json. */
(function () {
  'use strict';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var num = function (s) { var n = parseInt(String(s).replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; };
  function wa(a, w) {
    var t = 'Namaste ' + a.studio + ' 🙏\n\nI found you through RoamWise (Sacred art). I would like to enquire about "' + w.title + '". Please share price, availability and delivery details.';
    return 'https://wa.me/' + a.whatsapp + '?text=' + encodeURIComponent(t);
  }
  function mail(a, w) {
    var t = 'Hello RoamWise team,\n\nI would like to enquire about a sacred painting from ' + a.name + ' (' + a.studio + '): ' + w.title + ' (' + w.price + ').\nPlease connect me with the artist.';
    return 'mailto:founder@roamwise.co.in?subject=' + encodeURIComponent('Sacred art enquiry: ' + a.name) + '&body=' + encodeURIComponent(t);
  }
  function card(a, w, href, cta, page) {
    return '<article class="sa-card">' + (w.image ? '<img src="' + esc(w.image) + '" alt="' + esc(w.title) + ' by ' + esc(a.name) + '" loading="lazy" width="400" height="400">' : '<div class="sa-ph" aria-hidden="true">ॐ</div>') +
      '<div><span class="sa-by">' + esc(a.name) + ' · ' + esc(a.studio) + '</span><h3>' + esc(w.title) + '</h3>' + (w.detail ? '<p>' + esc(w.detail) + '</p>' : '') +
      '<p class="sa-price">' + esc(w.price) + '</p><a class="sa-btn" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(cta) + '</a> <a class="sa-link" href="' + page + '">About the artist</a></div></article>';
  }
  function build(data, limit) {
    var out = [];
    data.artists.forEach(function (a) {
      var page = a.id === 'natasha-guleria' ? '/creators/artists.html' : '/creators/jagriti.html';
      (a.artworks || []).filter(function (w) { return w.status === 'Available' && w.type === 'Original' && num(w.price) > 0; })
        .forEach(function (w) { out.push({ k: num(w.price), h: card(a, w, wa(a, w), 'Enquire on WhatsApp', page) }); });
      (a.tiers || []).filter(function (t) { return t.sacred; }).forEach(function (t) {
        out.push({ k: t.range ? t.range[1] : 0, h: card(a, t, a.instagram, 'Ask via Instagram', page).replace('<a class="sa-link"', '<a class="sa-btn sa-alt" href="' + esc(mail(a, t)) + '">Ask RoamWise</a> <a class="sa-link"') });
      });
    });
    out.sort(function (x, y) { return y.k - x.k; });
    return out.slice(0, limit || out.length).map(function (x) { return x.h; }).join('');
  }
  var boxes = document.querySelectorAll('[data-sacred-art]');
  if (!boxes.length) return;
  fetch('/creators/artists-data.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    boxes.forEach(function (b) { b.innerHTML = build(d, parseInt(b.getAttribute('data-limit'), 10) || 0); });
  }).catch(function () {
    boxes.forEach(function (b) { b.innerHTML = '<p class="sa-note">The paintings could not load. <a href="/creators/sacred-art.html">Open the sacred art page</a>.</p>'; });
  });
})();
