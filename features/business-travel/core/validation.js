/* Input shape, bounded text and date validation; no I/O. */
(function (root) {
  'use strict';
  var api = root.RWBusinessCore = root.RWBusinessCore || {};
  function fail(message) { throw new Error(message); }
  function object(value, name) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(name + ' must be an object.');
    return value;
  }
  function text(value, name, max, optional) {
    if (optional && (value === undefined || value === '')) return '';
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) fail(name + ' is missing or invalid.');
    return value.trim();
  }
  function date(value, name) {
    if (typeof value !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) fail(name + ' must be a valid date from 2000–2099.');
    return value;
  }
  Object.assign(api, { fail: fail, object: object, text: text, date: date });
})(globalThis);
