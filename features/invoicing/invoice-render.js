/* RoamWise invoice renderer: builds a printable invoice as DOM text nodes only (no innerHTML), so stored data can never inject markup. */
(function (root) {
  'use strict';
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = String(text); return n; }
  function inr(p) { return '₹' + (Number(p || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function kv(label, value) { var d = el('div', 'inv-kv'); d.appendChild(el('span', 'inv-k', label)); d.appendChild(el('span', 'inv-v', value)); return d; }
  var TITLES = { tax_invoice: 'Tax Invoice', invoice: 'Invoice' };
  var FLAGS = {
    seller_legal_name_missing: 'Seller legal name not configured yet.',
    gst_rate_not_confirmed_by_ca: 'GST rate taken from the dated rules table; CA has not confirmed it.',
    place_of_supply_assumed_seller_state: 'Customer state not recorded; place of supply assumed to be the seller state.',
    manual_entry_no_payment_reference: 'Manual entry with no payment reference.',
    gstin_invalid_no_gst_charged: 'Seller GSTIN is invalid, so no GST was charged.'
  };
  function render(inv, opts) {
    opts = opts || {};
    var box = el('article', 'inv'), s = inv.seller || {}, c = inv.customer || {}, head = el('header', 'inv-head'), left = el('div'), right = el('div', 'inv-meta');
    left.appendChild(el('h2', 'inv-seller', s.legalName || 'RoamWise'));
    if (s.tradeName && s.tradeName !== s.legalName) left.appendChild(el('p', 'inv-line', 'Trading as ' + s.tradeName));
    [s.address, s.gstin && 'GSTIN: ' + s.gstin, s.pan && 'PAN: ' + s.pan, s.udyam && 'Udyam: ' + s.udyam, s.email, s.phone].forEach(function (t) { if (t) left.appendChild(el('p', 'inv-line', t)); });
    right.appendChild(el('h1', 'inv-title', TITLES[inv.docType] || 'Invoice'));
    right.appendChild(kv('Invoice no', inv.number)); right.appendChild(kv('Date', inv.date)); right.appendChild(kv('Financial year', inv.fy));
    head.appendChild(left); head.appendChild(right); box.appendChild(head);
    var bill = el('section', 'inv-bill'); bill.appendChild(el('h3', null, 'Billed to'));
    [c.name, c.email, c.gstin && 'GSTIN: ' + c.gstin, inv.placeOfSupply && (root.RWInvoice && root.RWInvoice.STATES[inv.placeOfSupply] ? 'Place of supply: ' + root.RWInvoice.STATES[inv.placeOfSupply] : '')].forEach(function (t) { if (t) bill.appendChild(el('p', 'inv-line', t)); });
    if (!c.name && !c.email) bill.appendChild(el('p', 'inv-line', 'RoamWise customer'));
    box.appendChild(bill);
    var table = el('table', 'inv-table'), thead = el('thead'), hr = el('tr');
    ['Description', 'SAC', 'Taxable value', 'GST %'].forEach(function (h) { hr.appendChild(el('th', null, h)); }); thead.appendChild(hr); table.appendChild(thead);
    var tb = el('tbody');
    (inv.lines || []).forEach(function (l) { var r = el('tr'); r.appendChild(el('td', null, l.description)); r.appendChild(el('td', null, l.sac || '-')); r.appendChild(el('td', 'num', inr(l.taxablePaise))); r.appendChild(el('td', 'num', l.ratePct ? l.ratePct + '%' : '-')); tb.appendChild(r); });
    table.appendChild(tb); box.appendChild(table);
    var tot = el('section', 'inv-totals');
    tot.appendChild(kv('Taxable value', inr(inv.taxablePaise)));
    if (inv.cgstPaise) tot.appendChild(kv('CGST', inr(inv.cgstPaise))); if (inv.sgstPaise) tot.appendChild(kv('SGST', inr(inv.sgstPaise))); if (inv.igstPaise) tot.appendChild(kv('IGST', inr(inv.igstPaise)));
    var grand = kv('Total (INR)', inr(inv.totalPaise)); grand.className += ' inv-grand'; tot.appendChild(grand); box.appendChild(tot);
    box.appendChild(el('p', 'inv-words', inv.totalInWords));
    var pay = inv.payment || {}; box.appendChild(el('p', 'inv-line', 'Paid via ' + (pay.provider || 'online payment') + (pay.ref ? ' · ref ' + pay.ref : '') + (pay.paidAt ? ' · ' + String(pay.paidAt).slice(0, 10) : '')));
    box.appendChild(el('p', 'inv-note', inv.gstNote));
    if (opts.showFlags && inv.flags && inv.flags.length) { var f = el('ul', 'inv-flags'); inv.flags.forEach(function (k) { f.appendChild(el('li', null, FLAGS[k] || k)); }); box.appendChild(f); }
    box.appendChild(el('p', 'inv-foot', 'Computer-generated invoice; no signature required. Integrity hash ' + String(inv.hash || '').slice(0, 16) + '…'));
    return box;
  }
  root.RWInvoiceRender = { render: render, inr: inr };
})(window);
