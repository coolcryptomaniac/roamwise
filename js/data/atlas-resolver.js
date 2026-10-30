// @ts-nocheck
// ATLAS RESOLVER — turns any place phrase or sentence into structured places using the open atlas data
// (data/atlas/*.json, GeoNames CC-BY 4.0): 252 countries, 36 states/UTs, ~760 Indian districts, ~19k Indian towns/temples/forts/
// lakes (curated famous places win), 34k world cities, plus a village-namesake index so "Rampur" is flagged as ambiguous
// instead of guessed. Pure functions + a lazy loader; nothing else depends on it. Unknown villages fall through to the live geocoder.
(function (root) {
  var A = { ready: false, countries: [], states: [], places: [], cities: [], namesakes: {}, idx: null, byIso: {}, stateIdx: {} };
  var STOP = { the:1, of:1, in:1, to:1, from:1, and:1, near:1, at:1, for:1, a:1, an:1, is:1, my:1, i:1, we:1, you:1, best:1, hot:1, new:0, old:0, trip:1, tour:1,
    plan:1, weather:1, how:1, what:1, where:1, can:1, with:1, by:1, on:1, it:1, do:1, go:1, visit:1, day:1, days:1, cost:1, price:1, food:1, stay:1, hotel:1, hotels:1,
    mountain:1, beach:1, lake:1, temple:1, fort:1, road:1, city:1, town:1, village:1, park:1, hill:1, hills:1, valley:1, river:1, sea:1, bus:1, train:1, flight:1, about:1,
    mar:1, may:1, march:1, june:1, august:1, will:1, bar:1, pass:1, mount:1, east:1, west:1, north:1, south:1, central:1, upper:1, lower:1, big:1, little:1, good:1 };
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function add(map, key, rec, pen) { var k = norm(key); if (!k) return; var r = rec; if (pen) { r = {}; for (var x in rec) r[x] = rec[x]; r.w = rec.w - pen; r.viaAlias = 1; } (map[k] || (map[k] = [])).push(r); }
  function hav(a, b, c, d) {
    var r = Math.PI / 180, x = Math.sin((c - a) * r / 2) * Math.sin((c - a) * r / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) * Math.sin((d - b) * r / 2);
    return 12742 * Math.asin(Math.sqrt(x));
  }
  var KIND = { C: 'capital city', A: 'city', a: 'town', v: 'town or village', T: 'temple or shrine', F: 'fort or heritage site', W: 'lake or waterfall', M: 'mountain or pass',
    B: 'beach', I: 'island', N: 'national park or reserve', X: 'cave site', R: 'hill station or resort' };
  var TW = { C: 700, A: 420, a: 260, v: 120, T: 380, F: 380, W: 330, M: 330, B: 330, I: 330, N: 380, X: 300, R: 400 };

  function use(d) {
    var ctry = (d.countries && d.countries.countries) || [], adm = (d.admin && d.admin.states) || [], pl = (d.places && d.places.places) || [], ci = (d.cities && d.cities.cities) || [];
    A.countries = ctry; A.states = adm; A.places = pl; A.cities = ci; A.namesakes = (d.namesakes && d.namesakes.names) || {};
    var idx = {}; A.byIso = {}; A.stateIdx = {};
    ctry.forEach(function (c) {
      A.byIso[c.iso] = c;
      var rec = { kind: 'country', label: 'country', name: c.name, iso: c.iso, country: c.name, lat: null, lng: null, w: 1000 + Math.log10((c.pop || 1) + 1), ref: c };
      [c.name, c.iso, c.iso3].concat(c.aliases || []).forEach(function (k) { add(idx, k, rec); });
    });
    var IN = A.byIso.IN ? A.byIso.IN.name : 'India';
    adm.forEach(function (s, si) {
      var rec = { kind: 'state', label: s.name === 'Delhi' || s.name === 'Chandigarh' || s.name === 'Puducherry' || s.name === 'Ladakh' || /Andaman|Lakshadweep|Dadra/.test(s.name) ? 'union territory' : 'state', name: s.name, iso: 'IN', country: IN, state: s.name, lat: s.lat, lng: s.lng, w: 600, si: si };
      A.stateIdx[norm(s.name)] = si; add(idx, s.name, rec); (s.aliases || []).forEach(function (a) { add(idx, a, rec); });
      s.districts.forEach(function (dd, di) {
        add(idx, dd.name, { kind: 'district', label: 'district', name: dd.name, iso: 'IN', country: IN, state: s.name, district: dd.name, lat: dd.lat, lng: dd.lng, w: 450, si: si, di: di });
      });
    });
    pl.forEach(function (r) {
      var s = adm[r[4]] || {}, dd = (s.districts || [])[r[5]] || {}, t = r[3], cur = r[6] >= 1e7;
      var rec = { kind: 'place', label: KIND[t] || 'place', name: r[0], iso: 'IN', country: IN, state: s.name, district: dd.name || '', lat: r[1], lng: r[2], pop: cur ? 0 : r[6], type: t,
        w: (TW[t] || 100) + (cur ? 520 : Math.log10(r[6] + 1) * 40) + 140, cur: cur };
      add(idx, r[0], rec); (r[7] || []).forEach(function (a) { add(idx, a, rec); });
    });
    ci.forEach(function (r) {
      var c = A.byIso[r[3]] || { name: r[3] };
      var lm = r[7] === 3, rec = { kind: 'place', label: lm ? (r[8] || 'landmark') : r[7] === 1 ? 'capital city' : 'city', name: r[0], iso: r[3], country: c.name, state: r[4], lat: r[1], lng: r[2], pop: lm ? 0 : r[5], type: lm ? 'L' : 'c', cur: lm,
        w: lm ? 900 : (r[7] === 1 ? 650 : r[7] === 2 ? 330 : 200) + Math.log10(r[5] + 1) * 45 };
      add(idx, r[0], rec); (r[6] || []).forEach(function (a) { add(idx, a, rec, r[7] === 3 ? 0 : 260); });
    });
    A.idx = idx; A.ready = true; return A;
  }

  function loadAll(base) {
    base = base || '';
    if (A._p) return A._p;
    var g = function (f) { return fetch(base + 'data/atlas/' + f).then(function (r) { return r.json(); }); };
    A._p = Promise.all([g('world-countries.json'), g('india-admin.json'), g('india-places.json'), g('india-namesakes.json'), g('world-cities.json')]).then(function (a) {
      return use({ countries: a[0], admin: a[1], places: a[2], namesakes: a[3], cities: a[4] });
    }).catch(function () { A._p = null; return null; });
    return A._p;
  }

  /* split "Almora, Uttarakhand" / "Paris Texas" into a head phrase and context words */
  function candidates(phrase) {
    var segs = String(phrase || '').split(/[,;|]| - | in /i).map(norm).filter(Boolean);
    if (!segs.length) return { head: [], ctx: [] };
    return { segs: segs };
  }

  function find(query, opt) {
    if (root && root.RW_INDIA_LANG) query = root.RW_INDIA_LANG.canonical(query);
    opt = opt || {}; if (!A.ready) return { matches: [], best: null, ambiguous: false, ready: false };
    var segs = String(query || '').split(/[,;|]/).map(norm).filter(Boolean), full = norm(query), pool = [], ctxWords = [];
    var tryHead = function (txt) { return A.idx[txt] || null; };
    var cand = null, headTxt = '';
    if (segs.length > 1) { headTxt = segs[0]; cand = tryHead(headTxt); ctxWords = segs.slice(1); }
    if (!cand) {
      cand = tryHead(full); headTxt = full; ctxWords = [];
      if (!cand) { // "paris texas": longest leading n-gram that is a known name, rest is context
        var w = full.split(' ');
        for (var n = w.length - 1; n >= 1 && !cand; n--) { var h = w.slice(0, n).join(' '); if (A.idx[h]) { cand = A.idx[h]; headTxt = h; ctxWords = [w.slice(n).join(' ')]; } }
        for (var m = 1; m < w.length && !cand; m++) { var t2 = w.slice(m).join(' '); if (A.idx[t2]) { cand = A.idx[t2]; headTxt = t2; ctxWords = [w.slice(0, m).join(' ')]; } }
      }
    }
    if (!cand) return { matches: [], best: null, ambiguous: false, ready: true, namesakes: A.namesakes[full] || null };
    var ctx = ctxWords.join(' ');
    var seen = {}, list = cand.filter(function (r) { var k = r.kind + r.name + (r.state || '') + (r.district || '') + r.iso + Math.round((r.lat || 0) * 10) + Math.round((r.lng || 0) * 10); if (seen[k]) return false; seen[k] = 1; return true; });
    var scored = list.map(function (r) {
      var s = r.w, hit = false;
      if (ctx) {
        var hay = [r.state, r.district, r.country, r.iso].map(norm);
        hay.forEach(function (h) { if (h && (ctx === h || (h.length > 3 && ctx.indexOf(h) >= 0) || (ctx.length > 3 && h.indexOf(ctx) === 0))) hit = true; });
        if (hit) s += 5000;
      }
      return { r: r, s: s, hit: hit };
    }).sort(function (a, b) { return b.s - a.s; });
    var matches = scored.map(function (x) { return withText(x.r); });
    var top = scored[0], second = scored[1];
    var ns = A.namesakes[headTxt]; var indiaNames = ns ? ns[0] : 0;
    var ambiguous = !(top.hit) && ((second && second.r.kind !== 'country' && top.r.kind !== 'country' && !sameSpot(top.r, second.r) && second.s > top.s * 0.7 && second.s > 250) || indiaNames >= 8 && top.r.type !== 'C' && !top.r.cur && top.r.iso === 'IN' && top.s < 560);
    return { query: query, matches: matches, best: matches[0], ambiguous: !!ambiguous, namesakes: ns ? { total: ns[0], top: ns[1].slice(0, 4).map(function (x) { var s = A.states[x[0]]; return { state: s && s.name, district: x[1] >= 0 && s ? (s.districts[x[1]] || {}).name : '', count: x[2] }; }) } : null, ready: true };
  }
  function sameSpot(a, b) { if (a.iso === b.iso && a.state && a.state === b.state && norm(a.name) === norm(b.name)) return true; return a.lat != null && b.lat != null && hav(a.lat, a.lng, b.lat, b.lng) < 15 && a.iso === b.iso; }

  function withText(r) {
    var o = {}; for (var k in r) o[k] = r[k]; o.where = where(r); o.summary = summary(r); return o;
  }
  function where(r) {
    if (r.kind === 'country') return r.name;
    if (r.kind === 'state') return r.name + ', India';
    var p = [];
    if (r.district && r.district !== r.name && r.state !== r.name) p.push(r.district + (r.iso === 'IN' ? ' district' : ''));
    if (r.state && r.state !== r.name) p.push(r.state);
    p.push(r.country);
    return p.join(', ');
  }
  function summary(r) {
    if (r.kind === 'country') { var c = r.ref; return r.name + ' is a country in ' + c.continent + (c.capital ? '; its capital is ' + c.capital : '') + (c.currency ? ', currency ' + c.currency : '') + '.'; }
    var art = /^[aeiou]/i.test(r.label) ? 'an ' : 'a ';
    return r.name + ' is ' + art + r.label + ' in ' + where(r).replace(/^[^,]*, ?/, function (m) { return r.kind === 'state' ? '' : m; }).replace(/^/, r.kind === 'state' ? '' : '') + '.';
  }

  /* scan free text for place mentions: greedy longest n-gram, strong places only */
  function extract(text, opt) {
    opt = opt || {}; if (!A.ready) return [];
    var raw = String(text || '').replace(/[?!.]+/g, ' ').split(/\s+/).filter(Boolean), out = [], i = 0;
    while (i < raw.length) {
      var hit = null;
      for (var n = Math.min(4, raw.length - i); n >= 1 && !hit; n--) {
        var seg = raw.slice(i, i + n).join(' '), k = norm(seg), c = A.idx[k];
        if (!c) continue;
        if (n === 1 && (STOP[k] || k.length < 3 || (k.length < 4 && !/^[A-Z]/.test(seg) && !A.byIso[seg.toUpperCase()]))) continue;
        if (n === 1 && !/^[A-Z]/.test(seg) && !opt.loose) continue; // single lowercase words are not places
        var strong = c.filter(function (r) { return r.kind !== 'place' || r.cur || (r.type && r.type !== 'v' && r.type !== 'a') || (r.pop || 0) >= 20000; });
        if (!strong.length) continue;
        hit = { text: seg, n: n };
      }
      if (hit) { out.push(hit.text); i += hit.n; } else i++;
    }
    // resolve each mention, using the neighbouring mention as context ("Almora Uttarakhand" / "Paris Texas")
    var res = [];
    for (var j = 0; j < out.length; j++) {
      var f = find(out[j]); if (f.best) res.push({ text: out[j], best: f.best, ambiguous: f.ambiguous, matches: f.matches.slice(0, 5), namesakes: f.namesakes });
    }
    return res;
  }

  function nearby(lat, lng, n, kinds) {
    if (!A.ready) return []; var out = [];
    A.places.forEach(function (r) {
      var t = r[3]; if (kinds && kinds.indexOf(t) < 0) return; if (t === 'v' && !(kinds && kinds.indexOf('v') >= 0) && r[6] < 20000) return;
      var d = hav(lat, lng, r[1], r[2]); if (d < 300) out.push({ name: r[0], type: t, label: KIND[t], km: Math.round(d * 10) / 10, lat: r[1], lng: r[2], state: (A.states[r[4]] || {}).name });
    });
    return out.sort(function (a, b) { return a.km - b.km; }).slice(0, n || 8);
  }
  function distance(a, b) {
    var fa = typeof a === 'string' ? find(a).best : a, fb = typeof b === 'string' ? find(b).best : b;
    if (!fa || !fb || fa.lat == null || fb.lat == null) return null;
    var km = hav(fa.lat, fa.lng, fb.lat, fb.lng);
    return { from: fa.name, to: fb.name, km: Math.round(km), roadKmApprox: Math.round(km * 1.35), note: 'Straight-line distance; roads are typically 25-45% longer, more in mountains.' };
  }
  function inDistrict(stateName, districtName, n, kinds) {
    var si = A.stateIdx[norm(stateName)]; if (si == null) return [];
    var s = A.states[si], di = s.districts.findIndex(function (d) { return norm(d.name) === norm(districtName); }); if (di < 0) return [];
    return A.places.filter(function (r) { return r[4] === si && r[5] === di && (!kinds || kinds.indexOf(r[3]) >= 0); }).sort(function (a, b) { return b[6] - a[6]; }).slice(0, n || 20)
      .map(function (r) { return { name: r[0], type: r[3], label: KIND[r[3]], lat: r[1], lng: r[2] }; });
  }

  var API = { use: use, loadAll: loadAll, find: find, extract: extract, nearby: nearby, distance: distance, inDistrict: inDistrict, norm: norm, _state: A };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) { root.RW_ATLAS = API; root.rwAtlasFind = find; root.rwAtlasExtract = extract; root.rwAtlasNearby = nearby; root.rwAtlasDistance = distance; root.rwAtlasLoadAll = loadAll; }
})(typeof window !== 'undefined' ? window : null);
