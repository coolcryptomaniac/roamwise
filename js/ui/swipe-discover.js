/* Discover: Tinder-style swipe deck for artists, paintings and stays (Nov 2026).
 * Open with window.rwOpenDiscover('artists' | 'paintings' | 'stays').
 * Swipe right / ♥ = love, left / ✕ = pass, up / ★ = save. Likes and saves are kept
 * on this device only (localStorage). Nothing here books, prices or sends enquiries:
 * stays open the normal rooms-and-dates flow, art opens the artist's own pages. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window), KEY = 'rw_discover_v1';
  var VIBES = [['spiritual', '🕉️ Spiritual'], ['himalayan', '🏔️ Himalayan'], ['culture', '🪔 Culture'], ['wellness', '🌿 Wellness'], ['folk', '🎨 Folk art'], ['nature', '🌲 Nature']];
  var TABS = [['artists', 'Artists & creators'], ['paintings', 'Paintings'], ['stays', 'Stays']];
  var state = { tab: 'artists', vibes: [], deck: [], idx: 0, history: [], data: null, root: null };

  function rel(u) { u = String(u || ''); return /^https?:/.test(u) ? u : u.replace(/^\//, ''); }
  function node(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function store() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: in-memory only */ } }
  function norm(t) { return String(t || '').toLowerCase(); }
  function tagsOf(list) {
    var out = [];
    (list || []).forEach(function (t) {
      var n = norm(t);
      if (/spirit|shiva|yantra|ganesh|ram|devi/.test(n)) out.push('spiritual');
      if (/himal|mountain|peak|kailash/.test(n)) out.push('himalayan');
      if (/cultur|heritage|kumaoni|craft/.test(n)) out.push('culture');
      if (/well|yoga|medit|retreat/.test(n)) out.push('wellness');
      if (/aipan|folk/.test(n)) out.push('folk');
      if (/landscape|nature|forest|jungle|garden|river|lake/.test(n)) out.push('nature');
    });
    return out.filter(function (t, i) { return out.indexOf(t) === i; });
  }
  function matchPct(tags) {
    if (!state.vibes.length) return null;
    var hit = state.vibes.filter(function (v) { return tags.indexOf(v) >= 0; }).length;
    return Math.round(100 * hit / state.vibes.length);
  }

  /* ---------- data ---------- */
  function loadData() {
    if (state.data) return Promise.resolve(state.data);
    return fetch('creators/artists-data.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () { var f = W.rwAmbassadorFallback; return { artists: f ? [f] : [], properties: [] }; })
      .then(function (d) { state.data = d; return d; });
  }
  function artistPage(a) { return a.id === 'natasha-guleria' ? '/creators/natasha.html' : (a.page || '/creators/artists.html'); }
  function cardsFor(tab, includeSeen) {
    var d = state.data || { artists: [] }, out = [];
    if (tab === 'artists') {
      d.artists.forEach(function (a) {
        var art = (a.artworks || []).filter(function (w) { return w.image; })[0];
        out.push({ key: 'artist:' + a.id, kind: 'artist', title: a.name, sub: [a.studio, a.state].filter(Boolean).join(' · '),
          badge: /ambassador/i.test(a.role || '') ? 'BRAND AMBASSADOR' : (a.role || '').replace(/^RoamWise /, '').toUpperCase(),
          img: (a.photo && a.photo.src) || (art && art.image) || '', chips: (a.themes || []).concat(a.confirmedServices || []).slice(0, 5),
          tags: tagsOf((a.themes || []).concat((a.artworks || []).map(function (w) { return w.title; }))),
          links: [[artistPage(a), 'Profile'], a.instagram ? [a.instagram, 'Instagram', 1] : null].filter(Boolean), ref: a });
      });
      out.push({ key: 'join:creator', kind: 'join', title: 'Are you a creator or artist?', sub: 'Get featured on RoamWise and matched with stays that suit your work.',
        badge: 'JOIN', img: '', glyph: '✨', chips: ['Artists', 'Travel creators', 'Photographers'], tags: [], links: [['/creators/join-artist.html', 'Join as an artist'], ['/creators/', 'Creator programme']] });
    } else if (tab === 'paintings') {
      d.artists.forEach(function (a) {
        (a.artworks || []).filter(function (w) { return w.image; }).forEach(function (w) {
          out.push({ key: 'art:' + a.id + ':' + (w.id || w.title), kind: 'painting', title: w.title, sub: 'by ' + a.name + (w.status ? ' · ' + w.status : ''),
            badge: w.type ? String(w.type).toUpperCase() : 'ARTWORK', img: w.image, chips: [w.medium, w.size, w.price].filter(Boolean),
            tags: tagsOf([w.title].concat(a.themes || [])), links: [[w.url || artistPage(a), w.url ? 'View or buy' : 'Artist page', !!w.url]], ref: a });
        });
      });
    } else {
      var all = Array.isArray(W.RW_PARTNERS) ? W.RW_PARTNERS : (W.RW_PARTNER_SEED || []);
      all.filter(function (p) { return p && p.cat === 'stay' && typeof W.rwStayPublicEligible === 'function' && W.rwStayPublicEligible(p) && (typeof W.rwBookingOpen !== 'function' || W.rwBookingOpen(p)); })
        .forEach(function (p) {
          var ph = (p.photos || [])[0];
          var src = ph ? (typeof W.rwListingPhotoUrl === 'function' ? W.rwListingPhotoUrl(ph.src) : ph.src) : '';
          out.push({ key: 'stay:' + p.id, kind: 'stay', title: p.name, sub: [p.area, p.zone].filter(Boolean).join(' · '), badge: (p.badges && p.badges[0]) ? String(p.badges[0]).toUpperCase() : 'STAY',
            img: src || '', glyph: '🏡', desc: p.hook || '', chips: (p.badges || []).slice(0, 4),
            tags: tagsOf([p.hook, p.area, p.zone].concat(p.badges || [])), stay: p,
            links: p.instagramUrl ? [[p.instagramUrl, 'Instagram', 1]] : [] });
        });
    }
    if (includeSeen) return out;
    var seen = store().seen || {};
    var fresh = out.filter(function (c) { return !seen[c.key]; });
    fresh = fresh.length ? fresh : out; /* everything seen: start the deck again */
    return W.RWTaste ? W.RWTaste.rank(fresh) : fresh; /* learned taste orders the deck (js/ui/discover-taste.js) */
  }

  /* ---------- rendering ---------- */
  function renderCard(c, depth) {
    var card = node('article', 'rw-dsc-card'); card.dataset.depth = String(depth); card.dataset.key = c.key;
    card.setAttribute('aria-label', c.title + (c.sub ? ', ' + c.sub : ''));
    var img = node('div', 'rw-dsc-img' + (c.img ? '' : ' pattern'));
    if (c.img) img.style.backgroundImage = 'url("' + rel(c.img).replace(/"/g, '%22') + '")'; else img.textContent = c.glyph || '🎨';
    card.append(img, node('div', 'rw-dsc-shade'));
    var pct = matchPct(c.tags);
    if (pct != null) { var m = node('div', 'rw-dsc-match'); m.style.setProperty('--m', pct); m.append(node('b', '', pct + '%'), node('small', '', 'your match')); card.append(m); }
    var info = node('div', 'rw-dsc-info');
    if (c.badge) info.append(node('span', 'rw-dsc-badge', c.badge));
    info.append(node('h3', '', c.title)); if (c.sub) info.append(node('p', 'rw-dsc-sub', c.sub));
    if (c.desc) info.append(node('p', 'rw-dsc-desc', c.desc));
    var chips = node('div', 'rw-dsc-chips');
    c.chips.forEach(function (t) { chips.append(node('span', '', t)); });
    c.tags.forEach(function (t) { if (state.vibes.indexOf(t) >= 0) { var s = node('span', 'hit', '✓ ' + t); chips.prepend(s); } });
    info.append(chips);
    var links = node('div', 'rw-dsc-links');
    c.links.forEach(function (l) { var a = node('a', '', l[1]); a.href = /^https?:/.test(l[0]) ? l[0] : rel(l[0]); if (l[2]) { a.target = '_blank'; a.rel = 'noopener'; } links.append(a); });
    if (c.kind === 'stay') { var b = node('a', '', 'See rooms & dates'); b.href = '#'; b.addEventListener('click', function (e) { e.preventDefault(); openStay(c.stay); }); links.prepend(b); }
    if (links.children.length) info.append(links);
    card.append(info);
    ['like', 'nope', 'save'].forEach(function (k) { card.append(node('span', 'rw-dsc-stamp ' + k, k === 'like' ? 'LOVE' : k === 'nope' ? 'PASS' : 'SAVE')); });
    if (depth === 0) drag(card, c);
    return card;
  }
  function renderDeck() {
    var deck = state.root.querySelector('.rw-dsc-deck'); deck.replaceChildren();
    var rest = state.deck.slice(state.idx, state.idx + 4);
    if (!rest.length) { deck.append(summary()); return; }
    for (var i = rest.length - 1; i >= 0; i--) deck.append(renderCard(rest[i], i));
  }
  function summary() {
    var s = store(), box = node('div', 'rw-dsc-empty');
    box.append(node('h3', '', 'Your picks'));
    var liked = (s.liked || []).concat(s.saved || []);
    var mine = liked.map(function (k) { return findAny(k); }).filter(Boolean);
    if (!mine.length) box.append(node('p', 'rw-dsc-sub', 'Nothing loved yet. Start again, or try another tab.'));
    mine.slice(-12).reverse().forEach(function (c) {
      var a = node('a'); a.href = c.links[0] ? (/^https?:/.test(c.links[0][0]) ? c.links[0][0] : rel(c.links[0][0])) : '#';
      if (c.kind === 'stay') a.addEventListener('click', function (e) { e.preventDefault(); openStay(c.stay); });
      if (c.img) { var im = node('img'); im.src = rel(c.img); im.alt = ''; a.append(im); }
      var t = node('span', '', c.title); t.append(node('small', '', c.sub || '')); a.append(t); box.append(a);
    });
    var ideas = collabIdeas(mine);
    if (ideas.length) {
      box.append(node('h3', '', 'Collaboration ideas'));
      ideas.forEach(function (x) {
        var a = node('a'); a.href = 'creators/match.html';
        var t = node('span', '', x.artist + ' × ' + x.place); t.append(node('small', '', 'Shared themes: ' + x.shared.join(', ') + '. A proposal, not a confirmed booking.'));
        a.append(t); box.append(a);
      });
    }
    if (W.RWTaste) box.append(W.RWTaste.shelf());
    var again = node('button', '', '↺ Start this deck again'); again.type = 'button';
    again.addEventListener('click', function () { var st = store(); st.seen = {}; save(st); setTab(state.tab); });
    box.append(again);
    return box;
  }
  function findAny(key) {
    for (var i = 0; i < TABS.length; i++) {
      var hit = cardsFor(TABS[i][0], true).filter(function (c) { return c.key === key; })[0];
      if (hit) return hit;
    }
    return null;
  }
  /* Liked artists x the collaboration properties already researched in artists-data.json. */
  function collabIdeas(mine) {
    var props = (state.data && state.data.properties) || [], out = [];
    mine.filter(function (c) { return c.kind === 'artist' && c.ref; }).forEach(function (c) {
      var at = (c.ref.themes || []).map(norm);
      props.forEach(function (p) {
        var shared = (p.themes || []).map(norm).filter(function (t) { return at.indexOf(t) >= 0; });
        if (shared.length >= 2) out.push({ artist: c.ref.name, place: p.name + (p.city ? ' (' + p.city + ')' : ''), shared: shared });
      });
    });
    return out.slice(0, 6);
  }

  /* ---------- swiping ---------- */
  function drag(card, c) {
    var sx = 0, sy = 0, dx = 0, dy = 0, t0 = 0, on = false;
    card.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a,button')) return;
      on = true; sx = e.clientX; sy = e.clientY; t0 = Date.now(); card.classList.add('dragging');
      try { card.setPointerCapture(e.pointerId); } catch (x) { /* older WebView */ }
    });
    card.addEventListener('pointermove', function (e) {
      if (!on) return; dx = e.clientX - sx; dy = e.clientY - sy;
      card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 16) + 'deg)';
      stamp(card, dx, dy);
    });
    function end() {
      if (!on) return; on = false; card.classList.remove('dragging');
      var v = Math.abs(dx) / Math.max(1, Date.now() - t0);
      if (dy < -110 && Math.abs(dy) > Math.abs(dx)) decide('save', c, card);
      else if (dx > 110 || (dx > 40 && v > 0.6)) decide('like', c, card);
      else if (dx < -110 || (dx < -40 && v > 0.6)) decide('nope', c, card);
      else { card.style.transform = ''; stamp(card, 0, 0); }
      dx = dy = 0;
    }
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  }
  function stamp(card, dx, dy) {
    var s = card.querySelectorAll('.rw-dsc-stamp');
    s[0].style.opacity = Math.max(0, Math.min(1, dx / 110)); s[1].style.opacity = Math.max(0, Math.min(1, -dx / 110));
    s[2].style.opacity = Math.max(0, Math.min(1, -dy / 110)) * (Math.abs(dy) > Math.abs(dx) ? 1 : 0);
  }
  function decide(kind, c, card) {
    card = card || state.root.querySelector('.rw-dsc-card[data-depth="0"]');
    c = c || state.deck[state.idx]; if (!card || !c) return;
    var out = kind === 'like' ? 'translate(140vw,-6vh) rotate(28deg)' : kind === 'nope' ? 'translate(-140vw,-6vh) rotate(-28deg)' : 'translate(0,-130vh) rotate(-4deg)';
    stamp(card, kind === 'like' ? 200 : kind === 'nope' ? -200 : 0, kind === 'save' ? -200 : 0);
    card.style.transform = out; card.style.opacity = '0';
    var s = store(); s.seen = s.seen || {}; s.seen[c.key] = 1;
    if (kind === 'like') { s.liked = (s.liked || []).filter(function (k) { return k !== c.key; }).concat(c.key); burst(['💖', '✨', '🧡', '💫']); }
    if (W.RWTaste && c) { W.RWTaste.learn((c.tags || []).concat(W.RWTaste.tagsOfText((c.chips || []).join(' ') + ' ' + c.title)), kind, { id: c.key }); if (kind === 'like') W.RWTaste.offer(c, state.root, openStay); }
    if (kind === 'save') { s.saved = (s.saved || []).filter(function (k) { return k !== c.key; }).concat(c.key); burst(['⭐', '✨']); }
    save(s); state.history.push({ key: c.key, kind: kind });
    try { if (navigator.vibrate) navigator.vibrate(kind === 'nope' ? 8 : 18); } catch (e) { /* no haptics */ }
    state.idx++; setTimeout(renderDeck, 260);
  }
  function undo() {
    var last = state.history.pop(); if (!last || state.idx === 0) return;
    var s = store(); if (s.seen) delete s.seen[last.key];
    ['liked', 'saved'].forEach(function (k) { s[k] = (s[k] || []).filter(function (x) { return x !== last.key; }); });
    save(s); state.idx--; renderDeck();
  }
  function burst(glyphs) {
    var deck = state.root.querySelector('.rw-dsc-deck').getBoundingClientRect();
    for (var i = 0; i < 14; i++) {
      var p = node('span', 'rw-dsc-burst', glyphs[i % glyphs.length]);
      p.style.left = (deck.left + deck.width / 2) + 'px'; p.style.top = (deck.top + deck.height / 2) + 'px';
      var a = Math.random() * Math.PI * 2, r = 90 + Math.random() * 140;
      p.style.setProperty('--dx', Math.cos(a) * r + 'px'); p.style.setProperty('--dy', Math.sin(a) * r - 40 + 'px'); p.style.setProperty('--r', (Math.random() * 120 - 60) + 'deg');
      document.body.append(p); setTimeout(function (n) { n.remove(); }.bind(null, p), 950);
    }
  }
  function openStay(p) { close(); if (typeof W.openStays === 'function') W.openStays(p.zone || '', p.id); }

  /* ---------- shell ---------- */
  function setTab(tab) {
    state.tab = tab; state.idx = 0; state.history = []; state.deck = cardsFor(tab);
    state.root.querySelectorAll('.rw-dsc-tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); });
    renderDeck();
  }
  function onKey(e) {
    if (!state.root) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') decide('like'); else if (e.key === 'ArrowLeft') decide('nope'); else if (e.key === 'ArrowUp') decide('save');
  }
  W.rwCloseDiscover = function () { close(); };
  function close() { if (!state.root) return; state.root.remove(); state.root = null; document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; }
  function open(tab) {
    if (state.root) close();
    var root = node('div', 'rw-dsc'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Discover artists, paintings and stays');
    var top = node('div', 'rw-dsc-top'); top.append(node('h2', '', 'Discover'));
    var x = node('button', '', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', close); top.append(x);
    var tabs = node('div', 'rw-dsc-tabs'); tabs.setAttribute('role', 'tablist');
    TABS.forEach(function (t) { var b = node('button', '', t[1]); b.type = 'button'; b.dataset.tab = t[0]; b.setAttribute('role', 'tab'); b.addEventListener('click', function () { setTab(t[0]); }); tabs.append(b); });
    var vibes = node('div', 'rw-dsc-vibes'); vibes.setAttribute('aria-label', 'Pick your vibes to see a match score');
    state.vibes = store().vibes || [];
    VIBES.forEach(function (v) {
      var b = node('button', '', v[1]); b.type = 'button'; b.setAttribute('aria-pressed', String(state.vibes.indexOf(v[0]) >= 0));
      b.addEventListener('click', function () {
        var i = state.vibes.indexOf(v[0]); if (i >= 0) state.vibes.splice(i, 1); else state.vibes.push(v[0]);
        b.setAttribute('aria-pressed', String(i < 0)); var s = store(); s.vibes = state.vibes; save(s); renderDeck();
      });
      vibes.append(b);
    });
    var deck = node('div', 'rw-dsc-deck');
    var acts = node('div', 'rw-dsc-actions');
    [['undo', '↺', 'Undo', undo], ['nope', '✕', 'Pass', function () { decide('nope'); }], ['like', '♥', 'Love', function () { decide('like'); }], ['save', '★', 'Save for later', function () { decide('save'); }]]
      .forEach(function (a) { var b = node('button', 'rw-dsc-a-' + a[0], a[1]); b.type = 'button'; b.setAttribute('aria-label', a[2]); b.addEventListener('click', a[3]); acts.append(b); });
    root.append(top, tabs, vibes, deck, acts, node('p', 'rw-dsc-hint', 'Swipe right to love, left to pass, up to save. Picks stay on this device.'));
    document.body.append(root); state.root = root; document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    deck.append(node('p', 'rw-dsc-hint', 'Loading…'));
    loadData().then(function () { if (state.root === root) setTab(tab || 'artists'); });
  }
  W.rwOpenDiscover = open;
  W.rwCloseDiscover = close;
})();
