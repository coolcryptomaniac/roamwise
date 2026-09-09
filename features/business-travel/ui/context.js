/* One explicit page context; no feature data is added to consumer globals. */
(function (root) {
  'use strict';
  root.RWBusinessUI = {
    createContext: function () {
      var ctx = { core: root.RWBusinessCore, key: 'rw_business_draft_v1',
        state: { expenses: [], editing: null, tripId: crypto.randomUUID(), dirty: false, lastBase: 'INR' },
        today: new Date().toISOString().slice(0, 10) };
      ctx.$ = function (id) { return document.getElementById(id); };
      ctx.tripForm = ctx.$('trip-form'); ctx.expenseForm = ctx.$('expense-form');
      ctx.fields = function (form, name) { return form.elements.namedItem(name); };
      ctx.tell = function (message) { ctx.$('message').textContent = message; };
      ctx.cash = function (value, code) { return code + ' ' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: ctx.core.currencies[code], maximumFractionDigits: ctx.core.currencies[code] }); };
      ctx.el = function (tag, text, className) { var n = document.createElement(tag); n.textContent = text; if (className) n.className = className; return n; };
      return ctx;
    }
  };
})(window);
