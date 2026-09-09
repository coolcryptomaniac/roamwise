/* Explicit local persistence and validated backup restoration. */
(function (ui) {
  'use strict';
  ui.installStorage = function (ctx) {
    function persist() {
      ctx.state.dirty = true;
      if (!ctx.$('remember').checked) { ctx.$('save-status').textContent = 'Not saved · download a backup before closing'; return; }
      try {
        // Incomplete form fields are preserved too, separate from strict exports.
        localStorage.setItem(ctx.key, JSON.stringify({ savedAt: Date.now(), draft: ctx.readDraft() }));
        ctx.$('save-status').textContent = 'Draft saved on this device'; ctx.state.dirty = false;
      } catch (_) { ctx.$('save-status').textContent = 'Could not save · download a backup'; }
    }
    function validateBackup(input) {
      if (!input || input.kind !== 'roamwise-business-backup' || input.version !== 1) throw new Error('Choose a RoamWise business backup.');
      var d = input.draft;
      if (!d || d.schemaVersion !== 1 || !d.trip || !d.policy || !Array.isArray(d.expenses)) throw new Error('Invalid backup.');
      ['id', 'title', 'costCenter', 'route', 'startDate', 'endDate'].forEach(function (n) { if (typeof d.trip[n] !== 'string' || d.trip[n].length > 240 || /[\u0000-\u001f]/.test(d.trip[n])) throw new Error('Invalid trip in backup.'); });
      ['baseCurrency', 'budget', 'dailyLimit', 'receiptThreshold'].forEach(function (n) { if (typeof d.policy[n] !== 'string' || d.policy[n].length > 20) throw new Error('Invalid policy in backup.'); });
      if (!Object.hasOwn(ctx.core.currencies, d.policy.baseCurrency) || typeof d.policy.requireReceipt !== 'boolean') throw new Error('Invalid policy in backup.');
      // Validate expenses against a temporary valid trip/policy if draft details
      // were subsequently cleared. Never accept malformed rows into the ledger.
      var safe = { schemaVersion: 1, trip: { id: d.trip.id || 'restored', title: 'Restored', costCenter: 'DRAFT', route: 'Draft', startDate: '2000-01-01', endDate: '2000-01-01' }, policy: { baseCurrency: d.policy.baseCurrency, budget: '1', dailyLimit: '1', receiptThreshold: '0', requireReceipt: true }, expenses: [] };
      if (d.expenses.length > 200) throw new Error('Too many expenses.');
      var seen = new Set();
      var rows = d.expenses.map(function (e) {
        safe.trip.startDate = safe.trip.endDate = e.date; safe.expenses = [e];
        var row = ctx.core.normalize(safe).expenses[0];
        if (seen.has(row.id)) throw new Error('Duplicate expense ID.'); seen.add(row.id); return row;
      });
      return { schemaVersion: 1, trip: Object.assign({}, d.trip, { id: d.trip.id || crypto.randomUUID() }), policy: d.policy, expenses: rows };
    }
    ctx.persist = persist;
    ctx.validateBackup = validateBackup;
  ctx.$('remember').addEventListener('change', function () {
    if (!ctx.$('remember').checked) {
      try { localStorage.removeItem(ctx.key); } catch (_) { ctx.tell('Could not remove the saved draft. Clear this site’s business draft using your browser storage controls.'); }
    }
    ctx.persist();
  });

  };
})(window.RWBusinessUI);
