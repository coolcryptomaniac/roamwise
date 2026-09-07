// @ts-nocheck
/* ============================================================================
   js/admin/business-metrics.js
   ----------------------------------------------------------------------------
   REAL, data-grounded MRR/ARR/EBITDA for the admin "Business" tab. Nothing
   in this file invents a number:

   - Revenue side: every currently-Pro account's most recent APPROVED payment
     amount (from claims/payments, exactly the records the existing Money tab
     already treats as real revenue) is matched against the live price list
     in RWPricing.CONFIG (js/pricing/subscription-plans.js + one-off-plans.js
     — the single source of truth
     the rest of the app already reads prices from). A match against a
     recurring monthly/yearly tier price contributes to MRR/ARR; a match
     against a one-time price (Founder ₹100, a long-term pass, a short-term
     pass) is counted as one-time cash collected, NOT recurring revenue —
     folding a lifetime pass into "MRR" would overstate the business.
     Amounts that don't match ANY known price point are never dropped or
     guessed at — they land in `unclassified` so the admin can see exactly
     what wasn't counted and why, instead of a silently wrong total.
   - Expense side: there is no real expense ledger in Firestore today, so
     EBITDA is computed from an EDITABLE `finance/costs` doc the owner fills
     in by hand (see js/admin/business-metrics.js's sumMonthlyExpenses,
     keyed off the real expense categories already defined in
     finance-data.js's RW_ACCOUNTS) — never a fabricated expense guess.

   Pure functions only; DOM wiring + the Firestore read/write for
   finance/costs live in admin/index.html, matching the load-order
   convention documented in CLAUDE.md (data/config modules load and are
   called by the page that wires them together, not the other way round).
   ========================================================================= */
