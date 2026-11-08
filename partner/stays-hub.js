/* RoamWise Partner — stays list + in-app enquiries.
 * Shows EVERY signed, listing-ready stay from RW_PARTNER_SEED (merged with Firestore
 * config/partners for WhatsApp numbers), filters them by the search form, and replaces the
 * old third-party flight/car/things-to-do hand-offs with a RoamWise enquiry that goes to
 * RoamWise (WhatsApp if configured, else email) — never to an OTA. */
(function (root) {
  'use strict';
  var SUPPORT_EMAIL = (root.RW_PARTNER_CONFIG && root.RW_PARTNER_CONFIG.supportEmail) || 'support@roamwise.co.in';
  function groupUrl() { var c = (root.RW_PARTNER_CONFIG && root.RW_PARTNER_CONFIG.chat) || {}; return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(c.supportGroupUrl || '') ? c.supportGroupUrl : ''; }
  function groupLink() { var g = groupUrl(); return g ? '<p class="rw-stay-group">Questions? <a href="' + esc(g) + '" target="_blank" rel="noopener noreferrer">Join the RoamWise Customer group on WhatsApp ↗</a> or email <a href="mailto:' + esc(SUPPORT_EMAIL) + '">' + esc(SUPPORT_EMAIL) + '</a></p>' : ''; }
  var live = {}; /* id -> {bookingWhatsapp, bookingMode, ...} from config/partners */
  var loaded = false;

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function digits(v) { return String(v || '').replace(/\D/g, ''); }
  function norm(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function photoUrl(src) { if(typeof src!=='string')return ''; if(/^assets\/property-photos\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/i.test(src))return '../'+src; try { var u=new URL(src); return u.protocol==='https:' && ['assets.simplotel.com','nanauresort.com'].includes(u.hostname) ? u.href : ''; } catch(e){return '';} }
  function supportWa() { var c = (root.RW_PARTNER_CONFIG && root.RW_PARTNER_CONFIG.chat) || {}; return digits(c.supportWhatsapp); }

  function allStays() {
    var seed = Array.isArray(root.RW_PARTNER_SEED) ? root.RW_PARTNER_SEED : [];
    return seed.filter(function (p) { return p && p.cat === 'stay' && (root.rwStayPublicEligible ? root.rwStayPublicEligible(p) : p.verified === 'signed' && p.listingReady !== false); })
      .map(function (p) { return Object.assign({}, p, p.enquiryOnly ? {} : live[p.id] || {}); });
  }
  function whatsappOf(p) { var n = digits(p.bookingWhatsapp); return n && (!p.bookingMode || p.bookingMode === 'whatsapp') ? n : ''; }

  function matches(p, dest) {
    var d = norm(dest); if (!d) return true;
    var hay = norm([p.zone, p.area, p.name].join(' '));
    return d.split(' ').every(function (w) { return hay.indexOf(w) !== -1; });
  }
  function nights(ctx) { var a = new Date(ctx.checkin + 'T12:00:00'), b = new Date(ctx.checkout + 'T12:00:00'); var n = Math.round((b - a) / 864e5); return n > 0 ? n : 0; }
  function tripLine(ctx) { var n = nights(ctx); return (ctx.checkin || '?') + ' to ' + (ctx.checkout || '?') + (n ? ' (' + n + ' night' + (n > 1 ? 's' : '') + ')' : '') + ', ' + ctx.guests + ' guest' + (ctx.guests > 1 ? 's' : ''); }

  /* The RoamWise quote form (escapes) prefills from these params, so the guest never retypes dates. */
  function quoteUrl(p, ctx) {
    var q = { stay: p.name, zone: p.zone || '', start: ctx.checkin || '', end: ctx.checkout || '', guests: ctx.guests || '' };
    return '/escapes/?' + Object.keys(q).filter(function (k) { return q[k] !== ''; }).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&') + '#request-quote';
  }
  function openEnquiry(subject, body) {
    var wa = supportWa();
    if (wa) { root.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(body), '_blank', 'noopener,noreferrer'); return; }
    root.location.href = 'mailto:' + SUPPORT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function track(name) {
    try {
      if (typeof root.track === 'function') { root.track(name); return; }
      if (root.firebase && root.firebase.apps && root.firebase.apps.length) {
        var day = new Date().toISOString().slice(0, 10), inc = {}; inc[name] = root.firebase.firestore.FieldValue.increment(1);
        root.firebase.firestore().collection('stats').doc(day).set(inc, { merge: true }).catch(function () {});
      }
    } catch (e) { /* analytics must never break the page */ }
  }

  function badgeHtml(p) {
    if (p.enquiryOnly) return '<span class="rw-stay-pill">Founder introduced</span><span class="rw-stay-pill alt">Enquiry only</span>';
    var out = ['<span class="rw-stay-pill">RoamWise Partner</span>'];
    try {
      var T = root.RWTrust, B = root.RW_TRUST_BADGES;
      var ids = T && B ? T.assess(Object.assign({}, p, { routeType: whatsappOf(p) ? 'whatsapp' : (p.supportEmail ? 'direct' : 'none'), photoCount: (p.photos || []).length })).badges : [];
      ids.slice(0, 3).forEach(function (id) { if (B[id]) out.push('<span class="rw-stay-pill alt" title="' + esc(B[id].means) + '">' + esc(B[id].short) + '</span>'); });
    } catch (e) { /* badges are optional */ }
    return out.join('');
  }

  function card(p, ctx) {
    var ph = (p.photos || (p.heroImage ? [{src:p.heroImage,alt:p.name}] : [])).map(function (x) { return { src: photoUrl(x.src), alt: x.alt }; }).filter(function (x) { return x.src; })[0];
    var milan = root.RW_MILAN_PILOT && root.RW_MILAN_PILOT.isMilan(p.name);
    var price = milan ? '<p class="rw-stay-price"><b>Approx. ₹1,613–₹3,226 per room, per night</b></p>' : '<p class="rw-stay-price muted">Rate confirmed by the host for your dates.</p>';
    // Keep customer booking relationship at RoamWise. Do not route paid prospects to hosts.
    var pay = typeof root.rwBookingRoutes === 'function' ? root.rwBookingRoutes(p).filter(function (r) { return r.type === 'pay'; })[0] : null;
    var href = pay ? pay.href + (ctx.checkin ? '&checkin=' + encodeURIComponent(ctx.checkin) : '') + (ctx.checkout ? '&checkout=' + encodeURIComponent(ctx.checkout) : '') : quoteUrl(p, ctx);
    var action = '<a class="btn rw-stay-ask" data-stay-ask="' + esc(p.id) + '" href="' + esc(href) + '">' + (pay ? 'Book &amp; pay →' : 'Book through RoamWise →') + '</a>';
    var maps = p.mapsUrl ? ' <a class="rw-stay-map" href="' + esc(p.mapsUrl) + '" target="_blank" rel="noopener noreferrer">Map ↗</a>' : '';
    return '<article class="rw-stay-card" data-stay="' + esc(p.id) + '">' +
      (ph ? '<img class="rw-stay-img" loading="lazy" src="' + esc(ph.src) + '" alt="' + esc(ph.alt || p.name) + '">' : '') +
      '<div class="rw-stay-body"><span class="eyebrow">ROAMWISE STAY · ' + esc(String(p.zone || '').toUpperCase()) + '</span>' +
      '<h2>' + esc(p.name) + '</h2><p class="muted">' + esc(p.area || '') + maps + '</p><div class="rw-stay-badges">' + badgeHtml(p) + '</div>' +
      price + '<p>' + esc(p.hook || '') + '</p><div class="actions">' + action + '</div>' +
      '<small class="muted">RoamWise coordinates availability, your quotation and booking confirmation. A payment receipt alone does not guarantee a room.</small></div></article>';
  }

  function renderStays(h, ctx) {
    if (!h) return;
    var all = allStays(), hit = all.filter(function (p) { return matches(p, ctx.destination); });
    var head, list;
    if (hit.length) { head = '<p class="rw-stay-head"><b>' + hit.length + ' RoamWise stay' + (hit.length > 1 ? 's' : '') + (ctx.destination ? ' in ' + esc(ctx.destination) : '') + '</b> · ' + esc(tripLine(ctx)) + '</p>'; list = hit; }
    else { head = '<p class="rw-stay-head"><b>No RoamWise stay in “' + esc(ctx.destination) + '” yet.</b> Here are the places we do have:</p>'; list = all; }
    h.innerHTML = head + '<div class="rw-stay-list">' + list.map(function (p) { return card(p, ctx); }).join('') + '</div>' + groupLink();
    Array.prototype.forEach.call(h.querySelectorAll('[data-stay-ask]'), function (a) {
      a.addEventListener('click', function () { track('stay_roamwise_enquiry'); });
    });
  }

  var KINDS = {
    flight: { title: 'Flights', lead: 'Tell RoamWise where you are flying and we will find and confirm options for you.', from: true, to: true, ret: true },
    car: { title: 'Cars & drivers', lead: 'Local cab or self-drive. Share pick-up and drop and RoamWise will confirm a driver and price.', from: true, to: true, ret: false },
    experience: { title: 'Things to do', lead: 'Yoga, live culture, food, treks and rare moments. Tell us what you like and RoamWise will arrange it.', from: false, to: true, ret: false }
  };
  function renderOther(h, ctx, cat) {
    var k = KINDS[cat]; if (!h || !k) return;
    h.innerHTML = '<section class="card rw-enq"><span class="eyebrow">PLAN WITH ROAMWISE</span><h2>' + esc(k.title) + '</h2><p class="muted">' + esc(k.lead) + '</p>' +
      '<div class="fields">' + (k.from ? '<div class="field"><label>From</label><input id="enqFrom" placeholder="Delhi"></div>' : '') +
      '<div class="field"><label>' + (k.to ? 'To / where' : 'Where') + '</label><input id="enqTo" value="' + esc(ctx.destination || '') + '" placeholder="Almora, Manali…"></div>' +
      '<div class="field"><label>Date</label><input id="enqDate" type="date" value="' + esc(ctx.checkin) + '"></div>' +
      (k.ret ? '<div class="field"><label>Return</label><input id="enqRet" type="date" value="' + esc(ctx.checkout) + '"></div>' : '') +
      '<div class="field"><label>People</label><input id="enqPax" type="number" min="1" max="12" value="' + esc(ctx.guests) + '"></div>' +
      '<div class="field full"><label>Anything else</label><input id="enqNote" placeholder="Preferences, budget, timing"></div></div>' +
      '<div class="actions"><button class="btn" id="enqSend" type="button">Send to RoamWise →</button></div>' +
      '<small class="muted">RoamWise replies with options and a confirmed price. Nothing is booked or charged until you agree.</small>' + groupLink() + '</section>';
    var btn = h.querySelector('#enqSend');
    btn.addEventListener('click', function () {
      function v(id) { var e = h.querySelector(id); return e ? String(e.value || '').trim() : ''; }
      var body = 'Hello RoamWise, I need help with ' + k.title.toLowerCase() + '.' + (v('#enqFrom') ? ' From: ' + v('#enqFrom') + '.' : '') + ' To/where: ' + (v('#enqTo') || 'open') + '. Date: ' + (v('#enqDate') || 'flexible') + '.' + (v('#enqRet') ? ' Return: ' + v('#enqRet') + '.' : '') + ' People: ' + (v('#enqPax') || '1') + '.' + (v('#enqNote') ? ' Notes: ' + v('#enqNote') : '');
      track('partner_enquiry_' + cat); openEnquiry(k.title + ' enquiry', body);
    });
  }

  function loadLive(done) {
    if (loaded) { done(); return; }
    loaded = true;
    try {
      root.firebase.firestore().collection('config').doc('partners').get().then(function (d) {
        var list = d.exists && d.data() && Array.isArray(d.data().list) ? d.data().list : [];
        list.forEach(function (x) { if (x && x.id) live[x.id] = { bookingMode: x.bookingMode }; });
      }).catch(function () {}).then(done);
    } catch (e) { done(); }
  }

  root.RWStaysHub = {
    render: function (h, ctx, cat) { if (cat && cat !== 'stay') { renderOther(h, ctx, cat); return; } renderStays(h, ctx); loadLive(function () { if (Object.keys(live).length) renderStays(h, ctx); }); },
    allStays: allStays, matches: matches, quoteUrl: quoteUrl
  };
  if (typeof module === 'object' && module.exports) module.exports = root.RWStaysHub;
})(typeof window === 'undefined' ? globalThis : window);
