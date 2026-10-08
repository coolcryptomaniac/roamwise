/* Advisory arrival passes. Kept in memory; saved on this device only when the visitor opts in. */
(function (root) {
  'use strict';
  root.RWKainchiUI.passes = function (ctx) {
    var form = ctx.$('pass-form'), list = ctx.$('pass-list'), remember = ctx.$('pass-remember'), passes = [];
    function persist() {
      if (remember.checked) ctx.set(ctx.cfg.storageKey, JSON.stringify(passes));
      else ctx.remove(ctx.cfg.storageKey);
    }
    function fillHours() {
      var select = ctx.$('pass-hour'), keep = select.value, date = ctx.$('pass-date').value;
      ctx.clear(select);
      ctx.core.slotsFor(ctx.core.parseDate(date) ? date : ctx.today).forEach(function (s) {
        var o = ctx.el('option', s.label); o.value = String(s.hour); select.appendChild(o);
      });
      if (keep) select.value = keep;
    }
    function card(p) {
      var wrap = ctx.el('li', null, 'pass'), cap = ctx.core.capacityFor(p.date, p.hour);
      wrap.setAttribute('data-code', p.code);
      wrap.appendChild(ctx.el('p', ctx.t('pass_code'), 'pass-label'));
      wrap.appendChild(ctx.el('p', p.code, 'pass-code'));
      wrap.appendChild(ctx.el('p', p.date + ' · ' + String(p.hour).padStart(2, '0') + ':00', 'pass-when'));
      wrap.appendChild(ctx.el('p', p.leader + ' · ' + p.size + (p.vehicle ? ' · ' + p.vehicle : '')));
      wrap.appendChild(ctx.el('p', cap ? ctx.t('pass_cap_n', { n: cap }) : ctx.t('pass_cap_none'), 'muted'));
      wrap.appendChild(ctx.el('p', ctx.t('pass_note'), 'pass-note'));
      var row = ctx.el('div', null, 'row-actions'), print = ctx.el('button', ctx.t('pass_print')), del = ctx.el('button', ctx.t('pass_delete'), 'quiet');
      print.type = del.type = 'button';
      print.addEventListener('click', function () {
        wrap.classList.add('printing');
        var done = function () { wrap.classList.remove('printing'); root.removeEventListener('afterprint', done); };
        root.addEventListener('afterprint', done);
        root.print();
      });
      del.addEventListener('click', function () { passes = passes.filter(function (x) { return x.code !== p.code; }); persist(); render(); });
      row.appendChild(print); row.appendChild(del); wrap.appendChild(row);
      return wrap;
    }
    function render() {
      ctx.clear(list);
      if (!passes.length) { list.appendChild(ctx.el('li', ctx.t('pass_none'), 'muted')); return; }
      passes.forEach(function (p) { list.appendChild(card(p)); });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try {
        var p = ctx.core.makePass({ date: ctx.$('pass-date').value, hour: ctx.$('pass-hour').value, leader: ctx.$('pass-leader').value,
          size: ctx.$('pass-size').value, vehicle: ctx.$('pass-vehicle').value }, ctx.iso);
        passes.unshift(p); passes = passes.slice(0, 20); persist(); render(); ctx.say('pass-message', ctx.t('pass_ok'));
      } catch (err) { ctx.fail('pass-message', err); }
    });
    remember.addEventListener('change', persist);
    var dateInput = ctx.$('pass-date');
    dateInput.min = ctx.today; dateInput.max = ctx.core.addDays(ctx.today, ctx.cfg.maxAdvanceDays); dateInput.value = ctx.today;
    dateInput.addEventListener('input', fillHours);
    var stored = ctx.core.parseStoredPasses(ctx.get(ctx.cfg.storageKey));
    if (stored.length) { passes = stored; remember.checked = true; }
    ctx.onLang(function () { render(); });
    fillHours(); render();
    return { all: function () { return passes.slice(); } };
  };
})(window);
