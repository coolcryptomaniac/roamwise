/* Homepage promo: two swipeable rows built from data/home-promo.json, partners-data.js and creators/artists-data.json.
   Stays: "Book now" opens the property's own WhatsApp (signed partners) or an enquiry (founder-introduced, agreement pending).
   Paintings: "Buy now" opens Natasha's WhatsApp with the painting and price filled in. Prices for stays only show when set in the JSON. */
(function () {
  'use strict';
  var host = document.getElementById('rwPromo'); if (!host) return;
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var wa = function (num, text) { return 'https://wa.me/' + num + '?text=' + encodeURIComponent(text); };
  function fetchJson(u) { return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  function partners() { var a = [].concat(/** @type {any} */ (window).RW_PARTNER_SEED || [], /** @type {any} */ (window).RW_PARTNERS || []), m = {}; a.forEach(function (p) { if (p && p.id) m[p.id] = p; }); return m; }
  /* Direct-rate badge: shown only when data/home-promo.json carries a dated, per-room comparison; the saving is computed, never typed. */
  function save(c) {
    var v = c.save; if (!v || !c.from || !(v.ota > c.from)) return '';
    var d = v.ota - c.from, pct = Math.round(100 * d / v.ota);
    return '<div class="rwx-save"><b>&#10003; Direct rate: &#8377;' + esc(d.toLocaleString('en-IN')) + ' (' + pct + '%) less than ' + esc(v.vs) + '</b><small>Same room, per night. ' + esc(v.vs) + ' &#8377;' + esc(Number(v.ota).toLocaleString('en-IN')) + ' incl. fees, checked ' + esc(v.checked) + '.</small></div>';
  }
  function chips(a) { return a && a.length ? '<ul class="rwx-chips">' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; }
  var inr = function (n) { return '&#8377;' + esc(Number(n).toLocaleString('en-IN')); };
  /* Long stays: one hero card, then one card per plan. Prices come from the property's own nomad record via RWNomadPlans. */
  function nomad(c, p) {
    var N = /** @type {any} */ (window).RWNomadPlans, ps = N && p && p.nomad && p.nomad.enabled ? N.plans(p.nomad) : [], ph = (p && p.photos) || [];
    if (!ps.length || !ph.length) return '';
    var img = function (i) { var x = ph[(c.photoOrder || [])[i % ph.length] != null ? c.photoOrder[i % ph.length] : i % ph.length] || ph[0]; return '<img loading="lazy" src="/' + esc(String(x.src).replace(/^\//, '')) + '" alt="' + esc(x.alt || p.name) + '">'; };
    var hero = '<article class="rwx-card rwx-nm" data-tilt><div class="rwx-img">' + img(0) + '<span class="rwx-tag">SIGNED ROAMWISE PARTNER</span><span class="rwx-ex rwx-ex-soft">WORKATION STAYS</span></div><div class="rwx-b"><h3>' + esc(p.name) + '</h3><div class="rwx-area">&#128205; ' + esc(c.area) + '</div><p>' + esc(c.hero) + '</p>' + chips(['Wi-Fi 100 Mbps (owner-told)', 'Inverter backup', 'Desk and chair', 'Quiet spot for calls']) + '<p class="rwx-swipe">Swipe for 15-night to 3-month plans &rarr;</p></div></article>';
    var cards = ps.map(function (pl, i) {
      var msg = 'Namaste ' + p.name + ', I found you on RoamWise. I am interested in the ' + pl.label + ' work stay (' + String(pl.total.toLocaleString('en-IN')) + ' rupees as shown). Check-in date: ____  Guests: ____. Please confirm availability, taxes and the final total.';
      var href = p.bookingWhatsapp ? wa(p.bookingWhatsapp, msg) : 'mailto:' + (p.supportEmail || 'support@roamwise.co.in') + '?subject=' + encodeURIComponent('Work stay enquiry: ' + p.name + ' (' + pl.label + ')') + '&body=' + encodeURIComponent(msg);
      return '<article class="rwx-card rwx-nm" data-tilt><div class="rwx-img">' + img(i + 1) + '<span class="rwx-tag">' + esc(pl.tag) + '</span><span class="rwx-price">' + inr(pl.total) + ' <small>/ ' + esc(pl.label) + '</small></span></div><div class="rwx-b"><h3>' + esc(pl.label) + ' at ' + esc(p.name) + '</h3><div class="rwx-area">About ' + inr(pl.perNight) + ' a night &middot; ' + esc(pl.note) + '</div>' + chips(pl.derived ? ['Not in the agreement: monthly rate x 2'] : ['Rate agreed with the hotel']) + '<a class="rwx-cta" target="_blank" rel="noopener" href="' + esc(href) + '">Enquire for this plan <span>&rarr;</span></a></div></article>';
    }).join('');
    return hero + cards;
  }
  function stay(c, p) {
    var photo = p.photos && p.photos[0], num = p.bookingWhatsapp, mail = p.supportEmail; if (!photo || !(num || mail)) return '';
    var price = c.from ? (c.to ? inr(c.from) + ' &ndash; ' + inr(c.to) : 'From ' + inr(c.from)) + ' <small>/ night' + (c.gst ? ' + GST' : '') + ', by room</small>' : 'Rates on WhatsApp';
    var msg = 'Namaste ' + p.name + ', I found you on RoamWise. ' + (c.ask || 'I would like to book') + '. Dates: ____  Guests: ____. Please share availability and the total.';
    var href = num ? wa(num, msg) : 'mailto:' + mail + '?subject=' + encodeURIComponent('Stay enquiry: ' + p.name) + '&body=' + encodeURIComponent(msg);
    return '<article class="rwx-card" data-tilt><div class="rwx-img"><img loading="lazy" src="/' + esc(String(photo.src).replace(/^\//, '')) + '" alt="' + esc(photo.alt || p.name) + '"><span class="rwx-tag">' + esc(c.tag) + '</span>' + (c.exclusive ? '<span class="rwx-ex">&#9733; EXCLUSIVE ROAMWISE TIE-UP</span>' : '') + '<span class="rwx-price">' + price + '</span></div><div class="rwx-b"><h3>' + esc(p.name) + '</h3><div class="rwx-area">&#128205; ' + esc(c.area) + '</div><p>' + esc(c.line) + '</p>' + chips(c.chips) + save(c) + '<a class="rwx-cta" target="_blank" rel="noopener" href="' + esc(href) + '">' + esc(c.cta) + ' <span>&rarr;</span></a></div></article>';
  }
  function art(a, w) {
    if (!a.whatsapp || !w.image) return ''; var price = w.price || 'Price on request';
    var msg = 'Namaste ' + a.name + ', I found you through RoamWise. I would like to buy "' + w.title + '" (' + price + '). Please share availability, shipping and payment details.';
    return '<article class="rwx-card rwx-art" data-tilt><div class="rwx-img"><img loading="lazy" src="' + esc(w.image) + '" alt="' + esc(w.title + ', an original painting by ' + a.name) + '"><span class="rwx-tag">' + esc((w.type || 'Original').toUpperCase()) + '</span><span class="rwx-price">' + esc(price) + '</span></div><div class="rwx-b"><h3>' + esc(w.title) + '</h3><div class="rwx-area">&#127912; ' + esc(a.name) + ' &middot; ' + esc(a.studio || '') + '</div><a class="rwx-cta" target="_blank" rel="noopener" href="' + esc(wa(a.whatsapp, msg)) + '">Buy now <span>&rarr;</span></a></div></article>';
  }
  /* The live partner list (Firestore, with the WhatsApp numbers owners gave on the join form) arrives after first paint.
     rwPromoRepaint() redraws only when one of the promoted partners' numbers changed, so cards upgrade from email to WhatsApp. */
  var lastSig = null;
  function sig() { var P = partners(), c = window.__rwPromoIds || []; return c.map(function (id) { return id + ':' + ((P[id] || {}).bookingWhatsapp || ''); }).join('|'); }
  function run() { Promise.all([fetchJson('/data/home-promo.json'), fetchJson('/creators/artists-data.json')]).then(function (r) {
    var cfg = r[0], data = r[1], P = partners();
    window.__rwPromoIds = (cfg.stays || []).map(function (c) { return c.partnerId; }).concat(cfg.nomad ? [cfg.nomad.partnerId] : []); lastSig = sig();
    var nm = cfg.nomad && P[cfg.nomad.partnerId] ? nomad(cfg.nomad, P[cfg.nomad.partnerId]) : '';
    var stays = (cfg.stays || []).map(function (c) { return P[c.partnerId] ? stay(c, P[c.partnerId]) : ''; }).join('');
    var a = (data.artists || []).filter(function (x) { return x.id === (cfg.art || {}).artistId; })[0], arts = '';
    if (a) arts = ((cfg.art || {}).artworkIds || []).map(function (id) { var w = (a.artworks || []).filter(function (x) { return x.id === id; })[0]; return w ? art(a, w) : ''; }).join('');
    if (!stays && !arts && !nm) { host.style.display = 'none'; return; }
    host.querySelector('.rwx-mount').innerHTML =
      (stays ? '<div class="rwx-row-h"><span>&#127968; STAY IN THE HILLS</span></div><div class="rwx-track" id="rwxStays">' + stays + '</div><div class="rwm-dots" id="rwxStaysDots"></div>' : '') +
      (nm ? '<div class="rwx-row-h"><span>&#128187; ' + esc(cfg.nomad.title) + '</span></div><div class="rwx-track" id="rwxNomad">' + nm + '</div><div class="rwm-dots" id="rwxNomadDots"></div><p class="rwx-fine">' + esc(cfg.nomad.note) + ' <a href="/nomads/">Compare all work stays &rarr;</a></p>' : '') +
      (arts ? '<div class="rwx-row-h"><span>&#127912; OWN A PAINTING &middot; NATASHA GULERIA</span></div><div class="rwx-track" id="rwxArt">' + arts + '</div><div class="rwm-dots" id="rwxArtDots"></div><p class="rwx-fine">Original and print art sold directly by the artist. <a href="/creators/artists.html">See the full collection &rarr;</a></p>' : '');
    function boot() { if (!/** @type {any} */ (window).rwCarousel) return setTimeout(boot, 200); ['Stays', 'Nomad', 'Art'].forEach(function (k) { var t = document.getElementById('rwx' + k); if (t) /** @type {any} */ (window).rwCarousel(t, { dots: document.getElementById('rwx' + k + 'Dots'), auto: k === 'Stays' ? 5200 : k === 'Nomad' ? 6000 : 4200 }); }); }
    boot();
  }).catch(function () { host.style.display = 'none'; }); }
  /** @type {any} */ (window).rwPromoRepaint = function () { if (lastSig !== null && sig() !== lastSig) run(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
