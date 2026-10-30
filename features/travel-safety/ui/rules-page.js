/* ============================================================================
   /uttarakhand-travel-rules/ — permits & rules checker
   Pick places, date and activities -> must-do steps, live advisories, safety.
   Everything is computed on the device; nothing is sent anywhere.
   ========================================================================= */
(function () {
  'use strict';
  var D = window.RWTSDom;
  var C = window.RWTravelChecker;
  var el = D.el;
  var state = { picks: [], other: '', date: '', acts: [] };
  var $ = function (id) { return document.getElementById(id); };

  function readUrl() {
    try {
      var q = new URLSearchParams(location.search);
      var p = (q.get('places') || '').split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
      var ids = (window.RW_UK_PICKS || []).map(function (x) { return x.id; });
      state.picks = p.filter(function (x) { return ids.indexOf(x) !== -1; }).slice(0, 8);
      if (/^20\d\d-\d\d-\d\d$/.test(q.get('date') || '')) state.date = q.get('date');
    } catch (e) { /* plain page without query is fine */ }
  }

  function places() {
    var list = state.picks.slice();
    if (state.other) list.push(state.other.toLowerCase());
    return list;
  }
  function pickLabel(id) {
    var p = (window.RW_UK_PICKS || []).filter(function (x) { return x.id === id; })[0];
    return p ? p.label : id;
  }

  function renderPicks() {
    var box = D.clear($('ts-picks'));
    (window.RW_UK_PICKS || []).forEach(function (p) {
      var on = state.picks.indexOf(p.id) !== -1;
      box.appendChild(el('button', { type: 'button', class: 'ts-chip', 'aria-pressed': on ? 'true' : 'false', on: { click: function () {
        var i = state.picks.indexOf(p.id);
        if (i === -1) state.picks.push(p.id); else state.picks.splice(i, 1);
        renderPicks(); render();
      } } }, [p.label]));
    });
  }

  function section(title, note, cards) {
    if (!cards.length) return null;
    return el('section', { class: 'ts-group' }, [el('h3', { class: 'ts-group-h', text: title }), note ? el('p', { class: 'ts-note', text: note }) : null].concat(cards));
  }

  function render() {
    var out = D.clear($('ts-result'));
    var pl = places();
    var trip = { places: pl, activities: state.acts, date: state.date };
    var res = C.rulesFor(trip);
    var adv = C.advisoriesFor(trip);
    if (!pl.length && !state.acts.length) {
      out.appendChild(el('p', { class: 'ts-empty', text: 'Pick at least one place (or an activity) above to see what you need. The two safety notes below apply to every trip.' }));
    }
    var mustNote = res.must.length ? null : (pl.length ? 'Nothing special to register or carry for these places beyond ID. Still check the advisories.' : null);
    [section('Must do before you go', mustNote, res.must.map(D.ruleCard)),
      section('Current advisories for your places', adv.length ? 'From news and official notices, each with its source. They drop off when they expire.' : null, adv.map(D.advisoryCard)),
      section('Good to know', null, res.know.map(D.ruleCard)),
      section('Safety', null, res.safety.map(D.ruleCard))
    ].forEach(function (s) { if (s) out.appendChild(s); });
    if (pl.length && !res.must.length) out.insertBefore(el('p', { class: 'ts-ok', text: 'No permit or registration needed for these places. Carry photo ID.' }), out.firstChild);

    var guides = [];
    state.picks.forEach(function (id) {
      var p = (window.RW_UK_PICKS || []).filter(function (x) { return x.id === id; })[0];
      if (p && p.guide && guides.every(function (g) { return g.url !== p.guide; })) guides.push({ label: 'RoamWise ' + p.label + ' guide', url: p.guide });
    });
    var regions = C.regionsFor(pl.join(' | '));
    var text = C.checklistText({ places: state.picks.map(pickLabel).concat(state.other ? [state.other] : []), date: state.date }, res, adv);
    var acts = el('div', { class: 'ts-actions' }, [
      el('a', { class: 'ts-btn', href: 'https://wa.me/?text=' + encodeURIComponent(text), target: '_blank', rel: 'noopener noreferrer', text: 'Share checklist on WhatsApp' }),
      el('button', { type: 'button', class: 'ts-btn quiet', text: 'Print', on: { click: function () { window.print(); } } }),
      regions.length ? el('a', { class: 'ts-btn quiet', href: C.followUrl(regions), text: 'Get alerts for these places' }) : null
    ]);
    out.appendChild(acts);
    if (guides.length) out.appendChild(el('p', { class: 'ts-links' }, guides.map(function (g) { return D.link(g.label, g.url); })));
    try {
      var q = new URLSearchParams();
      if (state.picks.length) q.set('places', state.picks.join(','));
      if (state.date) q.set('date', state.date);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : ''));
    } catch (e) { /* history is optional */ }
  }

  function renderAll() {
    var box = $('ts-all');
    if (!box) return;
    (window.RW_UK_RULES || []).forEach(function (r) { box.appendChild(D.ruleCard(r)); });
  }

  function init() {
    readUrl();
    $('ts-form').addEventListener('submit', function (e) { e.preventDefault(); render(); });
    renderPicks();
    var date = $('ts-date');
    date.value = state.date;
    date.addEventListener('change', function () { state.date = /^20\d\d-\d\d-\d\d$/.test(date.value) ? date.value : ''; render(); });
    var other = $('ts-other');
    other.addEventListener('input', function () { state.other = other.value.trim().slice(0, 60); render(); });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="ts-act"]'), function (cb) {
      cb.addEventListener('change', function () {
        state.acts = Array.prototype.filter.call(document.querySelectorAll('input[name="ts-act"]'), function (x) { return x.checked; }).map(function (x) { return x.value; });
        render();
      });
    });
    $('ts-checked').textContent = D.fmtDate(window.RW_UK_RULES_CHECKED);
    render();
    renderAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
