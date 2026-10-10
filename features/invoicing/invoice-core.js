/* RoamWise invoicing core: pure, deterministic, browser + Worker + Node (UMD). No network, no Firestore.
 * Turns a verified payment into an invoice, numbers it, and chains it to the previous one so the trail is tamper-evident.
 * All money is integer paise. GST is charged ONLY when the owner has set gstRegistered=true with a valid GSTIN; otherwise the
 * document is a plain invoice that says no GST was charged. Rates are never invented: a registered seller without an explicit
 * gstRateBps uses the dated RWGst "platform_fee" rule and the invoice carries a flag asking the CA to confirm it. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RWInvoice = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  var STATES = { '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat', '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh' };
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function paise(rupees) {
    var n = Number(rupees);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
  }
  function isoDate(v) {
    if (v && typeof v.toDate === 'function') v = v.toDate();
    var d = v instanceof Date ? v : new Date(String(v || ''));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  /* Indian financial year: 1 April to 31 March. Calendar day is taken in IST so a late-evening payment lands in the right month. */
  function istDay(iso) { return new Date(new Date(iso).getTime() + 19800000).toISOString().slice(0, 10); }
  function fyStart(day) { var y = Number(day.slice(0, 4)); return Number(day.slice(5, 7)) >= 4 ? y : y - 1; }
  function fyLabel(day) { var s = fyStart(day); return s + '-' + String(s + 1).slice(-2); }
  function fyCode(label) { return label.slice(2, 4) + label.slice(5); }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function prefixOf(seller) { var p = String((seller && seller.prefix) || 'RW').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4); return p || 'RW'; }
  function numberOf(seller, label, seq) { return prefixOf(seller) + '/' + fyCode(label) + '/' + pad(seq, 6); }

  function words(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + words(n % 100) : '');
    return '';
  }
  function amountInWords(p) {
    var rupees = Math.floor(p / 100), ps = p % 100, out = [], parts = [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']], i;
    if (rupees === 0) out.push('Zero');
    for (i = 0; i < parts.length; i++) {
      var q = Math.floor(rupees / parts[i][0]);
      if (q) { out.push(q < 1000 ? words(q) : amountInWords(q * 100).replace(/^Rupees | Only$/g, '')); out.push(parts[i][1]); rupees %= parts[i][0]; }
    }
    if (rupees) out.push(words(rupees));
    return 'Rupees ' + out.join(' ') + (ps ? ' and ' + words(ps) + ' Paise' : '') + ' Only';
  }

  function gstState(gstin) {
    var g = String(gstin || '').replace(/\s/g, '').toUpperCase();
    return /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g) && STATES[g.slice(0, 2)] ? { gstin: g, code: g.slice(0, 2), name: STATES[g.slice(0, 2)] } : null;
  }
  function validBps(v) { return Number.isInteger(v) && v >= 0 && v <= 10000; }
  function platformRateBps() {
    try { var r = root.RWGst && root.RWGst.rule && root.RWGst.rule('platform_fee'); if (r && validBps(r.rateBps)) return r.rateBps; } catch (e) { /* use fallback */ }
    return 1800;
  }

  function fromPayment(p, id) {
    var amount = paise(p && (p.amountINR != null ? p.amountINR : (p.amount != null ? Number(p.amount) / 100 : null))), at = isoDate(p && (p.paidAt || p.receivedDate || p.created));
    if (!amount || !at) return null;
    if (p.currency && p.currency !== 'INR') return null;
    if (p.status && String(p.status).toLowerCase() !== 'paid') return null;
    return { key: 'pay_' + id, source: 'payments', provider: String(p.provider || 'unknown'), providerRef: String(p.providerRef || id), amountPaise: amount, paidAt: at,
      customer: { uid: String(p.uid || ''), email: String(p.email || ''), name: String(p.customerName || ''), state: String(p.customerState || '') },
      planId: String(p.planId || ''), description: String(p.planLabel || p.label || ''), manual: false };
  }
  function fromLedgerRevenue(e, id) {
    var amount = paise(e && (e.amountINR != null ? e.amountINR : e.amount)), at = isoDate(e && (e.at || e.date || e.postedAt));
    if (!amount || !at || (e.currency && e.currency !== 'INR')) return null;
    if (e.kind !== 'revenue' || e.reversalOf) return null;
    return { key: 'led_' + id, source: 'ledger', provider: String(e.provider || e.method || 'manual'), providerRef: String(e.providerRef || e.sourceRef || e.ref || ''), amountPaise: amount, paidAt: at,
      customer: { uid: String(e.uid || ''), email: String(e.email || ''), name: String(e.customerName || e.name || ''), state: String(e.customerState || '') },
      planId: String(e.planId || ''), description: String(e.note || e.description || e.label || ''), manual: !e.providerRef && !e.sourceRef && !e.ref };
  }

  function taxFor(totalPaise, seller, customerState) {
    var reg = seller && seller.gstRegistered === true ? gstState(seller.gstin) : null;
    var out = { mode: 'none', ratePct: 0, taxablePaise: totalPaise, cgstPaise: 0, sgstPaise: 0, igstPaise: 0, taxPaise: 0, assumed: false, flags: [] };
    if (seller && seller.gstRegistered === true && !reg) out.flags.push('gstin_invalid_no_gst_charged');
    if (!reg) return out;
    var bps = validBps(seller.gstRateBps) ? seller.gstRateBps : platformRateBps();
    if (!validBps(seller.gstRateBps)) out.flags.push('gst_rate_not_confirmed_by_ca');
    var tax = Math.round(totalPaise * bps / (10000 + bps)), cs = String(customerState || '').slice(0, 2);
    out.taxPaise = tax; out.taxablePaise = totalPaise - tax; out.ratePct = bps / 100;
    if (!STATES[cs]) { cs = reg.code; out.assumed = true; out.flags.push('place_of_supply_assumed_seller_state'); }
    if (cs === reg.code) { out.mode = 'cgst_sgst'; out.cgstPaise = Math.floor(tax / 2); out.sgstPaise = tax - out.cgstPaise; }
    else { out.mode = 'igst'; out.igstPaise = tax; }
    out.pos = cs;
    return out;
  }

  function sellerSnapshot(seller) {
    seller = seller || {};
    var g = gstState(seller.gstin), flags = [];
    if (!String(seller.legalName || '').trim()) flags.push('seller_legal_name_missing');
    return { snap: { legalName: String(seller.legalName || '').trim() || 'RoamWise', tradeName: String(seller.tradeName || 'RoamWise'), gstin: seller.gstRegistered === true && g ? g.gstin : '',
      state: g ? g.name : String(seller.state || ''), address: String(seller.address || ''), pan: String(seller.pan || ''), udyam: String(seller.udyam || ''), email: String(seller.email || ''), phone: String(seller.phone || ''), sac: String(seller.sac || '') }, flags: flags };
  }

  /* seq is chosen by the caller (atomically, in the Worker). prevHash links this invoice to the one before it. */
  function build(norm, seller, seq, prevHash, now) {
    var day = istDay(norm.paidAt), fy = fyLabel(day), s = sellerSnapshot(seller), t = taxFor(norm.amountPaise, seller, norm.customer.state);
    var desc = norm.description || (norm.planId ? 'RoamWise plan: ' + norm.planId : 'RoamWise service');
    var flags = s.flags.concat(t.flags);
    if (norm.manual) flags.push('manual_entry_no_payment_reference');
    return {
      number: numberOf(seller, fy, seq), seq: seq, fy: fy, date: day, issuedAt: now || new Date().toISOString(),
      docType: t.mode === 'none' ? 'invoice' : 'tax_invoice', status: 'issued', currency: 'INR',
      seller: s.snap, customer: { uid: norm.customer.uid, email: norm.customer.email, name: norm.customer.name, state: norm.customer.state },
      lines: [{ description: desc, sac: s.snap.sac, taxablePaise: t.taxablePaise, ratePct: t.ratePct }],
      taxMode: t.mode, taxablePaise: t.taxablePaise, cgstPaise: t.cgstPaise, sgstPaise: t.sgstPaise, igstPaise: t.igstPaise, taxPaise: t.taxPaise, totalPaise: norm.amountPaise,
      totalInWords: amountInWords(norm.amountPaise), placeOfSupply: t.pos || '', gstNote: t.mode === 'none' ? 'GST not charged: the seller has no GST registration recorded.' : 'Amount shown is inclusive of GST.',
      payment: { source: norm.source, provider: norm.provider, ref: norm.providerRef, paidAt: norm.paidAt }, sourceKey: norm.key, flags: flags, prevHash: prevHash || '', hash: ''
    };
  }

  /* Canonical text of everything that matters, so any later edit changes the hash. */
  function canonical(inv) {
    var keys = ['number', 'seq', 'fy', 'date', 'docType', 'currency', 'taxMode', 'taxablePaise', 'cgstPaise', 'sgstPaise', 'igstPaise', 'totalPaise', 'sourceKey', 'prevHash'], o = {}, i;
    for (i = 0; i < keys.length; i++) o[keys[i]] = inv[keys[i]];
    o.seller = inv.seller.legalName + '|' + inv.seller.gstin; o.customer = inv.customer.uid + '|' + inv.customer.email; o.pay = inv.payment.ref + '|' + inv.payment.paidAt;
    return JSON.stringify(o);
  }
  function sha256Hex(text) {
    return root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return pad(b.toString(16), 2); }).join('');
    });
  }
  function seal(inv) { return sha256Hex(inv.prevHash + '|' + canonical(inv)).then(function (h) { inv.hash = h; return inv; }); }

  /* Re-checks every FY series: unbroken numbering, an intact hash chain and unaltered content. */
  function verifyChain(invoices) {
    var by = {}, issues = [], chain = Promise.resolve();
    invoices.forEach(function (i) { (by[i.fy] = by[i.fy] || []).push(i); });
    Object.keys(by).sort().forEach(function (fy) {
      var list = by[fy].sort(function (a, b) { return a.seq - b.seq; }), prev = '', expect = 1;
      list.forEach(function (inv) {
        chain = chain.then(function () {
          if (inv.seq !== expect) issues.push({ code: 'number_gap', fy: fy, detail: 'Expected ' + numberOf(inv.seller, fy, expect) + ' before ' + inv.number });
          expect = inv.seq + 1;
          if (inv.prevHash !== prev) issues.push({ code: 'chain_break', fy: fy, number: inv.number, detail: 'Previous-hash link does not match.' });
          return sha256Hex(inv.prevHash + '|' + canonical(inv)).then(function (h) {
            if (h !== inv.hash) issues.push({ code: 'content_changed', fy: fy, number: inv.number, detail: 'Stored hash does not match content.' });
            prev = inv.hash;
          });
        });
      });
    });
    return chain.then(function () { return { ok: issues.length === 0, checked: invoices.length, issues: issues }; });
  }

  return { STATES: STATES, paise: paise, istDay: istDay, fyLabel: fyLabel, fyStart: fyStart, numberOf: numberOf, amountInWords: amountInWords, gstState: gstState,
    fromPayment: fromPayment, fromLedgerRevenue: fromLedgerRevenue, taxFor: taxFor, build: build, canonical: canonical, sha256Hex: sha256Hex, seal: seal, verifyChain: verifyChain };
});
