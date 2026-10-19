/* Generic artist page: /creators/artist.html?a=<artist id>. Everything comes from artists-data.json, so a new artist needs no code. */
(function () {
  'use strict';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var https = function (u) { return typeof u === 'string' && u.indexOf('https://') === 0 ? u : ''; };
  var img = function (u) { return typeof u === 'string' && (u.indexOf('/assets/') === 0 || u.indexOf('https://') === 0) ? u : ''; };
  var root = document.getElementById('artistRoot');
  var id = new URLSearchParams(location.search).get('a') || '';
  function enquire(a, w) {
    var what = w ? ' about "' + w.title + '"' : '';
    var t = 'Namaste ' + a.name + ' 🙏\n\nI found you through RoamWise. I would like to enquire' + what + '. Please share price, availability and delivery details.';
    if (/^\d{10,15}$/.test(String(a.whatsapp || ''))) return 'https://wa.me/' + a.whatsapp + '?text=' + encodeURIComponent(t);
    return 'mailto:founder@roamwise.co.in?subject=' + encodeURIComponent('Art enquiry: ' + a.name) + '&body=' + encodeURIComponent('Hello RoamWise team,\n\nI would like to connect with ' + a.name + (w ? ' about ' + w.title : '') + '. Please introduce us.');
  }
  function work(a, w) {
    var buy = https(w.url);
    return '<article class="sa-card">' + (img(w.image) ? '<img src="' + esc(img(w.image)) + '" alt="' + esc(w.title) + ' by ' + esc(a.name) + '" loading="lazy" width="400" height="400">' : '<div class="sa-ph" aria-hidden="true">&#127912;</div>') +
      '<div><span class="sa-by">' + esc(w.type || 'Original') + ' · ' + esc(w.status || 'Available') + '</span><h3>' + esc(w.title) + '</h3>' + (w.medium || w.size ? '<p>' + esc([w.medium, w.size].filter(Boolean).join(' · ')) + '</p>' : '') +
      '<p class="sa-price">' + esc(w.price || 'Price on request') + '</p><a class="sa-btn" href="' + esc(enquire(a, w)) + '" target="_blank" rel="noopener">Enquire</a>' + (buy ? ' <a class="sa-link" href="' + esc(buy) + '" target="_blank" rel="noopener">Artist’s site &rarr;</a>' : '') + '</div></article>';
  }
  function render(d) {
    var a = d.artists.filter(function (x) { return x.id === id; })[0];
    if (!a) { root.innerHTML = '<section class="art-section"><h1>Artist not found</h1><p>We could not find that artist. <a href="/creators/gallery.html">See all artists</a>.</p></section>'; return; }
    if (a.page && a.page.indexOf('artist.html') < 0) { location.replace(a.page); return; }
    var plan = a.plan || 'free', free = plan === 'free', cap = free ? ((d.plans && d.plans.free && d.plans.free.maxPaintings) || 6) : 24;
    document.title = a.name + ' · ' + a.studio + ' | RoamWise'; var m = document.querySelector('meta[name=description]'); if (m) m.setAttribute('content', a.name + ' (' + a.studio + ', ' + a.state + '): paintings, prices and how to enquire directly.');
    var works = (a.artworks || []).filter(function (w) { return w.status !== 'Sold'; }), shown = works.slice(0, cap);
    var tiers = !free && a.tiers && a.tiers.length ? '<section class="art-section"><span class="art-eyebrow">CUSTOM &amp; PRICE RANGES</span><h2>Commission or choose a size.</h2><div class="sa-grid">' + a.tiers.map(function (t) { return '<article class="sa-card"><div class="sa-ph" aria-hidden="true">&#127912;</div><div><h3>' + esc(t.title) + '</h3>' + (t.detail ? '<p>' + esc(t.detail) + '</p>' : '') + '<p class="sa-price">' + esc(t.price || '') + '</p><a class="sa-btn" href="' + esc(enquire(a, t)) + '" target="_blank" rel="noopener">Ask about this</a></div></article>'; }).join('') + '</div></section>' : '';
    var links = [https(a.instagram) && '<a href="' + esc(https(a.instagram)) + '" target="_blank" rel="noopener">Instagram ↗</a>', https(a.website) && '<a href="' + esc(https(a.website)) + '" target="_blank" rel="noopener">Website ↗</a>'].filter(Boolean).join(' · ');
    root.innerHTML = '<header class="art-hero"><div><span class="art-eyebrow">' + esc((a.role || 'ROAMWISE ARTIST').toUpperCase()) + '</span><h1>' + esc(a.name) + '<span>' + esc(a.studio) + ' · ' + esc(a.state) + '</span></h1>' +
      (a.bio ? '<p class="art-lead">' + esc(a.bio) + '</p>' : '') + '<div class="hub-chips">' + (a.themes || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<p class="art-actions"><a class="art-button" href="' + esc(enquire(a)) + '" target="_blank" rel="noopener">Enquire with ' + esc(a.name.split(' ')[0]) + '</a></p>' + (links ? '<p class="art-small">' + links + '</p>' : '') + '</div>' +
      (a.photo && img(a.photo.src) ? '<aside class="art-feature"><img class="art-photo" src="' + esc(img(a.photo.src)) + '" alt="' + esc(a.photo.alt || a.name) + '" width="480" height="480"></aside>' : '') + '</header>' +
      '<section class="art-section"><span class="art-eyebrow">PAINTINGS</span><h2>Available work.</h2>' + (shown.length ? '<div class="sa-grid">' + shown.map(function (w) { return work(a, w); }).join('') + '</div>' : '<p class="sa-note">New paintings are being added. Ask the artist directly above.</p>') +
      (works.length > shown.length ? '<p class="art-small">Showing ' + shown.length + ' of ' + works.length + '. Ask the artist for more.</p>' : '') + '</section>' + tiers +
      '<section class="art-section art-invite"><div><h2>Sold directly by the artist.</h2><p>RoamWise charges buyers nothing and is not a party to the sale. Price, payment, delivery and returns are agreed between you and the artist. ' + (a.shipping ? 'Shipping: ' + esc(a.shipping) + ' ' : '') + (a.returns ? 'Returns: ' + esc(a.returns) + ' ' : 'Ask about shipping and returns before paying; commissioned and made-to-order work is usually final sale. ') + 'Something wrong? <a href="mailto:support@roamwise.co.in?subject=' + encodeURIComponent('Report: ' + a.name) + '">Report this page</a>. <a href="/creators/artist-terms.html">Artist terms</a>.</p></div><a class="art-button" href="/creators/gallery.html">More artists</a></section>';
  }
  fetch('/creators/artists-data.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(render).catch(function () { root.innerHTML = '<p class="sa-note">This page could not load. <a href="/creators/gallery.html">See all artists</a>.</p>'; });
})();
