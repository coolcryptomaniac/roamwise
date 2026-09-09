/* Shared, dependency-free expense rules. Classic browser script + Worker import.
 * Amounts cross the boundary as decimal strings; integer arithmetic rounds once
 * per expense (half up). An evaluation is never an approval or payment record. */
(function (root) {
  'use strict';
  var currencies = Object.freeze({ INR: 2, USD: 2, EUR: 2, GBP: 2, AED: 2, SGD: 2, JPY: 0, CAD: 2, AUD: 2, CHF: 2 });
  var categories = Object.freeze(['transport', 'lodging', 'meals', 'other']);
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
  function date(value, name) {
    if (typeof value !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) fail(name + ' must be a valid date from 2000–2099.');
    return value;
  }
  function policy(input) {
    object(input, 'Policy');
    var baseCurrency = currency(input.baseCurrency);
    if (typeof input.requireReceipt !== 'boolean') fail('Receipt requirement must be true or false.');
    return {
      baseCurrency: baseCurrency,
      budget: amount(money(input.budget, baseCurrency, 'Trip budget', false), baseCurrency),
      dailyLimit: amount(money(input.dailyLimit, baseCurrency, 'Daily spending limit', false), baseCurrency),
      receiptThreshold: amount(money(input.receiptThreshold, baseCurrency, 'Receipt threshold', true), baseCurrency),
      requireReceipt: input.requireReceipt
    };
  }
  function normalize(input, policyOverride) {
    object(input, 'Report');
    if (input.schemaVersion !== 1) fail('Unsupported report version.');
    var p = policy(policyOverride || input.policy);
    var t = object(input.trip, 'Trip');
    var trip = {
      id: text(t.id, 'Trip ID', 80), title: text(t.title, 'Trip name', 120),
      costCenter: text(t.costCenter, 'Cost center', 80), route: text(t.route, 'Route', 240),
      startDate: date(t.startDate, 'Start date'), endDate: date(t.endDate, 'End date')
    };
    if (trip.endDate < trip.startDate || (Date.parse(trip.endDate) - Date.parse(trip.startDate)) / 86400000 > 365) fail('Trip dates must be ordered and span at most 366 days.');
    if (!Array.isArray(input.expenses) || input.expenses.length > 200) fail('A report supports at most 200 expenses.');
    var ids = new Set();
    var expenses = input.expenses.map(function (e) {
      object(e, 'Expense');
      var id = text(e.id, 'Expense ID', 80);
      if (ids.has(id)) fail('Duplicate expense ID.');
      ids.add(id);
      if (!categories.includes(e.category)) fail('Choose a valid expense category.');
      var code = currency(e.currency);
      var originalMinor = money(e.amount, code, 'Expense amount', false);
      var rate = decimal(e.fxRate, 6, 'Exchange rate', false);
      if (code === p.baseCurrency && rate !== 1000000) fail('Same-currency exchange rate must be 1.');
      var fxDate = date(e.fxDate, 'Exchange-rate date');
      var fxSource = text(e.fxSource, 'Exchange-rate source', 120);
      var expenseDate = date(e.date, 'Expense date');
      if (expenseDate < trip.startDate || expenseDate > trip.endDate) fail('Expense date must fall within the trip dates.');
      return {
        id: id, date: expenseDate, category: e.category, description: text(e.description, 'Expense description', 160),
        amount: amount(originalMinor, code), currency: code, fxRate: (rate / 1000000).toFixed(6),
        fxDate: fxDate, fxSource: fxSource, receiptRef: text(e.receiptRef, 'Receipt reference', 120, true)
      };
    });
    return { schemaVersion: 1, trip: trip, policy: p, expenses: expenses };
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
  function evaluate(input, policyOverride) {
    var report = normalize(input, policyOverride), p = report.policy, base = p.baseCurrency;
    var total = 0, days = {}, flags = [], seen = new Map();
    var rows = report.expenses.map(function (e) {
      var value = convert(e, base);
      total += value;
      if (!Number.isSafeInteger(total)) fail('Report total exceeds safe limits.');
      days[e.date] = (days[e.date] || 0) + value;
      if (p.requireReceipt && value >= money(p.receiptThreshold, base, 'Receipt threshold', true) && !e.receiptRef) flags.push({ code: 'receipt_missing', expenseId: e.id, message: 'Add a receipt reference for ' + e.description + '.' });
      var duplicate = [e.date, e.category, e.description.toLowerCase(), e.currency, e.amount].join('|');
      if (seen.has(duplicate)) flags.push({ code: 'possible_duplicate', expenseId: e.id, message: 'Check a possible duplicate: ' + e.description + '.' });
      seen.set(duplicate, e.id);
      return Object.assign({}, e, { baseAmount: amount(value, base) });
    });
    var budget = money(p.budget, base, 'Budget', false);
    if (total > budget) flags.push({ code: 'budget_exceeded', message: 'Recorded spending is above the trip budget.' });
    Object.keys(days).sort().forEach(function (day) {
      if (days[day] > money(p.dailyLimit, base, 'Daily limit', false)) flags.push({ code: 'daily_limit_exceeded', date: day, message: 'Spending on ' + day + ' exceeds the daily limit.' });
    });
    return {
      report: report, rows: rows, total: amount(total, base), remaining: amount(budget - total, base),
      currency: base, status: !rows.length ? 'empty' : flags.length ? 'needs_review' : 'ready_for_review', flags: flags,
      notice: 'Draft reconciliation only. Receipt references and exchange rates are user supplied; no approval, booking, reimbursement or ERP posting has occurred.'
    };
  }
  function csvCell(value) {
    var s = String(value);
    if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function csv(input) {
    var result = evaluate(input), r = result.report;
    var header = ['schema_version', 'trip_id', 'trip_name', 'cost_center', 'route', 'start_date', 'end_date', 'expense_id', 'expense_date', 'category', 'description', 'original_amount', 'original_currency', 'fx_rate_to_base', 'fx_date', 'fx_source', 'base_amount', 'base_currency', 'receipt_reference', 'review_status'];
    var rows = result.rows.map(function (e) {
      return [1, r.trip.id, r.trip.title, r.trip.costCenter, r.trip.route, r.trip.startDate, r.trip.endDate, e.id, e.date, e.category, e.description, e.amount, e.currency, e.fxRate, e.fxDate, e.fxSource, e.baseAmount, result.currency, e.receiptRef, result.status];
    });
    return [header].concat(rows).map(function (row) { return row.map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }
  var api = { currencies: currencies, categories: categories, normalize: normalize, policy: policy, evaluate: evaluate, csv: csv, money: money, amount: amount };
  root.RWBusinessCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
