/* Ailon Tusk composer: the model picker pill. Shows the active model (Auto, Groq, Gemini…) and opens the
   model list (rendered into #heroModels by cpModelChips in js/copilot/core.js) and the language choice as a small menu above it. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  function els() { return { pill: document.getElementById('rwModelPill'), menu: document.getElementById('rwModelMenu'), list: document.getElementById('heroModels') }; }
  function label() {
    var p = typeof W.activeProv !== 'undefined' ? W.activeProv : 'smart';
    return p === 'smart' ? '⚡ Auto' : p.charAt(0).toUpperCase() + p.slice(1);
  }
  function sync() { var e = els(); if (!e.pill) return; e.pill.innerHTML = ''; e.pill.append(document.createTextNode(label() + ' ')); var i = document.createElement('i'); i.setAttribute('aria-hidden', 'true'); i.textContent = '▾'; e.pill.append(i); }
  /* The writing box clips its children (overflow:hidden) and the bottom nav sits on top of the page, so the menu
     lives on <body> and is placed with fixed coordinates next to the pill: above it when there is room, else below. */
  function place() {
    var e = els(); if (!e.pill || !e.menu || e.menu.hidden) return;
    if (e.menu.parentNode !== document.body) document.body.appendChild(e.menu);
    var r = e.pill.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, gap = 8, m = e.menu;
    m.style.maxHeight = ''; var h = m.offsetHeight, w = m.offsetWidth;
    var nav = document.getElementById('tabbar');
    var floor = nav ? Math.min(vh, nav.getBoundingClientRect().top) : vh;
    var above = r.top - gap - 8, below = floor - r.bottom - gap - 8;
    /* Always open upward (Mohit's call); drop below only if there is truly no room above. */
    var up = above >= Math.min(h, 160) || above >= below;
    var room = Math.max(120, up ? above : below);
    if (h > room) { m.style.maxHeight = room + 'px'; h = room; }
    m.style.top = (up ? r.top - gap - h : r.bottom + gap) + 'px';
    m.style.left = Math.max(8, Math.min(vw - w - 8, r.right - w)) + 'px';
    m.dataset.side = up ? 'up' : 'down';
  }
  function setOpen(open) { var e = els(); if (!e.pill || !e.menu) return; e.menu.hidden = !open; e.pill.setAttribute('aria-expanded', String(open)); if (open && typeof W.cpModelChips === 'function') W.cpModelChips('heroModels'); if (open) place(); }
  function start() {
    var e = els(); if (!e.pill || !e.menu) return;
    e.pill.addEventListener('click', function (ev) { ev.stopPropagation(); setOpen(e.menu.hidden); });
    e.menu.addEventListener('click', function (ev) { var t = /** @type {Element} */ (ev.target); /* a model chip re-renders the list on click, so its button may already be detached */ if (!t.isConnected || t.closest('#heroModels button')) setTimeout(function () { setOpen(false); sync(); }, 0); });
    document.addEventListener('click', function (ev) { if (!e.menu.hidden && !e.menu.contains(/** @type {Node} */ (ev.target))) setOpen(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !e.menu.hidden) { setOpen(false); e.pill.focus(); } });
    window.addEventListener('resize', place); window.addEventListener('scroll', place, { passive: true });
    new MutationObserver(sync).observe(e.list || e.menu, { childList: true, subtree: true });
    sync(); setTimeout(sync, 1500);
  }
  W.rwTuskModelSync = sync; W.rwTuskModelPlace = place;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
