// @ts-nocheck
/* ============================================================================
   js/admin/dashboard-home.js
   ----------------------------------------------------------------------------
   The "single dashboard" ask: an at-a-glance command-center card for the
   Overview tab, surfacing the most important numbers/actions FIRST and
   linking straight into the specific tab that owns each one. This file
   computes/renders NOTHING new of its own — every figure it shows is passed
   in already-computed from the real module that owns it (RWUserActivity,
   RWBusinessMetrics, the promo/notification lists) so this stays a thin
   aggregator, not a second source of truth. Kept under 150 lines by design.

   Pure functions only; DOM wiring (goPage() links, which sections feed this)
   lives in admin/index.html.
   ========================================================================= */
var RWDashboardHome = (function(){
  /**
   * @param {object} p
   * @param {number} p.totalUsers @param {number} p.proUsers
   * @param {number} p.unresolvedCount action-queue size, already computed
   * @param {*} p.activityStats RWUserActivity.computeActivityStats() output
   * @param {*} p.businessSummary RWBusinessMetrics.summarizeRevenue() output
   * @param {number} p.activePromoCount @param {number} p.queuedNotificationCount
   */
  function buildHomeSummary(p){
    p = p || {};
    return {
      totalUsers: Number(p.totalUsers) || 0,
      proUsers: Number(p.proUsers) || 0,
      unresolvedCount: Number(p.unresolvedCount) || 0,
      dau: (p.activityStats && p.activityStats.dau) || 0,
      mau: (p.activityStats && p.activityStats.mau) || 0,
      mrrINR: (p.businessSummary && p.businessSummary.mrrINR) || 0,
      activePromoCount: Number(p.activePromoCount) || 0,
      queuedNotificationCount: Number(p.queuedNotificationCount) || 0
    };
  }

  function renderDashboardHomeHtml(summary, helpers){
    var money = (helpers && helpers.money) || function(n){ return '₹' + Math.round(Number(n)||0).toLocaleString('en-IN'); };
    var s = summary;
    return '' +
      '<div class="grid kpis">' +
        '<div class="card kpi"><b>' + s.dau + '</b><span>DAU today</span></div>' +
        '<div class="card kpi"><b>' + money(s.mrrINR) + '</b><span>MRR (live, matched to pricing)</span></div>' +
        '<div class="card kpi"><b>' + s.activePromoCount + '</b><span>Active promo codes</span></div>' +
        '<div class="card kpi ' + (s.queuedNotificationCount ? 'warn' : '') + '"><b>' + s.queuedNotificationCount + '</b><span>Notifications queued, not yet sent</span></div>' +
      '</div>' +
      '<div class="actions" style="margin-top:14px;flex-wrap:wrap">' +
        '<button class="btn" onclick="goPage(\'activity\')">Open Activity &rarr;</button>' +
        '<button class="btn" onclick="goPage(\'promos\')">Open Promos &rarr;</button>' +
        '<button class="btn" onclick="goPage(\'notifications\')">Open Notifications &rarr;</button>' +
        '<button class="btn" onclick="goPage(\'business\')">Open Business &rarr;</button>' +
        '<button class="btn" onclick="goPage(\'users\')">Open Users &rarr;</button>' +
      '</div>' +
      '<p class="meta" style="margin-top:12px">' + s.totalUsers + ' total users &middot; ' + s.proUsers + ' Pro &middot; ' + s.mau + ' active in the last 30 days &middot; ' + s.unresolvedCount + ' revenue record(s) need attention (see the queue below).</p>';
  }

  return {
    buildHomeSummary: buildHomeSummary,
    renderDashboardHomeHtml: renderDashboardHomeHtml
  };
})();
