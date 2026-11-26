/* Home destinations: two endless photo rows — "Across India" (115+ places from the destination DB and
   RW_PLACE_OVERRIDES) and "Beyond India" (worldwide DB entries). Built on RWRail (paged, endless,
   self-scrolling, spotlight). Photos load only for cards actually rendered, a few at a time, through the
   shared Wikipedia gate (wikiAny) and the same per-place cache the other cards use (rw_pimg_*).
   Tapping a card plans that trip exactly like the older destination cards did. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var queue = [], active = 0, MAX_ACTIVE = 3;
  function node(tag, cls, text) { var el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  function key(name) { return 'rw_pimg_' + String(name).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function get(k) { try { return W.lsGet ? W.lsGet(k) : localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (W.lsSet) W.lsSet(k, v); else localStorage.setItem(k, v); } catch (e) { /* storage full */ } }
  function slow() { var n = W.__RW_NET || { tier: 'fast' }; return n.tier === 'vslow'; }
  function paint(card, url) {
    if (!/^https:\/\/[^"'()\s]+$/.test(url)) return;
    card.style.backgroundImage = 'linear-gradient(180deg,rgba(0,0,0,.05) 35%,rgba(0,0,0,.72)),url("' + url + '")';
    card.classList.add('has-photo');
  }
  function pump() {
    while (active < MAX_ACTIVE && queue.length) {
      var job = queue.shift(); if (!job.card.isConnected) continue;
      active++;
      Promise.resolve(typeof W.wikiAny === 'function' ? W.wikiAny(job.q, job.alt) : null).then(function (j, url) {
        if (url && /wikimedia|wikipedia/.test(url)) { put(key(j.name), url); paint(j.card, url); }
      }.bind(null, job), function () { /* keep the gradient */ }).then(function () { active--; setTimeout(pump, 120); });
    }
  }
  function photo(card, d) {
    var cached = get(key(d.name));
    if (cached && /^https:/.test(cached)) return paint(card, cached);
    if (slow()) return;
    queue.push({ card: card, name: d.name, q: d.name.replace(/\s*\(.*\)/, ''), alt: d.name + ' ' + (d.region || d.country || '') });
    pump();
  }
  function plan(d) {
    var input = document.getElementById('destInput');
    if (input) { /** @type {any} */ (input).value = d.name + ', ' + (d.country || 'India'); input.dispatchEvent(new Event('input', { bubbles: true })); }
    if (typeof W.tabGo === 'function') W.tabGo('plan');
    if (typeof W.runSearch === 'function') W.runSearch();
  }
  var HUES = [[38, 70, 110], [92, 52, 120], [40, 96, 88], [120, 62, 44], [30, 84, 130], [110, 40, 80]];
  function card(d) {
    var c = node('button', 'rw-dr-card'); c.type = 'button';
    var h = HUES[d.name.length % HUES.length];
    c.style.backgroundImage = 'linear-gradient(160deg,rgb(' + h.join(',') + '),#14121f)';
    c.setAttribute('aria-label', 'Plan a trip to ' + d.name + (d.region ? ', ' + d.region : ''));
    c.append(node('span', 'rw-dr-name', d.name), node('span', 'rw-dr-sub', d.region || d.country || ''));
    c.addEventListener('click', function () { plan(d); });
    photo(c, d);
    return c;
  }
  function india() {
    var seen = {}, out = [];
    function add(name, region) { var k = String(name).toLowerCase(); if (!name || seen[k]) return; seen[k] = 1; out.push({ name: name, region: region || '', country: 'India' }); }
    (W.DB || []).forEach(function (d) { if (d.country === 'India') add(d.name, d.region); });
    var o = W.RW_PLACE_OVERRIDES || {};
    /* State-level entries (admin like "Kerala (Kochi)") are regions, not destinations: skip them. */
    Object.keys(o).forEach(function (k) { var p = o[k]; if (p && p.name && !/\(/.test(p.admin || '')) add(p.name, String(p.admin || '').split(',').pop().trim()); });
    return out;
  }
  function world() { return (W.DB || []).filter(function (d) { return d.country && d.country !== 'India'; }).map(function (d) { return { name: d.name, region: d.country, country: d.country }; }); }
  /* Stable daily shuffle: a fresh order each day, the same order all day. */
  function shuffle(list) {
    var seed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, '')) || 1;
    return list.map(function (x, i) { seed = (seed * 9301 + 49297) % 233280; return { x: x, r: seed / 233280 + i * 0 }; }).sort(function (a, b) { return a.r - b.r; }).map(function (o) { return o.x; });
  }
  function row(title, sub, items, id) {
    var sec = node('div', 'rw-dr-row'); sec.id = id;
    var head = node('div', 'rw-dr-head'); head.append(node('h3', '', title), node('span', '', sub));
    var track = node('div', 'rw-dr-track'); track.setAttribute('role', 'list'); track.setAttribute('aria-label', title);
    sec.append(head, track);
    setTimeout(function () {
      if (W.RWRail) { var r = W.RWRail.create(track, { items: items, render: card, pageSize: 10, match: function (d, q) { return !q.text || (d.name + ' ' + d.region).toLowerCase().indexOf(String(q.text).toLowerCase()) >= 0; } }); W['rwDestRail_' + id] = r; W.RWRail.drift(track); W.RWRail.spotlight(track, 'x'); }
      else items.slice(0, 20).forEach(function (d) { track.appendChild(card(d)); });
    }, 0);
    return sec;
  }
  function mount() {
    if (document.getElementById('rwDestRows')) return true;
    var anchor = document.getElementById('rwDestinationsRail') || document.getElementById('rwHomeCreators');
    if (!anchor || !(W.DB || []).length) return false;
    var a = shuffle(india()), b = shuffle(world());
    var sec = node('section', 'v v-home rw-dest-rows'); sec.id = 'rwDestRows'; sec.setAttribute('aria-label', 'Destinations');
    var head = node('div', 'rw-dr-top'); head.append(node('small', '', 'TAP A PLACE · AILON PLANS IT'), node('h2', '', 'Where next? ' + (a.length + b.length) + ' destinations'));
    sec.append(head, row('Across India', a.length + ' places', a, 'india'), row('Beyond India', b.length + ' places', b, 'world'));
    anchor.insertAdjacentElement('beforebegin', sec);
    return true;
  }
  function start() { if (!mount()) { var n = 0, t = setInterval(function () { if (mount() || ++n > 20) clearInterval(t); }, 500); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
