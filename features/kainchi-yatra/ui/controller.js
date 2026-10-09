/* Compose the page: language, planner, passes, fair prices, nearby places. */
(function (root) {
  'use strict';
  function nearby(ctx) {
    var box = ctx.$('alt-list');
    function render() {
      ctx.clear(box);
      ctx.core.alternatives.forEach(function (a) {
        var item = ctx.el('li', null, 'alt');
        item.appendChild(ctx.el('b', ctx.core.pick(a.name, ctx.lang)));
        item.appendChild(ctx.el('small', a.district, 'muted'));
        item.appendChild(ctx.el('span', ctx.core.pick(a.about, ctx.lang)));
        box.appendChild(item);
      });
    }
    ctx.onLang(render);
  }
  function start() {
    var ctx = root.RWKainchiUI.createContext();
    root.RWKainchiUI.planner(ctx);
    root.RWKainchiUI.passes(ctx);
    root.RWKainchiUI.fair(ctx);
    nearby(ctx);
    root.RWKainchiUI.bhakti(ctx);
    root.RWKainchiUI.visit(ctx);
    root.RWKainchiUI.advisory(ctx);
    root.RWKainchiUI.navigation(ctx);
    root.RWKainchiUI.updates(ctx);
    root.RWKainchiUI.week(ctx);
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) {
      b.addEventListener('click', function () { ctx.setLang(b.getAttribute('data-lang')); });
    });
    ctx.$('emerg-amb').href = 'tel:' + ctx.cfg.emergency.ambulance;
    ctx.$('emerg-gen').href = 'tel:' + ctx.cfg.emergency.general;
    ctx.setLang(ctx.get(ctx.cfg.langKey) || (/^hi\b/i.test(root.navigator.language || '') ? 'hi' : 'en'));
    root.RWKainchiUI.ctx = null;
    return ctx;
  }
  root.RWKainchiUI.start = start;
  start();
})(window);
