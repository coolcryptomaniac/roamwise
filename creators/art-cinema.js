/* Cinematic layer for the Sacred art page: rising-ember canvas, count-up stats, gallery reel linked to Kala. Honours reduced motion. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function embers() {
    var cv = $('acEmbers'); if (!cv || still) return; var ctx = cv.getContext('2d'), W, H, ps = [], raf, vis = true;
    function size() { var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); W = cv.width = r.width * d; H = cv.height = r.height * d; }
    function mk(init) { return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: (Math.random() * 1.8 + .6) * (W / 800 + .6), v: Math.random() * .5 + .2, s: Math.random() * Math.PI * 2, a: Math.random() * .6 + .3 }; }
    size(); var n = W < 900 ? 38 : 70; for (var i = 0; i < n; i++) ps.push(mk(true));
    function tick(t) {
      if (!vis) { raf = requestAnimationFrame(tick); return; }
      ctx.clearRect(0, 0, W, H);
      ps.forEach(function (p, i) { p.y -= p.v * (W / 500 + .5); p.x += Math.sin(t / 1800 + p.s) * .4; if (p.y < -10) ps[i] = mk(false);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4); g.addColorStop(0, 'rgba(255,214,140,' + p.a + ')'); g.addColorStop(1, 'rgba(232,186,108,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.3); ctx.fill(); });
      raf = requestAnimationFrame(tick);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(cv);
    window.addEventListener('resize', size); raf = requestAnimationFrame(tick);
  }
  function count(el, to, pre, suf) {
    if (still) { el.textContent = pre + to.toLocaleString('en-IN') + suf; return; }
    var t0 = performance.now(); (function f(t) { var k = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + Math.round(to * e).toLocaleString('en-IN') + suf; if (k < 1) requestAnimationFrame(f); })(t0);
  }
  fetch('/creators/artists-data.json').then(function (r) { return r.json(); }).then(function (d) {
    var works = [], lows = [];
    d.artists.forEach(function (a) { (a.artworks || []).forEach(function (w) { if (w.image) works.push({ w: w, a: a }); }); (a.tiers || []).forEach(function (t) { if (t.range) lows.push(t.range[0]); }); });
    count($('acArtists'), d.artists.length, '', ''); count($('acWorks'), works.length, '', '+'); count($('acFrom'), Math.min.apply(null, lows), '₹', '');
    var reel = $('acReel'); if (!reel) return;
    reel.innerHTML = works.map(function (x, i) { return '<button type="button" class="ac-tile" data-t="' + esc(x.w.title) + '" aria-label="Meet ' + esc(x.w.title) + ' with Kala"><img src="' + esc(x.w.image) + '" alt="' + esc(x.w.title) + ' by ' + esc(x.a.name) + '" loading="lazy" width="400" height="500"><b>' + esc(x.w.title) + '</b><small>' + esc(x.a.name) + ' · ' + esc(x.w.price) + '</small></button>'; }).join('');
    reel.addEventListener('pointermove', function (e) { var t = e.target.closest('.ac-tile'); if (!t || still) return; var r = t.getBoundingClientRect(); t.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 14 + 'deg'); t.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 10 + 'deg'); });
    reel.addEventListener('pointerout', function (e) { var t = e.target.closest('.ac-tile'); if (t) { t.style.setProperty('--ry', '0deg'); t.style.setProperty('--rx', '0deg'); } });
    reel.addEventListener('click', function (e) {
      var t = e.target.closest('.ac-tile'); if (!t) return; var sel = $('agPick'); if (!sel) return;
      for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text.indexOf(t.dataset.t) === 0) { sel.value = i; sel.dispatchEvent(new Event('change')); break; }
      $('guide').scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
    });
  }).catch(function () {});
  embers();
})();
