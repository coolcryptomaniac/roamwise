/* Currency/decimal arithmetic; integer conversion and one half-up rounding. */
(function (root) {
  'use strict';
  var api = root.RWBusinessCore = root.RWBusinessCore || {};
  var fail = api.fail;
  var currencies = Object.freeze({ INR: 2, USD: 2, EUR: 2, GBP: 2, AED: 2, SGD: 2, JPY: 0, CAD: 2, AUD: 2, CHF: 2 });
  api.currencies = currencies;
  function currency(value) {
    if (!Object.hasOwn(currencies, value)) fail('Choose a supported currency.');
    return value;
  }
  function decimal(value, places, name, allowZero) {
    if (typeof value !== 'string' || value.length > 20 || !/^\d+(?:\.\d+)?$/.test(value)) fail(name + ' must be a plain decimal string.');
    var parts = value.split('.');
    if ((parts[1] || '').length > places) fail(name + ' has too many decimal places.');
    var result = BigInt(parts[0]) * 10n ** BigInt(places) + BigInt((parts[1] || '').padEnd(places, '0') || '0');
    if (result > 1000000000000n || (!allowZero && result === 0n)) fail(name + ' is outside the allowed range.');
    return Number(result);
  }
  function money(value, code, name, allowZero) { return decimal(value, currencies[currency(code)], name || 'Amount', allowZero); }
  function amount(value, code) {
    var p = currencies[currency(code)];
    if (!Number.isSafeInteger(value)) fail('Amount exceeds safe limits.');
    return (value / Math.pow(10, p)).toFixed(p);
  }
  function convert(e, base) {
    var original = BigInt(money(e.amount, e.currency, 'Expense amount', false));
    var rate = BigInt(decimal(e.fxRate, 6, 'Exchange rate', false));
    var numerator = original * rate * 10n ** BigInt(currencies[base]);
    var denominator = 1000000n * 10n ** BigInt(currencies[e.currency]);
    var result = (numerator + denominator / 2n) / denominator;
    if (result > 1000000000000n) fail('Converted amount exceeds the supported range.');
    return Number(result);
  }
  Object.assign(api, { currency: currency, decimal: decimal, money: money, amount: amount, convert: convert });
})(globalThis);