var RWBusinessMetrics = (function(){
  /* Exact match only: every price on the live ladder (tiers, long/short-term
     passes, the Founder offer) is a distinct whole-rupee amount by design
     (e.g. Plus ₹99 vs. Founder ₹100 differ by just one rupee) — any
     rounding tolerance here would misclassify one real price as another,
     which is worse than leaving a genuinely mismatched amount unclassified. */
  var TOLERANCE_INR = 0;

  /**
   * Match one payment amount (INR) against every listed price in
   * RWPricing.CONFIG and return what it most likely was, or null if it
   * matches nothing on the current price list (never guessed).
   */
  function matchPlan(amountINR, config){
    var amt = Number(amountINR);
    if(!isFinite(amt) || amt <= 0 || !config) return null;

    var tiers = config.TIERS || [];
    for(var i=0;i<tiers.length;i++){
      var t = tiers[i];
      if(t.priceMonthly > 0 && Math.abs(amt - t.priceMonthly) <= TOLERANCE_INR){
        return { period:'monthly', tierId:t.id, tierLabel:t.label, monthlyEquivalentINR:t.priceMonthly, amountINR:amt };
      }
      if(t.priceYearly > 0 && Math.abs(amt - t.priceYearly) <= TOLERANCE_INR){
        return { period:'yearly', tierId:t.id, tierLabel:t.label, monthlyEquivalentINR:t.priceYearly/12, amountINR:amt };
      }
    }
    var longTerm = config.LONG_TERM || [];
    for(i=0;i<longTerm.length;i++){
      var grp = longTerm[i];
      var opts = grp.options || [];
      for(var j=0;j<opts.length;j++){
        var o = opts[j];
        if(Math.abs(amt - o.priceINR) <= TOLERANCE_INR){
          return { period:'onetime', tierId:grp.tier, tierLabel:grp.tierLabel, monthlyEquivalentINR:0,
            amountINR:amt, onetimeLabel:(o.label || (o.years+'-year pass')) };
        }
      }
    }
    var shortTerm = config.SHORT_TERM || [];
    for(i=0;i<shortTerm.length;i++){
      var s = shortTerm[i];
      if(Math.abs(amt - s.priceINR) <= TOLERANCE_INR){
        return { period:'onetime', tierId:'pro', tierLabel:'Pro', monthlyEquivalentINR:0,
          amountINR:amt, onetimeLabel:s.label };
      }
    }
    var fo = config.FOUNDER_OFFER || {};
    if(fo.priceINR && Math.abs(amt - fo.priceINR) <= TOLERANCE_INR){
      return { period:'onetime', tierId:'elite', tierLabel:'Elite (Founder)', monthlyEquivalentINR:0,
        amountINR:amt, onetimeLabel:fo.label || 'Founder lifetime' };
    }
    return null;
  }

  /**
   * records: one entry per currently-Pro account: {amountINR} where
   * amountINR is that account's latest approved/succeeded payment amount in
   * rupees, or 0/undefined for a comp/trial grant with no real payment on
   * file. Never fabricates a price for an account with no matching record.
   */
  function summarizeRevenue(records, config){
    var out = {
      mrrINR: 0, arrINR: 0,
      byTier: {},                       // tierId -> {tierLabel, monthlyCount, yearlyCount, mrrINR}
      oneTime: { count:0, totalINR:0, entries:[] },
      unclassified: { count:0, totalINR:0 },
      compedCount: 0,                   // Pro with no matching payment amount at all
      subscriberCount: 0
    };
    (records || []).forEach(function(r){
      out.subscriberCount++;
      var amt = Number(r && r.amountINR) || 0;
      if(amt <= 0){ out.compedCount++; return; }
      var plan = matchPlan(amt, config);
      if(!plan){ out.unclassified.count++; out.unclassified.totalINR += amt; return; }
      if(plan.period === 'onetime'){
        out.oneTime.count++;
        out.oneTime.totalINR += amt;
        out.oneTime.entries.push(plan);
        return;
      }
      var bucket = out.byTier[plan.tierId] || (out.byTier[plan.tierId] = {
        tierLabel: plan.tierLabel, monthlyCount:0, yearlyCount:0, mrrINR:0
      });
      if(plan.period === 'monthly') bucket.monthlyCount++; else bucket.yearlyCount++;
      bucket.mrrINR += plan.monthlyEquivalentINR;
      out.mrrINR += plan.monthlyEquivalentINR;
    });
    out.arrINR = out.mrrINR * 12;
    return out;
  }

  /**
   * costsDoc: the owner-entered finance/costs Firestore doc, keyed by the
   * SAME expense account ids already defined in finance-data.js's
   * RW_ACCOUNTS (exp_referral, exp_stipend, exp_infra, ...), each a monthly
   * INR number. accounts defaults to window.RW_ACCOUNTS.
   */
  function sumMonthlyExpenses(costsDoc, accounts){
    var acc = accounts || (typeof window !== 'undefined' ? window.RW_ACCOUNTS : null) || {};
    var byCategory = {}, total = 0;
    Object.keys(acc).forEach(function(id){
      if(acc[id].type !== 'expense') return;
      var v = Number(costsDoc && costsDoc[id]) || 0;
      byCategory[id] = { label: acc[id].label, amountINR: v };
      total += v;
    });
    return { totalINR: total, byCategory: byCategory };
  }

  /**
   * EBITDA here is deliberately "revenue minus expenses" only — no
   * depreciation/amortization/tax line exists in this dataset to add back,
   * so this is an EBITDA-STYLE operating view, labelled as such wherever
   * it's shown, not a claim of statutory EBITDA.
   */
  function computeEbitda(monthlyRevenueINR, monthlyExpensesINR){
    var rev = Number(monthlyRevenueINR) || 0;
    var exp = Number(monthlyExpensesINR) || 0;
    var ebitda = rev - exp;
    return {
      monthlyRevenueINR: rev,
      monthlyExpensesINR: exp,
      monthlyEbitdaINR: ebitda,
      annualEbitdaINR: ebitda * 12,
      marginPct: rev > 0 ? Math.round((ebitda / rev) * 1000) / 10 : null
    };
  }

  function renderBusinessMetricsHtml(summary, ebitda, helpers){
    var money = (helpers && helpers.money) || function(n){ return '₹' + Math.round(Number(n)||0).toLocaleString('en-IN'); };
    var esc = (helpers && helpers.esc) || function(s){ return String(s==null?'':s); };
    var tierRows = Object.keys(summary.byTier).map(function(id){
      var b = summary.byTier[id];
      return '<tr><td>' + esc(b.tierLabel) + '</td><td>' + b.monthlyCount + '</td><td>' + b.yearlyCount + '</td><td>' + money(b.mrrINR) + '</td></tr>';
    }).join('') || '<tr><td colspan="4" class="meta">No recurring Pro accounts matched a live tier price yet.</td></tr>';
    var flags = [];
    if(summary.unclassified.count) flags.push('<div class="alert"><b>' + summary.unclassified.count + ' payment(s) totalling ' + money(summary.unclassified.totalINR) + '</b> did not match any current price on the pricing ladder (old/edited price, or a manual comp amount) — excluded from MRR/ARR so the number stays real. Check the Money tab.</div>');
    if(summary.compedCount) flags.push('<div class="meta">' + summary.compedCount + ' Pro account(s) have no payment record at all (comp/trial/legacy grant) — counted as users, not revenue.</div>');
    return '' +
      '<div class="grid kpis">' +
        '<div class="card kpi"><b>' + money(summary.mrrINR) + '</b><span>MRR (recurring, matched to live prices)</span></div>' +
        '<div class="card kpi"><b>' + money(summary.arrINR) + '</b><span>ARR (MRR &times; 12)</span></div>' +
        '<div class="card kpi"><b>' + money(summary.oneTime.totalINR) + '</b><span>One-time cash collected (' + summary.oneTime.count + ' Founder/long-term/short-term passes)</span></div>' +
        '<div class="card kpi ' + (ebitda.monthlyEbitdaINR < 0 ? 'warn' : '') + '"><b>' + money(ebitda.monthlyEbitdaINR) + '</b><span>Monthly EBITDA-style (MRR &minus; owner-entered expenses)</span></div>' +
      '</div>' +
      '<table style="margin-top:14px"><thead><tr><th>Tier (matched from real payments)</th><th>Monthly</th><th>Yearly</th><th>MRR contributed</th></tr></thead><tbody>' + tierRows + '</tbody></table>' +
      flags.join('');
  }

  return {
    matchPlan: matchPlan,
    summarizeRevenue: summarizeRevenue,
    sumMonthlyExpenses: sumMonthlyExpenses,
    computeEbitda: computeEbitda,
    renderBusinessMetricsHtml: renderBusinessMetricsHtml
  };
})();
