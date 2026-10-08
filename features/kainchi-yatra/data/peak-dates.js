/* Dates that raise crowd pressure. Only sourced or district-declared dates belong here. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  api.peaks = {
    /* Annual foundation day / fair. Source: ETV Bharat, 15 Jun 2025 (5 lakh expected). */
    foundationDay: { month: 6, day: 15 },
    /* Fixed-date national holidays. Moving festivals are NOT listed: add them to
       declaredPeaks when the district announces them. */
    fixedHolidays: [
      { month: 1, day: 26, name: 'Republic Day' },
      { month: 8, day: 15, name: 'Independence Day' },
      { month: 10, day: 2, name: 'Gandhi Jayanti' }
    ],
    /* District-declared peak dates: ['YYYY-MM-DD', ...]. Empty until announced. */
    declaredPeaks: [],
    /* Measured past event, shown as history only. Source: Aaj Tak, 6 Oct 2026 (border ANPR). */
    observed: [
      { from: '2026-10-02', to: '2026-10-04', outsideVehiclesPerDay: [101840, 93197, 90077],
        note: 'Gandhi Jayanti long weekend. Jams of 10 to 20 km toward Kainchi Dham.' }
    ]
  };
})(globalThis);
