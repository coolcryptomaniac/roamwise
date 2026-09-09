/* User-triggered backup, CSV/JSON downloads and file restore. */
(function (ui) {
  'use strict';
  ui.installTransfers = function (ctx) {
    function download(content, type, suffix) {
      var url = URL.createObjectURL(new Blob([content], { type: type }));
      var link = document.createElement('a'); link.href = url; link.download = 'roamwise-business-' + ctx.state.tripId.replace(/[^a-z0-9_-]/gi, '_') + suffix;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
    ctx.download = download;
  ctx.$('backup').addEventListener('click', function () {
    ctx.download(JSON.stringify({ kind: 'roamwise-business-backup', version: 1, draft: ctx.readDraft() }, null, 2), 'application/json', '-backup.json');
    ctx.tell('Backup download requested. Keep it private; it contains your expense details.');
  });
  ctx.$('export-csv').addEventListener('click', function () {
    try { ctx.download('\ufeff' + ctx.core.csv(ctx.readDraft()), 'text/csv;charset=utf-8', '.csv'); ctx.tell('Finance CSV download requested. No report was sent to an employer.'); }
    catch (e) { ctx.tell(e.message); }
  });
  ctx.$('export-json').addEventListener('click', function () {
    try { ctx.download(JSON.stringify(ctx.core.evaluate(ctx.readDraft()), null, 2), 'application/json', '-report.json'); ctx.tell('Report JSON download requested. No report was sent to an employer.'); }
    catch (e) { ctx.tell(e.message); }
  });
  ctx.$('restore').addEventListener('change', async function () {
    var file = this.files[0]; if (!file) return;
    try {
      if (file.size > 256 * 1024) throw new Error('Backup must be smaller than 256 KB.');
      var restored = ctx.validateBackup(JSON.parse(await file.text()));
      if (!window.confirm('Replace this draft with the backup? Download the current draft first if you need it.')) return;
      ctx.fillDraft(restored); ctx.persist(); ctx.tell('Backup restored. Review your trip dates and policy before exporting.');
    } catch (e) { ctx.tell(e.message || 'Could not restore this backup.'); }
    finally { this.value = ''; }
  });

  };
})(window.RWBusinessUI);
