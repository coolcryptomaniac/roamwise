/* The Rope Team (/rope/): investors and advisors tied to one rope on a live view of the
   Kumaon Himalaya from Almora. People come from team-data.js (RW_TEAM, RW_INVESTORS,
   RW_ROPE_SEATS). The sky follows the real sun over Almora; the rope is a verlet
   simulation that reacts to pointer and touch. */
(function () {
  'use strict';
  var ALMORA = { lat: 29.5971, lon: 79.6591 };
  var FOUNDER_EMAIL = 'founder@roamwise.co.in';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(t) { return String(t == null ? '' : t).replace(/[<>&"']/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { u = String(u || ''); return /^(https?:\/\/|\/|mailto:)/i.test(u) ? u : ''; }
  function initials(n) { return String(n || '?').split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase(); }
  function monthLabel(ym) {
    var m = /^(\d{4})-(\d{2})/.exec(ym || ''); if (!m) return '';
    return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  /* ---------------- people ---------------- */
  var team = window.RW_TEAM || [];
  var founder = team.filter(function (p) { return /founder/i.test(p.role || ''); })[0] || team[0];
  var members = (window.RW_INVESTORS || []).slice().sort(function (a, b) { return String(a.joined || '9999').localeCompare(String(b.joined || '9999')); });
  var seats = window.RW_ROPE_SEATS || [];
  var climbers = [];
  if (founder) climbers.push({ type: 'lead', p: founder });
  members.forEach(function (m) { climbers.push({ type: 'member', p: m }); });
  seats.forEach(function (s) { climbers.push({ type: 'seat', p: s }); });

  var ICON = {
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 7.5A2.3 2.3 0 1 0 5.2 3a2.3 2.3 0 0 0 0 4.5ZM3.3 21h3.8V9H3.3v12Zm6.2-12H13v1.6h.1c.5-.9 1.7-2 3.5-2 3.8 0 4.5 2.5 4.5 5.7V21h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1v6H9.5V9Z"/></svg>',
    website: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15.7 15.7 0 0 0-1.3-3.9A8 8 0 0 1 18.9 8ZM12 4c.8 1.1 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.9 1.9-4ZM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3Zm.8 2h3a15.7 15.7 0 0 0 1.3 3.9A8 8 0 0 1 5.1 16Zm3-8h-3a8 8 0 0 1 4.3-3.9C7.9 5.3 7.5 6.6 7.1 8ZM12 20c-.8-1.1-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.9-1.9 4Zm2.3-6H9.7a14.6 14.6 0 0 1 0-4h4.6a14.6 14.6 0 0 1 0 4Zm.3 5.9c.6-1.2 1-2.5 1.3-3.9h3a8 8 0 0 1-4.3 3.9Zm1.7-5.9a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.2L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>'
  };

  var CHOWKI = '<svg class="chowki-art" viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" rx="6" fill="#8f2a22"/><rect x="7" y="7" width="106" height="106" fill="none" stroke="#f6efe2" stroke-width="1.6"/><rect x="12" y="12" width="96" height="96" fill="none" stroke="#f6efe2" stroke-width="0.9"/><circle cx="17.0" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="26.6" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="26.6" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="26.6" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="26.6" r="1.3" fill="#f6efe2"/><circle cx="36.2" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="36.2" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="36.2" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="36.2" r="1.3" fill="#f6efe2"/><circle cx="45.8" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="45.8" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="45.8" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="45.8" r="1.3" fill="#f6efe2"/><circle cx="55.4" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="55.4" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="55.4" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="55.4" r="1.3" fill="#f6efe2"/><circle cx="65.0" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="65.0" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="65.0" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="65.0" r="1.3" fill="#f6efe2"/><circle cx="74.6" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="74.6" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="74.6" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="74.6" r="1.3" fill="#f6efe2"/><circle cx="84.2" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="84.2" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="84.2" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="84.2" r="1.3" fill="#f6efe2"/><circle cx="93.8" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="93.8" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="93.8" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="93.8" r="1.3" fill="#f6efe2"/><circle cx="103.4" cy="17.0" r="1.3" fill="#f6efe2"/><circle cx="103.4" cy="103.0" r="1.3" fill="#f6efe2"/><circle cx="17.0" cy="103.4" r="1.3" fill="#f6efe2"/><circle cx="103.0" cy="103.4" r="1.3" fill="#f6efe2"/><path d="M60 24 96 60 60 96 24 60Z" fill="none" stroke="#f6efe2" stroke-width="1.2"/><ellipse cx="60" cy="44" rx="5.2" ry="13" fill="none" stroke="#f6efe2" stroke-width="1.3" transform="rotate(0 60 60)"/><circle cx="60" cy="27.5" r="1.4" fill="#f6efe2" transform="rotate(22.5 60 60)"/><ellipse cx="60" cy="44" rx="5.2" ry="13" fill="none" stroke="#f6efe2" stroke-width="1.3" transform="rotate(45 60 60)"/><circle cx="60" cy="27.5" r="1.4" fill="#f6efe2" transform="rotate(67.5 60 60)"/><ellipse cx="60" cy="44" rx="5.2" ry="13" fill="none" stroke="#f6efe2" stroke-width="1.3" transform="rotate(90 60 60)"/><circle cx="60" cy="27.5" r="1.4" fill="#f6efe2" transform="rotate(112.5 60 60)"/><ellipse cx="60" cy="44" rx="5.2" ry="13" fill="none" stroke="#f6efe2" stroke-width="1.3" transform="rotate(135 60 60)"/><circle cx="60" cy="27.5" r="1.4" fill="#f6efe2" transform="rotate(157.5 60 60)"/><ellipse cx="60" cy="44" rx="5.2" ry="13" fill="none" stroke="#f6efe2" stroke-width="1.3" transform="rotate(180 60 60)"/><circle cx="60" cy="27.5" r="1.4" fill="#f6efe2" transform="rotate(202.5 60 60)"/><ellipse cx="60" cy="44" rx="5.2" ry="13" fill="none" stroke="#f6efe2" stroke-width="1.3" transform="rotate(225 60 60)"/><circle cx="60" cy="27.5" r="1.4" fill="#f6efe2" transform="rotate(247.5 60 60)"/><ellipse cx="60" cy="44" rx="5.2" ry="13" fill="none" stroke="#f6efe2" stroke-width="1.3" transform="rotate(270 60 60)"/><circle cx="60" cy="27.5" r="1.4" fill="#f6efe2" transform="rotate(292.5 60 60)"/><ellipse cx="60" cy="44" rx="5.2" ry="13" fill="none" stroke="#f6efe2" stroke-width="1.3" transform="rotate(315 60 60)"/><circle cx="60" cy="27.5" r="1.4" fill="#f6efe2" transform="rotate(337.5 60 60)"/><circle cx="60" cy="60" r="7" fill="#f6efe2"/><circle cx="60" cy="60" r="2.4" fill="#8f2a22"/><path d="M24 19L29 24L24 29L19 24Z" fill="#f6efe2"/><path d="M96 19L101 24L96 29L91 24Z" fill="#f6efe2"/><path d="M24 91L29 96L24 101L19 96Z" fill="#f6efe2"/><path d="M96 91L101 96L96 101L91 96Z" fill="#f6efe2"/></svg>';
  function tieMail(seat) {
    var subject = 'Tying in: ' + seat.title + ' (' + seat.kind.toLowerCase() + ')';
    var body = 'Hi Mohit,\n\nI saw the open ' + seat.title + ' seat on the RoamWise rope.\n\nAbout me:\nWhere I can help:\nLinkedIn:\n';
    return 'mailto:' + FOUNDER_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function climberHTML(c, i) {
    var p = c.p, out = '', links = '';
    if (c.type === 'seat') {
      links = '<a class="tie" href="' + tieMail(p) + '">Apply for this seat</a>';
      if (/investor/i.test(p.kind)) links += '<a href="/invest/">Read the round terms</a>';
      return '<li class="climber open" id="c-' + i + '">'
        + '<div class="portrait chowki">' + CHOWKI + '</div>'
        + '<div class="who"><div class="altitude">Open seat for an ' + esc(p.kind.toLowerCase()) + '</div><h3>' + esc(p.title) + '</h3>'
        + '<p class="holds">' + esc(p.need) + '</p><div class="links">' + links + '</div></div></li>';
    }
    var l = p.links || {};
    if (safeUrl(l.linkedin)) links += '<a href="' + esc(safeUrl(l.linkedin)) + '" target="_blank" rel="noopener noreferrer">' + ICON.linkedin + 'LinkedIn</a>';
    if (safeUrl(l.twitter)) links += '<a href="' + esc(safeUrl(l.twitter)) + '" target="_blank" rel="noopener noreferrer">' + ICON.twitter + 'X</a>';
    if (safeUrl(l.website)) links += '<a href="' + esc(safeUrl(l.website)) + '"' + (/^https?:/i.test(l.website) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + ICON.website + 'Website</a>';
    if (l.email && c.type === 'lead') links += '<a href="mailto:' + esc(l.email) + '">' + ICON.email + esc(l.email) + '</a>';
    var photo = safeUrl(p.photo)
      ? '<img src="' + esc(safeUrl(p.photo)) + '" alt="Portrait of ' + esc(p.name) + '" loading="lazy" decoding="async" style="object-position:' + esc(p.photoPosition || '50% 35%') + '">'
      : '<span class="mono" aria-hidden="true">' + esc(initials(p.name)) + '</span>';
    var alt = c.type === 'lead' ? 'Lead climber' : ((p.kind || 'Backer') + (p.joined ? ', tied in ' + monthLabel(p.joined) : ''));
    out += '<li class="climber" id="c-' + i + '"><div class="portrait">' + photo + '</div><div class="who">'
      + '<div class="altitude">' + esc(alt) + '</div><h3>' + esc(p.name) + '</h3>'
      + '<p class="role">' + esc(p.role || '') + '</p>'
      + (p.holds ? '<p class="holds"><strong>Helps with</strong> ' + esc(p.holds) + '</p>' : '')
      + (p.bio ? '<p class="bio">' + esc(p.bio) + '</p>' : '')
      + (p.note ? '<blockquote class="note">' + esc(p.note) + '</blockquote>' : '')
      + (links ? '<div class="links">' + links + '</div>' : '') + '</div></li>';
    return out;
  }

  document.getElementById('ropeOut').innerHTML = climbers.map(climberHTML).join('');
  var lede = document.getElementById('ropeLede');
  if (!members.length) lede.textContent = 'Mohit leads the rope. In Kumaon, an Aipan chowki is drawn on the floor to welcome a guest to their seat. Each chowki below is a seat on the rope still waiting for the right person.';
  else lede.textContent = members.length + (members.length === 1 ? ' person has' : ' people have') + ' tied in behind the founder. Open seats are shown as they are: open.';
  var ledger = document.getElementById('ledger');
  ledger.innerHTML = members.length
    ? '<b>The knot ledger.</b> ' + members.map(function (m) { return esc(m.name) + ' (' + esc((m.kind || 'Backer').toLowerCase()) + (m.joined ? ', ' + esc(monthLabel(m.joined)) : '') + ')'; }).join('; ') + '.'
    : '<b>The knot ledger is empty.</b> The first investor or advisor to sign will be the first name written here, with the date.';

  /* ---------------- sun over Almora ---------------- */
  function sun(date) {
    var rad = Math.PI / 180, d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
    var g = (357.529 + 0.98560028 * d) * rad, q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, e = (23.439 - 0.00000036 * d) * rad;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    var gmst = (18.697374558 + 24.06570982441908 * d) % 24, lst = (gmst + ALMORA.lon / 15) * 15 * rad;
    var ha = lst - ra, lat = ALMORA.lat * rad;
    var el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / rad;
    var morning = Math.sin(ha) < 0;
    return { el: el, morning: morning };
  }
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { t = Math.max(0, Math.min(1, t)); var A = hex(a), B = hex(b); return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')'; }
  function mixRGB(a, b, t) { var A = hex(a), B = hex(b); return A.map(function (v, i) { return Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, t))); }); }
  function rgbStr(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  function toHex(c) { return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
  // sky by solar elevation: [elevation, top, horizon]; dusk tones follow the Almora alpenglow reference
  var SKY = [
    [-18, '#04071a', '#0d1330'],
    [-8, '#0f1748', '#262c6a'],
    [-2, '#212c7a', '#6f56a6'],
    [3, '#283a8c', '#e08d6c'],
    [10, '#3762b0', '#f1c7a0'],
    [25, '#3d78c4', '#b8d3ec'],
    [90, '#3270bd', '#a8c8e6']
  ];
  // layer tints (multiply) and alpenglow strength: [elevation, snow, glow, hills, ridge]
  var TINT = [
    [-18, '#3b4777', 0, '#262f52', '#1a2033'],
    [-8, '#56609c', 0, '#343d6c', '#22283e'],
    [-2, '#b39ccc', 0.2, '#66689e', '#383a56'],
    [3, '#ffd3bd', 0.42, '#9894c0', '#5a5c6c'],
    [10, '#fff2e6', 0.14, '#dcdeea', '#a3a49a'],
    [25, '#ffffff', 0, '#ffffff', '#ffffff'],
    [90, '#ffffff', 0, '#ffffff', '#ffffff']
  ];
  function lerpStops(T, el) {
    for (var i = 0; i < T.length - 1; i++) {
      var a = T[i], b = T[i + 1];
      if (el <= b[0] || i === T.length - 2) {
        var t = Math.max(0, Math.min(1, (el - a[0]) / (b[0] - a[0])));
        return a.slice(1).map(function (v, k) { return typeof v === 'number' ? v + (b[k + 1] - v) * t : mixRGB(v, b[k + 1], t); });
      }
    }
  }

  /* ---------------- scene: live sky + painted layers ---------------- */
  var canvas = document.getElementById('sky'), ctx = canvas.getContext('2d');
  var skyC = document.createElement('canvas'), skyX = skyC.getContext('2d');
  var W = 0, H = 0, DPR = 1, S = null, anchors = [], rope = [], imgs = {};
  var L = { snow: {}, hills: {}, ridge: {} }, G = null, par = { x: 0, tx: 0 };
  // where the peaks sit in the snow painting (fraction of its width), west to east as seen from Almora
  var PEAKS = [
    { name: 'Chaukhamba', m: '7,138 m', x: 0.125 }, { name: 'Trishul', m: '7,120 m', x: 0.3 },
    { name: 'Nanda Devi', m: '7,816 m', x: 0.452 }, { name: 'Nanda Kot', m: '6,861 m', x: 0.66 },
    { name: 'Panchachuli', m: '6,904 m', x: 0.86 }
  ];
  function loadLayer(name) {
    return new Promise(function (res) {
      var im = new Image(); im.decoding = 'async';
      im.onload = function () { res(im); }; im.onerror = function () { res(null); };
      im.src = '/rope/img/' + name + (window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) > 1400 ? '' : '-sm') + '.webp';
    });
  }
  function crestOf(im) { // first opaque row per column, as a fraction of image height
    var c = document.createElement('canvas'), w = 400, h = Math.round(400 * im.height / im.width);
    c.width = w; c.height = h; var x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, out = new Float32Array(w);
    for (var i = 0; i < w; i++) { var y = 0; while (y < h && d[(y * w + i) * 4 + 3] < 140) y++; out[i] = y / h; }
    return out;
  }
  function geometry() {
    var lw = Math.max(W, H * 1.3), mob = W < 640;
    var g = { lw: lw, x: (W - lw) / 2 };
    function place(key, bottom) {
      var im = L[key].img; if (!im) return;
      var h = lw * im.height / im.width; g[key] = { y: H * bottom - h, h: h };
    }
    place('snow', mob ? 0.72 : 0.68); place('hills', mob ? 0.88 : 0.87); place('ridge', 1.02);
    return g;
  }
  function crestY(key, sx) { // screen y of a layer's crest at screen x
    var l = L[key], g = G[key]; if (!l.crest || !g) return H * 0.8;
    var u = (sx - G.x) / G.lw, i = Math.max(0, Math.min(l.crest.length - 1, Math.round(u * (l.crest.length - 1))));
    return g.y + l.crest[i] * g.h;
  }
  function tintLayer(key, mul, glow) {
    var l = L[key], g = G[key]; if (!l.img || !g) return;
    var c = l.c || (l.c = document.createElement('canvas')), x = c.getContext('2d');
    c.width = Math.round(G.lw * DPR); c.height = Math.round(g.h * DPR);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over';
    x.drawImage(l.img, 0, 0, c.width, c.height);
    if (mul.join() !== '255,255,255') { x.globalCompositeOperation = 'multiply'; x.fillStyle = rgbStr(mul); x.fillRect(0, 0, c.width, c.height); }
    if (glow > 0.01) { // alpenglow: warm light on the upper snow, the side the sun is on stronger
      var gr = x.createLinearGradient(S.s.morning ? c.width : 0, 0, S.s.morning ? 0 : c.width, c.height * 0.55);
      gr.addColorStop(0, 'rgba(255,150,96,' + glow + ')'); gr.addColorStop(0.6, 'rgba(255,170,140,' + glow * 0.55 + ')'); gr.addColorStop(1, 'rgba(255,170,140,0)');
      x.globalCompositeOperation = 'screen'; x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
    }
    x.globalCompositeOperation = 'destination-in'; x.drawImage(l.img, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
  }
  function paintBackground() {
    if (!W) return;
    var s = sun(new Date()), sky = lerpStops(SKY, s.el), tint = lerpStops(TINT, s.el);
    S = { s: s }; G = geometry();
    skyC.width = W * DPR; skyC.height = H * DPR; skyX.setTransform(DPR, 0, 0, DPR, 0, 0);
    var g = skyX.createLinearGradient(0, 0, 0, H * 0.62);
    g.addColorStop(0, rgbStr(sky[0])); g.addColorStop(1, rgbStr(sky[1]));
    skyX.fillStyle = g; skyX.fillRect(0, 0, W, H);
    if (s.el > -10) {
      var gx = s.morning ? W * 1.05 : -W * 0.05, gy = H * 0.45 - Math.max(0, s.el) * H * 0.01;
      var glow = skyX.createRadialGradient(gx, gy, 0, gx, gy, W * 0.75), warm = s.el < 12 ? 0.4 : 0.14;
      glow.addColorStop(0, 'rgba(255,190,130,' + warm + ')'); glow.addColorStop(1, 'rgba(255,190,130,0)');
      skyX.fillStyle = glow; skyX.fillRect(0, 0, W, H);
    }
    var starA = Math.max(0, Math.min(1, (-4 - s.el) / 10));
    if (starA > 0) {
      var r = rnd(42);
      for (var i = 0; i < 320; i++) {
        var sx = r() * W, sy = r() * H * 0.5, sz = r() * 1.4 + 0.3;
        skyX.fillStyle = 'rgba(238,241,244,' + (starA * (0.3 + r() * 0.7)) + ')'; skyX.fillRect(sx, sy, sz, sz);
      }
    }
    tintLayer('snow', tint[0], tint[1]); tintLayer('hills', tint[2], 0); tintLayer('ridge', tint[3], 0);
    var t2 = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    var where = s.el >= 0 ? 'sun ' + Math.round(s.el) + '° above the horizon' : 'sun ' + Math.round(-s.el) + '° below the horizon';
    document.getElementById('skyCaption').innerHTML = 'The sky over Almora right now: <b>' + esc(t2) + '</b>, ' + esc(where) + '. Peaks as seen from Kasar Devi.';
  }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* ---------------- rope (verlet) ---------------- */
  function layout() {
    var n = climbers.length; if (!n || !G) return;
    // climbers stand on the open crest of the foreground ridge; the lead is highest, on the right
    var vis0 = Math.max(0, -G.x) / G.lw, vis1 = Math.min(1, (W - G.x) / G.lw);
    var u0 = Math.max(0.42, vis0 + 0.05), u1 = Math.min(0.95, vis1 - 0.07);
    if (W < 640) u0 = vis0 + (vis1 - vis0) * 0.08;
    anchors = climbers.map(function (c, i) {
      var u = n === 1 ? u1 : u1 - (u1 - u0) * (i / (n - 1)), x = G.x + u * G.lw;
      return { x: x, y: crestY('ridge', x) - 16, c: c, i: i };
    });
    rope = [];
    for (var k = 0; k < anchors.length - 1; k++) {
      var a = anchors[k], b = anchors[k + 1], dist = Math.hypot(b.x - a.x, b.y - a.y);
      var segs = Math.max(6, Math.round(dist / 9)), rest = dist * 1.12 / segs, pts = [];
      for (var j = 0; j <= segs; j++) {
        var t = j / segs, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        pts.push({ x: x, y: y, px: x, py: y, pin: j === 0 || j === segs });
      }
      rope.push({ pts: pts, rest: rest });
    }
    for (var s = 0; s < (reduce ? 400 : 120); s++) step(0);
    var host = document.getElementById('anchors');
    host.innerHTML = anchors.map(function (a) {
      var c = a.c, label = c.type === 'seat' ? 'Open seat: ' + c.p.title + ' ' + c.p.kind.toLowerCase() : c.p.name + ', ' + (c.p.role || '');
      return '<button class="anchor" type="button" data-i="' + a.i + '" style="left:' + a.x + 'px;top:' + a.y + 'px" aria-label="' + esc(label) + '. Show details"></button>';
    }).join('');
  }
  var pointer = { x: -999, y: -999, vx: 0, vy: 0, t: 0 };
  function step(time) {
    var wind = reduce ? 0 : Math.sin(time / 1300) * 0.03 + Math.sin(time / 470) * 0.012;
    rope.forEach(function (r) {
      r.pts.forEach(function (p) {
        if (p.pin) return;
        var vx = (p.x - p.px) * 0.985, vy = (p.y - p.py) * 0.985;
        p.px = p.x; p.py = p.y; p.x += vx + wind; p.y += vy + 0.32;
        var dx = p.x - pointer.x, dy = p.y - pointer.y;
        if (dx * dx + dy * dy < 3600 && time - pointer.t < 120) { p.x += pointer.vx * 0.35; p.y += pointer.vy * 0.35; }
      });
      for (var it = 0; it < 6; it++) {
        for (var j = 0; j < r.pts.length - 1; j++) {
          var a = r.pts[j], b = r.pts[j + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
          if (d <= r.rest) continue;
          var diff = (d - r.rest) / d * 0.5;
          if (!a.pin) { a.x += dx * diff; a.y += dy * diff; }
          if (!b.pin) { b.x -= dx * diff; b.y -= dy * diff; }
        }
      }
    });
  }
  function photoFor(p) {
    var u = safeUrl(p.photo); if (!u) return null;
    if (!imgs[u]) { var im = new Image(); im.decoding = 'async'; im.onload = function () { if (reduce) draw(); }; im.src = u; imgs[u] = im; }
    return imgs[u].complete && imgs[u].naturalWidth ? imgs[u] : null;
  }
  function drawLayer(key, shift) {
    var l = L[key], g = G && G[key]; if (!l.c || !g) return;
    ctx.drawImage(l.c, G.x + shift, g.y, G.lw, g.h);
  }
  function draw() {
    if (!G) return;
    par.x += (par.tx - par.x) * 0.06;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(skyC, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawLayer('snow', par.x * -7);
    if (W >= 640 && L.snow.crest && G.snow) { // peak names, quiet
      ctx.font = '500 12px "Familjen Grotesk", system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = S.s.el > 6 ? 'rgba(22,32,44,.62)' : 'rgba(238,241,244,.6)';
      PEAKS.forEach(function (p) {
        var px = G.x + p.x * G.lw + par.x * -7; if (px < 60 || px > W - 60) return;
        ctx.fillText(p.name + ', ' + p.m, px, crestY('snow', px - par.x * -7) - 14);
      });
    }
    if (G.hills) { // close the seam under the hills so no sky shows through at the edges
      ctx.fillStyle = rgbStr(lerpStops(TINT, S.s.el)[2].map(function (v, k) { return Math.round(v * [44, 61, 58][k] / 255); }));
      ctx.fillRect(0, G.hills.y + G.hills.h - 3, W, H);
    }
    drawLayer('hills', par.x * -15);
    drawLayer('ridge', 0);
    var fade = ctx.createLinearGradient(0, H * 0.86, 0, H);
    fade.addColorStop(0, 'rgba(22,32,44,0)'); fade.addColorStop(1, 'rgba(22,32,44,1)');
    ctx.fillStyle = fade; ctx.fillRect(0, H * 0.86, W, H * 0.14);
    rope.forEach(function (r) {
      ctx.beginPath(); r.pts.forEach(function (p, j) { j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = '#c8322b'; ctx.lineWidth = 3.6; ctx.stroke();
      ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(246,239,226,.6)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
    });
    anchors.forEach(function (a) {
      var c = a.c, R = c.type === 'lead' ? 19 : 15;
      if (c.type === 'seat') { // a tiny Aipan chowki: an empty seat waiting for its guest
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#8f2a22'; ctx.fillRect(-11, -11, 22, 22);
        ctx.strokeStyle = '#f6efe2'; ctx.lineWidth = 1.4; ctx.strokeRect(-8, -8, 16, 16);
        ctx.restore();
        ctx.fillStyle = '#f6efe2'; ctx.beginPath(); ctx.arc(a.x, a.y, 2.4, 0, Math.PI * 2); ctx.fill();
        [[0, -6], [6, 0], [0, 6], [-6, 0]].forEach(function (d) { ctx.beginPath(); ctx.arc(a.x + d[0], a.y + d[1], 1.2, 0, Math.PI * 2); ctx.fill(); });
        return;
      }
      ctx.save(); ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, Math.PI * 2); ctx.closePath();
      var im = photoFor(c.p);
      if (im) {
        ctx.clip(); var s = Math.max(2 * R / im.naturalWidth, 2 * R / im.naturalHeight);
        ctx.drawImage(im, a.x - im.naturalWidth * s / 2, a.y - im.naturalHeight * s / 2.6, im.naturalWidth * s, im.naturalHeight * s);
      } else {
        ctx.fillStyle = '#2b3d52'; ctx.fill(); ctx.fillStyle = '#eef1f4'; ctx.font = '400 ' + Math.round(R * 0.9) + 'px Gloock, Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initials(c.p.name), a.x, a.y + 1);
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, Math.PI * 2); ctx.strokeStyle = '#c8322b'; ctx.lineWidth = 3; ctx.stroke();
      if (c.type === 'lead') { // summit flag in Pichhoda colours: saffron with red dots
        var fx = a.x + R + 6, fy = a.y - R - 22;
        ctx.strokeStyle = 'rgba(246,239,226,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x + R - 3, a.y - R + 3); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = '#f2a900'; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 17, fy + 5); ctx.lineTo(fx - 1, fy + 11); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c8322b'; [[4, 4], [9, 5.5], [4, 8]].forEach(function (d) { ctx.beginPath(); ctx.arc(fx + d[0], fy + d[1], 1.1, 0, Math.PI * 2); ctx.fill(); });
      }
    });
  }

  /* ---------------- sizing, loop, interaction ---------------- */
  var running = false, visible = true;
  function resize() {
    var r = canvas.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    paintBackground(); layout(); draw();
  }
  var layersReady = Promise.all(['snow', 'hills', 'ridge'].map(function (k) {
    return loadLayer(k).then(function (im) { L[k].img = im; if (im) L[k].crest = crestOf(im); });
  }));
  function loop(t) {
    if (!visible || document.hidden) { running = false; return; }
    step(t); draw(); requestAnimationFrame(loop);
  }
  function start() { if (!reduce && !running) { running = true; requestAnimationFrame(loop); } }
  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(canvas);
  setInterval(function () { paintBackground(); if (reduce) draw(); }, 60000);
  climbParallax();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { paintBackground(); draw(); });

  var climb = canvas.parentNode;
  function move(e) {
    var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (pointer.t && now - pointer.t < 100) { pointer.vx = x - pointer.x; pointer.vy = y - pointer.y; } else { pointer.vx = pointer.vy = 0; }
    pointer.x = x; pointer.y = y; pointer.t = now;
  }
  climb.addEventListener('pointermove', move, { passive: true });
  climb.addEventListener('pointerdown', move, { passive: true });
  function climbParallax() {
    if (reduce) return;
    canvas.parentNode.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') par.tx = (e.clientX / window.innerWidth - 0.5) * 2; }, { passive: true });
  }

  var tip = document.getElementById('tip');
  function showTip(btn) {
    var a = anchors[+btn.dataset.i]; if (!a) return; var c = a.c;
    tip.innerHTML = c.type === 'seat' ? '<b>' + esc(c.p.title) + '</b><span>Open seat for an ' + esc(c.p.kind.toLowerCase()) + '</span>'
      : '<b>' + esc(c.p.name) + '</b><span>' + esc(c.p.role || '') + '</span>';
    var left = Math.max(110, Math.min(W - 110, a.x));
    tip.style.left = left + 'px'; tip.style.top = a.y + 'px'; tip.classList.add('on');
  }
  function hideTip() { tip.classList.remove('on'); }
  var anchorHost = document.getElementById('anchors');
  anchorHost.addEventListener('pointerover', function (e) { if (e.target.dataset && e.target.dataset.i) showTip(e.target); });
  anchorHost.addEventListener('pointerout', hideTip);
  anchorHost.addEventListener('focusin', function (e) { if (e.target.dataset.i) showTip(e.target); });
  anchorHost.addEventListener('focusout', hideTip);
  anchorHost.addEventListener('click', function (e) {
    var i = e.target.dataset && e.target.dataset.i; if (i == null) return;
    // give the rope a tug from that climber, then go to their entry
    if (!reduce) rope.forEach(function (r) { r.pts.forEach(function (p) { if (!p.pin && Math.abs(p.x - anchors[i].x) < 90) p.py += 9; }); });
    var el = document.getElementById('c-' + i);
    if (el) { history.replaceState(null, '', '#c-' + i); el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
  });

  layersReady.then(function () { resize(); start(); });
})();
