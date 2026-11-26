/* RWRail: endless horizontal rails for home carousels. Classic script, global window.RWRail.
 *
 * Two modes:
 *  1. Data mode  RWRail.create(track, opts) - renders items a page at a time as the user scrolls,
 *     then starts again from the first item, so a rail never runs out. Works with a local array
 *     today and a server page function later (search, filters and sort go through setQuery), so a
 *     rail with thousands of listings only ever builds what is on screen plus the next page.
 *       opts.items      local array (or call setItems later)
 *       opts.fetchPage  optional async ({offset, limit, query}) => {items, done}  (server inventory)
 *       opts.render     (item) => Element             (required)
 *       opts.match      (item, query) => boolean      (local search/filter; default: always true)
 *       opts.pageSize   default 12
 *       opts.loop       default true: wrap to the start when the inventory is exhausted
 *       opts.loopMin    default 4: fewer matches than this (e.g. a narrow search) are shown once, not repeated
 *       opts.onCount    (matched, total) => void      (status text)
 *  2. Loop mode  RWRail.loop(track) - for rails other modules render themselves: when the user nears
 *     the end, copies of the original cards are appended. Taps on a copy are forwarded to the same
 *     element in the original card, so JavaScript click handlers keep working.
 *
 * DOM is capped (MAX_NODES); the oldest cards are dropped and scroll position is kept steady. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var MAX_NODES = 120, NEAR_PX = 700;

  function nearEnd(track) { return track.scrollLeft + track.clientWidth > track.scrollWidth - NEAR_PX; }
  function trim(track) {
    var extra = track.children.length - MAX_NODES; if (extra <= 0) return;
    var before = track.scrollWidth;
    for (var i = 0; i < extra; i++) track.removeChild(track.firstElementChild);
    track.scrollLeft -= before - track.scrollWidth;
  }
  function onNear(track, fn) {
    var busy = false;
    function check() { if (busy || !track.isConnected || track.scrollWidth <= track.clientWidth + 4 && track.children.length > 0 && !track.__rwRailWants) return; if (!nearEnd(track)) return; busy = true; Promise.resolve(fn()).then(function () { busy = false; }, function () { busy = false; }); }
    track.addEventListener('scroll', check, { passive: true });
    return check;
  }

  function create(track, opts) {
    opts = opts || {};
    var pageSize = opts.pageSize || 12, loop = opts.loop !== false;
    var all = (opts.items || []).slice(), list = all, query = null, cursor = 0, done = false, generation = 0, rendered = 0;
    function matchAll() { return query && opts.match ? all.filter(function (x) { return opts.match(x, query); }) : all; }
    function count(total) { if (opts.onCount) opts.onCount(total, opts.fetchPage ? total : all.length); }
    function put(item, copy) { var el = opts.render(item); if (!el) return; if (copy) el.setAttribute('data-rw-loop', '1'); track.appendChild(el); rendered++; }
    function nextPage() {
      var gen = generation;
      if (opts.fetchPage && !done) {
        return Promise.resolve(opts.fetchPage({ offset: cursor, limit: pageSize, query: query })).then(function (res) {
          if (gen !== generation) return;
          var items = (res && res.items) || [];
          items.forEach(function (x) { list.push(x); put(x, false); });
          cursor += items.length; done = !!(res && res.done) || items.length < pageSize;
          count(list.length); trim(track); fill();
        });
      }
      if (!list.length) return;
      for (var n = 0; n < pageSize; n++) {
        if (cursor >= list.length) { if (!loop || list.length < (opts.loopMin || 4)) return; cursor = 0; done = true; }
        put(list[cursor], done || rendered >= list.length); cursor++;
      }
      trim(track); fill();
    }
    /* Keep adding pages until the rail is wider than the screen, so there is always something to swipe to. */
    function fill() { if (track.isConnected && track.clientWidth > 0 && track.scrollWidth <= track.clientWidth + NEAR_PX && ((loop && list.length >= (opts.loopMin || 4)) || cursor < list.length || (opts.fetchPage && !done))) { if (++track.__rwFill < 8) setTimeout(nextPage, 0); } }
    function reset() {
      generation++; cursor = 0; done = false; rendered = 0; track.__rwFill = 0;
      list = opts.fetchPage ? [] : matchAll();
      track.replaceChildren(); track.scrollLeft = 0;
      if (!opts.fetchPage) count(list.length);
      return nextPage();
    }
    track.__rwRailWants = true;
    onNear(track, nextPage);
    var api = {
      setItems: function (items) { all = (items || []).slice(); return reset(); },
      setQuery: function (q) { query = q || null; return reset(); },
      refresh: reset,
      matched: function () { return list.length; },
      total: function () { return all.length; }
    };
    reset();
    return api;
  }

  function pathFrom(root, el) { var path = []; while (el && el !== root) { var p = el.parentElement; if (!p) return null; path.unshift(Array.prototype.indexOf.call(p.children, el)); el = p; } return el === root ? path : null; }
  function follow(root, path) { var el = root; for (var i = 0; el && i < path.length; i++) el = el.children[path[i]]; return el; }

  function loopTrack(track) {
    if (!track || track.__rwLoop) return;
    track.__rwLoop = true;
    var check = onNear(track, function () {
      var originals = Array.prototype.filter.call(track.children, function (c) { return !c.hasAttribute('data-rw-loop'); });
      if (originals.length < 3) return;
      originals.forEach(function (c, i) { var copy = /** @type {Element} */ (c.cloneNode(true)); copy.setAttribute('data-rw-loop', '1'); copy.setAttribute('data-rw-loop-of', String(i)); copy.removeAttribute('id'); copy.querySelectorAll('[id]').forEach(function (x) { x.removeAttribute('id'); }); track.appendChild(copy); });
      trim(track);
    });
    track.addEventListener('click', function (e) {
      var t = /** @type {Element} */ (e.target); var copy = t && t.closest && t.closest('[data-rw-loop-of]');
      if (!copy || copy.parentElement !== track) return;
      var originals = Array.prototype.filter.call(track.children, function (c) { return !c.hasAttribute('data-rw-loop'); });
      var orig = originals[+copy.getAttribute('data-rw-loop-of')]; if (!orig) return;
      var path = pathFrom(copy, t), target = path && follow(orig, path);
      if (target && target !== t) { e.preventDefault(); e.stopPropagation(); /** @type {HTMLElement} */ (target).click(); }
    }, true);
    setTimeout(check, 50);
  }

  /* Electric tap: a short spark burst and a light buzz on any card in a rail or the quick icons. */
  var ZAP_SCOPE = '.rw-property-track,.rwc-track,#rwDestinationTrack,.rw-world-track,.rw-amb-works,.rw-room-carousel,.rwc-banner,#rwQuick';
  function motionOk() { try { return W.RWDesignEngine ? W.RWDesignEngine.motionEnabled() : !W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } }
  function zap(e) {
    var t = /** @type {Element} */ (e.target); if (!t || !t.closest) return;
    var scope = t.closest(ZAP_SCOPE); if (!scope) return;
    var card = t.closest('a,button,article,[role="listitem"],.rwq-item') || t;
    if (!scope.contains(card)) return;
    try { if (W.navigator.vibrate) W.navigator.vibrate([6, 24, 10]); } catch (err) { /* no vibration */ }
    if (!motionOk()) return;
    var r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    var z = document.createElement('span'); z.className = 'rw-zap'; z.setAttribute('aria-hidden', 'true');
    z.style.left = x + 'px'; z.style.top = y + 'px';
    var bolts = '';
    for (var i = 0; i < 7; i++) { var a = i * (360 / 7) + Math.random() * 20; bolts += '<path transform="rotate(' + a.toFixed(0) + ' 60 60)" d="M60 60 L66 46 L58 42 L68 22 L62 20 L72 2"/>'; }
    z.innerHTML = '<i></i><svg viewBox="0 0 120 120">' + bolts + '</svg>';
    var cs = getComputedStyle(card); if (cs.position === 'static') card.classList.add('rw-zap-host');
    card.classList.add('rw-zap-on'); card.appendChild(z);
    setTimeout(function () { z.remove(); card.classList.remove('rw-zap-on'); }, 520);
  }
  document.addEventListener('pointerdown', zap, { passive: true });

  /* Self-scroll: a slow drift (about 24 px/s) while the rail is on screen. Any touch, wheel, hover or
     keyboard focus pauses it; it resumes 6 s after the last interaction. Off with reduced motion. */
  var DRIFT_PX_PER_S = 24, RESUME_MS = 6000;
  function drift(track) {
    if (!track || track.__rwDrift) return; track.__rwDrift = true;
    var visible = false, pausedUntil = 0, acc = 0, last = 0, hover = false;
    function pause() { pausedUntil = Date.now() + RESUME_MS; if (track.__rwSnap != null) { track.style.scrollSnapType = track.__rwSnap; track.__rwSnap = null; } }
    ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach(function (ev) { track.addEventListener(ev, pause, { passive: true }); });
    track.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; pause(); } });
    track.addEventListener('pointerleave', function () { hover = false; pause(); });
    if ('IntersectionObserver' in W) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.35 }).observe(track); else visible = true;
    function step(t) {
      if (!track.isConnected) { track.__rwDrift = false; return; }
      var dt = last ? Math.min(64, t - last) : 16; last = t;
      if (visible && !hover && !document.hidden && Date.now() > pausedUntil && motionOk() && track.scrollWidth > track.clientWidth + 8) {
        if (track.__rwSnap == null) { track.__rwSnap = track.style.scrollSnapType || ''; track.style.scrollSnapType = 'none'; track.style.scrollBehavior = 'auto'; }
        acc += DRIFT_PX_PER_S * dt / 1000;
        if (acc >= 1) { var px = Math.floor(acc); acc -= px; track.scrollLeft += px; track.dispatchEvent(new Event('scroll')); }
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Spotlight: the card nearest the middle is fully lit, the others sit back in shadow, so a rail or a
     long vertical list can hold many items in little space. axis 'x' (default) or 'y'. */
  function spotlight(track, axis) {
    if (!track || track.__rwSpot) return; track.__rwSpot = true;
    var y = axis === 'y', raf = 0;
    track.classList.add('rw-spot', y ? 'rw-spot-y' : 'rw-spot-x');
    function update() {
      raf = 0; var box = track.getBoundingClientRect(), mid = y ? box.top + box.height / 2 : box.left + box.width / 2, best = null, bestD = 1e9;
      Array.prototype.forEach.call(track.children, function (c) {
        if (c.hidden) return; var r = c.getBoundingClientRect(); if (!r.width) return;
        var d = Math.abs((y ? r.top + r.height / 2 : r.left + r.width / 2) - mid); if (d < bestD) { bestD = d; best = c; }
      });
      Array.prototype.forEach.call(track.children, function (c) { if (c === best) c.setAttribute('data-spot', 'on'); else c.removeAttribute('data-spot'); });
    }
    function queue() { if (!raf) raf = requestAnimationFrame(update); }
    track.addEventListener('scroll', queue, { passive: true });
    W.addEventListener('resize', queue);
    if ('MutationObserver' in W) new MutationObserver(queue).observe(track, { childList: true });
    track.__rwSpotUpdate = update; queue();
  }
  /* Big-card rails (a card at least ~45% of the rail width) get the spotlight automatically. */
  function wantsSpot(track) { var c = track.firstElementChild; return !!c && c.getBoundingClientRect().width >= track.clientWidth * 0.45; }

  /* Rails other modules render; each is looped once it exists. */
  var LOOP_SELECTORS = ['#rwDestinationTrack', '.rw-world-track', '.rw-amb-works', '.rw-room-carousel', '.rw-sales-track', '.rwx-track', '.rwa-row'];
  var DRIFT_SELECTORS = LOOP_SELECTORS.concat(['.rw-property-track', '.rwc-track']);
  function autoLoop() {
    LOOP_SELECTORS.forEach(function (s) { document.querySelectorAll(s).forEach(loopTrack); });
    DRIFT_SELECTORS.forEach(function (s) { document.querySelectorAll(s).forEach(function (/** @type {any} */ t) { drift(t); if (!t.__rwSpot && t.clientWidth && wantsSpot(t)) spotlight(t, 'x'); }); });
  }
  W.RWRail = { create: create, loop: loopTrack, autoLoop: autoLoop, drift: drift, spotlight: spotlight };
  function start() {
    autoLoop(); setTimeout(autoLoop, 2500); setTimeout(autoLoop, 7000);
    /* Rails that appear later (tab switches, lazy sections) are picked up too. */
    var pending = 0;
    if ('MutationObserver' in W) new MutationObserver(function () { if (!pending) pending = setTimeout(function () { pending = 0; autoLoop(); }, 600); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
