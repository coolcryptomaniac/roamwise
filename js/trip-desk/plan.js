// @ts-nocheck
/* Trip desk planning helpers: the instruction sent to the AI (kept out of sight) and a useful plan of Tusk's own for when the AI engines are unreachable.
   Works from RWTripDesk.summary() only. Distances are straight-line estimates scaled for roads, never quotes. No prices are invented. */
(function (root) {
  'use strict';
  var PLACES = [
    ['Almora', 29.597, 79.659], ['Nainital', 29.381, 79.463], ['Ranikhet', 29.644, 79.432], ['Kausani', 29.844, 79.602], ['Binsar', 29.703, 79.756],
    ['Mukteshwar', 29.472, 79.647], ['Bageshwar', 29.838, 79.771], ['Jageshwar', 29.640, 79.855], ['Kasar Devi', 29.642, 79.665], ['Jim Corbett', 29.395, 79.124],
    ['Dehradun', 30.316, 78.032], ['Rishikesh', 30.087, 78.268], ['Haridwar', 29.945, 78.164], ['Mussoorie', 30.459, 78.066], ['Manali', 32.239, 77.189],
    ['Shimla', 31.104, 77.173], ['Delhi', 28.614, 77.209], ['Jaipur', 26.912, 75.787], ['Mumbai', 19.076, 72.878], ['Pune', 18.520, 73.857], ['Goa', 15.299, 74.124],
    ['Bengaluru', 12.972, 77.594], ['Hyderabad', 17.385, 78.487], ['Chennai', 13.083, 80.270], ['Kolkata', 22.573, 88.364], ['Varanasi', 25.317, 82.973], ['Tirthan Valley', 31.62, 77.45]
  ];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim(); };
  function lev(a, b) {
    var m = [], i, j;
    for (i = 0; i <= a.length; i++) m[i] = [i];
    for (j = 0; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  /* { name, lat, lon, exact } or null. A near-miss spelling ("Mimbai") returns the closest place with exact:false. */
  function find(text) {
    var q = norm(text), best = null, bd = 99;
    if (!q) return null;
    PLACES.forEach(function (p) {
      var n = norm(p[0]), d = n === q ? 0 : (q.length >= 4 && (n.indexOf(q) === 0 || q.indexOf(n) === 0)) ? 0 : lev(n, q);
      if (d < bd) { bd = d; best = p; }
    });
    if (!best || bd > (q.length >= 6 ? 2 : 1)) return null;
    return { name: best[0], lat: best[1], lon: best[2], exact: bd === 0 };
  }
  function km(a, b) {
    var r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }
  var nights = function (s) { var d = Math.round((Date.parse(s.freeUntil) - Date.parse(s.freeFrom)) / 86400000); return d > 0 ? d : 0; };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var fmt = function (d) { try { return new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return d; } };

  /* The fuller instruction for the AI. The traveller never sees this text. */
  function aiPrompt() {
    var s = root.RWTripDesk.summary(), n = nights(s), t = function (x) { return x.title || x.id || ''; };
    var lines = [
      'The traveller wants a practical trip plan. Reply in plain, friendly language with no field names, brackets or code.',
      'From: ' + s.origin + '. To: ' + (s.destination || 'not chosen, so suggest two or three realistic options within the budget') + '.',
      'Free from ' + s.freeFrom + ' to ' + s.freeUntil + (n ? ' (' + n + ' nights)' : '') + '. Total budget: ' + (s.budgetINR ? 'INR ' + s.budgetINR : 'not given, ask once') + '.',
      s.electricPreferred ? 'Prefer electric buses and taxis, but only name them where they really run on this route.' : '',
      'Stays confirmed on RoamWise: ' + (s.confirmed.length ? s.confirmed.map(function (b) { return b.title || b.id; }).join(', ') : 'none') + '. Enquiries awaiting an answer: ' + (s.pending.length ? s.pending.map(t).join(', ') : 'none') + '. Shortlist: ' + (s.shortlist.length ? s.shortlist.map(t).join(', ') : 'none') + '.',
      'Still to arrange: ' + s.missing.join(', ') + '.',
      'Compare transport, stay, a day-by-day itinerary and an optional local guide. If the destination looks misspelt or unreal, ask whether they meant the closest real place. If the budget cannot cover the journey, say so kindly and suggest closer options. Ask only essential questions. Keep estimates separate from provider quotes. Never book or take payment. Only a stay marked confirmed above is confirmed.'
    ];
    return lines.filter(Boolean).join('\n');
  }

  /* Tusk's own plan, used when the AI engines cannot be reached. */
  function fallback() {
    var s = root.RWTripDesk.summary(), n = nights(s), budget = Number(s.budgetINR) || 0, o = find(s.origin), d = find(s.destination);
    var out = ['<b>' + esc(s.origin) + ' → ' + esc(s.destination || 'a place to be chosen') + '</b> · ' + esc(fmt(s.freeFrom)) + ' to ' + esc(fmt(s.freeUntil)) + (n ? ' · ' + n + ' night' + (n > 1 ? 's' : '') : '')];
    if (budget) out.push('Budget ' + inr(budget) + (n ? ', about ' + inr(budget / (n + 1)) + ' a day for everything' : '') + '.');
    var road = 0;
    if (s.destination && !d) out.push('I do not recognise “' + esc(s.destination) + '” yet. Check the spelling, or tell me the nearest big town.');
    else if (d && !d.exact) out.push('Did you mean <b>' + esc(d.name) + '</b>? I have used it below; tell me if it is somewhere else.');
    if (o && d) {
      road = Math.round(km(o, d) * 1.3 / 10) * 10;
      out.push(esc(o.name) + ' to ' + esc(d.name) + ' is roughly ' + road.toLocaleString('en-IN') + ' km by road (an estimate, not a route quote).');
      if (road > 500 && budget && budget < 10000) out.push('At that distance, getting there and back could use most of ' + inr(budget) + ' before a single night’s stay. Check fares first, or consider somewhere closer.');
    }
    var near = o ? PLACES.filter(function (p) { return p[0] !== o.name && km(o, { lat: p[1], lon: p[2] }) <= 150; }).map(function (p) { return [p[0], Math.round(km(o, { lat: p[1], lon: p[2] }) * 1.3 / 5) * 5]; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 4) : [];
    if (near.length && (!d || road > 500)) out.push('<b>Closer ideas from ' + esc(o.name) + ':</b> ' + near.map(function (p) { return esc(p[0]) + ' (about ' + p[1] + ' km)'; }).join(', ') + '.');
    var where = [d && d.name, o && o.name, s.destination, s.origin].filter(Boolean).map(norm);
    var stays = (root.RW_PARTNERS || []).filter(function (p) { return p && p.cat === 'stay' && p.listingReady && where.some(function (w) { return norm(p.zone) === w || norm(p.area).indexOf(w) >= 0; }); }).slice(0, 4);
    out.push(stays.length ? '<b>RoamWise stays you can enquire at:</b> ' + stays.map(function (p) { return esc(p.name); }).join(', ') + '. Open Explore Stay &amp; Do to see them.' : 'No RoamWise stay is listed there yet. Explore Stay &amp; Do shows where we do have one.');
    out.push('<b>Getting there:</b> compare IRCTC for trains and redBus for buses' + (s.electricPreferred ? ', and NueGo for electric coaches where it runs your route' : '') + '. Fares and seats change, so confirm with the provider.');
    out.push('Nothing is booked or charged. How many people are travelling? Tell me and I will tighten this plan.');
    return out.join('<br><br>');
  }

  if (root.RWTripDesk) { root.RWTripDesk.aiPrompt = aiPrompt; root.RWTripDesk.fallback = fallback; root.RWTripDesk.findPlace = find; }
})(typeof window !== 'undefined' ? window : globalThis);
