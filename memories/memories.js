/* RoamWise Memories: renders /memories/ and the homepage carousel from /memories/data.json (built by tools/build-memories.js).
   Text is set via esc() only; links to external video go to YouTube. No tracking. */
(function () {
  'use strict';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dparts(d) { var p = String(d).split('-'); return { y: p[0], m: MONTHS[(+p[1] || 1) - 1], d: +p[2] || '' }; }
  function safeSrc(s) { s = String(s || ''); return /^(\/[^\/]|https:\/\/)/.test(s) ? s : ''; }
  function load() { return fetch('/memories/data.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { var ev = (d && d.events) || []; /* YouTube thumbnails are tiny lazy images; the player iframe loads only on tap */
    ev.forEach(function (e) { (e.videos || []).forEach(function (v) { if (v.youtube && !v.poster) v.poster = 'https://i.ytimg.com/vi/' + encodeURIComponent(v.youtube) + '/hqdefault.jpg'; }); if (!e.cover && !(e.photos || []).length) { var y = (e.videos || []).filter(function (v) { return v.poster; })[0]; if (y) e.cover = y.poster; } });
    return ev; }); }
  function bg(ev) { var c = safeSrc(ev.cover); return c ? 'style="background-image:url(\'' + esc(c) + '\')"' : 'class="rwm-bg rwm-theme-' + esc(ev.theme || 'stage') + '"'; }
  function bgDiv(ev) { var c = safeSrc(ev.cover); return c ? '<div class="rwm-bg" style="background-image:url(\'' + esc(c) + '\')"></div>' : '<div class="rwm-bg rwm-theme-' + esc(ev.theme || 'stage') + '"></div>'; }

  /* ---------- lightbox ---------- */
  var lb, list = [], at = 0;
  function ensureLB() {
    if (lb) return; lb = document.createElement('div'); lb.className = 'rwm-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button class="x" aria-label="Close">&times;</button><button class="pv" aria-label="Previous">&#8249;</button><button class="nx" aria-label="Next">&#8250;</button><div class="rwm-lbm"></div><p></p>';
    document.body.appendChild(lb);
    lb.querySelector('.x').onclick = close; lb.querySelector('.pv').onclick = function () { show(at - 1); }; lb.querySelector('.nx').onclick = function () { show(at + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
    var sx = 0; lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); }, { passive: true });
  }
  function close() { if (!lb) return; lb.classList.remove('open'); lb.querySelector('.rwm-lbm').innerHTML = ''; document.body.style.overflow = ''; }
  function show(i) {
    at = (i + list.length) % list.length; var it = list[at], m = lb.querySelector('.rwm-lbm');
    if (it.type === 'photo') m.innerHTML = '<img src="' + esc(it.src) + '" alt="' + esc(it.cap || it.title || 'Memory') + '">';
    else if (it.youtube) m.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(it.youtube) + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="' + esc(it.title) + '"></iframe>';
    else if (it.src) m.innerHTML = '<video src="' + esc(it.src) + '" poster="' + esc(it.poster || '') + '" controls playsinline autoplay></video>';
    lb.querySelector('p').textContent = it.cap || it.title || '';
    lb.querySelector('.pv').style.display = lb.querySelector('.nx').style.display = list.length > 1 ? '' : 'none';
  }
  function openLB(items, i) { ensureLB(); list = items; lb.classList.add('open'); document.body.style.overflow = 'hidden'; show(i); }

  function items(ev) {
    var a = []; (ev.videos || []).forEach(function (v) { if (v.youtube || v.src) a.push({ type: 'video', youtube: v.youtube, src: safeSrc(v.src), poster: safeSrc(v.poster), title: v.title, cap: v.title }); });
    (ev.photos || []).forEach(function (p) { if (safeSrc(p.src)) a.push({ type: 'photo', src: safeSrc(p.src), cap: p.cap }); }); return a;
  }

  /* ---------- page ---------- */
  function renderPage(events) {
    var root = document.getElementById('rwmEvents'), filter = 'all';
    function paint() {
      if (!events.length) { root.innerHTML = '<p class="rwm-empty">Memories will appear here as events happen.</p>'; return; }
      root.innerHTML = events.map(function (ev, ei) {
        var d = dparts(ev.date), its = items(ev), vids = (ev.videos || []);
        var showP = filter === 'all' || filter === 'photos', showV = filter === 'all' || filter === 'videos';
        if ((filter === 'photos' && !(ev.photos || []).length) || (filter === 'videos' && !vids.length)) return '';
        var grid = '';
        if (showV) vids.forEach(function (v, vi) {
          if (v.youtube || v.src) grid += '<a class="rwm-vid' + (v.poster ? '' : ' rwm-theme-' + esc(ev.theme || 'stage')) + '" data-e="' + ei + '" data-i="' + its.findIndex(function (x) { return x.type === 'video' && x.title === v.title; }) + '" href="#" style="position:relative;' + (v.poster ? 'background:url(' + esc(safeSrc(v.poster)) + ') center/cover' : '') + '"><span class="rwm-play">&#9654;</span><span style="position:relative;z-index:1;margin-top:90px;text-shadow:0 2px 12px #000">' + esc(v.title) + '</span></a>';
          else grid += '<a class="rwm-vid rwm-theme-' + esc(ev.theme || 'stage') + '" href="' + esc(safeSrc(v.url) || '#') + '" target="_blank" rel="noopener"><span><span class="rwm-play" style="position:static;margin:0 auto 10px">&#9654;</span>' + esc(v.title) + '<small>' + esc(v.note || 'Watch on YouTube') + '</small></span></a>';
        });
        if (showP) (ev.photos || []).forEach(function (p, pi) { if (!safeSrc(p.src)) return; var idx = its.findIndex(function (x) { return x.type === 'photo' && x.src === safeSrc(p.src); }); grid += '<figure tabindex="0" data-e="' + ei + '" data-i="' + idx + '"><img loading="lazy" src="' + esc(safeSrc(p.src)) + '" alt="' + esc(p.cap || ev.title) + '"><figcaption>' + esc(p.cap || '') + '</figcaption></figure>'; });
        return '<section class="rwm-event rwm-rv" id="' + esc(ev.id) + '"><header><div class="rwm-date">' + esc(d.m) + '<b>' + esc(d.d) + '</b>' + esc(d.y) + '</div><div><h2>' + esc(ev.emoji || '') + ' ' + esc(ev.title) + '</h2>' + (ev.place ? '<div class="rwm-place">' + esc(ev.place) + '</div>' : '') + (ev.caption ? '<p>' + esc(ev.caption) + '</p>' : '') + '</div></header><div class="rwm-grid">' + grid + '</div></section>';
      }).join('') || '<p class="rwm-empty">Nothing here yet.</p>';
      [].forEach.call(root.querySelectorAll('[data-e]'), function (el) {
        function open(e) { e.preventDefault(); var ev = events[+el.dataset.e], its = items(ev); if (+el.dataset.i >= 0) openLB(its, +el.dataset.i); }
        el.addEventListener('click', open); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(e); });
      });
      reveal(root); if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView({ behavior: 'smooth' }); }, 300); }
    }
    [].forEach.call(document.querySelectorAll('.rwm-chips button'), function (b) { b.onclick = function () { filter = b.dataset.f; [].forEach.call(b.parentNode.children, function (x) { x.classList.toggle('on', x === b); }); paint(); }; });
    paint();
  }
  function reveal(scope) {
    var els = [].slice.call(scope.querySelectorAll('.rwm-rv'));
    if (!('IntersectionObserver' in window) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .1 });
    els.forEach(function (e) { io.observe(e); }); setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 5000);
  }

  /* ---------- homepage ---------- */
  function renderHome(events) {
    var host = document.getElementById('rwMemories'); if (!host) return;
    if (!events.length) { host.style.display = 'none'; return; }
    var top = events[0], slides = [];
    events.forEach(function (ev) {
      slides.push({ k: 'event', ev: ev });
      (ev.videos || []).slice(0, 1).forEach(function (v) { slides.push({ k: 'video', ev: ev, v: v }); });
      (ev.photos || []).slice(0, 3).forEach(function (p) { slides.push({ k: 'photo', ev: ev, p: p }); });
    });
    slides = slides.slice(0, 14);
    var d = dparts(top.date);
    host.querySelector('.rwm-mount').innerHTML =
      '<a class="rwm-feature rwm-rv" href="/memories/#' + esc(top.id) + '">' + bgDiv(top) + '<span class="rwm-emoji" aria-hidden="true">' + esc(top.emoji || '✨') + '</span><div class="rwm-in"><span class="rwm-badge">LATEST MEMORY &middot; ' + esc(d.m.toUpperCase() + ' ' + d.d) + '</span><h3>' + esc(top.title) + '</h3><p>' + esc(top.caption || top.place || '') + '</p><span class="rwm-go">Relive it &rarr;</span></div></a>' +
      '<div class="rwm-track" id="rwmTrack">' + slides.map(function (s) {
        var href = '/memories/#' + esc(s.ev.id);
        if (s.k === 'photo') return '<a class="rwm-slide" data-tilt href="' + href + '"><img loading="lazy" src="' + esc(safeSrc(s.p.src)) + '" alt="' + esc(s.p.cap || s.ev.title) + '"><div class="rwm-cap"><small>' + esc(s.ev.title.toUpperCase()) + '</small>' + esc(s.p.cap || '') + '</div></a>';
        if (s.k === 'video') return '<a class="rwm-slide" data-tilt href="' + href + '">' + (safeSrc(s.v.poster) ? '<img loading="lazy" src="' + esc(safeSrc(s.v.poster)) + '" alt="">' : bgDiv(s.ev)) + '<span class="rwm-play">&#9654;</span><div class="rwm-cap"><small>VIDEO</small>' + esc(s.v.title) + '</div></a>';
        return '<a class="rwm-slide" data-tilt href="' + href + '">' + bgDiv(s.ev) + '<span class="rwm-emoji" style="font-size:44px;top:14px;right:14px">' + esc(s.ev.emoji || '') + '</span><div class="rwm-cap"><small>' + esc(dparts(s.ev.date).m.toUpperCase() + ' ' + dparts(s.ev.date).y) + '</small><b style="font-size:16px">' + esc(s.ev.title) + '</b></div></a>';
      }).join('') + '</div><div class="rwm-dots" id="rwmDots"></div><a class="rwm-more" href="/memories/">See all memories &rarr;</a>';
    reveal(host);
    if (window.rwCarousel) window.rwCarousel(document.getElementById('rwmTrack'), { dots: document.getElementById('rwmDots'), auto: 3800 });
  }

  window.RWM = { load: load, openLB: openLB };
  load().then(function (events) {
    if (document.getElementById('rwmEvents')) renderPage(events);
    renderHome(events);
  }).catch(function () { var h = document.getElementById('rwMemories'); if (h) h.style.display = 'none'; var r = document.getElementById('rwmEvents'); if (r) r.innerHTML = '<p class="rwm-empty">Memories could not load. Please try again.</p>'; });
})();
