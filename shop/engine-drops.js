/* In-site promotion for the shop (no paid ads, founder decision 27 Nov 2026).
 * - "Popular now": the products with the most on-site clicks and purchases, ranked by the Worker.
 * - "New drops": products made by the shop engine (auto-designed, printed on demand), popular first.
 * - Clicks on Buy now / product cards are counted anonymously (POST /shop/click, no personal data).
 * Both sections use checkout.js (data-buy), so prices still come from the Worker. Server text is set
 * with textContent and only https images from RoamWise hosts are shown. Nothing renders while the
 * engine is off. A promo link /shop/?buy=<id> opens checkout under that card. */
(function() {
  'use strict';
  if (typeof fetch !== 'function') return;
  const API = String(window.RW_SHOP_API || 'https://roamwise-api.founder-f53.workers.dev').replace(/\/$/, '');
  const ID = /^[a-z0-9-]{1,60}$/;
  const AUTO = /^auto-\d{8}-[a-z0-9-]{2,40}$/;
  const IMG = /^https:\/\/(roamwise\.co\.in\/shop\/img\/[a-z0-9-]+\.(jpg|webp|png)|[a-z0-9.-]+\/media\/r2\/shop\/designs\/auto-\d{8}-[a-z0-9-]{2,40}\/mockup\.jpg)$/;
  const money = (p) => '₹' + Math.round(p / 100).toLocaleString('en-IN');

  /* Anonymous click counting for every product on the page (static and engine). */
  const sent = new Set();
  function count(id) {
    if (!ID.test(id || '') || sent.has(id)) return;
    sent.add(id);
    const body = JSON.stringify({ id });
    try { if (navigator.sendBeacon && navigator.sendBeacon(API + '/shop/click', body)) return; } catch (_) { /* fall through */ }
    fetch(API + '/shop/click', { method: 'POST', body, keepalive: true }).catch(() => {});
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-buy],[data-buy-jump],[data-product-id]');
    if (el) count(el.dataset.buy || el.dataset.buyJump || el.dataset.productId);
  });

  function card(p, badge) {
    const c = document.createElement('article'); c.className = 'product live'; c.dataset.productId = p.id;
    const img = document.createElement('img'); img.src = p.image; img.alt = p.name + ' design preview'; img.loading = 'lazy';
    img.width = 360; img.style.cssText = 'max-width:100%;height:auto;border-radius:12px';
    const type = document.createElement('p'); type.className = 'eyebrow'; type.textContent = (badge ? badge + ' · ' : '') + String(p.type || '');
    const title = document.createElement('h3'); title.textContent = String(p.name || '');
    const desc = document.createElement('p'); desc.textContent = String(p.description || '');
    const price = document.createElement('p'); const b = document.createElement('strong');
    b.textContent = money(p.pricePaise) + (p.auto ? ' · Printed on demand' : ' · Available now'); price.append(b);
    const buy = document.createElement('button'); buy.type = 'button'; buy.className = 'button'; buy.dataset.buy = p.id; buy.textContent = 'Buy now →';
    c.append(img, type, title, desc, price, buy);
    return c;
  }

  fetch(API + '/shop/catalogue').then((r) => (r.ok ? r.json() : null)).then((data) => {
    const all = ((data && data.products) || []).filter((p) => p && ID.test(p.id) && IMG.test(p.image || ''));
    const rank = ((data && data.popular) || []).filter((id) => ID.test(id));
    const pos = (id) => { const i = rank.indexOf(id); return i < 0 ? 999 : i; };
    const usedOnPage = new Set();
    const popular = rank.map((id) => all.find((p) => p.id === id)).filter(Boolean).slice(0, 4);
    const ps = document.getElementById('popular-now'); const pg = document.getElementById('popular-now-grid');
    if (ps && pg && popular.length) {
      popular.forEach((p, i) => { pg.append(card(p, i === 0 ? 'Most loved' : 'Popular')); usedOnPage.add(p.id); });
      ps.hidden = false;
    }
    const drops = all.filter((p) => p.auto === true && AUTO.test(p.id) && !usedOnPage.has(p.id))
      .sort((a, b) => pos(a.id) - pos(b.id)).slice(0, 200);
    const ds = document.getElementById('new-drops'); const dg = document.getElementById('new-drops-grid');
    if (ds && dg && drops.length) {
      const LABEL = { kumaon: 'Kumaon', songs: 'Songs', rave: 'Raveverse', books: 'Books', travel: 'RoamWise', trend: 'Trending' };
      const cols = Object.keys(LABEL).filter((c) => drops.some((p) => p.collection === c));
      const PAGE = 24; let filter = 'all'; let shown = PAGE;
      const bar = document.createElement('div'); bar.className = 'drop-filters'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Filter new drops');
      const more = document.createElement('button'); more.type = 'button'; more.className = 'button'; more.textContent = 'Show more';
      const draw = () => {
        dg.replaceChildren();
        const list = drops.filter((p) => filter === 'all' || p.collection === filter);
        list.slice(0, shown).forEach((p) => dg.append(card(p, '')));
        more.hidden = list.length <= shown;
      };
      ['all', ...cols].forEach((c) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = c === 'all' ? 'All' : LABEL[c];
        b.setAttribute('aria-pressed', String(c === 'all'));
        b.addEventListener('click', () => { filter = c; shown = PAGE; bar.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); });
        bar.append(b);
      });
      more.addEventListener('click', () => { shown += PAGE; draw(); });
      dg.before(bar); dg.after(more); draw(); ds.hidden = false;
    }
    const want = new URLSearchParams(location.search).get('buy');
    if (want && ID.test(want)) {
      const btn = document.querySelector('#popular-now-grid [data-buy="' + want + '"], #new-drops-grid [data-buy="' + want + '"]');
      if (btn) btn.click();
    }
  }).catch(() => { /* in-site promotion is optional */ });
})();
