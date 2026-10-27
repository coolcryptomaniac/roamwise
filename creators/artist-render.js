/* Artist page markup, shared by the browser page (creators/artist.js) and the static page builder (tools/build-artist-pages.js).
   One source of truth: the HTML Google sees on /creators/<id>/ is exactly what the live page renders. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RWArtistRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var https = function (u) { return typeof u === 'string' && u.indexOf('https://') === 0 ? u : ''; };
  var img = function (u) { return typeof u === 'string' && (u.indexOf('/assets/') === 0 || u.indexOf('https://') === 0) ? u : ''; };
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
  function works(d, a) {
    var plan = a.plan || 'free', free = plan === 'free', cap = free ? ((d.plans && d.plans.free && d.plans.free.maxPaintings) || 6) : 24;
    var all = (a.artworks || []).filter(function (w) { return w.status !== 'Sold'; });
    return { all: all, shown: all.slice(0, cap), free: free };
  }
  function find(d, id) { return (d.artists || []).filter(function (x) { return x.id === id; })[0] || null; }
  function title(a) { return a.name + ' · ' + a.studio + ' | RoamWise'; }
  function description(a) { return a.name + ' (' + a.studio + ', ' + a.state + '): paintings, prices and how to enquire directly.'; }
  /* Enough real content for a search engine to index: a written bio and at least one available painting with a photo. */
  function indexable(d, a) { return !!(a.bio && works(d, a).shown.some(function (w) { return img(w.image); })); }
  function html(d, a) {
    var w = works(d, a), free = w.free, shown = w.shown;
    var tiers = !free && a.tiers && a.tiers.length ? '<section class="art-section"><span class="art-eyebrow">CUSTOM &amp; PRICE RANGES</span><h2>Commission or choose a size.</h2><div class="sa-grid">' + a.tiers.map(function (t) { return '<article class="sa-card"><div class="sa-ph" aria-hidden="true">&#127912;</div><div><h3>' + esc(t.title) + '</h3>' + (t.detail ? '<p>' + esc(t.detail) + '</p>' : '') + '<p class="sa-price">' + esc(t.price || '') + '</p><a class="sa-btn" href="' + esc(enquire(a, t)) + '" target="_blank" rel="noopener">Ask about this</a></div></article>'; }).join('') + '</div></section>' : '';
    var links = [https(a.instagram) && '<a href="' + esc(https(a.instagram)) + '" target="_blank" rel="noopener">Instagram ↗</a>', https(a.website) && '<a href="' + esc(https(a.website)) + '" target="_blank" rel="noopener">Website ↗</a>'].filter(Boolean).join(' · ');
    return "<aside class=\"art-buyer-notice\" aria-label=\"Before buying artwork\"><strong>Before you pay</strong><p>Buyers must independently verify the artist, artwork ownership and authenticity, original/print/digital format, condition, total price, payment recipient, delivery and refund terms before any transaction. Ask for recent artwork evidence and keep written records. You transact directly with the artist; RoamWise does not hold these payments or guarantee authenticity, delivery or refunds.</p><p>A RoamWise “Instagram profile checked” badge means we reviewed the linked public profile and its portfolio consistency. It is not Instagram/Meta verification, identity or ownership verification, or buyer protection. Featured, Ambassador and Founding Artist labels are not verification badges. <a href=\"mailto:support@roamwise.co.in?subject=Report%20artist%20or%20artwork\">Report a concern</a>.</p></aside>" + '<header class="art-hero"><div><span class="art-eyebrow">' + esc((a.role || 'ROAMWISE ARTIST').toUpperCase()) + '</span><h1>' + esc(a.name) + '<span>' + esc(a.studio) + ' · ' + esc(a.state) + '</span></h1>' +
      (a.bio ? '<p class="art-lead">' + esc(a.bio) + '</p>' : '') + '<div class="hub-chips">' + (a.themes || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<p class="art-actions"><a class="art-button" href="' + esc(enquire(a)) + '" target="_blank" rel="noopener">Enquire with ' + esc(a.name.split(' ')[0]) + '</a></p>' + (links ? '<p class="art-small">' + links + '</p>' : '') + '</div>' +
      (a.photo && img(a.photo.src) ? '<aside class="art-feature"><img class="art-photo" src="' + esc(img(a.photo.src)) + '" alt="' + esc(a.photo.alt || a.name) + '" width="480" height="480"></aside>' : '') + '</header>' +
      '<section class="art-section"><span class="art-eyebrow">PAINTINGS</span><h2>Available work.</h2>' + (shown.length ? '<div class="sa-grid">' + shown.map(function (x) { return work(a, x); }).join('') + '</div>' : '<p class="sa-note">New paintings are being added. Ask the artist directly above.</p>') +
      (w.all.length > shown.length ? '<p class="art-small">Showing ' + shown.length + ' of ' + w.all.length + '. Ask the artist for more.</p>' : '') + '</section>' + tiers +
      '<section class="art-section art-invite"><div><h2>Sold directly by the artist.</h2><p>RoamWise charges buyers nothing and is not a party to the sale. Price, payment, delivery and returns are agreed between you and the artist. ' + (a.shipping ? 'Shipping: ' + esc(a.shipping) + ' ' : '') + (a.returns ? 'Returns: ' + esc(a.returns) + ' ' : 'Ask about shipping and returns before paying; commissioned and made-to-order work is usually final sale. ') + 'Something wrong? <a href="mailto:support@roamwise.co.in?subject=' + encodeURIComponent('Report: ' + a.name) + '">Report this page</a>. <a href="/creators/artist-terms.html">Artist terms</a>.</p></div><a class="art-button" href="/creators/gallery.html">More artists</a></section>';
  }
  return { esc: esc, img: img, find: find, works: works, title: title, description: description, indexable: indexable, html: html };
});
