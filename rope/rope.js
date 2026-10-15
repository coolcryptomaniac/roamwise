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
        + '<div class="portrait empty"><span class="mono" aria-hidden="true">+</span></div>'
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
  if (!members.length) lede.textContent = 'Mohit leads the rope. The seats behind him are open, and each one is a real gap we want the right person to fill.';
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
  // sky stops by solar elevation: [elevation, top, horizon, snow, hills]
  var STOPS = [
    [-18, '#060a13', '#111b2c', '#46526d', '#0f1826'],
    [-8, '#0d1629', '#2b3150', '#6a7596', '#131e2e'],
    [-2, '#1d2a4c', '#c0727a', '#c29aa8', '#1c2738'],
    [3, '#2f4778', '#eba46a', '#f6c0a4', '#25344a'],
    [10, '#3f6aa6', '#f0cf9f', '#f4e2d6', '#2d4560'],
    [25, '#3a74bd', '#b7d2ea', '#eef1f4', '#33516f'],
    [90, '#2f6cb8', '#a9c9e6', '#f3f6f9', '#34536f']
  ];
  function palette(el) {
    for (var i = 0; i < STOPS.length - 1; i++) {
      var a = STOPS[i], b = STOPS[i + 1];
      if (el <= b[0]) {
        var t = (el - a[0]) / (b[0] - a[0]);
        return { top: mixRGB(a[1], b[1], t), hor: mixRGB(a[2], b[2], t), snow: mixRGB(a[3], b[3], t), hills: mixRGB(a[4], b[4], t) };
      }
    }
    var z = STOPS[STOPS.length - 1]; return { top: hex(z[1]), hor: hex(z[2]), snow: hex(z[3]), hills: hex(z[4]) };
  }

  /* ---------------- terrain ---------------- */
  var canvas = document.getElementById('sky'), ctx = canvas.getContext('2d');
  var bg = document.createElement('canvas'), bgx = bg.getContext('2d');
  var W = 0, H = 0, DPR = 1, S = null, anchors = [], rope = [], imgs = {};
  // Kumaon range as seen from Almora, west to east. x = position across the view, h = relative height.
  var PEAKS = [
    { name: 'Chaukhamba', m: '7,138 m', x: 0.07, h: 0.52, w: 0.07 },
    { name: 'Trishul', m: '7,120 m', x: 0.29, h: 0.66, w: 0.09, triple: true },
    { name: 'Nanda Devi', m: '7,816 m', x: 0.5, h: 0.92, w: 0.075, twin: true },
    { name: 'Nanda Kot', m: '6,861 m', x: 0.65, h: 0.55, w: 0.06 },
    { name: 'Panchachuli', m: '6,904 m', x: 0.86, h: 0.62, w: 0.1, five: true }
  ];
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function noise1(x, seed) { return Math.sin(x * 12.9 + seed) * 0.5 + Math.sin(x * 33.1 + seed * 2.1) * 0.3 + Math.sin(x * 71.7 + seed * 3.7) * 0.2; }
  function rangeY(x) { // far snow range crest
    var base = H * 0.5, amp = H * (W < 640 ? 0.2 : 0.27), u = W < 640 ? 0.2 + 0.58 * x / W : x / W, best = 0;
    PEAKS.forEach(function (p) {
      var d = Math.abs(u - p.x) / p.w, v = Math.max(0, 1 - Math.pow(d, 1.25));
      if (p.twin) v = Math.max(v, Math.max(0, 0.83 - Math.abs(u - p.x - p.w * 0.55) / (p.w * 0.6)));
      if (p.triple) [-0.45, 0.45].forEach(function (o) { v = Math.max(v, Math.max(0, 0.86 - Math.abs(u - p.x - p.w * o) / (p.w * 0.55))); });
      if (p.five) [-0.6, -0.3, 0.3, 0.6].forEach(function (o, k) { v = Math.max(v, Math.max(0, (0.8 - k * 0.04) - Math.abs(u - p.x - p.w * o) / (p.w * 0.35))); });
      best = Math.max(best, v * p.h);
    });
    return base - amp * (0.12 + best + 0.035 * noise1(u * 3, 1.3));
  }
  function midY(x) { var u = x / W; return H * 0.67 - H * 0.06 * (0.5 + 0.5 * noise1(u * 1.7, 4.2)) - H * 0.02 * noise1(u * 6, 7.1); }
  function nearY(x) { var u = x / W, rise = W < 640 ? 0.2 : 0.26; return H * 0.9 - H * rise * Math.pow(u, 1.35) - H * 0.012 * noise1(u * 9, 2.4); }

  function paintBackground() {
    var s = sun(new Date()), pal = palette(s.el);
    S = { s: s, pal: pal };
    bg.width = W * DPR; bg.height = H * DPR; bgx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var g = bgx.createLinearGradient(0, 0, 0, H * 0.62);
    g.addColorStop(0, rgbStr(pal.top)); g.addColorStop(1, rgbStr(pal.hor));
    bgx.fillStyle = g; bgx.fillRect(0, 0, W, H);
    // sun glow on the side the sun is on (east = right in a north-facing view)
    if (s.el > -10) {
      var gx = s.morning ? W * 1.05 : -W * 0.05, gy = H * 0.5 - Math.max(0, s.el) * H * 0.012;
      var glow = bgx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.7);
      var warm = s.el < 12 ? 0.42 : 0.16;
      glow.addColorStop(0, 'rgba(255,196,130,' + warm + ')'); glow.addColorStop(1, 'rgba(255,196,130,0)');
      bgx.fillStyle = glow; bgx.fillRect(0, 0, W, H);
    }
    // stars
    var starA = Math.max(0, Math.min(1, (-4 - s.el) / 10));
    if (starA > 0) {
      var r = rnd(42);
      for (var i = 0; i < 260; i++) {
        var sx = r() * W, sy = r() * H * 0.55, sz = r() * 1.3 + 0.2;
        bgx.fillStyle = 'rgba(238,241,244,' + (starA * (0.35 + r() * 0.65)) + ')';
        bgx.fillRect(sx, sy, sz, sz);
      }
    }
    // snow range with sun-side shading
    var step = 2, xs = [];
    for (var x = 0; x <= W + step; x += step) xs.push([x, rangeY(x)]);
    bgx.beginPath(); bgx.moveTo(0, H);
    xs.forEach(function (p) { bgx.lineTo(p[0], p[1]); }); bgx.lineTo(W, H); bgx.closePath();
    var sg = bgx.createLinearGradient(0, H * 0.18, 0, H * 0.62);
    sg.addColorStop(0, rgbStr(pal.snow)); sg.addColorStop(1, rgbStr(mixRGB(toHex(pal.snow), toHex(pal.hills), 0.55)));
    bgx.fillStyle = sg; bgx.fill();
    // faceted shade: on each summit, the face turned away from the sun is darker
    bgx.save(); bgx.clip();
    var dir = s.morning ? -1 : 1, win = 12, reach = W * (W < 640 ? 0.12 : 0.07);
    bgx.fillStyle = 'rgba(20,32,52,' + (s.el > 0 ? 0.24 : 0.13) + ')';
    for (var k = win; k < xs.length - win; k++) {
      var y0 = xs[k][1], top = true;
      for (var q2 = k - win; q2 <= k + win; q2++) if (xs[q2][1] < y0) { top = false; break; }
      if (!top || y0 > H * 0.47) continue;
      bgx.beginPath(); bgx.moveTo(xs[k][0], y0);
      for (var q3 = k; q3 >= 0 && q3 < xs.length && Math.abs(xs[q3][0] - xs[k][0]) <= reach; q3 += dir) bgx.lineTo(xs[q3][0], xs[q3][1]);
      bgx.lineTo(xs[k][0] + dir * reach * 0.25, H * 0.62); bgx.lineTo(xs[k][0] - dir * reach * 0.06, H * 0.62);
      bgx.closePath(); bgx.fill();
      k += win;
    }
    bgx.restore();
    // peak names
    if (W >= 480) {
      bgx.font = '500 12px "Familjen Grotesk", system-ui, sans-serif'; bgx.textAlign = 'center';
      PEAKS.forEach(function (p) {
        var px = W < 640 ? (p.x - 0.2) / 0.58 * W : p.x * W, py = rangeY(px) - 12; if (px < 40 || px > W - 40) return;
        bgx.fillStyle = s.el > 4 ? 'rgba(22,32,44,.55)' : 'rgba(238,241,244,.55)';
        bgx.fillText(p.name + ', ' + p.m, px, py);
      });
    }
    // haze then mid hills
    var hz = bgx.createLinearGradient(0, H * 0.48, 0, H * 0.7);
    hz.addColorStop(0, rgbStr(pal.hor, 0)); hz.addColorStop(1, rgbStr(pal.hor, 0.35));
    bgx.fillStyle = hz; bgx.fillRect(0, H * 0.45, W, H * 0.3);
    bgx.beginPath(); bgx.moveTo(0, H);
    for (x = 0; x <= W + 4; x += 4) bgx.lineTo(x, midY(x));
    bgx.lineTo(W, H); bgx.closePath();
    bgx.fillStyle = rgbStr(mixRGB(toHex(pal.hills), toHex(pal.hor), 0.18)); bgx.fill();
    // near ridge with deodar silhouettes
    var near = rgbStr(mixRGB('#0e1714', toHex(pal.hills), 0.22));
    bgx.beginPath(); bgx.moveTo(0, H);
    for (x = 0; x <= W + 3; x += 3) bgx.lineTo(x, nearY(x));
    bgx.lineTo(W, H); bgx.closePath(); bgx.fillStyle = near; bgx.fill();
    var tr = rnd(7);
    for (x = 4; x < W; x += 7 + tr() * 16) {
      var t = (x / W > 0.38 && x / W < 0.98) && tr() < 0.6 ? 0 : 1; // keep the climbers' crest clearer
      if (!t) continue;
      var th = 10 + tr() * 26, ty = nearY(x) + 2, tw = th * 0.32;
      bgx.beginPath(); bgx.moveTo(x, ty - th); bgx.lineTo(x + tw, ty); bgx.lineTo(x - tw, ty); bgx.closePath(); bgx.fill();
    }
    var fade = bgx.createLinearGradient(0, H * 0.84, 0, H);
    fade.addColorStop(0, 'rgba(22,32,44,0)'); fade.addColorStop(1, 'rgba(22,32,44,1)');
    bgx.fillStyle = fade; bgx.fillRect(0, H * 0.84, W, H * 0.16);
    // caption
    var t2 = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    var where = s.el >= 0 ? 'sun ' + Math.round(s.el) + '° above the horizon' : 'sun ' + Math.round(-s.el) + '° below the horizon';
    document.getElementById('skyCaption').innerHTML = 'The sky over Almora right now: <b>' + esc(t2) + '</b>, ' + esc(where) + '. Peaks as seen from Kasar Devi.';
  }

  /* ---------------- rope (verlet) ---------------- */
  function layout() {
    var n = climbers.length; if (!n) return;
    var x0 = W < 640 ? 0.1 : 0.4, x1 = W < 640 ? 0.86 : 0.94;
    anchors = climbers.map(function (c, i) {
      // lead climber is highest and furthest right; followers trail down the ridge
      var u = n === 1 ? x1 : x1 - (x1 - x0) * (i / (n - 1));
      var x = u * W; return { x: x, y: nearY(x) - 18, c: c, i: i };
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
        p.px = p.x; p.py = p.y;
        p.x += vx + wind; p.y += vy + 0.32;
        var dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 3600 && time - pointer.t < 120) { p.x += pointer.vx * 0.35; p.y += pointer.vy * 0.35; }
      });
      for (var it = 0; it < 6; it++) {
        for (var j = 0; j < r.pts.length - 1; j++) {
          var a = r.pts[j], b = r.pts[j + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
          if (d <= r.rest) continue; // a rope only resists stretching
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
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // rope: shadow, core, braid
    rope.forEach(function (r) {
      ctx.beginPath(); r.pts.forEach(function (p, j) { j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = '#d23a44'; ctx.lineWidth = 3.6; ctx.stroke();
      ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(255,214,214,.55)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
    });
    anchors.forEach(function (a) {
      var c = a.c, R = c.type === 'lead' ? 19 : 15;
      if (c.type === 'seat') {
        ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14,23,20,.55)'; ctx.fill();
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(238,241,244,.8)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(238,241,244,.9)'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(a.x - 6, a.y); ctx.lineTo(a.x + 6, a.y); ctx.moveTo(a.x, a.y - 6); ctx.lineTo(a.x, a.y + 6); ctx.stroke();
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
      ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, Math.PI * 2); ctx.strokeStyle = '#d23a44'; ctx.lineWidth = 3; ctx.stroke();
      if (c.type === 'lead') { // a small summit flag above the lead climber
        ctx.strokeStyle = 'rgba(238,241,244,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x + R - 2, a.y - R + 2); ctx.lineTo(a.x + R + 6, a.y - R - 20); ctx.stroke();
        ctx.fillStyle = '#e3a63c'; ctx.beginPath(); ctx.moveTo(a.x + R + 6, a.y - R - 20); ctx.lineTo(a.x + R + 20, a.y - R - 15); ctx.lineTo(a.x + R + 4, a.y - R - 11); ctx.closePath(); ctx.fill();
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
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { paintBackground(); draw(); });

  var climb = canvas.parentNode;
  function move(e) {
    var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (pointer.t && now - pointer.t < 100) { pointer.vx = x - pointer.x; pointer.vy = y - pointer.y; } else { pointer.vx = pointer.vy = 0; }
    pointer.x = x; pointer.y = y; pointer.t = now;
  }
  climb.addEventListener('pointermove', move, { passive: true });
  climb.addEventListener('pointerdown', move, { passive: true });

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

  resize(); start();
})();
