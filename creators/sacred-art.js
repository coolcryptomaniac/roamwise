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
    data.artists.filter(function (a) { return a.plan !== 'free'; }).forEach(function (a) {
      var page = a.page || '/creators/artist.html?a=' + encodeURIComponent(a.id);
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

/* Buyer prospects for one artist: fills [data-artist-buyers="<artist id>"]. */
(function () {
  'use strict';
  var box = document.querySelector('[data-artist-buyers]'); if (!box) return;
  var id = box.getAttribute('data-artist-buyers');
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var https = function (u) { return /^https:\/\//i.test(u) ? u : '#'; };
  fetch('/creators/artists-data.json').then(function (r) { return r.json(); }).then(function (d) {
    var a = d.artists.filter(function (x) { return x.id === id; })[0];
    var rows = d.buyers.filter(function (b) { return (b.forArtists || []).indexOf(id) > -1; });
    box.innerHTML = rows.map(function (b) {
      var brief = 'Hello RoamWise team,\n\nPlease introduce ' + a.name + ' (' + a.studio + ') to ' + b.name + ' (' + b.city + ').\n\nWhy it may fit: ' + b.reasons.join('; ') + '.\nHer work: https://www.roamwise.co.in/creators/jagriti.html\nInstagram: ' + a.instagram + '\n\nNo commitment is implied by either side.';
      return '<article class="art-match"><span class="art-status">Research prospect</span><h3>' + esc(b.name) + '</h3><span class="art-small">' + esc(b.city) + ' · ' + esc(b.kind) + '</span><ul>' + b.reasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul><p class="art-small">' + esc(b.evidence) + '</p><a href="' + esc(https(b.sourceUrl)) + '" target="_blank" rel="noopener">Source ↗</a> <a href="' + esc(https(b.contactUrl)) + '" target="_blank" rel="noopener">Official ' + (b.contactType === 'official contact page' ? 'contact page' : 'site') + ' ↗</a> <a class="art-button" href="mailto:founder@roamwise.co.in?subject=' + encodeURIComponent('Introduction: ' + a.name + ' to ' + b.name) + '&body=' + encodeURIComponent(brief) + '">Request an introduction</a></article>';
    }).join('');
    var n = document.getElementById('artBuyersNote'); if (n) n.textContent = rows.length + ' organisations. ' + (d.buyersNote || '');
  }).catch(function () { box.innerHTML = '<p class="art-small">The list could not load.</p>'; });
})();
