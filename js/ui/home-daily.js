// @ts-nocheck
/* Daily home page refresh. Reads today's feed from the Worker (GET /home/daily, see
   worker/handlers/home-daily.js) and exposes it as window.__rwDaily, a promise that always resolves:
   to the feed, or to null when the Worker is unreachable or slow. js/ui/home-promo.js uses the feed's
   stayOrder so a different partner stay leads each day, and this file adds a short "today" strip of the
   travel advisories in force. With no feed the home page is exactly what it was before this file existed.
   The feed only reorders and selects what the team already published; nothing here is generated. */
(function () {
  'use strict';
  var API = String((window.RW_CONFIG && window.RW_CONFIG.workerUrl) || 'https://roamwise-api.founder-f53.workers.dev').replace(/\/+$/, '');
  var KEY = 'rw_home_daily', WAIT_MS = 1500;
  function today() { return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); }
  function valid(f) { return !!f && f.v === 1 && f.date === today() && Array.isArray(f.stayOrder) && Array.isArray(f.advisories); }
  function saved() { try { var f = JSON.parse(localStorage.getItem(KEY) || 'null'); return valid(f) ? f : null; } catch (e) { return null; } }

  function strip(feed) {
    var host = document.getElementById('rwPromo'); if (!host || document.getElementById('rwDaily')) return;
    var t = today(), list = feed.advisories.filter(function (a) { return a && a.title && (!a.until || a.until >= t); }).slice(0, 3);
    var eyebrow = host.querySelector('.rwx-eyebrow');
    if (eyebrow && feed.stayOrder.length) eyebrow.textContent = 'FEATURED TODAY · ' + new Date(t + 'T12:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).toUpperCase();
    if (!list.length) return;
    var box = document.createElement('div'); box.id = 'rwDaily';
    box.style.cssText = 'margin:12px 0 4px;padding:12px 14px;border:1px solid rgba(232,186,108,.35);border-radius:14px;background:rgba(232,186,108,.07);font-size:13px;line-height:1.5';
    var head = document.createElement('div');
    head.style.cssText = 'font-size:11px;letter-spacing:.14em;font-weight:800;color:#e8ba6c;margin-bottom:6px';
    head.textContent = 'BEFORE YOU TRAVEL TODAY';
    box.appendChild(head);
    list.forEach(function (a) {
      var row = document.createElement('div'); row.style.margin = '4px 0';
      var b = document.createElement('b'); b.textContent = (a.kind === 'closure' ? '⛔ ' : '⚠️ ') + a.title; row.appendChild(b);
      if (a.source) { var s = document.createElement('span'); s.style.opacity = '.75'; s.textContent = ' · ' + a.source + (a.official ? ' (official)' : ''); row.appendChild(s); }
      box.appendChild(row);
    });
    var more = document.createElement('a'); more.href = '/uttarakhand-road-status/'; more.style.cssText = 'display:inline-block;margin-top:6px;color:#e8ba6c;font-weight:700';
    more.textContent = 'Check roads and rules for your route →';
    box.appendChild(more);
    var mount = host.querySelector('.rwx-mount');
    if (mount) host.insertBefore(box, mount);
  }

  var cachedFeed = saved();
  window.__rwDaily = cachedFeed ? Promise.resolve(cachedFeed) : new Promise(function (resolve) {
    var done = false, finish = function (f) { if (done) return; done = true; resolve(f); };
    setTimeout(function () { finish(null); }, WAIT_MS);
    if (typeof fetch !== 'function') return finish(null);
    fetch(API + '/home/daily').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (f) {
      if (!valid(f)) return finish(null);
      try { localStorage.setItem(KEY, JSON.stringify(f)); } catch (e) { /* private mode: fetch again next visit */ }
      finish(f);
    }).catch(function () { finish(null); });
  });
  window.__rwDaily.then(function (f) {
    if (!f) return;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { strip(f); }); else strip(f);
  });
})();
