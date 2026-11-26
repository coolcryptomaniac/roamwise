import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFeed } from '../worker/lib/shop-feed.js';
import { SHOP_CATALOGUE } from '../worker/lib/shop-catalogue.js';

test('feed lists every buyable product with server prices and no supplier SKUs', () => {
  const xml = buildFeed(SHOP_CATALOGUE);
  for (const p of SHOP_CATALOGUE.products) {
    assert.ok(xml.includes('<g:id>' + p.id + '</g:id>'), p.id);
    assert.ok(xml.includes((p.pricePaise / 100).toFixed(2) + ' INR'));
  }
  assert.ok(!/qikink|v-9R6l/i.test(xml));
  assert.match(xml, /^<\?xml/);
  assert.ok(xml.includes('https://roamwise.co.in/shop/?buy=almora-after-dark-hoodie'));
});

test('feed escapes text and splits multi-variant products into an item group', () => {
  const cat = { products: [{ id: 'auto-20261127-x', name: 'A & B <tee>', type: 'Oversized graphic tee', description: 'x', image: 'https://e.test/m.jpg', pricePaise: 89900,
    variants: [{ id: 'black-m', label: 'Black · M' }, { id: 'black-l', label: 'Black · L' }] }] };
  const xml = buildFeed(cat);
  assert.ok(xml.includes('A &amp; B &lt;tee&gt;'));
  assert.ok(xml.includes('<g:item_group_id>auto-20261127-x</g:item_group_id>'));
  assert.ok(xml.includes('<g:size>L</g:size>'));
});
