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
  function setOpen(open) { var e = els(); if (!e.pill || !e.menu) return; e.menu.hidden = !open; e.pill.setAttribute('aria-expanded', String(open)); if (open && typeof W.cpModelChips === 'function') W.cpModelChips('heroModels'); }
  function start() {
    var e = els(); if (!e.pill || !e.menu) return;
    e.pill.addEventListener('click', function (ev) { ev.stopPropagation(); setOpen(e.menu.hidden); });
    e.menu.addEventListener('click', function (ev) { var t = /** @type {Element} */ (ev.target); /* a model chip re-renders the list on click, so its button may already be detached */ if (!t.isConnected || t.closest('#heroModels button')) setTimeout(function () { setOpen(false); sync(); }, 0); });
    document.addEventListener('click', function (ev) { if (!e.menu.hidden && !e.menu.contains(/** @type {Node} */ (ev.target))) setOpen(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !e.menu.hidden) { setOpen(false); e.pill.focus(); } });
    new MutationObserver(sync).observe(e.list || e.menu, { childList: true, subtree: true });
    sync(); setTimeout(sync, 1500);
  }
  W.rwTuskModelSync = sync;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
