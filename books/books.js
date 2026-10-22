/* RoamWise Bookshelf: renders the Home carousel (#rwBooks .rwb-mount) and /books/ (#rwbPage) from /books/data.json.
   Kindle-style sample reader opens only for books that have /books/samples/<id>.json. Text set via esc(); no tracking.
   Never invents links: empty Pothi shows "link soon"; empty Amazon/Flipkart fall back to a store search for the title. */
(function () {
  'use strict';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function safeSrc(s) { s = String(s || ''); return /^(\/[^\/]|https:\/\/)/.test(s) ? s : ''; }
  function safeUrl(s) { s = String(s || ''); return /^https:\/\//.test(s) ? s : ''; }
  var DATA = null, SAMPLES = {};

  function get(u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  function load() { return DATA ? Promise.resolve(DATA) : get('/books/data.json').then(function (d) { DATA = d; return d; }); }
  function hasSample(id) { if (id in SAMPLES) return Promise.resolve(SAMPLES[id]); return get('/books/samples/' + encodeURIComponent(id) + '.json').then(function (d) { return (SAMPLES[id] = d && d.chapters && d.chapters.length ? d : null); }, function () { return (SAMPLES[id] = null); }); }

  function cover(b) {
    var c = b.cover || {}, img = safeSrc(c.image);
    return '<div class="rwb-stage"><div class="rwb-book"><div class="rwb-front" style="--f:' + esc(/^#[0-9a-f]{3,8}$/i.test(c.from) ? c.from : '#222') + ';--t:' + esc(/^#[0-9a-f]{3,8}$/i.test(c.to) ? c.to : '#555') + ';--a:' + esc(/^#[0-9a-f]{3,8}$/i.test(c.accent) ? c.accent : '#fff') + '">' +
      (img ? '<img src="' + esc(img) + '" alt="' + esc(b.title) + ' cover" loading="lazy">' :
        '<div class="rwb-emoji" aria-hidden="true">' + esc(c.emoji || '📖') + '</div><div><div class="rwb-ct">' + esc(b.title) + '</div><div class="rwb-cs">' + esc(b.subtitle || '') + '</div></div><div class="rwb-ca">' + esc((DATA.author || '').toUpperCase()) + '</div>') +
      '</div></div></div>';
  }
  function btn(cls, name, href, sub) {
    if (!href) return '<span class="rwb-btn rwb-off" aria-disabled="true"><span>' + esc(name) + '<br><small>Link coming soon</small></span></span>';
    return '<a class="rwb-btn ' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener sponsored"><span>' + (/·/.test(name) ? '' : 'Buy on ') + esc(name) + '<br><small>' + esc(sub) + '</small></span><span class="rwb-ar" aria-hidden="true">&rarr;</span></a>';
  }
  function slide(b) {
    var L = b.links || {}, q = encodeURIComponent(b.title + ' ' + (DATA.author || ''));
    var amz = safeUrl(L.amazon), fk = safeUrl(L.flipkart), pt = safeUrl(L.pothi);
    var extra = (L.extra || []).map(function (x) { return safeUrl(x.url) ? btn('rwb-pothi', x.label || 'Pothi', safeUrl(x.url), 'Official listing') : ''; }).join('');
    return '<article class="rwb-slide" data-id="' + esc(b.id) + '"><div class="rwb-room">' + esc(b.room || 'Library') + '</div>' + cover(b) +
      '<div class="rwb-tags">' + (b.formats || []).map(function (f) { return '<span class="rwb-tag">' + esc(String(f).toUpperCase()) + '</span>'; }).join('') + '</div>' +
      '<h3>' + esc(b.title) + '</h3><p class="rwb-st">' + esc(b.subtitle || '') + '</p><p class="rwb-bl">' + esc(b.blurb || '') + '</p>' +
      (b.meta ? '<p class="rwb-meta">' + esc(b.meta) + '</p>' : '') + (b.note ? '<p class="rwb-note">' + esc(b.note) + '</p>' : '') +
      '<div class="rwb-btns"><button class="rwb-btn rwb-read" data-read="' + esc(b.id) + '" hidden><span>Read a free sample<br><small>Opens the e-reader</small></span><span class="rwb-ar" aria-hidden="true">&#128214;</span></button>' +
      btn('rwb-pothi', L.pothiName || 'Pothi', pt, 'Official listing') + extra +
      btn('rwb-amz', 'Amazon', amz || ('https://www.amazon.in/s?k=' + q), amz ? (L.amazonSub || 'Official listing') : 'Search for this title') +
      (L.flipkart === 'none' ? '' : btn('rwb-flip', 'Flipkart', fk || ('https://www.flipkart.com/search?q=' + q), fk ? 'Official listing' : 'Search for this title')) + '</div></article>';
  }
  function wire(root) {
    root.querySelectorAll('.rwb-slide').forEach(function (s) {
      var id = s.getAttribute('data-id'), rb = s.querySelector('[data-read]');
      hasSample(id).then(function (d) { if (d && rb) { rb.hidden = false; rb.onclick = function () { openReader(id, d); }; } });
    });
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 }) : null;
    root.querySelectorAll('.rwb-rv').forEach(function (n) { io ? io.observe(n) : n.classList.add('in'); });
  }

  /* ---------- Kindle-style reader ---------- */
  var rk, st = { th: 'paper', fs: 18, ff: 'serif', page: 0, pages: 1, book: null, data: null, W: 0, gap: 40 };
  var FF = { serif: 'Georgia,"Times New Roman",serif', sans: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' };
  function pref() { try { var p = JSON.parse(localStorage.getItem('rwReader') || '{}'); ['th', 'fs', 'ff'].forEach(function (k) { if (p[k]) st[k] = p[k]; }); } catch (e) {} }
  function savePref() { try { localStorage.setItem('rwReader', JSON.stringify({ th: st.th, fs: st.fs, ff: st.ff })); } catch (e) {} }
  function savePos() { try { localStorage.setItem('rwPos:' + st.book, String(st.page / Math.max(1, st.pages - 1))); } catch (e) {} }
  function build() {
    rk = document.createElement('div'); rk.className = 'rk'; rk.setAttribute('role', 'dialog'); rk.setAttribute('aria-modal', 'true'); rk.setAttribute('aria-label', 'Sample reader');
    rk.innerHTML = '<div class="rk-dev"><div class="rk-screen">' +
      '<div class="rk-bar top"><button data-a="close" aria-label="Close reader">&#10005;</button><b></b><button data-a="toc" aria-label="Chapters">&#9776;</button><button data-a="aa" aria-label="Text settings">Aa</button></div>' +
      '<div class="rk-panel" id="rkAa"><div class="rk-row"><span>Size</span><button data-fs="-1">A&minus;</button><button data-fs="1">A+</button></div>' +
      '<div class="rk-row"><span>Theme</span><button data-th="paper">Paper</button><button data-th="sepia">Sepia</button><button data-th="dark">Dark</button></div>' +
      '<div class="rk-row"><span>Font</span><button data-ff="serif">Serif</button><button data-ff="sans">Sans</button></div></div>' +
      '<div class="rk-panel rk-toc" id="rkToc"></div>' +
      '<div class="rk-view"><div class="rk-tap l" data-a="prev"></div><div class="rk-tap c" data-a="chrome"></div><div class="rk-tap r" data-a="next"></div><div class="rk-flow" id="rkFlow"></div></div>' +
      '<div class="rk-bar bot"><button data-a="prev" aria-label="Previous page">&#8249;</button><div class="rk-prog"><i></i></div><span class="rk-pg"></span><button data-a="next" aria-label="Next page">&#8250;</button></div>' +
      '</div></div>';
    document.body.appendChild(rk);
    rk.addEventListener('click', function (e) {
      var t = e.target.closest('[data-a],[data-fs],[data-th],[data-ff],[data-ch]'); if (!t) { if (e.target === rk) closeReader(); return; }
      var a = t.getAttribute('data-a');
      if (a === 'close') closeReader(); else if (a === 'next') go(st.page + 1); else if (a === 'prev') go(st.page - 1);
      else if (a === 'chrome') { rk.classList.toggle('rk-hide'); panels(); }
      else if (a === 'aa') togglePanel('rkAa'); else if (a === 'toc') togglePanel('rkToc');
      else if (t.hasAttribute('data-fs')) { st.fs = Math.max(14, Math.min(30, st.fs + 2 * +t.getAttribute('data-fs'))); apply(true); }
      else if (t.hasAttribute('data-th')) { st.th = t.getAttribute('data-th'); apply(false); }
      else if (t.hasAttribute('data-ff')) { st.ff = t.getAttribute('data-ff'); apply(true); }
      else if (t.hasAttribute('data-ch')) { jumpTo(+t.getAttribute('data-ch')); panels(); }
    });
    document.addEventListener('keydown', function (e) { if (!rk.classList.contains('open')) return; if (e.key === 'Escape') closeReader(); if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(st.page + 1); } if (e.key === 'ArrowLeft') go(st.page - 1); });
    var sx = 0, sy = 0, v = rk.querySelector('.rk-view');
    v.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    v.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); go(st.page + (dx < 0 ? 1 : -1)); } });
    window.addEventListener('resize', function () { if (rk.classList.contains('open')) apply(true); });
  }
  function panels() { rk.querySelectorAll('.rk-panel').forEach(function (p) { p.classList.remove('open'); }); }
  function togglePanel(id) { var p = rk.querySelector('#' + id), o = p.classList.contains('open'); panels(); if (!o) p.classList.add('open'); }
  function apply(relayout) {
    var s = rk.querySelector('.rk-screen'); s.className = 'rk-screen rk-' + st.th; savePref();
    rk.querySelectorAll('[data-th]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-th') === st.th); });
    rk.querySelectorAll('[data-ff]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-ff') === st.ff); });
    if (relayout) layout(st.pages > 1 ? st.page / (st.pages - 1) : 0);
  }
  function layout(frac) {
    var view = rk.querySelector('.rk-view'), flow = rk.querySelector('#rkFlow'), cs = getComputedStyle(view);
    view.style.setProperty('--ff', FF[st.ff]); view.style.setProperty('--fs', st.fs + 'px'); view.style.padding = '18px 20px';
    var W = Math.max(120, view.clientWidth - 40), H = Math.max(120, view.clientHeight - 36);
    st.W = W; flow.style.cssText = 'width:' + W + 'px;height:' + H + 'px;column-width:' + W + 'px;column-gap:' + st.gap + 'px;transform:translateX(0)';
    var n = Math.max(1, Math.round((flow.scrollWidth + st.gap) / (W + st.gap)));
    st.pages = n; st.page = Math.min(n - 1, Math.max(0, Math.round((frac || 0) * (n - 1)))); show();
  }
  function show() {
    var flow = rk.querySelector('#rkFlow'); flow.style.transform = 'translateX(' + (-st.page * (st.W + st.gap)) + 'px)';
    rk.querySelector('.rk-prog i').style.width = (st.pages > 1 ? 100 * st.page / (st.pages - 1) : 100) + '%';
    rk.querySelector('.rk-pg').textContent = (st.page + 1) + ' / ' + st.pages; savePos();
  }
  function go(p) { if (p < 0 || p > st.pages - 1) return; st.page = p; show(); }
  function jumpTo(ci) { var h = rk.querySelectorAll('#rkFlow h2')[ci]; if (!h) return; var left = h.offsetLeft; st.page = Math.max(0, Math.min(st.pages - 1, Math.round(left / (st.W + st.gap)))); show(); }
  function openReader(id, data) {
    if (!rk) { pref(); build(); }
    var b = (DATA.books || []).filter(function (x) { return x.id === id; })[0] || { title: id };
    st.book = id; st.data = data; rk.querySelector('.rk-bar b').textContent = b.title + ' · sample';
    var html = ''; data.chapters.forEach(function (c) { html += '<h2>' + esc(c.title) + '</h2>' + (c.text || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); });
    html += '<h2>That\'s the end of the sample</h2><p class="rk-off">Enjoyed it? The full book is on Pothi, Amazon and Flipkart. Close the reader to find the buttons.</p>';
    rk.querySelector('#rkFlow').innerHTML = html;
    rk.querySelector('#rkToc').innerHTML = data.chapters.map(function (c, i) { return '<button data-ch="' + i + '">' + esc(c.title) + '</button>'; }).join('');
    rk.classList.remove('rk-hide'); panels(); rk.classList.add('open'); document.body.style.overflow = 'hidden';
    var frac = 0; try { frac = parseFloat(localStorage.getItem('rwPos:' + id)) || 0; } catch (e) {}
    apply(false); requestAnimationFrame(function () { layout(frac); });
  }
  function closeReader() { rk.classList.remove('open'); document.body.style.overflow = ''; }

  /* ---------- mounts ---------- */
  function home(m, d) {
    m.innerHTML = '<div class="rwb-track" tabindex="0" aria-label="Books by ' + esc(d.author) + '">' + d.books.map(slide).join('') + '</div><div class="rwb-dots"></div><a class="rwb-more" href="/books/">Enter the full library &rarr;</a>';
    var t = m.querySelector('.rwb-track'); if (window.rwCarousel) window.rwCarousel(t, { dots: m.querySelector('.rwb-dots'), auto: false });
    wire(m);
  }
  function page(m, d) { m.innerHTML = '<div class="rwb-grid">' + d.books.map(function (b) { return slide(b).replace('class="rwb-slide"', 'class="rwb-slide rwb-rv"'); }).join('') + '</div>'; wire(m); }
  function init() {
    var h = document.querySelector('#rwBooks .rwb-mount'), p = document.getElementById('rwbPage');
    if (!h && !p) return;
    load().then(function (d) { if (!d.books || !d.books.length) throw 0; if (h) home(h, d); if (p) page(p, d); })
      .catch(function () { var m = h || p; if (m) m.innerHTML = '<p class="rwb-sub">The bookshelf is warming up. Please check back soon.</p>'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
