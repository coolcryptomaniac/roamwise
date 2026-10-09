/* Exact-year festival dates are never rolled into a later lunar calendar. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore;
  var trust = 'https://shreekainchimandirtrust.org/contact';
  var holidays = 'https://cgca.gov.in/ccaupeast/list-of-holiday';
  var dates = [
    { id: 'foundation', monthDay: '06-15', kind: 'temple', source: trust },
    { id: 'siddhi', monthDay: '12-28', kind: 'temple', source: trust },
    { id: 'dussehra', date: '2026-10-20', kind: 'festival', source: holidays },
    { id: 'diwali', date: '2026-11-08', kind: 'festival', source: holidays }
  ];
  api.importantDates = function (today) {
    var year = Number(today.slice(0, 4));
    return dates.map(function (event) {
      var date = event.date || year + '-' + event.monthDay;
      if (event.monthDay && date < today) date = (year + 1) + '-' + event.monthDay;
      return Object.assign({}, event, { date: date, days: Math.round((api.parseDate(date).ts - api.parseDate(today).ts) / api.DAY) });
    }).filter(function (event) { return event.date >= today; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
  };
})(globalThis);
