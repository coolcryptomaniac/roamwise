/* Long-stay (workation) plans for the homepage. Prices are DERIVED from the property's own nomad record in partners-data.js
   (rate15 = total for 15 nights, rate30 = one month, rate90 = per month on a 3-month stay), never typed a second time.
   The 2-month plan is not in the agreement: it is the monthly rate x 2 and is labelled that way. Pure; works in a page and in node tests. */
(function (root) {
  'use strict';
  var num = function (v) { v = Number(v); return v > 0 && isFinite(v) ? Math.round(v) : 0; };
  var PLANS = [
    { id: '15n', label: '15 nights', nights: 15, tag: 'TRY IT', note: 'Shortest stay' },
    { id: '1m', label: '1 month', nights: 30, tag: 'MOST POPULAR', note: 'One month, one rate' },
    { id: '2m', label: '2 months', nights: 60, tag: 'WORKATION', note: 'Monthly rate x 2, confirm with the hotel', derived: true },
    { id: '3m', label: '3 months', nights: 90, tag: 'BEST VALUE', note: 'Same monthly rate, locked for 3 months' }
  ];
  function total(n, p) {
    var r15 = num(n.rate15), r30 = num(n.rate30), r90 = num(n.rate90) || r30;
    if (p.id === '15n') return r15;
    if (p.id === '1m') return r30;
    if (p.id === '2m') return r30 ? r30 * 2 : 0;
    return r90 ? r90 * 3 : 0;
  }
  function plans(nomad) {
    var n = nomad || {};
    return PLANS.map(function (p) {
      var t = total(n, p);
      return { id: p.id, label: p.label, nights: p.nights, tag: p.tag, note: p.note, derived: !!p.derived, total: t, perNight: t ? Math.round(t / p.nights) : 0 };
    }).filter(function (p) { return p.total > 0 && p.nights >= (num(n.minNights) || 1); });
  }
  var api = { plans: plans, PLANS: PLANS };
  root.RWNomadPlans = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
