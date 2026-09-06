// @ts-nocheck
/* ============================================================================
   js/admin/investor-summary.js
   ----------------------------------------------------------------------------
   A clean, read-only rollup meant to be screenshotted for an investor
   update. Every figure it shows is passed in already-computed from real
   sources (RWBusinessMetrics.summarizeRevenue/computeEbitda, USERS.length,
   the existing Money-tab revenue total) — this file adds NO new
   calculation of its own beyond simple ratios (conversion %, growth
   counts), and fabricates nothing.
   ========================================================================= */
var RWInvestorSummary = (function(){
  /**
   * @param {{totalUsers:number, proUsers:number, totalApprovedRevenueINR:number}} userStats
   * @param {*} revenueSummary RWBusinessMetrics.summarizeRevenue() output
   * @param {*} ebitda RWBusinessMetrics.computeEbitda() output
   */
  function buildSummary(userStats, revenueSummary, ebitda){
    var totalUsers = Number(userStats && userStats.totalUsers) || 0;
    var proUsers = Number(userStats && userStats.proUsers) || 0;
    var conversionPct = totalUsers > 0 ? Math.round((proUsers / totalUsers) * 1000) / 10 : null;
    return {
      totalUsers: totalUsers,
      proUsers: proUsers,
      freeUsers: Math.max(0, totalUsers - proUsers),
      conversionPct: conversionPct,
      mrrINR: revenueSummary.mrrINR,
      arrINR: revenueSummary.arrINR,
      oneTimeCollectedINR: revenueSummary.oneTime.totalINR,
      totalApprovedRevenueINR: Number(userStats && userStats.totalApprovedRevenueINR) || 0,
      monthlyEbitdaINR: ebitda.monthlyEbitdaINR,
      marginPct: ebitda.marginPct
    };
  }

  function renderInvestorSummaryHtml(summary, helpers){
    var money = (helpers && helpers.money) || function(n){ return '₹' + Math.round(Number(n)||0).toLocaleString('en-IN'); };
    var pct = function(n){ return n == null ? '—' : n + '%'; };
    return '' +
      '<div class="eyebrow">Investor-facing snapshot &middot; real, computed numbers only</div>' +
      '<div class="grid kpis" style="margin-top:8px">' +
        '<div class="card kpi"><b>' + summary.totalUsers.toLocaleString('en-IN') + '</b><span>Total signups</span></div>' +
        '<div class="card kpi"><b>' + summary.proUsers.toLocaleString('en-IN') + '</b><span>Pro accounts</span></div>' +
        '<div class="card kpi"><b>' + pct(summary.conversionPct) + '</b><span>Free &rarr; Pro conversion</span></div>' +
        '<div class="card kpi"><b>' + money(summary.totalApprovedRevenueINR) + '</b><span>Total revenue recorded (all-time)</span></div>' +
      '</div>' +
      '<div class="grid kpis" style="margin-top:14px">' +
        '<div class="card kpi"><b>' + money(summary.mrrINR) + '</b><span>MRR</span></div>' +
        '<div class="card kpi"><b>' + money(summary.arrINR) + '</b><span>ARR</span></div>' +
        '<div class="card kpi"><b>' + money(summary.oneTimeCollectedINR) + '</b><span>One-time cash collected</span></div>' +
        '<div class="card kpi ' + (summary.monthlyEbitdaINR < 0 ? 'warn' : '') + '"><b>' + money(summary.monthlyEbitdaINR) + '</b><span>Monthly EBITDA-style' + (summary.marginPct != null ? ' (' + summary.marginPct + '% margin)' : '') + '</span></div>' +
      '</div>' +
      '<p class="meta" style="margin-top:14px">MRR/ARR are matched to the live pricing ladder from real approved payments (Business tab). EBITDA-style = MRR minus owner-entered monthly expenses (Business tab → Expenses). No figure on this page is estimated or fabricated.</p>';
  }

  return {
    buildSummary: buildSummary,
    renderInvestorSummaryHtml: renderInvestorSummaryHtml
  };
})();
