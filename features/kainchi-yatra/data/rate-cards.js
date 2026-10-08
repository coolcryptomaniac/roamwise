/* Official fare and stay-rate cards. EMPTY ON PURPOSE.
   Add a card only from a written notice of the district magistrate, RTO or municipal body.
   Card shape (all fields required except note):
   { id: 'kgm-kainchi-taxi', kind: 'taxi'|'shuttle'|'stay', route: 'Kathgodam to Kainchi Dham',
     min: 1200, max: 1500, unit: 'per vehicle', issuer: 'Office that notified it',
     asOf: 'YYYY-MM-DD', note: 'optional' }                                                     */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  api.rateCardsRaw = [];
})(globalThis);
