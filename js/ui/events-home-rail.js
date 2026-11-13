// @ts-nocheck
/* Homepage events rail: upcoming festivals, fairs and conferences from events-data.js (window.RW_EVENTS),
 * soonest first, India first. A card opens Ailon Tusk with the trip planned around the event (rwEventPlan);
 * the last card opens the full events page. Hides itself when nothing upcoming is known.
 * Honesty rule from events-data.js: 'typical' dates are shown as "usual dates", never as announced. */
(function () {
  'use strict';
  var MAX = 12, HORIZON_DAYS = 150;
  function iso(d) { return d.toISOString().slice(0, 10); }
  function fmt(s) {
    var d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ICON = { music: '🎶', festival: '🪔', art: '🎨', startup: '🚀', trade: '🧳', sports: '🏟️', auto: '🏎️', food: '🍲', culture: '🎭' };
  function build() {
    var rail = document.getElementById('rwEventsRail'), track = document.getElementById('rwSalesEvents');
    if (!rail || !track || rail.dataset.built) return;
    var all = Array.isArray(window.RW_EVENTS) ? window.RW_EVENTS : [];
    if (!all.length) return;
    var now = new Date(), today = iso(now), limit = iso(new Date(now.getTime() + HORIZON_DAYS * 864e5));
    var list = all.filter(function (e) { return e && e.id && e.start && (e.end || e.start) >= today && e.start <= limit; })
      .sort(function (a, b) {
        var ia = a.country === 'India' ? 0 : 1, ib = b.country === 'India' ? 0 : 1;
        var sa = a.start < today ? today : a.start, sb = b.start < today ? today : b.start;
        return sa === sb ? ia - ib : (sa < sb ? -1 : 1);
      });
    /* Keep the rail mostly Indian: at most a third international. */
    var india = list.filter(function (e) { return e.country === 'India'; }), abroad = list.filter(function (e) { return e.country !== 'India'; });
    list = india.slice(0, MAX).concat(abroad.slice(0, Math.max(2, Math.floor(MAX / 3)))).slice(0, MAX)
      .sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
    if (!list.length) return;
    rail.dataset.built = '1';
    track.innerHTML = list.map(function (e) {
      var live = e.start <= today, when = fmt(e.start) + (e.end && e.end !== e.start ? ' – ' + fmt(e.end) : '');
      var badge = live ? '<span class="rw-deal">On now</span>' : e.verified === 'confirmed' ? '<span class="rw-deal">Dates confirmed</span>' : '<span class="rw-deal" style="background:#ffd29822;border-color:#e8ba6c;color:#ffe4b5">Usual dates</span>';
      return '<a class="rw-sales-card" href="#" data-rw-event="' + esc(e.id) + '" aria-label="Plan a trip to ' + esc(e.name) + '">' +
        '<span class="rw-sales-copy">' + badge +
        '<strong>' + (ICON[e.cat] || '📅') + ' ' + esc(e.name) + '</strong>' +
        '<small>' + esc(when) + ' · ' + esc(e.place) + '</small>' +
        (e.vibe ? '<small>' + esc(String(e.vibe).slice(0, 120)) + (String(e.vibe).length > 120 ? '…' : '') + '</small>' : '') +
        '<b>Plan my trip →</b></span></a>';
    }).join('') +
      '<a class="rw-sales-card" href="#" data-rw-event-all="1" style="justify-content:center;align-items:center;text-align:center;min-height:200px"><span class="rw-sales-copy"><strong>📅 All events</strong><small>Music, festivals, art fairs, sport and conferences, with what each trip costs.</small><b>Open the calendar →</b></span></a>';
    track.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('[data-rw-event],[data-rw-event-all]');
      if (!a) return;
      ev.preventDefault();
      if (a.dataset.rwEventAll) { if (typeof openEvents === 'function') openEvents('all'); return; }
      if (typeof rwEventPlan === 'function') rwEventPlan(a.dataset.rwEvent);
    });
    rail.hidden = false;
  }
  /* events-data.js is a later deferred script, so build after DOMContentLoaded, with one retry for slow loads. */
  function boot() { build(); setTimeout(build, 1500); }
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
