/* Advisory arrival pass: validation, code generation, shareable text. No server, no QR. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore = root.RWKainchiCore || {};
  var ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  function randomChars(n, rng) {
    var out = '', bytes;
    rng = rng || function (len) { return root.crypto.getRandomValues(new Uint8Array(len)); };
    while (out.length < n) {
      bytes = rng(n * 2);
      for (var i = 0; i < bytes.length && out.length < n; i++) if (bytes[i] < 240) out += ALPHABET[bytes[i] % 30];
    }
    return out;
  }
  function newCode(rng) { var s = randomChars(8, rng); return 'KDY-' + s.slice(0, 4) + '-' + s.slice(4); }
  function vehicle(value) {
    var v = api.clean(value).toUpperCase().replace(/[\s-]/g, '');
    if (!v) return '';
    if (!/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/.test(v)) api.fail('e_vehicle');
    return v;
  }
  function leader(value) {
    var v = api.clean(value).replace(/\s+/g, ' ');
    if (!/^[\p{L}\p{M} .'-]{2,60}$/u.test(v)) api.fail('e_leader');
    return v;
  }
  function make(input, now, cfg, rng) {
    cfg = cfg || api.config;
    var today = now.slice(0, 10), date = api.dateInWindow(input.date, today, cfg.maxAdvanceDays);
    var hour = api.validHour(input.hour, cfg);
    return {
      code: newCode(rng), date: date, hour: hour, leader: leader(input.leader),
      size: api.intIn(input.size, 1, cfg.maxGroupSize, 'e_size', { n: cfg.maxGroupSize }),
      vehicle: vehicle(input.vehicle), createdAt: now, kind: 'advisory'
    };
  }
  function shareText(pass) {
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'Kainchi Dham arrival pass (advisory)\n' + pass.code + '\n' + pass.date + ' ' + pad(pass.hour) + ':00\n' +
      pass.leader + ' · ' + pass.size + ' people' + (pass.vehicle ? ' · ' + pass.vehicle : '') +
      '\nNot an official permit. Follow district and police instructions.';
  }
  function parseStored(raw) {
    var list;
    try { list = JSON.parse(raw); } catch (e) { return []; }
    if (!Array.isArray(list)) return [];
    return list.filter(function (p) {
      return p && typeof p.code === 'string' && /^KDY-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(p.code) && api.parseDate(p.date) &&
        Number.isInteger(p.hour) && typeof p.leader === 'string' && p.leader.length <= 60 && Number.isInteger(p.size) && p.size >= 1 && p.size <= 60;
    }).slice(0, 20);
  }
  Object.assign(api, { newCode: newCode, makePass: make, passText: shareText, parseStoredPasses: parseStored });
})(globalThis);
