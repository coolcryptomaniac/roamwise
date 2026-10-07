// @ts-nocheck
/* ============================================================================
   STAY QUOTE — pre-book (advance), balance, cancellation refund, RoamWise fee
   ============================================================================
   PURE ARITHMETIC. Nothing here moves money, calls a gateway or writes data.
   In the current model the guest pays the PROPERTY directly (UPI / at hotel),
   so any refund is made by the property under the policy it published; this
   module only makes the numbers and the policy wording consistent for both
   sides. RoamWise's own fee (7% Partner Free, 5% paid plan) is charged to the
   property after a completed stay and is never added to the guest's total.

   policy = {
     advancePct       0-100  share of the stay total asked up front to pre-book
     freeCancelHours  0-720  full refund if cancelled at least this long before check-in
     lateRefundPct    0-100  share of the PAID amount refunded after that window (0 = none)
   }
   ========================================================================= */
function rwClampNum(v, lo, hi, dflt){
  var n = Number(v);
  if(!isFinite(n)) return dflt;
  return Math.min(hi, Math.max(lo, n));
}
function rwNormalizeStayPolicy(p){
  p = p || {};
  return {
    advancePct: Math.round(rwClampNum(p.advancePct, 0, 100, 0)),
    freeCancelHours: Math.round(rwClampNum(p.freeCancelHours, 0, 720, 0)),
    lateRefundPct: Math.round(rwClampNum(p.lateRefundPct, 0, 100, 0))
  };
}
function rwHasStayPolicy(p){
  var n = rwNormalizeStayPolicy(p);
  return n.advancePct > 0 || n.freeCancelHours > 0;
}
/* Whole rupees, rounded half up, so quotes never carry paise. */
function rwRupees(x){ return Math.round(Number(x) || 0); }

/* Refund owed if the guest cancels `hoursBefore` hours before check-in having paid `paid`. */
function rwStayRefund(policy, paid, hoursBefore){
  var pol = rwNormalizeStayPolicy(policy);
  paid = Math.max(0, rwRupees(paid));
  var h = Number(hoursBefore);
  if(!isFinite(h)) h = 0;
  var pct = h >= pol.freeCancelHours && pol.freeCancelHours > 0 ? 100 : pol.lateRefundPct;
  var refund = rwRupees(paid * pct / 100);
  return { refund: refund, retained: paid - refund, refundPct: pct, full: pct === 100 };
}

/* feePct = RoamWise fee as a percent of the stay total, charged to the property. */
function rwStayQuote(input){
  input = input || {};
  var rate = Math.max(0, rwRupees(input.rate));
  var nights = Math.max(1, Math.round(rwClampNum(input.nights, 1, 60, 1)));
  var rooms = Math.max(1, Math.round(rwClampNum(input.rooms, 1, 20, 1)));
  var pol = rwNormalizeStayPolicy(input.policy);
  var feePct = rwClampNum(input.feePct, 0, 30, 7);
  var total = rate * nights * rooms;
  var advance = rwRupees(total * pol.advancePct / 100);
  var out = {
    ok: rate > 0,
    rate: rate, nights: nights, rooms: rooms, policy: pol,
    total: total, advance: advance, balance: total - advance,
    propertyFee: rwRupees(total * feePct / 100), feePct: feePct,
    propertyReceives: total - rwRupees(total * feePct / 100),
    guestPaysRoamwise: 0
  };
  /* GST on the room itself is the PROPERTY's to charge (or, via section 9(5), an e-commerce
     operator's). `total` above stays pre-tax so advances and fees keep their meaning; this
     adds the tax view only when the caller says who is liable. Rules: features/finance-tax/gst-rules.js */
  out.gst = null; out.totalWithTax = total;
  if(out.ok && (input.gstRegistered === true || input.viaEco === true) && typeof RWGst !== 'undefined'){
    var g = RWGst.stay({ nightlyValue: rate, nights: nights, rooms: rooms, registered: input.gstRegistered === true, viaEco: input.viaEco === true });
    out.gst = { ruleId: g.ruleId, rateBps: g.rateBps, tax: g.tax, payableBy: g.payableBy, itc: g.itc, confidence: g.confidence, reason: g.reason };
    out.totalWithTax = g.total;
  }
  out.cancellation = [
    { label: pol.freeCancelHours > 0 ? 'At least ' + pol.freeCancelHours + 'h before check-in' : 'Any time', hoursBefore: Math.max(pol.freeCancelHours, 0) },
    { label: pol.freeCancelHours > 0 ? 'Less than ' + pol.freeCancelHours + 'h before check-in' : 'No-show', hoursBefore: 0 }
  ].map(function(row){
    var r = rwStayRefund(pol, advance, row.hoursBefore);
    return { label: row.label, refundOfAdvance: r.refund, retainedOfAdvance: r.retained, refundPct: r.refundPct };
  });
  return out;
}

/* One plain-language line the listing can show, or '' when the property has set no policy. */
function rwStayPolicyText(policy){
  var p = rwNormalizeStayPolicy(policy), parts = [];
  if(p.advancePct > 0) parts.push('Pre-book with a ' + p.advancePct + '% advance paid directly to the hotel');
  if(p.freeCancelHours > 0){
    var when = p.freeCancelHours % 24 === 0 ? (p.freeCancelHours / 24) + (p.freeCancelHours === 24 ? ' day' : ' days') : p.freeCancelHours + ' hours';
    parts.push('free cancellation up to ' + when + ' before check-in' + (p.lateRefundPct > 0 ? ', then ' + p.lateRefundPct + '% refunded' : ', no refund after that'));
  }
  return parts.length ? parts.join('; ') + '. Set by the property.' : '';
}
