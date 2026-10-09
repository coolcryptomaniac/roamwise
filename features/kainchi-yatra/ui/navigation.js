/* Progressively enhanced tabs. Hashes, keyboard navigation and browser Back stay usable. */
(function (root) {
  'use strict';
  root.RWKainchiUI.navigation = function (ctx) {
    var nav = ctx.$('section-tabs'), buttons = Array.from(nav.querySelectorAll('a'));
    var panels = Array.from(document.querySelectorAll('[data-tab-panel]'));
    nav.setAttribute('role', 'tablist');
    buttons.forEach(function (b) {
      b.setAttribute('role', 'tab'); b.id = 'tab-' + b.hash.slice(1);
      b.setAttribute('aria-controls', b.hash.slice(1));
    });
    panels.forEach(function (p) {
      p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'tab-' + p.id); p.tabIndex = 0;
    });
    function select(id, focus) {
      if (!panels.some(function (p) { return p.id === id; })) id = 'today';
      panels.forEach(function (p) { p.hidden = p.id !== id; });
      buttons.forEach(function (b) {
        var active = b.hash === '#' + id;
        b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1;
        if (active && focus) b.focus();
        if (active && nav.scrollWidth > nav.clientWidth) {
          if (b.offsetLeft < nav.scrollLeft) nav.scrollLeft = b.offsetLeft;
          else if (b.offsetLeft + b.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = b.offsetLeft + b.offsetWidth - nav.clientWidth;
        }
      });
    }
    buttons.forEach(function (b, i) {
      b.addEventListener('keydown', function (e) {
        var next = { ArrowRight: (i + 1) % buttons.length, ArrowLeft: (i + buttons.length - 1) % buttons.length,
          Home: 0, End: buttons.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault(); root.location.hash = buttons[next].hash; select(buttons[next].hash.slice(1), true);
      });
    });
    root.addEventListener('hashchange', function () { select(root.location.hash.slice(1), false); });
    // Handle links to the currently selected hash too, including the skip link.
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (!panels.some(function (p) { return '#' + p.id === a.getAttribute('href'); })) return;
        select(a.hash.slice(1), false);
        if (!nav.contains(a)) ctx.$(a.hash.slice(1)).focus();
      });
    });
    select(root.location.hash.slice(1), false);
  };
})(window);
