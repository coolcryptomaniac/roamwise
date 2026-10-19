/* Device-only enquiry log for artists. localStorage, with in-memory fallback when storage is blocked. */
(function () {
  'use strict';
  var KEY = 'rw-art-enquiries-v1', mem = [];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return mem; } }
  function save(a) { mem = a; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { $('eqSum').textContent = 'This browser blocks saving, so entries last only until you close the page. Export a CSV.'; } }
  var STATUS = ['New', 'Replied', 'Quoted', 'Won', 'Lost'];
  function draw() {
    var a = load(), won = a.filter(function (x) { return x.status === 'Won'; }).reduce(function (s, x) { return s + (+x.budget || 0); }, 0);
    $('eqSum').textContent = a.length + ' enquiries · ' + a.filter(function (x) { return x.status === 'Won'; }).length + ' won' + (won ? ' · ₹' + won.toLocaleString('en-IN') + ' won value' : '');
    $('eqRows').innerHTML = a.map(function (x, i) { return '<tr><td>' + esc(x.date) + '</td><td>' + esc(x.who) + '</td><td>' + esc(x.what) + '</td><td>' + (x.budget ? '₹' + (+x.budget).toLocaleString('en-IN') : '') + '</td><td><select data-i="' + i + '" aria-label="Status">' + STATUS.map(function (s) { return '<option' + (s === x.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td><td>' + esc(x.note) + '</td><td><button class="sa-link" data-del="' + i + '" type="button">Remove</button></td></tr>'; }).join('');
  }
  $('eqForm').addEventListener('submit', function (e) { e.preventDefault(); var f = e.target.elements, a = load(); a.unshift({ date: new Date().toISOString().slice(0, 10), who: f.who.value.trim(), what: f.what.value.trim(), budget: f.budget.value.replace(/\D/g, ''), status: f.status.value, note: f.note.value.trim() }); save(a); e.target.reset(); draw(); });
  $('eqRows').addEventListener('change', function (e) { var i = e.target.getAttribute('data-i'); if (i === null) return; var a = load(); a[i].status = e.target.value; save(a); draw(); });
  $('eqRows').addEventListener('click', function (e) { var i = e.target.getAttribute('data-del'); if (i === null) return; var a = load(); a.splice(+i, 1); save(a); draw(); });
  $('eqCsv').addEventListener('click', function () {
    var cell = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    var rows = [['Date', 'Who', 'Request', 'Budget', 'Status', 'Note']].concat(load().map(function (x) { return [x.date, x.who, x.what, x.budget, x.status, x.note]; }));
    var blob = new Blob([rows.map(function (r) { return r.map(cell).join(','); }).join('\n')], { type: 'text/csv' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'roamwise-art-enquiries.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  draw();
})();
