/* New drops: products made by the shop engine (auto-designed, printed on demand). They exist only in the
 * Worker's catalogue (D1), so this file asks /shop/catalogue and renders those marked `auto`. Each card's
 * "Buy now" uses checkout.js (data-buy), so prices still come from the Worker. Server text is set with
 * textContent; images must be https URLs from the Worker's media path. Renders nothing while the engine
 * is off. A promo link /shop/?buy=<id> opens checkout under that card. */
(function() {
  'use strict';
  const section = document.getElementById('new-drops');
  const grid = document.getElementById('new-drops-grid');
  if (!section || !grid || typeof fetch !== 'function') return;
  const API = String(window.RW_SHOP_API || 'https://roamwise-api.founder-f53.workers.dev').replace(/\/$/, '');
  const ID = /^auto-\d{8}-[a-z0-9-]{2,40}$/;
  const IMG = /^https:\/\/[a-z0-9.-]+\/media\/r2\/shop\/designs\/auto-\d{8}-[a-z0-9-]{2,40}\/mockup\.jpg$/;
  const money = (p) => '₹' + Math.round(p / 100).toLocaleString('en-IN');
  fetch(API + '/shop/catalogue').then((r) => (r.ok ? r.json() : null)).then((data) => {
    const items = ((data && data.products) || []).filter((p) => p && p.auto === true && ID.test(p.id) && IMG.test(p.image || '')).slice(0, 24);
    if (!items.length) return;
    for (const p of items) {
      const card = document.createElement('article'); card.className = 'product live'; card.id = p.id;
      const img = document.createElement('img'); img.src = p.image; img.alt = p.name + ' design preview'; img.loading = 'lazy';
      img.width = 360; img.style.cssText = 'max-width:100%;height:auto;border-radius:12px';
      const type = document.createElement('p'); type.className = 'eyebrow'; type.textContent = String(p.type || '');
      const title = document.createElement('h3'); title.textContent = String(p.name || '');
      const desc = document.createElement('p'); desc.textContent = String(p.description || '');
      const price = document.createElement('p'); const b = document.createElement('strong');
      b.textContent = money(p.pricePaise) + ' · Printed on demand'; price.append(b);
      const buy = document.createElement('button'); buy.type = 'button'; buy.className = 'button'; buy.dataset.buy = p.id; buy.textContent = 'Buy now →';
      card.append(img, type, title, desc, price, buy); grid.append(card);
    }
    section.hidden = false;
    const want = new URLSearchParams(location.search).get('buy');
    if (want && ID.test(want)) { const btn = grid.querySelector('[data-buy="' + want + '"]'); if (btn) btn.click(); }
  }).catch(() => { /* engine drops are optional */ });
})();
