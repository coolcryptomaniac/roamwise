/* ============================================================================
   features/travel-safety/ui/dom.js — tiny DOM helpers shared by the three
   travel-safety pages. Text nodes only: no innerHTML anywhere in this feature.
   ========================================================================= */
(function (root) {
  'use strict';
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v == null || v === false) return;
      if (k === 'text') n.textContent = String(v);
      else if (k === 'class') n.className = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
      else n.setAttribute(k, v === true ? '' : String(v));
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); return n; }
  function safeHref(u) {
    var s = String(u || '');
    return /^https:\/\//.test(s) || /^\/[^/]/.test(s) || s === '/' ? s : '#';
  }
  function link(label, url, official) {
    var ext = /^https:/.test(url);
    return el('a', { class: 'ts-link' + (official ? ' is-official' : ''), href: safeHref(url), target: ext ? '_blank' : null, rel: ext ? 'noopener noreferrer' : null },
      [label + (ext ? ' ↗' : ' →')]);
  }
  function fmtDate(iso) {
    if (!/^20\d\d-\d\d-\d\d$/.test(String(iso || ''))) return '';
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (+iso.slice(8, 10)) + ' ' + m[+iso.slice(5, 7) - 1] + ' ' + iso.slice(0, 4);
  }
  var KIND = { closure: 'Closure', crowd: 'Crowds', event: 'Event', snow: 'Snow', rain: 'Rain', road: 'Road', heat: 'Heat' };
  function regionName(id) {
    var r = (root.RW_UK_REGIONS || []).filter(function (x) { return x.id === id; })[0];
    return r ? r.name : id;
  }
  /* One advisory card, used by the rules checker and the status page. */
  function advisoryCard(c) {
    var tags = [el('span', { class: 'ts-badge kind-' + (KIND[c.kind] ? c.kind : 'other'), text: KIND[c.kind] || 'Advisory' })];
    tags.push(el('span', { class: 'ts-badge ' + (c.official ? 'is-official' : 'is-confirm'), text: c.official ? 'Official' : 'Confirm locally' }));
    if (c.closedNow || c.closedOnTripDate) tags.push(el('span', { class: 'ts-badge is-closed', text: 'Closed on these dates' }));
    var meta = [];
    if (c.regions && c.regions.length) meta.push(c.regions.map(regionName).join(' · '));
    if (c.until) meta.push('until ' + fmtDate(c.until));
    return el('article', { class: 'ts-card ts-adv' }, [
      el('div', { class: 'ts-tags' }, tags),
      el('h3', { text: c.title }),
      el('p', { text: c.detail }),
      meta.length ? el('p', { class: 'ts-meta', text: meta.join(' · ') }) : null,
      el('p', { class: 'ts-src' }, ['Source: ', link(c.source || 'source', c.sourceUrl)])
    ]);
  }
  var STATUS = { 'in-force': 'In force', draft: 'Coming (draft)', seasonal: 'Seasonal', info: 'Advice' };
  function ruleCard(r) {
    return el('article', { class: 'ts-card ts-rule kind-' + r.kind }, [
      el('div', { class: 'ts-tags' }, [el('span', { class: 'ts-badge st-' + r.status, text: STATUS[r.status] || r.status }),
        r.stale ? el('span', { class: 'ts-badge is-confirm', text: 'Re-check: older than 60 days' }) : null]),
      el('h3', { text: r.title }),
      el('ul', {}, r.body.map(function (b) { return el('li', { text: b }); })),
      el('p', { class: 'ts-links' }, r.links.map(function (l) { return link(l.label, l.url, l.official); })),
      el('p', { class: 'ts-src' }, ['Source: ', link(r.source.label, r.source.url), ' · checked ' + fmtDate(r.checked)])
    ]);
  }
  root.RWTSDom = { el: el, clear: clear, link: link, fmtDate: fmtDate, advisoryCard: advisoryCard, ruleCard: ruleCard, regionName: regionName, safeHref: safeHref };
})(window);
