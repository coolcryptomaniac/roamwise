/* ============================================================================
   features/travel-safety/core/checker.js — pure logic for the rules checker
   and the road & safety status page. No DOM, no network, no storage.
   Needs (globals or require): RW_UK_RULES, RW_UK_REGIONS, rwUkRegionsForText
   and, for advisories, RW_CONDITIONS.
   ========================================================================= */
(function (root, factory) {
  var api = factory(root);
  root.RWTravelChecker = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this, function (root) {
  'use strict';
  var STALE_DAYS = 60;
  var DAY = 86400000;

  function g(name) {
    if (root[name] !== undefined) return root[name];
    return undefined;
  }
  function isoDay(d) {
    var x = d instanceof Date ? d : new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function validIso(s) { return /^20\d\d-\d\d-\d\d$/.test(String(s || '')); }
  function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY); }
  function addDays(iso, n) { var t = Date.parse(iso + 'T00:00:00Z') + n * DAY; return new Date(t).toISOString().slice(0, 10); }

  function regionsFor(placeText) {
    var f = g('rwUkRegionsForText');
    return typeof f === 'function' ? f(placeText) : [];
  }

  /* trip: { places: ['kainchi', 'adi kailash'], activities: ['trek','helicopter','car-outside'], date: 'YYYY-MM-DD' } */
  function rulesFor(trip, today) {
    var t = trip || {};
    var places = (t.places || []).map(function (p) { return String(p).toLowerCase(); });
    var text = places.join(' | ');
    var acts = t.activities || [];
    var day = validIso(t.date) ? t.date : (today || isoDay());
    var month = +day.slice(5, 7);
    var now = today || isoDay();
    var out = { must: [], know: [], safety: [] };
    (g('RW_UK_RULES') || []).forEach(function (r) {
      var a = r.applies || {};
      var placeHit = Array.isArray(a.places) && a.places.some(function (w) { return text.indexOf(w) !== -1; });
      var actHit = Array.isArray(a.activities) && a.activities.some(function (x) { return acts.indexOf(x) !== -1; });
      var monthOk = !Array.isArray(a.months) || a.months.indexOf(month) !== -1;
      var hit;
      if (a.always) hit = true;
      else if (a.places && a.activities) hit = placeHit || actHit;
      else if (a.places) hit = placeHit;
      else if (a.activities) hit = actHit;
      else hit = !!a.months;
      if (!monthOk) hit = false;
      if (!hit) return;
      var stale = validIso(r.checked) && daysBetween(r.checked, now) > STALE_DAYS;
      out[r.kind === 'must' ? 'must' : r.kind === 'know' ? 'know' : 'safety'].push(Object.assign({}, r, { stale: stale }));
    });
    return out;
  }

  /* Live advisories (conditions-data.js) for the chosen places on the trip date, de-duplicated. */
  function advisoriesFor(trip) {
    var t = trip || {};
    var api = g('RWConditions');
    if (!api || typeof api.forPlace !== 'function') return [];
    var seen = {};
    var out = [];
    (t.places || []).forEach(function (p) {
      api.forPlace(p, validIso(t.date) ? t.date : undefined).forEach(function (c) {
        if (seen[c.id]) return;
        seen[c.id] = 1;
        out.push(c);
      });
    });
    return out;
  }

  /* Everything active today, each tagged with the Uttarakhand regions it touches.
     Closures stay listed for 7 days after their date so people see "now closed". */
  function activeAdvisories(today) {
    var day = today || isoDay();
    return (g('RW_CONDITIONS') || []).filter(function (c) {
      if (!c || !validIso(c.until) || !c.sourceUrl) return false;
      var from = validIso(c.from) ? c.from : '2000-01-01';
      if (from > day) return false;
      if (day <= c.until) return true;
      return c.kind === 'closure' && day <= addDays(c.until, 7);
    }).map(function (c) {
      var regions = regionsFor((c.match || []).join(' | '));
      return Object.assign({}, c, { regions: regions, uttarakhand: regions.length > 0, closedNow: day > c.until });
    }).sort(function (a, b) {
      if (a.uttarakhand !== b.uttarakhand) return a.uttarakhand ? -1 : 1;
      return String(b.from || '').localeCompare(String(a.from || ''));
    });
  }

  /* Items that start within the next `days` days (e.g. a rally next fortnight). */
  function upcomingAdvisories(today, days) {
    var day = today || isoDay();
    var end = addDays(day, days || 30);
    return (g('RW_CONDITIONS') || []).filter(function (c) {
      return c && validIso(c.from) && validIso(c.until) && c.sourceUrl && c.from > day && c.from <= end;
    }).map(function (c) {
      var regions = regionsFor((c.match || []).join(' | '));
      return Object.assign({}, c, { regions: regions, uttarakhand: regions.length > 0 });
    }).sort(function (a, b) { return a.from.localeCompare(b.from); });
  }

  function lastUpdated(list) {
    return (list || []).reduce(function (m, c) { return validIso(c.from) && c.from > m ? c.from : m; }, '');
  }

  var REGION_ID = /^[a-z][a-z0-9-]{1,23}$/;
  function cleanRegions(ids) {
    var known = (g('RW_UK_REGIONS') || []).map(function (r) { return r.id; });
    var out = [];
    (ids || []).forEach(function (x) {
      var id = String(x || '').trim().toLowerCase();
      if (REGION_ID.test(id) && known.indexOf(id) !== -1 && out.indexOf(id) === -1) out.push(id);
    });
    return out.slice(0, 12);
  }
  /* Opens the RoamWise app, which saves the regions on the signed-in account (js/core/alert-follow.js). */
  function followUrl(ids) {
    var clean = cleanRegions(ids);
    return clean.length ? '/?follow=' + clean.join(',') + '#alerts' : '/';
  }

  /* Plain-text checklist for WhatsApp / printing. */
  function checklistText(trip, res, advisories) {
    var lines = ['RoamWise Uttarakhand trip checklist'];
    if (trip && trip.places && trip.places.length) lines.push('Places: ' + trip.places.join(', '));
    if (trip && validIso(trip.date)) lines.push('Travel date: ' + trip.date);
    var add = function (head, list) {
      if (!list.length) return;
      lines.push('', head);
      list.forEach(function (r) { lines.push('- ' + r.title + (r.status === 'draft' ? ' (coming, not yet in force)' : '')); });
    };
    add('Must do', res.must);
    add('Good to know', res.know);
    if (advisories && advisories.length) {
      lines.push('', 'Current advisories');
      advisories.forEach(function (c) { lines.push('- ' + c.label); });
    }
    add('Safety', res.safety);
    lines.push('', 'Check before you go: https://www.roamwise.co.in/uttarakhand-travel-rules/');
    return lines.join('\n');
  }

  return { rulesFor: rulesFor, advisoriesFor: advisoriesFor, activeAdvisories: activeAdvisories, upcomingAdvisories: upcomingAdvisories, lastUpdated: lastUpdated,
    regionsFor: regionsFor, cleanRegions: cleanRegions, followUrl: followUrl, checklistText: checklistText, isoDay: isoDay, STALE_DAYS: STALE_DAYS };
});
