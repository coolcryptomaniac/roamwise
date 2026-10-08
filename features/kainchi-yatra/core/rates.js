/* Official rate cards. Only complete, dated, issuer-attributed cards are ever shown. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  var KINDS = ['taxi', 'shuttle', 'stay'];
  function normalize(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (c) {
      return c && typeof c.id === 'string' && KINDS.indexOf(c.kind) !== -1 && typeof c.route === 'string' && c.route.length <= 120 &&
        Number.isInteger(c.min) && Number.isInteger(c.max) && c.min >= 0 && c.max >= c.min && c.max <= 1000000 &&
        typeof c.unit === 'string' && c.unit.length <= 40 && typeof c.issuer === 'string' && c.issuer.trim().length > 1 &&
        !!api.parseDate(c.asOf);
    }).map(function (c) {
      return { id: c.id, kind: c.kind, route: c.route, min: c.min, max: c.max, unit: c.unit, issuer: c.issuer.trim(), asOf: c.asOf, note: typeof c.note === 'string' ? c.note.slice(0, 160) : '' };
    });
  }
  /* How far above the notified ceiling a charged amount is; 0 when within the card. */
  function excess(card, charged) { return card && Number.isInteger(charged) && charged > card.max ? charged - card.max : 0; }
  Object.assign(api, { normalizeRates: normalize, rateExcess: excess });
})(globalThis);
