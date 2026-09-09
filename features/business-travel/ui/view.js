/* Ledger and budget rendering using text nodes; no HTML interpolation. */
(function (ui) {
  'use strict';
  ui.installView = function (ctx) {
    function renderLedger(result) {
      var ledger = ctx.$('ledger'); ledger.replaceChildren();
      ctx.$('expense-count').textContent = ctx.state.expenses.length + ' / 200';
      if (!ctx.state.expenses.length) { ledger.appendChild(ctx.el('p', 'No expenses yet. Your first entry will appear here.', 'empty')); return; }
      ctx.state.expenses.forEach(function (e, i) {
        var row = ctx.el('article', '', 'expense'), info = ctx.el('div', '');
        info.appendChild(ctx.el('h3', e.description));
        info.appendChild(ctx.el('p', e.date + ' · ' + e.category + (e.receiptRef ? ' · Receipt: ' + e.receiptRef : ' · No receipt reference')));
        row.appendChild(info);
        var sum = ctx.el('div', ctx.cash(e.amount, e.currency), 'sum');
        if (result && e.currency !== result.currency) sum.appendChild(ctx.el('p', ctx.cash(result.rows[i].baseAmount, result.currency)));
        row.appendChild(sum);
        var actions = ctx.el('div', '', 'row-actions');
        ['Edit', 'Remove'].forEach(function (action) {
          var b = ctx.el('button', action); b.type = 'button'; b.setAttribute('aria-label', action + ' ' + e.description);
          b.addEventListener('click', function () {
            if (action === 'Remove') {
              if (!window.confirm('Remove this expense?')) return;
              ctx.state.expenses.splice(i, 1); if (ctx.state.editing === e.id) ctx.resetExpense(); ctx.persist(); ctx.render(); ctx.tell('Expense removed.');
            } else {
              ctx.state.editing = e.id;
              Object.keys(e).forEach(function (name) { var f = ctx.fields(ctx.expenseForm, name); if (f) f.value = e[name]; });
              ctx.updateFX(); ctx.$('add-expense').textContent = 'Save expense'; ctx.$('cancel-edit').hidden = false;
              ctx.fields(ctx.expenseForm, 'description').focus();
            }
          }); actions.appendChild(b);
        }); row.appendChild(actions); ledger.appendChild(row);
      });
    }
    function render() {
      var result = null;
      ctx.$('flags').replaceChildren();
      try {
        result = ctx.core.evaluate(ctx.readDraft());
        ctx.$('total').textContent = ctx.cash(result.total, result.currency);
        ctx.$('budget-total').textContent = ctx.cash(result.report.policy.budget, result.currency);
        ctx.$('remaining').textContent = ctx.cash(result.remaining, result.currency);
        ctx.$('review-status').textContent = result.status === 'empty' ? 'Add your first expense' : result.status === 'needs_review' ? result.flags.length + ' checks need attention' : 'Ready for finance review';
        result.flags.forEach(function (flag) { ctx.$('flags').appendChild(ctx.el('li', flag.message)); });
      } catch (e) {
        ctx.$('total').textContent = '—'; ctx.$('remaining').textContent = '—'; ctx.$('budget-total').textContent = '—';
        ctx.$('review-status').textContent = e.message;
      }
      ctx.$('export-csv').disabled = !result || !ctx.state.expenses.length;
      ctx.$('export-json').disabled = !result || !ctx.state.expenses.length;
      ctx.$('base-currency').disabled = ctx.state.expenses.length > 0;
      ctx.$('base-currency').title = ctx.state.expenses.length ? 'Start a new trip to change report currency; existing exchange rates refer to this currency.' : '';
      ctx.renderLedger(result);
    }
    ctx.renderLedger = renderLedger;
    ctx.render = render;

  };
})(window.RWBusinessUI);
