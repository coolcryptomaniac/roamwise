/* One page-local context: language, dates, DOM helpers. No globals beyond RWKainchiUI. */
(function (root) {
  'use strict';
  function localDate(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function safeGet(key) { try { return root.localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, value) { try { root.localStorage.setItem(key, value); return true; } catch (e) { return false; } }
  function safeRemove(key) { try { root.localStorage.removeItem(key); } catch (e) { /* storage blocked */ } }
  root.RWKainchiUI = {
    createContext: function () {
      var core = root.RWKainchiCore, ctx = { core: core, cfg: core.config, lang: 'en', now: new Date() };
      ctx.today = localDate(ctx.now);
      ctx.iso = ctx.now.toISOString();
      ctx.$ = function (id) { return document.getElementById(id); };
      ctx.t = function (key, vars) { return core.t(ctx.lang, key, vars); };
      ctx.el = function (tag, text, className) { var n = document.createElement(tag); if (text != null) n.textContent = text; if (className) n.className = className; return n; };
      ctx.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); };
      ctx.say = function (id, message, bad) { var n = ctx.$(id); n.textContent = message; n.className = 'message' + (bad ? ' bad' : ''); };
      ctx.fail = function (id, e) { ctx.say(id, e && e.key ? ctx.t(e.key, e.vars) : ctx.t('e_date', { n: ctx.cfg.maxAdvanceDays }), true); };
      ctx.get = safeGet; ctx.set = safeSet; ctx.remove = safeRemove;
      ctx.listeners = [];
      ctx.onLang = function (fn) { ctx.listeners.push(fn); };
      ctx.setLang = function (lang) {
        if (core.languages.indexOf(lang) === -1) lang = 'en';
        ctx.lang = lang; document.documentElement.lang = lang;
        Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (n) { n.textContent = ctx.t(n.getAttribute('data-i18n')); });
        Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
        safeSet(ctx.cfg.langKey, lang);
        ctx.listeners.forEach(function (fn) { fn(); });
      };
      return ctx;
    }
  };
})(window);
