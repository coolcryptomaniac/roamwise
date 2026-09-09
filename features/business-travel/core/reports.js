/* Report normalization and policy evaluation; returns drafts, never approval. */
(function (root) {
  'use strict';
  var api = root.RWBusinessCore = root.RWBusinessCore || {};
  var fail = api.fail, object = api.object, text = api.text, date = api.date;
  var currency = api.currency, decimal = api.decimal, money = api.money, amount = api.amount, convert = api.convert;
  var categories = Object.freeze(['transport', 'lodging', 'meals', 'other']);
  api.categories = categories;
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
  Object.assign(api, { policy: policy, normalize: normalize, evaluate: evaluate });
})(globalThis);
