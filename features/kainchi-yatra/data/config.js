/* Page configuration. Nothing here is invented: empty means "not yet provided". */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  api.config = {
    asOf: '2026-10-08',
    storageKey: 'rw_kainchi_passes_v1',
    langKey: 'rw_kainchi_lang_v1',
    /* District contact for reports. Fill ONLY with an officer-confirmed address/number.
       While empty, reports go to RoamWise support, which collates them for the district. */
    districtContact: { name: '', email: '', whatsapp: '' },
    fallbackEmail: 'support@roamwise.co.in',
    emergency: { general: '112', ambulance: '108' },
    /* Hourly arrival slots shown in the advisory pass. */
    firstHour: 6,
    lastHour: 17,
    /* District-published slot capacities: { 'YYYY-MM-DD': { '6': 400, '7': 400 } }.
       Empty until the district publishes carrying capacity. Never guessed. */
    districtSlots: {},
    maxAdvanceDays: 120,
    maxGroupSize: 60
  };
})(globalThis);
