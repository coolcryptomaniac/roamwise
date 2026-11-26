/* More page "Focus" view: every tool in one vertical wheel. The tool in the middle is lit, the rest sit
   in shadow, so ~60 tools fit in one screen-height. Search filters it; tap a shadowed tool to bring it to
   the middle, tap the lit one to open it. Grid view stays one tap away. */
(function () {
  'use strict';
  var KEY = 'rw_more_view';
  var dir = document.getElementById('moreDirectory'), search = document.getElementById('moreSearch');
  if (!dir || !search) return;
  var tools = Array.prototype.slice.call(dir.querySelectorAll('.tool'));
  var groupOf = function (a) { var g = a.closest('.group'); var s = g && g.querySelector('summary'); return s ? s.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : ''; };
  var wrap = document.createElement('section'); wrap.className = 'fw'; wrap.setAttribute('aria-label', 'All tools, focus view');
  var list = document.createElement('div'); list.className = 'fw-list'; list.setAttribute('role', 'list'); list.tabIndex = 0;
  tools.forEach(function (a) {
    var row = /** @type {HTMLAnchorElement} */ (a.cloneNode(true)); row.className = 'fw-item'; row.setAttribute('role', 'listitem');
    var tag = document.createElement('em'); tag.textContent = groupOf(a); row.appendChild(tag);
    row.addEventListener('click', function (e) {
      if (row.getAttribute('data-spot') === 'on') return; /* lit item: follow the link */
      e.preventDefault(); row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    list.appendChild(row);
  });
  var pad = function () { var d = document.createElement('div'); d.className = 'fw-pad'; d.setAttribute('aria-hidden', 'true'); return d; };
  list.insertBefore(pad(), list.firstChild); list.appendChild(pad());
  var empty = document.createElement('p'); empty.className = 'fw-empty'; empty.textContent = 'No tools match. Try “stay”, “trip” or “creator”.';
  wrap.append(list, empty);
  var toggle = document.createElement('div'); toggle.className = 'fw-toggle'; toggle.setAttribute('role', 'group'); toggle.setAttribute('aria-label', 'Layout');
  var bFocus = document.createElement('button'), bGrid = document.createElement('button');
  bFocus.type = bGrid.type = 'button'; bFocus.textContent = '◎ Focus'; bGrid.textContent = '▦ Grid';
  toggle.append(bFocus, bGrid);
  search.closest('label').insertAdjacentElement('afterend', toggle);
  dir.insertAdjacentElement('beforebegin', wrap);
  function setView(v) {
    var focus = v === 'focus'; document.body.classList.toggle('fw-on', focus);
    bFocus.setAttribute('aria-pressed', String(focus)); bGrid.setAttribute('aria-pressed', String(!focus));
    try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ }
    if (focus && window.RWRail) { window.RWRail.spotlight(list, 'y'); setTimeout(function () { if (list.__rwSpotUpdate) list.__rwSpotUpdate(); }, 50); }
  }
  bFocus.addEventListener('click', function () { setView('focus'); });
  bGrid.addEventListener('click', function () { setView('grid'); });
  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase(), n = 0;
    Array.prototype.forEach.call(list.querySelectorAll('.fw-item'), function (r) { var hit = !q || r.textContent.toLowerCase().indexOf(q) > -1; r.hidden = !hit; if (hit) n++; });
    empty.style.display = n ? 'none' : 'block'; list.scrollTop = 0;
    if (list.__rwSpotUpdate) setTimeout(list.__rwSpotUpdate, 30);
  });
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  setView(saved || (window.matchMedia && window.matchMedia('(max-width: 600px)').matches ? 'focus' : 'grid'));
})();
