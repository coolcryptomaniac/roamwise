/* Finance CSV formatting and formula-injection protection. */
(function (root) {
  'use strict';
  var api = root.RWBusinessCore = root.RWBusinessCore || {};
  var evaluate = api.evaluate;
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
  Object.assign(api, { csvCell: csvCell, csv: csv });
})(globalThis);
