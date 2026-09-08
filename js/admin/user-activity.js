// @ts-nocheck
/* ============================================================================
   js/admin/user-activity.js
   ----------------------------------------------------------------------------
   DAU / user-activity dashboard for the admin "Activity" tab.

   BEFORE this file: no per-user activity/login timestamp existed anywhere
   admin-readable in this codebase (checked — see REVENUE-GROWTH-STRATEGY.md's
   "There is no DAU instrumentation anywhere in this codebase yet" finding,
   and users/{uid}/devices/{deviceId}.last, the one timestamp that DID exist,
   is per-device and its Firestore rule is isSelf(uid)-only, so admin can't
   read it). js/boot/auth-init.js now writes a plain users/{uid}.lastActive
   server timestamp every time onAuthStateChanged fires with a signed-in user
   (real sign-in AND every subsequent app-open while already signed in) —
   merge-only, so it needed no firestore.rules change (rides the existing
   generic self-write rule, same as pushTokens).

   HONEST LIMITATION, stated here and in the rendered HTML: this can only
   measure activity from the moment that instrumentation shipped forward.
   There is no way to retroactively know how active any account was before
   today — this file never backfills or estimates a "before" number.

   Pure functions only; the Firestore read and DOM wiring live in
   admin/index.html, matching every other js/admin/*.js file.
   ========================================================================= */
var RWUserActivity = (function(){
  var DAY_MS = 24 * 3600 * 1000;

  /** Accepts a Firestore Timestamp, ISO string, epoch millis, or null/undefined. */
  function toMillis(v){
    if(!v) return 0;
    if(typeof v.toDate === 'function'){ try{ return v.toDate().getTime(); }catch(e){ return 0; } }
    if(typeof v.toMillis === 'function'){ try{ return v.toMillis(); }catch(e){ return 0; } }
    var d = new Date(v);
    var t = d.getTime();
    return isFinite(t) ? t : 0;
  }

  /**
   * records: [{lastActive}] — one entry per user doc (raw Firestore value,
   * any of the shapes toMillis() accepts). nowMs is injectable for tests.
   */
  function computeActivityStats(records, nowMs){
    var now = typeof nowMs === 'number' ? nowMs : Date.now();
    var list = records || [];
    var out = { totalUsers: list.length, dau: 0, wau: 0, mau: 0, neverActive: 0, mostRecentMs: 0 };
    list.forEach(function(r){
      var ms = toMillis(r && r.lastActive);
      if(!ms){ out.neverActive++; return; }
      if(ms > out.mostRecentMs) out.mostRecentMs = ms;
      var age = now - ms;
      if(age <= DAY_MS) out.dau++;
      if(age <= 7 * DAY_MS) out.wau++;
      if(age <= 30 * DAY_MS) out.mau++;
    });
    return out;
  }

  function renderActivityHtml(stats, helpers){
    var esc = (helpers && helpers.esc) || function(s){ return String(s==null?'':s); };
    var pct = function(n, of){ return of > 0 ? Math.round((n / of) * 1000) / 10 + '%' : '—'; };
    var recent = stats.mostRecentMs
      ? new Date(stats.mostRecentMs).toLocaleString('en-IN')
      : 'No tracked activity yet';
    return '' +
      '<div class="grid kpis">' +
        '<div class="card kpi"><b>' + stats.dau + '</b><span>DAU (active in last 24h)</span></div>' +
        '<div class="card kpi"><b>' + stats.wau + '</b><span>WAU (last 7 days) &middot; ' + pct(stats.wau, stats.totalUsers) + ' of users</span></div>' +
        '<div class="card kpi"><b>' + stats.mau + '</b><span>MAU (last 30 days) &middot; ' + pct(stats.mau, stats.totalUsers) + ' of users</span></div>' +
        '<div class="card kpi warn"><b>' + stats.neverActive + '</b><span>No tracked activity yet</span></div>' +
      '</div>' +
      '<div class="alert" style="margin-top:14px"><b>Honest limitation:</b> activity is only tracked from the moment this instrumentation shipped. There is no way to know how active any account was before that, so historical/pre-launch DAU is not shown and should never be assumed to be zero or estimated from this dashboard.</div>' +
      '<p class="meta" style="margin-top:10px">Most recent tracked activity: ' + esc(recent) + '. Source: <code>users/{uid}.lastActive</code>, written on every sign-in and app-open (js/boot/auth-init.js).</p>';
  }

  return {
    toMillis: toMillis,
    computeActivityStats: computeActivityStats,
    renderActivityHtml: renderActivityHtml
  };
})();
