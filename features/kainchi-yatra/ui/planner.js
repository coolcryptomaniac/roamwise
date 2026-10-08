/* Crowd-pressure planner: date in, rating + reasons + advice out. Text nodes only. */
(function (root) {
  'use strict';
  root.RWKainchiUI.planner = function (ctx) {
    var dateInput = ctx.$('plan-date');
    function render() {
      var value = dateInput.value;
      var result;
      try { result = ctx.core.classify(value); } catch (e) { return; }
      var badge = ctx.$('plan-level'), meter = ctx.$('plan-meter');
      badge.textContent = ctx.t('level_' + result.level);
      badge.className = 'level level-' + result.level;
      meter.setAttribute('data-score', String(result.score));
      ctx.$('plan-advice').textContent = ctx.t('adv_' + result.level);
      var list = ctx.$('plan-reasons');
      ctx.clear(list);
      result.reasons.forEach(function (r) { list.appendChild(ctx.el('li', ctx.t(r.key, r.vars))); });
    }
    function renderHistory() {
      var box = ctx.$('plan-history'), obs = ctx.core.peaks.observed;
      ctx.clear(box);
      obs.forEach(function (o) {
        var v = o.outsideVehiclesPerDay, n = function (x) { return x.toLocaleString('en-IN'); };
        box.appendChild(ctx.el('p', ctx.t('plan_hist', { from: o.from, to: o.to, a: n(Math.min.apply(null, v)), b: n(Math.max.apply(null, v)) })));
      });
    }
    dateInput.min = ctx.today;
    dateInput.max = ctx.core.addDays(ctx.today, ctx.cfg.maxAdvanceDays);
    dateInput.value = ctx.today;
    dateInput.addEventListener('input', render);
    ctx.onLang(function () { render(); renderHistory(); });
    render(); renderHistory();
    return { render: render };
  };
})(window);
