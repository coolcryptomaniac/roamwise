/* RoamWise tax workbench: read-only, provisional analysis of the existing ledger.
 * Never treats a payment processor limit as a tax threshold; never files taxes.
 * Browser + Node compatible, no backend credentials or external dependencies.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RWTaxEngine = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  function paise(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    var n = Number(value);
    return Number.isFinite(n) && n >= 0 && Math.abs(Math.round(n * 100) - n * 100) < 0.000001 ? Math.round(n * 100) : null;
  }
  function dateOf(value) {
    if (value && typeof value.toDate === 'function') value = value.toDate();
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
    var d = value.slice(0, 10);
    var test = new Date(d + 'T12:00:00Z');
    return Number.isNaN(test.getTime()) || test.toISOString().slice(0, 10) !== d ? null : d;
  }
  function fiscalYear(date) { var y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7)); return m >= 4 ? y : y - 1; }
  function validBps(value) { return Number.isInteger(value) && value >= 0 && value <= 10000; }
  function gstSplit(basePaise, meta) {
    if (!meta || !validBps(meta.gstRateBps) || typeof meta.gstIncluded !== 'boolean') return null;
    var tax = meta.gstIncluded
      ? Math.round(basePaise * meta.gstRateBps / (10000 + meta.gstRateBps))
      : Math.round(basePaise * meta.gstRateBps / 10000);
    return { taxPaise: tax, taxableBasePaise: meta.gstIncluded ? basePaise - tax : basePaise };
  }
  function analyze(entries, opts) {
    opts = opts || {};
    var fyStart = Number(opts.fyStart);
    if (!Number.isInteger(fyStart) || fyStart < 2000 || fyStart > 2100) throw new Error('Provide a valid financial-year start, such as 2026.');
    if (!Array.isArray(entries)) throw new Error('Ledger entries must be an array.');
    var start = fyStart + '-04-01', end = (fyStart + 1) + '-04-01';
    var out = {
      period: { start: start, endExclusive: end, label: fyStart + '-' + String(fyStart + 1).slice(-2) },
      entriesRead: entries.length, entriesInPeriod: 0, revenuePaise: 0, expensePaise: 0,
      billsUnpaidPaise: 0, partnerFundsPaise: 0, gstOutputPaise: 0, gstInputCandidatePaise: 0,
      tdsWithheldPaise: 0, grossCollectionsPaise: 0, incomeTaxReservePaise: null,
      warnings: [], exceptions: [], complete: false, basis: 'PROVISIONAL — NOT A TAX RETURN'
    };
    var seenIds = new Set(), seenRefs = new Set(), original = new Map();
    entries.forEach(function (x) { if (x && x.id) original.set(String(x.id), x); });
    function problem(code, id, detail) { out.exceptions.push({ code: code, id: id, detail: detail }); }
    entries.forEach(function (x, i) {
      var id = String(x && (x.id || x._id) || ('row-' + (i + 1)));
      if (!x || typeof x !== 'object') { problem('invalid_row', id, 'Entry is not an object.'); return; }
      if (seenIds.has(id)) { problem('duplicate_id', id, 'Duplicate ledger ID.'); return; }
      seenIds.add(id);
      var d = dateOf(x.at || x.date || x.postedAt);
      if (!d) { problem('invalid_date', id, 'Date is missing or invalid.'); return; }
      if (d < start || d >= end) return;
      out.entriesInPeriod++;
      var value = paise(x.amountINR !== undefined ? x.amountINR : x.amount);
      if (value === null || value <= 0) { problem('invalid_amount', id, 'Positive INR amount required; do not mix rupees and paise.'); return; }
      if (x.currency && x.currency !== 'INR') { problem('currency', id, 'Non-INR entry requires a documented FX conversion.'); return; }
      var kind = String(x.kind || '');
      var meta = x.taxMeta || null;
      var reversal = kind === 'reversal';
      if (reversal) {
        var prior = original.get(String(x.reversalOf || ''));
        if (!prior || prior.kind === 'reversal' || prior.kind === 'bill' || prior.kind === 'partner_collection') {
          problem('reversal_reference', id, 'Reversal must reference an existing revenue or expense entry; bills/partner funds need manual review.'); return;
        }
        if (dateOf(prior.at || prior.date || prior.postedAt) < start || dateOf(prior.at || prior.date || prior.postedAt) >= end) {
          problem('cross_year_adjustment', id, 'Cross-year reversals require accountant review.'); return;
        }
        var priorAmount = paise(prior.amountINR !== undefined ? prior.amountINR : prior.amount);
        if (priorAmount !== value) { problem('reversal_amount', id, 'Reversal must match the original amount.'); return; }
        kind = prior.kind;
        meta = prior.taxMeta || null;
      }
      var sign = reversal ? -1 : 1;
      var providerRef = x.providerRef || x.sourceRef;
      if (providerRef && !reversal) {
        var key = String(x.provider || 'unknown') + ':' + String(providerRef);
        if (seenRefs.has(key)) { problem('duplicate_payment_reference', id, 'Repeated provider reference; check double counting.'); return; }
        seenRefs.add(key);
      }
      if (kind === 'revenue') {
        out.revenuePaise += sign * value;
        out.grossCollectionsPaise += sign * value;
        if (!providerRef && !reversal) problem('unverified_revenue', id, 'Manual revenue has no verified payment/order reference.');
      } else if (kind === 'expense' || kind === 'bill') {
        if (kind === 'bill' && x.status !== 'paid') { out.billsUnpaidPaise += value; return; }
        out.expensePaise += sign * value;
        if (!x.invoiceRef && !x.receiptRef && !reversal) problem('expense_evidence', id, 'Expense has no linked invoice or receipt.');
      } else if (kind === 'partner_collection') {
        out.partnerFundsPaise += value;
        out.grossCollectionsPaise += value;
        problem('partner_allocation', id, 'Partner gross collections require a documented principal/agent split and settlement evidence.');
        return;
      } else { problem('unknown_kind', id, 'Unrecognized ledger kind: ' + kind); return; }
      var gst = gstSplit(value, meta);
      if (gst && kind === 'revenue') out.gstOutputPaise += sign * gst.taxPaise;
      else if (gst && meta.itcEligible === true && (x.invoiceRef || x.receiptRef) && (kind === 'expense' || kind === 'bill')) {
        out.gstInputCandidatePaise += sign * gst.taxPaise;
      } else if (meta && meta.gstRateBps !== undefined && !gst) problem('gst_metadata', id, 'GST rate and tax-inclusive flag must be explicitly validated.');
      if ((kind === 'expense' || kind === 'bill') && meta && meta.tdsWithheldINR !== undefined) {
        var tds = paise(meta.tdsWithheldINR);
        if (tds === null || tds > value) problem('tds_metadata', id, 'TDS withheld must be a valid INR amount not exceeding the expense.');
        else out.tdsWithheldPaise += sign * tds;
      }
    });
    if (opts.incomeTaxReserveBps !== undefined && opts.incomeTaxReserveBps !== null) {
      if (!validBps(opts.incomeTaxReserveBps)) throw new Error('Income-tax reserve basis points must be explicitly configured (0–10000).');
      out.incomeTaxReservePaise = Math.round(Math.max(0, out.revenuePaise - out.expensePaise) * opts.incomeTaxReserveBps / 10000);
      out.warnings.push('Income-tax reserve is a user-configured cash buffer, not a statutory tax calculation.');
    }
    out.warnings.push('Ledger entries are not reconciled to the complete Cashfree/bank/UPI settlement history.');
    out.warnings.push('GST liability, input credit, TDS and income tax require entity-specific registration, invoices and accountant-reviewed rules.');
    out.warnings.push('Payment gateway gross collections are not necessarily taxable turnover or RoamWise revenue.');
    if (!entries.length) out.warnings.push('No ledger entries were supplied.');
    return out;
  }
  return { analyze: analyze, fiscalYear: fiscalYear, dateOf: dateOf, gstSplit: gstSplit };
});