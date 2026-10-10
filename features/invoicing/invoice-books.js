/* RoamWise books from invoices: sales register, GST summary, monthly P&L, bank matching and CSV helpers.
 * Pure + deterministic. These are working papers for the owner and CA, not filed returns. Money is integer paise. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RWInvoiceBooks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function rupees(p) { return (p / 100).toFixed(2); }
  function cell(v) { var s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function toCsv(cols, rows) {
    return [cols.map(function (c) { return cell(c[1]); }).join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return cell(r[c[0]]); }).join(','); })).join('\r\n') + '\r\n';
  }
  function inFy(inv, fyStart) { return inv.fy === fyStart + '-' + String(fyStart + 1).slice(-2); }
  function month(day) { return day.slice(0, 7); }

  var REGISTER_COLS = [['number', 'Invoice no'], ['date', 'Date'], ['docType', 'Type'], ['customer', 'Customer'], ['gstin', 'Customer GSTIN'], ['pos', 'Place of supply'], ['taxable', 'Taxable value'], ['cgst', 'CGST'], ['sgst', 'SGST'], ['igst', 'IGST'], ['total', 'Invoice total'], ['paymentRef', 'Payment ref'], ['provider', 'Provider'], ['paidAt', 'Paid at'], ['flags', 'Flags'], ['hash', 'Hash']];
  function salesRegister(invoices, fyStart) {
    return invoices.filter(function (i) { return fyStart == null || inFy(i, fyStart); }).sort(function (a, b) { return a.fy < b.fy ? -1 : a.fy > b.fy ? 1 : a.seq - b.seq; }).map(function (i) {
      return { number: i.number, date: i.date, docType: i.docType, customer: i.customer.name || i.customer.email || i.customer.uid || 'Unnamed', gstin: i.customer.gstin || '', pos: i.placeOfSupply, taxable: rupees(i.taxablePaise),
        cgst: rupees(i.cgstPaise), sgst: rupees(i.sgstPaise), igst: rupees(i.igstPaise), total: rupees(i.totalPaise), paymentRef: i.payment.ref, provider: i.payment.provider, paidAt: i.payment.paidAt, flags: (i.flags || []).join(';'), hash: i.hash };
    });
  }
  function emptyBucket() { return { count: 0, taxablePaise: 0, cgstPaise: 0, sgstPaise: 0, igstPaise: 0, totalPaise: 0 }; }
  function gstSummary(invoices, fyStart) {
    var months = {};
    invoices.forEach(function (i) {
      if (!inFy(i, fyStart)) return;
      var b = months[month(i.date)] = months[month(i.date)] || emptyBucket();
      b.count++; b.taxablePaise += i.taxablePaise; b.cgstPaise += i.cgstPaise; b.sgstPaise += i.sgstPaise; b.igstPaise += i.igstPaise; b.totalPaise += i.totalPaise;
    });
    return Object.keys(months).sort().map(function (m) { var b = months[m]; b.month = m; b.taxPaise = b.cgstPaise + b.sgstPaise + b.igstPaise; return b; });
  }
  /* Revenue = taxable value (GST collected is a liability, not income). Expenses come only from ledger entries the owner recorded. */
  function pnl(invoices, ledger, fyStart, kindOf) {
    var months = {}, warnings = [], k = kindOf || function (e) { return e.kind; };
    function m(key) { return months[key] = months[key] || { month: key, revenuePaise: 0, gstCollectedPaise: 0, expensePaise: 0 }; }
    invoices.forEach(function (i) { if (inFy(i, fyStart)) { m(month(i.date)).revenuePaise += i.taxablePaise; m(month(i.date)).gstCollectedPaise += i.taxPaise; } });
    (ledger || []).forEach(function (e) {
      var kind = k(e), day = String(e.at || e.date || '').slice(0, 10), v = Math.round(Number(e.amountINR != null ? e.amountINR : e.amount) * 100);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !(v > 0)) return;
      var y = Number(day.slice(0, 4)), fy = Number(day.slice(5, 7)) >= 4 ? y : y - 1;
      if (fy !== fyStart || (kind !== 'expense' && !(kind === 'bill' && e.status === 'paid'))) return;
      m(month(day)).expensePaise += v;
    });
    var rows = Object.keys(months).sort().map(function (key) { var r = months[key]; r.profitPaise = r.revenuePaise - r.expensePaise; return r; });
    var total = rows.reduce(function (t, r) { t.revenuePaise += r.revenuePaise; t.expensePaise += r.expensePaise; t.gstCollectedPaise += r.gstCollectedPaise; return t; }, { month: 'Total', revenuePaise: 0, expensePaise: 0, gstCollectedPaise: 0 });
    total.profitPaise = total.revenuePaise - total.expensePaise;
    warnings.push('Expenses include only ledger entries recorded by the team. Gateway fees, bank charges and tax payments appear only if entered.');
    warnings.push('Provisional management view, not audited financials and not a tax computation.');
    return { rows: rows, total: total, warnings: warnings };
  }

  /* ---- bank statement ---- */
  function parseCsv(text) {
    var rows = [], row = [], f = '', q = false, i, c;
    text = String(text || '').replace(/^﻿/, '');
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(function (x) { return x.trim(); })) rows.push(row); row = []; }
      else f += c;
    }
    row.push(f); if (row.some(function (x) { return x.trim(); })) rows.push(row);
    return rows;
  }
  function isoDay(s) {
    s = String(s || '').trim(); var m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/.exec(s);
    if (m) { var y = m[3].length === 2 ? '20' + m[3] : m[3]; return y + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2); }
    m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m ? m[0] : null;
  }
  function money(s) { var n = Number(String(s || '').replace(/[,\s₹]/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0; }
  /* Finds date / narration / credit columns by header name; accepts a single Amount column only with a Cr/Dr marker. */
  function normaliseBank(text) {
    var rows = parseCsv(text), hi = -1, h, i;
    for (i = 0; i < Math.min(rows.length, 30); i++) { var l = rows[i].map(function (x) { return x.toLowerCase(); }); if (l.some(function (x) { return /date/.test(x); }) && l.some(function (x) { return /narration|description|particulars|remarks/.test(x); })) { hi = i; break; } }
    if (hi < 0) throw new Error('Could not find a header row with Date and Narration/Description columns.');
    h = rows[hi].map(function (x) { return x.toLowerCase().trim(); });
    var di = h.findIndex(function (x) { return /date/.test(x); }), ni = h.findIndex(function (x) { return /narration|description|particulars|remarks/.test(x); });
    var ci = h.findIndex(function (x) { return /credit|deposit|\bcr\b/.test(x) && !/debit/.test(x); });
    if (ci < 0) throw new Error('Could not find a Credit/Deposit column.');
    return rows.slice(hi + 1).map(function (r) { return { date: isoDay(r[di]), narration: String(r[ni] || '').trim(), creditPaise: money(r[ci]) }; }).filter(function (r) { return r.date && r.creditPaise > 0; });
  }
  function dayDiff(a, b) { return Math.abs((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000); }
  /* Matches by payment reference in the narration first, then by exact amount within +/-4 days when unambiguous.
   * Gateway payouts are batched and net of fees, so lines mentioning the gateway are set aside for the settlement reconciliation. */
  function matchBank(invoices, bank, opts) {
    opts = opts || {}; var win = opts.windowDays == null ? 4 : opts.windowDays, gateway = opts.gatewayWords || ['cashfree', 'razorpay', 'payu', 'paytm payment'];
    var used = {}, matched = [], ambiguous = [], gatewayLines = [], unmatchedBank = [];
    bank.forEach(function (b) {
      var text = b.narration.toLowerCase(), byRef = invoices.filter(function (i) { return !used[i.number] && i.payment.ref && text.indexOf(String(i.payment.ref).toLowerCase()) >= 0; });
      if (byRef.length === 1 && byRef[0].totalPaise === b.creditPaise) { used[byRef[0].number] = 1; matched.push({ bank: b, invoice: byRef[0].number, by: 'reference' }); return; }
      if (gateway.some(function (w) { return text.indexOf(w) >= 0; })) { gatewayLines.push(b); return; }
      var cand = invoices.filter(function (i) { return !used[i.number] && i.totalPaise === b.creditPaise && dayDiff(i.date, b.date) <= win; });
      if (cand.length === 1) { used[cand[0].number] = 1; matched.push({ bank: b, invoice: cand[0].number, by: 'amount+date' }); }
      else if (cand.length > 1) ambiguous.push({ bank: b, candidates: cand.map(function (i) { return i.number; }) });
      else unmatchedBank.push(b);
    });
    var open = invoices.filter(function (i) { return !used[i.number]; }).map(function (i) { return i.number; });
    return { matched: matched, ambiguous: ambiguous, gatewayLines: gatewayLines, unmatchedBank: unmatchedBank, invoicesWithoutDeposit: open };
  }

  return { toCsv: toCsv, REGISTER_COLS: REGISTER_COLS, salesRegister: salesRegister, gstSummary: gstSummary, pnl: pnl, parseCsv: parseCsv, normaliseBank: normaliseBank, matchBank: matchBank, rupees: rupees };
});
