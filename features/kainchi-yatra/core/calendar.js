/* Crowd pressure from public calendar rules. An advisory estimate, never a measurement. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  var LEVELS = ['normal', 'elevated', 'high', 'peak'];
  function holidayOn(p, peaks) {
    var list = peaks.fixedHolidays || [];
    for (var i = 0; i < list.length; i++) if (list[i].month === p.m && list[i].day === p.d) return list[i];
    return null;
  }
  function isDeclared(value, peaks) { return (peaks.declaredPeaks || []).indexOf(value) !== -1; }
  function isOff(value, peaks) {
    var p = api.parseDate(value);
    return p.dow === 0 || p.dow === 6 || !!holidayOn(p, peaks) || isDeclared(value, peaks);
  }
  /* The consecutive run of days off (weekend, holiday, declared) containing `value`. */
  function blockDays(value, peaks) {
    var days = [value], k;
    for (k = 1; k < 8 && isOff(api.addDays(value, -k), peaks); k++) days.unshift(api.addDays(value, -k));
    for (k = 1; k < 8 && isOff(api.addDays(value, k), peaks); k++) days.push(api.addDays(value, k));
    return days;
  }
  function holidayInBlock(days, peaks) {
    for (var i = 0; i < days.length; i++) {
      var h = holidayOn(api.parseDate(days[i]), peaks);
      if (h) return h;
    }
    return null;
  }
  function classify(value, peaks) {
    peaks = peaks || api.peaks;
    var p = api.parseDate(value), reasons = [], level = 0, h, days;
    if (!p) api.fail('e_date', { n: 0 });
    if (peaks.foundationDay && p.m === peaks.foundationDay.month && p.d === peaks.foundationDay.day) { level = 3; reasons.push({ key: 'r_foundation' }); }
    if (isDeclared(value, peaks)) { level = 3; reasons.push({ key: 'r_declared' }); }
    if (level < 3 && isOff(value, peaks) && (days = blockDays(value, peaks)).length >= 3) {
      level = 2; h = holidayInBlock(days, peaks);
      if (h) reasons.push({ key: 'r_longweekend', vars: { name: h.name } });
      else reasons.push({ key: 'r_weekend' });
    } else if (level < 3 && isOff(value, peaks)) {
      level = 1; h = holidayOn(p, peaks);
      reasons.push(h ? { key: 'r_holiday', vars: { name: h.name } } : { key: 'r_weekend' });
    }
    if (!reasons.length) reasons.push({ key: 'r_weekday' });
    return { date: value, score: level, level: LEVELS[level], reasons: reasons };
  }
  api.levels = LEVELS;
  api.classify = classify;
})(globalThis);
