/* Visitor reports. Built locally; the visitor sends them from their own email or WhatsApp. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  var CATS = ['taxi', 'stay', 'nolist', 'bribe', 'garbage', 'misconduct', 'ambulance'];
  function rupees(value, key) {
    var s = api.clean(value);
    if (!s) return null;
    if (!/^\d{1,7}$/.test(s)) api.fail(key || 'e_rep_amount');
    return +s;
  }
  function validate(input) {
    if (CATS.indexOf(input.category) === -1) api.fail('e_rep_cat');
    var place = api.clean(input.place), text = api.clean(input.text), when = api.clean(input.when).slice(0, 40);
    if (place.length < 2 || place.length > 120) api.fail('e_rep_place');
    if (text.length < 10 || text.length > 600) api.fail('e_rep_text');
    return { category: input.category, place: place, when: when, text: text, amount: rupees(input.amount), official: rupees(input.official) };
  }
  function digits(v) { return String(v || '').replace(/\D/g, ''); }
  function build(input, now, cfg, rng) {
    cfg = cfg || api.config;
    var r = validate(input), contact = cfg.districtContact || {}, label = api.strings.en['cat_' + r.category];
    var code = 'RPT-' + api.newCode(rng).slice(4).replace('-', '');
    var lines = ['Kainchi Dham visitor report ' + code, 'Category: ' + label, 'Place: ' + r.place, 'When: ' + (r.when || 'not given'),
      'Amount charged (INR): ' + (r.amount == null ? 'not given' : r.amount), 'Notified rate (INR): ' + (r.official == null ? 'not given' : r.official),
      'Details: ' + r.text, 'Sent from RoamWise (independent planning aid) on ' + now.slice(0, 10)];
    var body = lines.join('\n'), to = contact.email || cfg.fallbackEmail, wa = digits(contact.whatsapp);
    return {
      id: code, report: r, body: body, toLabel: contact.email ? contact.name || contact.email : null, toFallback: !contact.email,
      mailto: 'mailto:' + to + '?subject=' + encodeURIComponent('Kainchi Dham report ' + code) + '&body=' + encodeURIComponent(body),
      whatsapp: wa.length >= 8 && wa.length <= 15 ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(body) : null,
      emergency: r.category === 'ambulance'
    };
  }
  Object.assign(api, { reportCategories: CATS, buildReport: build });
})(globalThis);
