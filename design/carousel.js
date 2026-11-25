/* Shared carousel helper: scroll-snap track + dots + gentle autoplay + pointer tilt. No dependencies.
   rwCarousel(track, {dots: element, auto: ms}) ; autoplay pauses on touch/hover, off-screen and when motion is reduced. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.rwCarousel = function (track, o) {
    if (!track || track.__rwc) return; track.__rwc = 1; o = o || {};
    var slides = [].slice.call(track.children), dots = o.dots, paused = false, visible = true, idx = 0;
    if (dots) { dots.innerHTML = ''; slides.forEach(function (s, i) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Go to item ' + (i + 1)); b.onclick = function () { go(i); }; dots.appendChild(b); }); }
    function mark() {
      var c = track.getBoundingClientRect().left + track.clientWidth / 2, best = 0, bd = 1e9;
      slides.forEach(function (s, i) { var d = Math.abs(s.getBoundingClientRect().left + s.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } });
      idx = best; if (dots) [].forEach.call(dots.children, function (b, i) { b.className = i === best ? 'on' : ''; });
    }
    function motion(){return window.RWDesignEngine?window.RWDesignEngine.motionEnabled():!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}
    function go(i) { i = (i + slides.length) % slides.length; var s = slides[i]; var left=track.scrollLeft+s.getBoundingClientRect().left-track.getBoundingClientRect().left-(track.clientWidth-s.offsetWidth)/2; track.scrollTo({ left:left, behavior: motion() ? 'smooth' : 'auto' }); }
    track.addEventListener('scroll', function () { cancelAnimationFrame(track.__raf); track.__raf = requestAnimationFrame(mark); }, { passive: true });
    ['pointerdown', 'touchstart', 'mouseenter', 'focusin'].forEach(function (ev) { track.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { track.addEventListener(ev, function () { paused = false; }); });
    track.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 6000); }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: .3 }).observe(track);
    var last=Date.now();
    if(o.auto!==0&&slides.length>1)setInterval(function(){
      var config=o.design&&window.RWDesignEngine?window.RWDesignEngine.get().carousel:null;
      var interval=config?config.interval:(o.auto||4800);
      if(paused||track.contains(document.activeElement)||!visible||document.hidden||!motion()||(config&&!config.autoplay)){last=Date.now();return;}
      if(Date.now()-last>=interval){last=Date.now();go(idx+1);}
    },1000);
    /* pointer tilt on cards that opt in with data-tilt (hover devices only) */
    if (!reduce && window.matchMedia && matchMedia('(hover:hover)').matches) slides.forEach(function (s) {
      if (!s.hasAttribute('data-tilt')) return;
      s.addEventListener('pointermove', function (e) { if(!motion()){s.style.transform='';return;}var r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; s.style.transform = 'perspective(800px) rotateY(' + (x * 9) + 'deg) rotateX(' + (-y * 9) + 'deg) translateY(-4px)'; });
      s.addEventListener('pointerleave', function () { s.style.transform = ''; });
    });
    mark();
  };
})();
