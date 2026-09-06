// @ts-nocheck
/* ============================================================================
   js/admin/referral-liability.js
   ----------------------------------------------------------------------------
   REAL total commission owed to referrers/creators, computed from the same
   attribution data the live app already stamps onto every approved claim
   (js/pricing/referral.js's rwRefStamp(): refCode/refRate/refSelf) — never
   an estimate. A sale only ever counts here if it is an APPROVED claim (the
   same "counts as real revenue" bar the Money tab already uses) and was not
   self-referred (refSelf === true is always excluded, matching the client's
   own self-referral guard and referral-data.js's selfReferralAllowed:false).

   referrers/terms come from referral-data.js (window.RW_REFERRERS /
   RW_REFERRAL_TERMS) — the same directory the live site validates codes
   against — so a referrer's name/type/rate shown here always matches what
   the public site actually pays out, not a duplicated copy.
   ========================================================================= */
var RWReferralLiability = (function(){
  /**
   * approvedRecords: [{amountINR, refCode, refRate, refSelf}] — one entry
   * per approved claim that carries referral attribution (rwRefStamp()'s
   * output, as stored on claims/{id}).
   * referrers: window.RW_REFERRERS (or the live config/referrers.list).
   * terms: window.RW_REFERRAL_TERMS (ratePct, holdDays, minPayout, ...).
   */
  function computeReferralLiability(approvedRecords, referrers, terms){
    var out = { byCode:{}, totalGrossRevenueINR:0, totalCommissionOwedINR:0, unmatchedCodes:{} };
    var byCode = {};
    (referrers || []).forEach(function(r){
      if(r && r.code) byCode[String(r.code).toUpperCase()] = r;
    });
    var defaultRate = ((terms && typeof terms.ratePct === 'number') ? terms.ratePct : 30) / 100;

    (approvedRecords || []).forEach(function(rec){
      if(!rec || !rec.refCode || rec.refSelf === true) return;
      var amt = Number(rec.amountINR) || 0;
      if(amt <= 0) return;
      var code = String(rec.refCode).toUpperCase();
      var who = byCode[code];
      var rate = (typeof rec.refRate === 'number') ? rec.refRate
        : (who && typeof who.rate === 'number') ? who.rate : defaultRate;
      var commission = amt * rate;

      var bucket = out.byCode[code] || (out.byCode[code] = {
        code: code,
        name: who ? who.name : null,
        type: who ? who.type : 'unknown',
        active: who ? who.active !== false : null,
        ratePct: Math.round(rate * 1000) / 10,
        salesCount: 0, grossRevenueINR: 0, commissionOwedINR: 0
      });
      bucket.salesCount++;
      bucket.grossRevenueINR += amt;
      bucket.commissionOwedINR += commission;
      out.totalGrossRevenueINR += amt;
      out.totalCommissionOwedINR += commission;
      if(!who) out.unmatchedCodes[code] = (out.unmatchedCodes[code] || 0) + 1;
    });
    return out;
  }

  /**
   * Flags any referrer whose YTD commission has crossed the Section 194H
   * TDS-withholding threshold (finance-data.js's RW_TAX_FLAGS.tds_194h,
   * ~Rs 20,000/person/FY per the Finance Act 2025 threshold documented in
   * PRICING-REFERRAL-MATH.md §6). This is a real threshold check against
   * real computed totals, not a fabricated compliance score.
   */
  function tdsFlagsForReferrers(liability, tdsLimitINR){
    var limit = Number(tdsLimitINR) || 20000;
    var flags = [];
    Object.keys(liability.byCode).forEach(function(code){
      var b = liability.byCode[code];
      if(b.commissionOwedINR >= limit){
        flags.push({ code: code, name: b.name, commissionOwedINR: b.commissionOwedINR });
      }
    });
    return flags;
  }

  function renderReferralLiabilityHtml(liability, helpers){
    var money = (helpers && helpers.money) || function(n){ return '₹' + Math.round(Number(n)||0).toLocaleString('en-IN'); };
    var esc = (helpers && helpers.esc) || function(s){ return String(s==null?'':s); };
    var codes = Object.keys(liability.byCode).sort(function(a,b){
      return liability.byCode[b].commissionOwedINR - liability.byCode[a].commissionOwedINR;
    });
    var rows = codes.map(function(code){
      var b = liability.byCode[code];
      return '<tr><td>' + esc(b.name || code) + (b.active === false ? ' <span class="tag">retired</span>' : '') + '<div class="meta">' + esc(code) + ' &middot; ' + esc(b.type) + ' &middot; ' + b.ratePct + '%</div></td>' +
        '<td>' + b.salesCount + '</td><td>' + money(b.grossRevenueINR) + '</td><td>' + money(b.commissionOwedINR) + '</td></tr>';
    }).join('') || '<tr><td colspan="4" class="meta">No approved, referral-attributed sales yet.</td></tr>';
    var unmatched = Object.keys(liability.unmatchedCodes);
    var unmatchedHtml = unmatched.length
      ? '<div class="alert bad"><b>' + unmatched.length + ' code(s) on approved claims aren’t in the current referrer directory</b> (' + esc(unmatched.join(', ')) + ') — a referrer may have been removed from referral-data.js/config/referrers after selling. Commission is still counted above at the claim’s stamped rate.</div>'
      : '';
    return '' +
      '<div class="grid kpis">' +
        '<div class="card kpi warn"><b>' + money(liability.totalCommissionOwedINR) + '</b><span>Total commission owed (all-time, approved sales)</span></div>' +
        '<div class="card kpi"><b>' + money(liability.totalGrossRevenueINR) + '</b><span>Gross revenue behind those sales</span></div>' +
      '</div>' +
      '<table style="margin-top:14px"><thead><tr><th>Referrer</th><th>Sales</th><th>Gross revenue</th><th>Commission owed</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      unmatchedHtml;
  }

  return {
    computeReferralLiability: computeReferralLiability,
    tdsFlagsForReferrers: tdsFlagsForReferrers,
    renderReferralLiabilityHtml: renderReferralLiabilityHtml
  };
})();
