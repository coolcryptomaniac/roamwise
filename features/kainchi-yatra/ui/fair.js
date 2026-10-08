/* Fair-price cards and the visitor report. Reports are sent by the visitor, never by this page. */
(function (root) {
  'use strict';
  root.RWKainchiUI.fair = function (ctx) {
    var cards = ctx.core.normalizeRates(ctx.core.rateCardsRaw);
    var form = ctx.$('report-form'), cat = ctx.$('rep-cat');
    function renderCards() {
      var box = ctx.$('rate-list');
      ctx.clear(box);
      if (!cards.length) { box.appendChild(ctx.el('p', ctx.t('fair_none'), 'empty')); return; }
      cards.forEach(function (c) {
        var item = ctx.el('div', null, 'rate');
        item.appendChild(ctx.el('b', c.route));
        item.appendChild(ctx.el('span', '₹' + c.min.toLocaleString('en-IN') + (c.max !== c.min ? ' – ₹' + c.max.toLocaleString('en-IN') : '') + ' ' + c.unit, 'rate-amt'));
        item.appendChild(ctx.el('small', ctx.t('fair_issuer', { issuer: c.issuer, date: c.asOf }), 'muted'));
        box.appendChild(item);
      });
    }
    function fillCategories() {
      var keep = cat.value;
      ctx.clear(cat);
      ctx.core.reportCategories.forEach(function (id) { var o = ctx.el('option', ctx.t('cat_' + id)); o.value = id; cat.appendChild(o); });
      if (keep) cat.value = keep;
    }
    function showOutput(r, excess) {
      var out = ctx.$('report-out');
      out.hidden = false;
      ctx.$('report-text').textContent = r.body;
      ctx.$('report-to').textContent = ctx.t('rep_to', { to: r.toFallback ? ctx.t('rep_to_fallback') : r.toLabel });
      ctx.$('report-mail').href = r.mailto;
      var wa = ctx.$('report-wa'); wa.hidden = !r.whatsapp; if (r.whatsapp) wa.href = r.whatsapp;
      ctx.$('report-emergency').hidden = !r.emergency;
      ctx.say('report-message', excess ? ctx.t('rep_over', { n: excess }) + ' ' + ctx.t('rep_ready') : ctx.t('rep_ready'));
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try {
        var input = { category: cat.value, place: ctx.$('rep-place').value, when: ctx.$('rep-when').value,
          amount: ctx.$('rep-amount').value, official: ctx.$('rep-official').value, text: ctx.$('rep-text').value };
        var r = ctx.core.buildReport(input, ctx.iso), rep = r.report;
        var over = rep.amount != null && rep.official != null && rep.amount > rep.official ? rep.amount - rep.official : 0;
        showOutput(r, over);
      } catch (err) { ctx.fail('report-message', err); ctx.$('report-out').hidden = true; }
    });
    cat.addEventListener('change', function () { ctx.$('report-emergency').hidden = cat.value !== 'ambulance'; });
    ctx.$('rep-when').value = ctx.today;
    ctx.onLang(function () { renderCards(); fillCategories(); });
    fillCategories(); renderCards();
    return { cards: cards };
  };
})(window);
