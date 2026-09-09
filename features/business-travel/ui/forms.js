/* Trip and expense form mapping; currency fields and editor reset. */
(function (ui) {
  'use strict';
  ui.installForms = function (ctx) {
    function fillCurrencies(select) {
      Object.keys(ctx.core.currencies).forEach(function (code) { var o = document.createElement('option'); o.value = code; o.textContent = code; select.appendChild(o); });
    }
    function readDraft() {
      function value(name) { return ctx.fields(ctx.tripForm, name).value.trim(); }
      return {
        schemaVersion: 1,
        trip: { id: ctx.state.tripId, title: value('title'), costCenter: value('costCenter'), route: value('route'), startDate: value('startDate'), endDate: value('endDate') },
        policy: { baseCurrency: value('baseCurrency'), budget: value('budget'), dailyLimit: value('dailyLimit'), receiptThreshold: value('receiptThreshold'), requireReceipt: ctx.fields(ctx.tripForm, 'requireReceipt').checked },
        expenses: ctx.state.expenses
      };
    }
    function fillDraft(draft) {
      ctx.state.tripId = draft.trip.id;
      ['title', 'costCenter', 'route', 'startDate', 'endDate'].forEach(function (name) { ctx.fields(ctx.tripForm, name).value = draft.trip[name]; });
      ['baseCurrency', 'budget', 'dailyLimit', 'receiptThreshold'].forEach(function (name) { ctx.fields(ctx.tripForm, name).value = draft.policy[name]; });
      ctx.fields(ctx.tripForm, 'requireReceipt').checked = draft.policy.requireReceipt;
      ctx.state.expenses = draft.expenses;
      ctx.state.lastBase = draft.policy.baseCurrency;
      ctx.resetExpense(); ctx.render();
    }
    function resetExpense() {
      ctx.expenseForm.reset(); ctx.state.editing = null;
      ctx.$('add-expense').textContent = 'Add expense'; ctx.$('cancel-edit').hidden = true;
      ctx.fields(ctx.expenseForm, 'date').value = ctx.fields(ctx.tripForm, 'startDate').value || ctx.today;
      ctx.fields(ctx.expenseForm, 'fxDate').value = ctx.fields(ctx.expenseForm, 'date').value;
      ctx.$('expense-currency').value = ctx.$('base-currency').value;
      ctx.updateFX();
    }
    function updateFX() {
      var same = ctx.$('expense-currency').value === ctx.$('base-currency').value;
      var rate = ctx.fields(ctx.expenseForm, 'fxRate'), source = ctx.fields(ctx.expenseForm, 'fxSource');
      rate.readOnly = same; source.readOnly = same;
      if (same) { rate.value = '1'; source.value = 'Same currency'; }
      else if (source.value === 'Same currency') { rate.value = ''; source.value = ''; }
      ctx.$('fx-hint').textContent = '1 ' + ctx.$('expense-currency').value + ' = exchange rate × ' + ctx.$('base-currency').value + '. Use your statement or finance-approved rate; no live rate is assumed.';
    }
    ctx.fillCurrencies = fillCurrencies;
    ctx.readDraft = readDraft;
    ctx.fillDraft = fillDraft;
    ctx.resetExpense = resetExpense;
    ctx.updateFX = updateFX;

  };
})(window.RWBusinessUI);
