'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..'), J = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

test('books data is valid and never holds non-https store links', () => {
  const d = J('books/data.json'); assert.ok(d.books.length >= 5);
  const ids = new Set();
  d.books.forEach(b => { assert.ok(b.id && b.title && !ids.has(b.id)); ids.add(b.id);
    ['pothi', 'amazon', 'flipkart'].forEach(k => assert.ok(!b.links[k] || /^https:\/\//.test(b.links[k]), b.id + ' ' + k));
    const s = path.join(root, 'books/samples', b.id + '.json');
    if (fs.existsSync(s)) assert.ok(J('books/samples/' + b.id + '.json').chapters.length); });
});

test('homepage links the bookshelf from section, menu and footer', () => {
  const h = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(h, /id="rwBooks"/); assert.match(h, /class="dr-link" href="\/books\/"/); assert.match(h, /foot-link" href="books\/"/);
});
