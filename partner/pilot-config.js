/* Public first-property pilot settings. Prices stored on Milan Heights rooms
 * are the partner's net/base nightly rates; guests see the 7% commission
 * grossed up against the customer total (net = 93% of total). */
(function (root) {
  'use strict';
  var commissionPct = 7;
  function isMilan(name) {
    var normalized=String(name||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
    return normalized==='milan heights'||normalized==='hotel milan heights';
  }
  function grossFromBase(base) {
    var value = Number(base);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.round(value / (1 - commissionPct / 100));
  }
  function commissionFromGross(gross) {
    return Math.round(Number(gross || 0) * commissionPct) / 100;
  }
  var pilot = {
    enabled: true,
    propertyName: 'Milan Heights',
    destination: 'Almora',
    commissionPct: commissionPct,
    minBasePrice: 1500,
    maxBasePrice: 3000,
    minGuestPrice: grossFromBase(1500),
    maxGuestPrice: grossFromBase(3000),
    isMilan: isMilan,
    grossFromBase: grossFromBase,
    commissionFromGross: commissionFromGross
  };
  root.RW_MILAN_PILOT = pilot;
  if (typeof module === 'object' && module.exports) module.exports = pilot;
})(typeof window === 'undefined' ? globalThis : window);
