/* Small celebratory touches: a short confetti burst on good moments (interest saved, added to trip, artist enquiry).
   Presentation only. Skipped when the visitor prefers reduced motion. window.rwCelebrate({big}) can be called by anything. */
(function () {
  'use strict';
  if (window.rwCelebrate) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS = ['#e8ba6c', '#ff7a59', '#ffd9a0', '#9b7bff', '#5ee6c0', '#ffffff'], busy = false;
  function burst(opts) {
    if (reduce || busy) return; busy = true;
    var big = opts && opts.big, N = big ? 110 : 56;
    var c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100000';
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr; document.body.appendChild(c);
    var x = c.getContext('2d'); x.scale(dpr, dpr);
    var ox = opts && opts.x != null ? opts.x : W / 2, oy = opts && opts.y != null ? opts.y : H * 0.62, ps = [];
    for (var i = 0; i < N; i++) {
      var a = -Math.PI / 2 + (Math.random() - .5) * 2.2, s = 5 + Math.random() * (big ? 11 : 8);
      ps.push({ x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLORS[i % COLORS.length], star: i % 9 === 0 });
    }
    var t0 = performance.now(), life = big ? 2300 : 1700;
    (function frame(t) {
      var k = (t - t0) / life; x.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.vy += .22; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.globalAlpha = Math.max(0, 1 - Math.max(0, k - .55) / .45); x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r);
        if (p.star) { x.font = '14px sans-serif'; x.fillText('✦', -6, 5); } else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else { c.remove(); busy = false; }
    })(t0);
  }
  window.rwCelebrate = burst;
  /* hooks: app scripts are deferred and load after this file, so wrap once everything has loaded */
  function hook() { try {
    if (typeof window.showToast === 'function') {
      var st = window.showToast;
      window.showToast = function (m) {
        var r = st.apply(this, arguments), s = String(m || '');
        if (!/could not|no passengers|key saved|error|failed|locally/i.test(s)) {
          if (/^➕|added to your trip/i.test(s)) burst();
          else if (/^✅|travel card saved|profile saved|saved to your passport/i.test(s)) burst({ big: true });
        }
        return r;
      };
    }
    if (typeof window.rwBookDone === 'function') {
      var bd = window.rwBookDone;
      window.rwBookDone = function () { var r = bd.apply(this, arguments); burst({ big: true }); return r; };
    }
  } catch (e) {} }
  if (document.readyState === 'complete') hook(); else window.addEventListener('load', hook);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.sa-btn, a.art-button[target="_blank"], #sendWa');
    if (a) burst({ x: e.clientX || undefined, y: e.clientY || undefined });
  }, true);
  document.addEventListener('submit', function (e) { if (e.target && e.target.id === 'joinForm') burst({ big: true }); }, true);
})();
