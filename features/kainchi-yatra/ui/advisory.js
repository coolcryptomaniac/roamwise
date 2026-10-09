/* Device-local visitor signals and private journey notes; never a live or official feed. */
(function (root) {
  'use strict';
  root.RWKainchiUI.advisory = function (ctx) {
    var signalKey = 'rw_kainchi_advisory_v1', residentKey = 'rw_kainchi_resident_note_v1';
    function read(key, fallback) { try { return JSON.parse(ctx.get(key) || JSON.stringify(fallback)); } catch (e) { return fallback; } }
    function save(key, value) { return ctx.set(key, JSON.stringify(value)); }
    function renderSignals() {
      var box = ctx.$('signal-list'), values = read(signalKey, []); ctx.clear(box);
      if (!values.length) { box.appendChild(ctx.el('p', ctx.t('signals_empty'), 'muted')); return; }
      values.slice(-4).reverse().forEach(function (v) {
        var card = ctx.el('article', null, 'signal-card');
        card.appendChild(ctx.el('strong', ctx.t('signal_card', { kind: ctx.t('signal_' + v.kind), state: ctx.t('signal_' + v.state) })));
        card.appendChild(ctx.el('small', ctx.t('signal_when', { when: new Date(v.at).toLocaleString(ctx.lang === 'hi' ? 'hi-IN' : 'en-IN') }), 'muted'));
        if (v.note) card.appendChild(ctx.el('span', v.note));
        box.appendChild(card);
      });
    }
    function renderResident() {
      var box = ctx.$('resident-out'), v = read(residentKey, null); ctx.clear(box);
      if (!v) { box.appendChild(ctx.el('p', ctx.t('resident_empty'), 'muted')); return; }
      box.appendChild(ctx.el('strong', v.route)); box.appendChild(ctx.el('span', v.date));
      if (v.details) box.appendChild(ctx.el('span', v.details));
    }
    ctx.$('signal-form').addEventListener('submit', function (e) {
      e.preventDefault(); var values = read(signalKey, []);
      values.push({ kind: ctx.$('signal-kind').value, state: ctx.$('signal-state').value, note: ctx.$('signal-note').value.trim(), at: new Date().toISOString() });
      if (save(signalKey, values.slice(-12))) { ctx.say('signal-message', ctx.t('signal_saved')); ctx.$('signal-note').value = ''; renderSignals(); }
    });
    ctx.$('resident-form').addEventListener('submit', function (e) {
      e.preventDefault(); var v = { route: ctx.$('resident-route').value.trim(), date: ctx.$('resident-date').value, details: ctx.$('resident-details').value.trim() };
      if (v.route && v.date && save(residentKey, v)) { ctx.say('resident-message', ctx.t('resident_saved')); renderResident(); }
    });
    renderSignals(); renderResident(); ctx.onLang(function () { renderSignals(); renderResident(); });
  };
})(window);
