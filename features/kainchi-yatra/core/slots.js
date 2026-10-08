/* Arrival-hour slots. Capacity is null unless the district published one; never guessed. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function capacityFor(date, hour, cfg) {
    cfg = cfg || api.config;
    var day = cfg.districtSlots && cfg.districtSlots[date], v = day && day[String(hour)];
    return Number.isInteger(v) && v > 0 ? v : null;
  }
  function slotsFor(date, cfg) {
    cfg = cfg || api.config;
    var out = [], h;
    for (h = cfg.firstHour; h <= cfg.lastHour; h++) {
      out.push({ hour: h, label: pad(h) + ':00 – ' + pad(h + 1) + ':00', capacity: capacityFor(date, h, cfg) });
    }
    return out;
  }
  function validHour(value, cfg) {
    cfg = cfg || api.config;
    var h = api.intIn(value, 0, 23, 'e_hour');
    if (h < cfg.firstHour || h > cfg.lastHour) api.fail('e_hour');
    return h;
  }
  Object.assign(api, { capacityFor: capacityFor, slotsFor: slotsFor, validHour: validHour });
})(globalThis);
