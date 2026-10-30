/* ============================================================================
   /uttarakhand-road-status/ — current advisories grouped by region, plus the
   "follow regions" picker that hands off to the RoamWise app for alerts.
   Data: conditions-data.js (sourced, self-expiring). No network requests.
   ========================================================================= */
(function () {
  'use strict';
  var D = window.RWTSDom;
  var C = window.RWTravelChecker;
  var el = D.el;
  var $ = function (id) { return document.getElementById(id); };
  var filter = 'all';
  var follow = [];
  var items = [];

  function regionsWithItems() {
    var ids = [];
    items.forEach(function (c) { (c.regions || []).forEach(function (r) { if (ids.indexOf(r) === -1) ids.push(r); }); });
    return (window.RW_UK_REGIONS || []).filter(function (r) { return ids.indexOf(r.id) !== -1; });
  }

  function renderFilter() {
    var box = D.clear($('ts-filter'));
    var opts = [{ id: 'all', name: 'All' }].concat(regionsWithItems());
    if (items.some(function (c) { return !c.uttarakhand; })) opts.push({ id: 'other', name: 'Other Himalaya' });
    opts.forEach(function (r) {
      box.appendChild(el('button', { type: 'button', class: 'ts-chip', 'aria-pressed': filter === r.id ? 'true' : 'false', on: { click: function () { filter = r.id; renderFilter(); renderList(); } } }, [r.name]));
    });
  }

  function renderList() {
    var box = D.clear($('ts-list'));
    var list = items.filter(function (c) {
      if (filter === 'all') return true;
      if (filter === 'other') return !c.uttarakhand;
      return (c.regions || []).indexOf(filter) !== -1;
    });
    if (!list.length) {
      box.appendChild(el('p', { class: 'ts-ok', text: 'No advisories on our list for this area right now. Still check the official live links below before you drive.' }));
      return;
    }
    list.forEach(function (c) { box.appendChild(D.advisoryCard(c)); });
  }

  function renderFollow() {
    var box = D.clear($('ts-follow'));
    (window.RW_UK_REGIONS || []).forEach(function (r) {
      var on = follow.indexOf(r.id) !== -1;
      box.appendChild(el('button', { type: 'button', class: 'ts-chip', 'aria-pressed': on ? 'true' : 'false', on: { click: function () {
        var i = follow.indexOf(r.id);
        if (i === -1) follow.push(r.id); else follow.splice(i, 1);
        renderFollow();
      } } }, [r.name]));
    });
    var go = $('ts-follow-go');
    go.setAttribute('href', C.followUrl(follow));
    go.setAttribute('aria-disabled', follow.length ? 'false' : 'true');
    go.textContent = follow.length ? 'Get alerts for ' + follow.length + (follow.length === 1 ? ' region' : ' regions') + ' in RoamWise' : 'Pick a region first';
  }

  function init() {
    items = C.activeAdvisories();
    var upd = C.lastUpdated(items);
    var chk = window.RW_CONDITIONS_CHECKED || '';
    if (chk > upd) upd = chk;
    if (upd) $('ts-updated').textContent = D.fmtDate(upd);
    var soon = C.upcomingAdvisories(undefined, 30);
    if (soon.length) {
      var box = $('ts-soon');
      box.appendChild(el('h2', { text: 'Coming up in the next 30 days' }));
      soon.forEach(function (c) { box.appendChild(D.advisoryCard(c)); });
    }
    try {
      var q = new URLSearchParams(location.search).get('region');
      if (q && (window.RW_UK_REGIONS || []).some(function (r) { return r.id === q; })) { filter = q; follow = [q]; }
    } catch (e) { /* no query */ }
    renderFilter();
    renderList();
    renderFollow();
    $('ts-follow-go').addEventListener('click', function (e) { if (!follow.length) e.preventDefault(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
