/* Look-up with English fallback and {placeholder} filling. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  api.languages = ['en', 'hi'];
  api.t = function (lang, key, vars) {
    var table = api.strings || {}, s = (table[lang] && table[lang][key]);
    if (s === undefined) s = table.en && table.en[key];
    if (s === undefined) return key;
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  };
  api.pick = function (obj, lang) { return obj ? (obj[lang] || obj.en || '') : ''; };
})(globalThis);
