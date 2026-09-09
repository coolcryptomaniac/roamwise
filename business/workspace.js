/* Device-local business draft. No API keys, analytics, network calls or account
 * storage. Opt-in persistence uses its own key and never clears other app data. */
(function () {
  'use strict';
  var core = window.RWBusinessCore, key = 'rw_business_draft_v1';
  var $ = function (id) { return document.getElementById(id); };
  var tripForm = $('trip-form'), expenseForm = $('expense-form');
  var fields = function (form, name) { return form.elements.namedItem(name); };
  var expenses = [], editing = null, tripId = crypto.randomUUID(), dirty = false, lastBase = 'INR';
  var today = new Date().toISOString().slice(0, 10);
  function tell(message) { $('message').textContent = message; }
  function fillCurrencies(select) {
    Object.keys(core.currencies).forEach(function (code) { var o = document.createElement('option'); o.value = code; o.textContent = code; select.appendChild(o); });
  }
  fillCurrencies($('base-currency')); fillCurrencies($('expense-currency'));
  function readDraft() {
    function value(name) { return fields(tripForm, name).value.trim(); }
    return {
      schemaVersion: 1,
      trip: { id: tripId, title: value('title'), costCenter: value('costCenter'), route: value('route'), startDate: value('startDate'), endDate: value('endDate') },
      policy: { baseCurrency: value('baseCurrency'), budget: value('budget'), dailyLimit: value('dailyLimit'), receiptThreshold: value('receiptThreshold'), requireReceipt: fields(tripForm, 'requireReceipt').checked },
      expenses: expenses
    };
  }
  function fillDraft(draft) {
    tripId = draft.trip.id;
    ['title', 'costCenter', 'route', 'startDate', 'endDate'].forEach(function (name) { fields(tripForm, name).value = draft.trip[name]; });
    ['baseCurrency', 'budget', 'dailyLimit', 'receiptThreshold'].forEach(function (name) { fields(tripForm, name).value = draft.policy[name]; });
    fields(tripForm, 'requireReceipt').checked = draft.policy.requireReceipt;
    expenses = draft.expenses;
    lastBase = draft.policy.baseCurrency;
    resetExpense(); render();
  }
  function persist() {
    dirty = true;
    if (!$('remember').checked) { $('save-status').textContent = 'Not saved · download a backup before closing'; return; }
    try {
      // Incomplete form fields are preserved too, separate from strict exports.
      localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), draft: readDraft() }));
      $('save-status').textContent = 'Draft saved on this device'; dirty = false;
    } catch (_) { $('save-status').textContent = 'Could not save · download a backup'; }
  }
  function resetExpense() {
    expenseForm.reset(); editing = null;
    $('add-expense').textContent = 'Add expense'; $('cancel-edit').hidden = true;
    fields(expenseForm, 'date').value = fields(tripForm, 'startDate').value || today;
    fields(expenseForm, 'fxDate').value = fields(expenseForm, 'date').value;
    $('expense-currency').value = $('base-currency').value;
    updateFX();
  }
  function updateFX() {
    var same = $('expense-currency').value === $('base-currency').value;
    var rate = fields(expenseForm, 'fxRate'), source = fields(expenseForm, 'fxSource');
    rate.readOnly = same; source.readOnly = same;
    if (same) { rate.value = '1'; source.value = 'Same currency'; }
    else if (source.value === 'Same currency') { rate.value = ''; source.value = ''; }
    $('fx-hint').textContent = '1 ' + $('expense-currency').value + ' = exchange rate × ' + $('base-currency').value + '. Use your statement or finance-approved rate; no live rate is assumed.';
  }
  function cash(value, code) { return code + ' ' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: core.currencies[code], maximumFractionDigits: core.currencies[code] }); }
  function el(tag, text, className) { var n = document.createElement(tag); n.textContent = text; if (className) n.className = className; return n; }
  function renderLedger(result) {
    var ledger = $('ledger'); ledger.replaceChildren();
    $('expense-count').textContent = expenses.length + ' / 200';
    if (!expenses.length) { ledger.appendChild(el('p', 'No expenses yet. Your first entry will appear here.', 'empty')); return; }
    expenses.forEach(function (e, i) {
      var row = el('article', '', 'expense'), info = el('div', '');
      info.appendChild(el('h3', e.description));
      info.appendChild(el('p', e.date + ' · ' + e.category + (e.receiptRef ? ' · Receipt: ' + e.receiptRef : ' · No receipt reference')));
      row.appendChild(info);
      var sum = el('div', cash(e.amount, e.currency), 'sum');
      if (result && e.currency !== result.currency) sum.appendChild(el('p', cash(result.rows[i].baseAmount, result.currency)));
      row.appendChild(sum);
      var actions = el('div', '', 'row-actions');
      ['Edit', 'Remove'].forEach(function (action) {
        var b = el('button', action); b.type = 'button'; b.setAttribute('aria-label', action + ' ' + e.description);
        b.addEventListener('click', function () {
          if (action === 'Remove') {
            if (!window.confirm('Remove this expense?')) return;
            expenses.splice(i, 1); if (editing === e.id) resetExpense(); persist(); render(); tell('Expense removed.');
          } else {
            editing = e.id;
            Object.keys(e).forEach(function (name) { var f = fields(expenseForm, name); if (f) f.value = e[name]; });
            updateFX(); $('add-expense').textContent = 'Save expense'; $('cancel-edit').hidden = false;
            fields(expenseForm, 'description').focus();
          }
        }); actions.appendChild(b);
      }); row.appendChild(actions); ledger.appendChild(row);
    });
  }
  function render() {
    var result = null;
    $('flags').replaceChildren();
    try {
      result = core.evaluate(readDraft());
      $('total').textContent = cash(result.total, result.currency);
      $('budget-total').textContent = cash(result.report.policy.budget, result.currency);
      $('remaining').textContent = cash(result.remaining, result.currency);
      $('review-status').textContent = result.status === 'empty' ? 'Add your first expense' : result.status === 'needs_review' ? result.flags.length + ' checks need attention' : 'Ready for finance review';
      result.flags.forEach(function (flag) { $('flags').appendChild(el('li', flag.message)); });
    } catch (e) {
      $('total').textContent = '—'; $('remaining').textContent = '—'; $('budget-total').textContent = '—';
      $('review-status').textContent = e.message;
    }
    $('export-csv').disabled = !result || !expenses.length;
    $('export-json').disabled = !result || !expenses.length;
    $('base-currency').disabled = expenses.length > 0;
    $('base-currency').title = expenses.length ? 'Start a new trip to change report currency; existing exchange rates refer to this currency.' : '';
    renderLedger(result);
  }
  tripForm.addEventListener('submit', function (event) { event.preventDefault(); });
  tripForm.addEventListener('input', function (event) {
    if (event.target.name === 'baseCurrency') {
      if (expenses.length) { $('base-currency').value = lastBase; return; }
      lastBase = $('base-currency').value; updateFX();
    }
    persist(); render();
  });
  $('expense-currency').addEventListener('change', updateFX);
  $('cancel-edit').addEventListener('click', resetExpense);
  expenseForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!tripForm.reportValidity()) return;
    var entry = { id: editing || crypto.randomUUID() };
    ['description', 'date', 'category', 'amount', 'currency', 'fxRate', 'fxDate', 'fxSource', 'receiptRef'].forEach(function (name) { entry[name] = fields(expenseForm, name).value.trim(); });
    var draft = readDraft();
    draft.expenses = editing ? expenses.map(function (e) { return e.id === editing ? entry : e; }) : expenses.concat(entry);
    try { expenses = core.normalize(draft).expenses; resetExpense(); persist(); render(); tell('Expense saved to this draft.'); }
    catch (e) { tell(e.message); }
  });
  $('remember').addEventListener('change', function () {
    if (!$('remember').checked) {
      try { localStorage.removeItem(key); } catch (_) { tell('Could not remove the saved draft. Clear this site’s business draft using your browser storage controls.'); }
    }
    persist();
  });
  function download(content, type, suffix) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a'); link.href = url; link.download = 'roamwise-business-' + tripId.replace(/[^a-z0-9_-]/gi, '_') + suffix;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  $('backup').addEventListener('click', function () {
    download(JSON.stringify({ kind: 'roamwise-business-backup', version: 1, draft: readDraft() }, null, 2), 'application/json', '-backup.json');
    tell('Backup download requested. Keep it private; it contains your expense details.');
  });
  $('export-csv').addEventListener('click', function () {
    try { download('\ufeff' + core.csv(readDraft()), 'text/csv;charset=utf-8', '.csv'); tell('Finance CSV download requested. No report was sent to an employer.'); }
    catch (e) { tell(e.message); }
  });
  $('export-json').addEventListener('click', function () {
    try { download(JSON.stringify(core.evaluate(readDraft()), null, 2), 'application/json', '-report.json'); tell('Report JSON download requested. No report was sent to an employer.'); }
    catch (e) { tell(e.message); }
  });
  // Backups may contain incomplete trip fields, but never arbitrary structures.
  function validateBackup(input) {
    if (!input || input.kind !== 'roamwise-business-backup' || input.version !== 1) throw new Error('Choose a RoamWise business backup.');
    var d = input.draft;
    if (!d || d.schemaVersion !== 1 || !d.trip || !d.policy || !Array.isArray(d.expenses)) throw new Error('Invalid backup.');
    ['id', 'title', 'costCenter', 'route', 'startDate', 'endDate'].forEach(function (n) { if (typeof d.trip[n] !== 'string' || d.trip[n].length > 240 || /[\u0000-\u001f]/.test(d.trip[n])) throw new Error('Invalid trip in backup.'); });
    ['baseCurrency', 'budget', 'dailyLimit', 'receiptThreshold'].forEach(function (n) { if (typeof d.policy[n] !== 'string' || d.policy[n].length > 20) throw new Error('Invalid policy in backup.'); });
    if (!Object.hasOwn(core.currencies, d.policy.baseCurrency) || typeof d.policy.requireReceipt !== 'boolean') throw new Error('Invalid policy in backup.');
    // Validate expenses against a temporary valid trip/policy if draft details
    // were subsequently cleared. Never accept malformed rows into the ledger.
    var safe = { schemaVersion: 1, trip: { id: d.trip.id || 'restored', title: 'Restored', costCenter: 'DRAFT', route: 'Draft', startDate: '2000-01-01', endDate: '2000-01-01' }, policy: { baseCurrency: d.policy.baseCurrency, budget: '1', dailyLimit: '1', receiptThreshold: '0', requireReceipt: true }, expenses: [] };
    if (d.expenses.length > 200) throw new Error('Too many expenses.');
    var seen = new Set();
    var rows = d.expenses.map(function (e) {
      safe.trip.startDate = safe.trip.endDate = e.date; safe.expenses = [e];
      var row = core.normalize(safe).expenses[0];
      if (seen.has(row.id)) throw new Error('Duplicate expense ID.'); seen.add(row.id); return row;
    });
    return { schemaVersion: 1, trip: Object.assign({}, d.trip, { id: d.trip.id || crypto.randomUUID() }), policy: d.policy, expenses: rows };
  }
  $('restore').addEventListener('change', async function () {
    var file = this.files[0]; if (!file) return;
    try {
      if (file.size > 256 * 1024) throw new Error('Backup must be smaller than 256 KB.');
      var restored = validateBackup(JSON.parse(await file.text()));
      if (!window.confirm('Replace this draft with the backup? Download the current draft first if you need it.')) return;
      fillDraft(restored); persist(); tell('Backup restored. Review your trip dates and policy before exporting.');
    } catch (e) { tell(e.message || 'Could not restore this backup.'); }
    finally { this.value = ''; }
  });
  $('new-trip').addEventListener('click', function () {
    if (!window.confirm('Start a new trip? Download this draft first if you need to keep it.')) return;
    tripForm.reset(); expenses = []; tripId = crypto.randomUUID(); lastBase = 'INR';
    fields(tripForm, 'startDate').value = fields(tripForm, 'endDate').value = today;
    resetExpense(); persist(); render(); tell('New trip started.');
  });
  window.addEventListener('beforeunload', function (event) { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  fields(tripForm, 'startDate').value = fields(tripForm, 'endDate').value = today;
  resetExpense();
  try {
    var stored = localStorage.getItem(key);
    if (stored) {
      if (stored.length > 262144) throw new Error('Saved draft is too large.');
      var record = JSON.parse(stored);
      fillDraft(validateBackup({ kind: 'roamwise-business-backup', version: 1, draft: record.draft }));
      $('remember').checked = true; $('save-status').textContent = 'Saved draft restored on this device';
    }
  } catch (_) { tell('A saved draft could not be loaded. Restore a downloaded backup to recover it.'); }
  render();
})();
