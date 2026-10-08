/* Bounded input checks and localisable errors; no I/O. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  var DAY = 86400000;
  function fail(key, vars) { var e = new Error(key); e.key = key; e.vars = vars || {}; throw e; }
  function parseDate(value) {
    if (typeof value !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(value)) return null;
    var y = +value.slice(0, 4), m = +value.slice(5, 7), d = +value.slice(8, 10), ts = Date.UTC(y, m - 1, d), t = new Date(ts);
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
    return { y: y, m: m, d: d, ts: ts, dow: t.getUTCDay() };
  }
  function addDays(value, n) { return new Date(parseDate(value).ts + n * DAY).toISOString().slice(0, 10); }
  function dateInWindow(value, today, maxDays, key) {
    var p = parseDate(value), t = parseDate(today);
    if (!p || !t || p.ts < t.ts || p.ts > t.ts + maxDays * DAY) fail(key || 'e_date', { n: maxDays });
    return value;
  }
  function clean(value) { return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u2028-\u202e]/g, '').trim(); }
  function intIn(value, min, max, key, vars) {
    var s = clean(value);
    if (!/^\d{1,6}$/.test(s) || +s < min || +s > max) fail(key, vars);
    return +s;
  }
  Object.assign(api, { fail: fail, parseDate: parseDate, addDays: addDays, dateInWindow: dateInWindow, clean: clean, intIn: intIn, DAY: DAY });
})(globalThis);
