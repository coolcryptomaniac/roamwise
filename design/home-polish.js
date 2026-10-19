/* Home polish: gentle reveal on scroll plus a thin progress bar. No layout changes; skipped when motion is reduced. */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var bar = document.createElement('div'); bar.id = 'rwpBar'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  var tick = false;
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { var h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; tick = false; });
  }, { passive: true });
  if (!('IntersectionObserver' in window)) return;
  var sel = 'body > #rwRaveCard, body > #rwBoard, body > #brief, body > .rw-discovery-feed, body > .rw-country-feed, body > #quickGrid';
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .08 });
  function arm() {
    [].forEach.call(document.querySelectorAll(sel), function (el) {
      if (el.classList.contains('rwp-r') || el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('rwp-r'); io.observe(el);
    });
  }
  document.documentElement.classList.add('rwp-js');
  arm(); setTimeout(arm, 1500); setTimeout(arm, 4000);
  setTimeout(function () { [].forEach.call(document.querySelectorAll('.rwp-r'), function (e) { e.classList.add('in'); }); }, 12000);
})();
