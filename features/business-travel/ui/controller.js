/* Page composition and event lifecycle; loaded last, once, using defer. */
(function (ui) {
  'use strict';
  var ctx = ui.createContext();
  ui.installForms(ctx); ui.installStorage(ctx); ui.installView(ctx); ui.installTransfers(ctx);
  ctx.editExpense = function (expense) {
    ctx.state.editing = expense.id;
    Object.keys(expense).forEach(function (name) { var field = ctx.fields(ctx.expenseForm, name); if (field) field.value = expense[name]; });
    ctx.updateFX(); ctx.$('add-expense').textContent = 'Save expense'; ctx.$('cancel-edit').hidden = false;
    ctx.fields(ctx.expenseForm, 'description').focus();
  };
  ctx.removeExpense = function (id) {
    if (!window.confirm('Remove this expense?')) return;
    ctx.state.expenses = ctx.state.expenses.filter(function (expense) { return expense.id !== id; });
    if (ctx.state.editing === id) ctx.resetExpense();
    ctx.persist(); ctx.render(); ctx.tell('Expense removed.');
  };
  ctx.fillCurrencies(ctx.$('base-currency')); ctx.fillCurrencies(ctx.$('expense-currency'));
  ctx.tripForm.addEventListener('submit', function (event) { event.preventDefault(); });
  ctx.tripForm.addEventListener('input', function (event) {
    if (event.target.name === 'baseCurrency') {
      if (ctx.state.expenses.length) { ctx.$('base-currency').value = ctx.state.lastBase; return; }
      ctx.state.lastBase = ctx.$('base-currency').value; ctx.updateFX();
    }
    ctx.schedulePersist(); ctx.render();
  });
  ctx.$('expense-currency').addEventListener('change', ctx.updateFX);
  ctx.$('cancel-edit').addEventListener('click', ctx.resetExpense);
  ctx.expenseForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!ctx.tripForm.reportValidity()) return;
    var entry = { id: ctx.state.editing || crypto.randomUUID() };
    ['description', 'date', 'category', 'amount', 'currency', 'fxRate', 'fxDate', 'fxSource', 'receiptRef'].forEach(function (name) { entry[name] = ctx.fields(ctx.expenseForm, name).value.trim(); });
    var draft = ctx.readDraft();
    draft.expenses = ctx.state.editing ? ctx.state.expenses.map(function (e) { return e.id === ctx.state.editing ? entry : e; }) : ctx.state.expenses.concat(entry);
    try { ctx.state.expenses = ctx.core.normalize(draft).expenses; ctx.resetExpense(); ctx.persist(); ctx.render(); ctx.tell('Expense saved to this draft.'); }
    catch (e) { ctx.tell(e.message); }
  });
  ctx.$('new-trip').addEventListener('click', function () {
    if (!window.confirm('Start a new trip? Download this draft first if you need to keep it.')) return;
    ctx.tripForm.reset(); ctx.state.expenses = []; ctx.state.tripId = crypto.randomUUID(); ctx.state.lastBase = 'INR';
    ctx.fields(ctx.tripForm, 'startDate').value = ctx.fields(ctx.tripForm, 'endDate').value = ctx.today;
    ctx.resetExpense(); ctx.persist(); ctx.render(); ctx.tell('New trip started.');
  });
  window.addEventListener('beforeunload', function (event) {
    ctx.flushPersist();
    if (ctx.state.dirty) { event.preventDefault(); event.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) ctx.flushPersist(); });
  ctx.fields(ctx.tripForm, 'startDate').value = ctx.fields(ctx.tripForm, 'endDate').value = ctx.today;
  ctx.resetExpense();
  try {
    var stored = localStorage.getItem(ctx.key);
    if (stored) {
      if (stored.length > 262144) throw new Error('Saved draft is too large.');
      var record = JSON.parse(stored);
      ctx.fillDraft(ctx.validateBackup({ kind: 'roamwise-business-backup', version: 1, draft: record.draft }));
      ctx.$('remember').checked = true; ctx.$('save-status').textContent = 'Saved draft restored on this device';
    }
  } catch (_) { ctx.tell('A saved draft could not be loaded. Restore a downloaded backup to recover it.'); }
  ctx.render();

})(window.RWBusinessUI);
