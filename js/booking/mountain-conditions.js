// @ts-nocheck
/* ==================== MOUNTAIN CONDITIONS: warn before you go ====================
   Matches a place (and optionally a trip date) against RW_CONDITIONS
   (conditions-data.js). Pure lookup: no network, no storage. Used by Tusk's
   mountain_conditions tool, the direct-booking flow and its check-in reminder,
   so a guest hears "Kedarnath closes 11 Nov" BEFORE the enquiry goes out.

   An advisory applies when the place name contains one of its match words and
   the trip date (default: today) is on or before its "until" date. Expired
   items drop out by themselves. Classic script; also loads in node tests. */
(function (root) {
  'use strict';
  function isoToday() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(iso, n) {
    var d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function list() {
    var l = root.RW_CONDITIONS;
    return Array.isArray(l) ? l : [];
  }
  /* place: "Kedarnath" / "Manali to Kaza"; dateIso: trip date YYYY-MM-DD (optional). */
  function forPlace(place, dateIso) {
    var p = String(place || '').toLowerCase();
    if (!p) return [];
    var day = /^20\d\d-\d\d-\d\d$/.test(String(dateIso || '')) ? String(dateIso) : isoToday();
    var today = isoToday();
    return list().filter(function (c) {
      if (!c || !Array.isArray(c.match) || !c.until || !c.sourceUrl) return false;
      if (!c.match.some(function (w) { return p.indexOf(String(w).toLowerCase()) !== -1; })) return false;
      if (day <= c.until) return true;
      /* A winter closure still matters for a trip AFTER the closing date (the temple is shut),
         but only while the closing date itself is recent; the reopening date is announced later. */
      return c.kind === 'closure' && today <= addDays(c.until, 150) && day <= addDays(c.until, 150);
    }).map(function (c) {
      var shut = c.kind === 'closure' && day > c.until;
      return {
        id: c.id, kind: c.kind, official: !!c.official, title: c.title, detail: c.detail,
        until: c.until, source: c.source, sourceUrl: c.sourceUrl, closedOnTripDate: shut,
        label: (shut ? 'Closed on your dates: ' : (c.official ? '' : 'Confirm: ')) + c.title
      };
    });
  }
  /* Short HTML block for cards. Text is escaped; only the source link is a tag. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function html(items) {
    if (!items || !items.length) return '';
    return '<ul class="rw-cond">' + items.map(function (c) {
      return '<li><b>' + esc(c.label) + '</b> ' + esc(c.detail)
        + ' <a href="' + esc(c.sourceUrl) + '" target="_blank" rel="noopener">Source: ' + esc(c.source) + '</a></li>';
    }).join('') + '</ul>';
  }
  var api = { forPlace: forPlace, html: html, today: isoToday };
  root.RWConditions = api;
  root.rwConditionsFor = forPlace;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
