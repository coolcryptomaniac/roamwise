/* RWTaste: learns from Discover swipes and turns matches into things to buy or book.
 *
 * - learn(tags, kind): a love (+1), save (+1.5) or buy tap (+3) raises those tags; a pass (-0.6) lowers
 *   them. Older signals fade a little each time (x0.97), so recent taste counts most.
 * - rank(cards): orders the next deck by taste, keeping 1 in 5 slots for something different so the
 *   deck keeps exploring instead of showing only one kind of thing.
 * - offer(card): after a love, a "Make it yours" bar with the real next step (book the stay, view or buy
 *   the painting, commission the artist) plus the best-matching product from the shop or books.
 * - shelf(): "Picked for you" — shop clothing, books, art and stays ranked by taste, each with its buy or
 *   book button. askAilon() hands the learned taste to Ailon Tusk for AI recommendations.
 * Everything stays on this device (localStorage rw_taste_v1); nothing is charged here — buttons open the
 * existing shop, book, artist and stay pages where the purchase happens. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window), KEY = 'rw_taste_v1', DECAY = 0.97;
  var STEP = { like: 1, save: 1.5, buy: 3, nope: -0.6 };
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function keep(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } }
  function node(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  /** @type {Array<[string, RegExp]>} */
  var VOCAB = [
    ['spiritual', /spirit|shiva|yantra|ganesh|\bram\b|devi|temple|mandala|bhakti|sacred|om\b/],
    ['himalayan', /himal|mountain|peak|kailash|almora|kumaon|hill/],
    ['culture', /cultur|heritage|kumaoni|craft|tradition/],
    ['wellness', /well|yoga|medit|retreat|calm|quiet/],
    ['folk', /aipan|folk|bandana/],
    ['nature', /landscape|nature|forest|jungle|garden|river|lake|valley/],
    ['fashion', /hoodie|tee|shirt|wear|headband|tote|bandana|style|merch/],
    ['reading', /book|novel|fiction|story|read|study|exam/],
    ['tech', /\bai\b|artificial|machine|tech|silicon|science|volt/],
    ['night', /after dark|night|rave|party|music/]
  ];
  function tagsOfText(text) { var t = String(text || '').toLowerCase(), out = []; VOCAB.forEach(function (v) { if (v[1].test(t)) out.push(v[0]); }); return out; }
  function learn(tags, kind, meta) {
    var step = STEP[kind]; tags = (tags || []).filter(function (t, i, a) { return t && a.indexOf(t) === i; }); if (!step || !tags.length) return;
    var s = load(); s.w = s.w || {}; s.n = (s.n || 0) + 1;
    Object.keys(s.w).forEach(function (k) { s.w[k] = Math.round(s.w[k] * DECAY * 1000) / 1000; if (Math.abs(s.w[k]) < 0.02) delete s.w[k]; });
    tags.forEach(function (t) { s.w[t] = (s.w[t] || 0) + step / Math.sqrt(tags.length); });
    if (kind === 'buy') { s.buys = (s.buys || []).concat([{ id: meta && meta.id || '', at: Date.now() }]).slice(-50); }
    keep(s);
  }
  function score(tags) { var w = load().w || {}, sum = 0; (tags || []).forEach(function (t) { sum += w[t] || 0; }); return tags && tags.length ? sum / Math.sqrt(tags.length) : 0; }
  function top(n) { var w = load().w || {}; return Object.keys(w).filter(function (k) { return w[k] > 0; }).sort(function (a, b) { return w[b] - w[a]; }).slice(0, n || 4); }
  function rank(cards) {
    if (!cards || cards.length < 3 || !(load().n > 0)) return cards;
    var sorted = cards.slice().sort(function (a, b) { return score(b.tags) - score(a.tags); });
    var rest = sorted.slice(), out = [];
    while (rest.length) { var explore = out.length % 5 === 4 && rest.length > 1; out.push(explore ? rest.splice(Math.floor(rest.length / 2 + Math.random() * rest.length / 2), 1)[0] : rest.shift()); }
    return out;
  }
  /* Things a match can lead to buying or booking. */
  var catalogCache = null;
  function catalog() {
    if (catalogCache) return Promise.resolve(catalogCache);
    var items = [];
    return shopCatalog().then(function () { return build(items); });
  }
  /* The shop catalogue is a classic script on /shop/; load it on demand elsewhere. */
  function shopCatalog() {
    if (W.RWShopCatalog) return Promise.resolve();
    return new Promise(/** @param {(v?: any) => void} done */ function (done) { var sc = document.createElement('script'); sc.src = '/shop/catalog.js'; sc.onload = sc.onerror = function () { done(); }; document.head.appendChild(sc); });
  }
  function build(items) {
    (W.RWShopCatalog || []).filter(function (p) { return p.live; }).forEach(function (p) {
      items.push({ id: 'shop:' + p.id, kind: 'Wear', title: p.name, sub: p.type + ' · ' + p.price, img: p.image, href: '/shop/' + (p.href || ''), cta: 'Buy', tags: tagsOfText([p.name, p.type, p.category, p.description].join(' ')).concat(['fashion']) });
    });
    return fetch('/books/data.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (/** @type {any} */ b) {
      ((b && b.books) || []).forEach(function (x) {
        var l = x.links || {}, link = [l.amazon, l.pothi, l.flipkart].filter(function (u) { return /^https:\/\//.test(u || ''); })[0];
        items.push({ id: 'book:' + x.id, kind: 'Book', title: x.title, sub: x.subtitle || x.room || '', img: '', glyph: '📚', href: link || '/books/', ext: !!link, cta: link ? 'Buy book' : 'See book', tags: tagsOfText([x.title, x.subtitle, x.blurb, x.room].join(' ')).concat(['reading']) });
      });
      return fetch('/creators/artists-data.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    }).then(function (/** @type {any} */ d) {
      ((d && d.artists) || []).forEach(function (a) {
        (a.artworks || []).filter(function (w) { return w.image; }).slice(0, 3).forEach(function (w) {
          items.push({ id: 'art:' + a.id + ':' + (w.id || w.title), kind: 'Art', title: w.title, sub: 'by ' + a.name + (w.price ? ' · ' + w.price : ''), img: w.image, href: w.url || a.page || '/creators/artists.html', ext: !!w.url, cta: w.url ? 'Buy art' : 'Enquire', tags: tagsOfText([w.title, (a.themes || []).join(' ')].join(' ')) });
        });
      });
      var all = Array.isArray(W.RW_PARTNERS) ? W.RW_PARTNERS : (W.RW_PARTNER_SEED || []);
      all.filter(function (p) { return p && p.cat === 'stay' && typeof W.rwStayPublicEligible === 'function' && W.rwStayPublicEligible(p) && (typeof W.rwBookingOpen !== 'function' || W.rwBookingOpen(p)); }).forEach(function (p) {
        var ph = (p.photos || [])[0], src = ph ? (typeof W.rwListingPhotoUrl === 'function' ? W.rwListingPhotoUrl(ph.src) : ph.src) : '';
        items.push({ id: 'stay:' + p.id, kind: 'Stay', title: p.name, sub: [p.area, p.zone].filter(Boolean).join(' · '), img: src, glyph: '🏡', href: '#', cta: 'Book', tap: function () { if (typeof W.rwCloseDiscover === 'function') W.rwCloseDiscover(); if (typeof W.openStays === 'function') W.openStays(p.zone || '', p.id); }, tags: tagsOfText([p.name, p.hook, p.area, p.zone].concat(p.badges || []).join(' ')).concat(['stay']) });
      });
      catalogCache = items; return items;
    });
  }
  function picks(n, exclude) {
    return catalog().then(function (items) {
      var seenKinds = {}, list = items.filter(function (x) { return !exclude || exclude.indexOf(x.id) < 0; }).sort(function (a, b) { return score(b.tags) - score(a.tags); });
      /* Mix: the best of each kind first, then the rest by score. */
      var head = list.filter(function (x) { if (seenKinds[x.kind]) return false; seenKinds[x.kind] = 1; return true; });
      return head.concat(list.filter(function (x) { return head.indexOf(x) < 0; })).slice(0, n || 8);
    });
  }
  function buyLink(item) {
    var a = node('a', 'rw-tst-buy', item.cta); a.href = item.href; if (item.ext) { a.target = '_blank'; a.rel = 'noopener'; }
    a.addEventListener('click', function (e) { learn(item.tags.length ? item.tags : [item.kind.toLowerCase()], 'buy', item); if (item.tap) { e.preventDefault(); item.tap(); } });
    return a;
  }
  function tile(item) {
    var t = node('div', 'rw-tst-item');
    var pic = node('span', 'rw-tst-pic'); if (item.img) { var im = node('img'); im.src = item.img; im.alt = ''; im.loading = 'lazy'; pic.append(im); } else pic.textContent = item.glyph || '🛍️';
    var body = node('span', 'rw-tst-body'); body.append(node('small', '', item.kind.toUpperCase()), node('b', '', item.title), node('em', '', item.sub));
    t.append(pic, body, buyLink(item));
    return t;
  }
  function shelf() {
    var stale = document.querySelector('.rw-tst-offer'); if (stale) stale.remove();
    var box = node('div', 'rw-tst-shelf');
    var t = top(3); box.append(node('h3', '', 'Picked for you'), node('p', 'rw-dsc-sub', t.length ? 'Because you love ' + t.join(', ') + '. Gets sharper with every swipe.' : 'Swipe a few cards and this shelf learns your taste.'));
    var list = node('div', 'rw-tst-list'); box.append(list);
    picks(8).then(function (items) { items.forEach(function (x) { list.append(tile(x)); }); });
    var ask = node('button', 'rw-tst-ask', '✨ Ask Ailon for more picks'); ask.type = 'button'; ask.addEventListener('click', askAilon); box.append(ask);
    return box;
  }
  /* Next step for the card just loved, shown as a bar inside the deck. */
  function offer(c, host, openStay) {
    if (!c || !host || c.kind === 'join') return;
    var old = host.querySelector('.rw-tst-offer'); if (old) old.remove();
    var bar = node('div', 'rw-tst-offer'); bar.setAttribute('role', 'status');
    bar.append(node('b', '', '💖 Make it yours'));
    var acts = node('span', 'rw-tst-acts');
    if (c.kind === 'stay') { var b = node('a', 'rw-tst-buy', 'Book this stay'); b.href = '#'; b.addEventListener('click', function (e) { e.preventDefault(); learn(c.tags, 'buy', { id: c.key }); openStay(c.stay); }); acts.append(b); }
    else if (c.links && c.links[0]) acts.append(buyLink({ id: c.key, kind: 'Art', title: c.title, href: c.links[0][0], ext: !!c.links[0][2], cta: c.kind === 'painting' ? 'View or buy' : 'Commission art', tags: c.tags }));
    picks(1, [c.key]).then(function (p) { if (p[0]) { var x = p[0]; acts.append(buyLink({ id: x.id, kind: x.kind, title: x.title, href: x.href, ext: x.ext, cta: x.cta + ': ' + x.title, tags: x.tags })); } });
    bar.append(acts); host.append(bar);
    setTimeout(function () { bar.remove(); }, 9000);
  }
  function askAilon() {
    var t = top(4), s = load(), bought = (s.buys || []).length;
    var prompt = 'Recommend from RoamWise for my taste: ' + (t.length ? t.join(', ') : 'open to anything') + '. Suggest 3 stays, 2 books, 2 clothing items from the RoamWise shop and 2 artworks or artists, with one line each on why they fit.' + (bought ? ' I have already tapped buy on ' + bought + ' items, so suggest new things.' : '');
    try { if (typeof W.rwCloseDiscover === 'function') W.rwCloseDiscover(); } catch (e) { /* deck already closed */ }
    var input = /** @type {any} */ (document.getElementById('heroInput'));
    if (input && typeof W.copilotSend === 'function') { try { W.tabGo && W.tabGo('home'); } catch (e) { /* nav */ } input.value = prompt; W.copilotSend(true); }
    else location.href = '/?q=' + encodeURIComponent(prompt);
  }
  W.RWTaste = { learn: learn, score: score, top: top, rank: rank, picks: picks, shelf: shelf, offer: offer, askAilon: askAilon, tagsOfText: tagsOfText };
})();
