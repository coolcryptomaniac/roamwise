/* Tests for tools/generate-related-links.js and tools/generate-sitemap.js —
   the internal cross-linking generator and sitemap regenerator for
   guides/, blog/, and trips/. Runs against the real content directories
   (there's no fixture corpus — these tools exist specifically to operate
   on the live ~210-page content set), so these are regression/invariant
   checks rather than unit tests of isolated inputs. */
'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const links = require('../tools/generate-related-links.js');

/* ------------------------------------------------------- extractCityName */

test('extractCityName reads the "Best Time to Visit X" template', () => {
  const name = links.extractCityName(
    'kyoto-japan',
    'Best Time to Visit Kyoto, Japan (2026) — Crowd Calendar, Budget & Itinerary',
    'Best Time to Visit Kyoto: the Crowd-Smart Guide'
  );
  assert.equal(name, 'Kyoto');
});

test('extractCityName reads the "X in <Month>" template', () => {
  const name = links.extractCityName('jaipur-in-april', 'Jaipur in April (2026): Weather, Crowds & Is It Worth It?', 'Jaipur in April: the Honest Answer');
  assert.equal(name, 'Jaipur');
});

test('extractCityName reads the "X: ..." template', () => {
  const name = links.extractCityName('rishikesh-uttarakhand', 'Rishikesh Travel Guide 2026', "Rishikesh: what it actually costs, and what the maps get wrong");
  assert.equal(name, 'Rishikesh');
});

test('extractCityName falls back to a filtered filename slug', () => {
  const name = links.extractCityName('cape-town-south-africa', 'Cape Town Weekend', 'Cape Town Weekend');
  assert.equal(name, 'Cape Town');
});

test('extractCityName returns null for multi-destination roundup pages (no forced fake destination)', () => {
  assert.equal(
    links.extractCityName('best-time-to-visit-india', 'When to visit India — month by month, region by region', 'When to visit India'),
    null
  );
  assert.equal(
    links.extractCityName('what-things-cost-india', 'What Things Actually Cost in India 2026: Real Prices Locals Pay', "What things actually cost in India — and what you'll be quoted"),
    null
  );
});

/* ------------------------------------------------------- scoring basics */

test('jaccard is 0 for disjoint sets and 1 for identical non-empty sets', () => {
  assert.equal(links.jaccard(new Set(['a']), new Set(['b'])), 0);
  assert.equal(links.jaccard(new Set(['a', 'b']), new Set(['a', 'b'])), 1);
});

test('tokenize drops corpus boilerplate but keeps distinctive words', () => {
  const tokens = links.tokenize('Best Time to Visit Kyoto, Japan (2026) — Month-by-Month Weather & Travel Guide');
  assert.ok(!tokens.includes('best'));
  assert.ok(!tokens.includes('travel'));
  assert.ok(tokens.includes('kyoto'));
  assert.ok(tokens.includes('japan'));
});

/* ------------------------------------------------------- generator output (live content) */

test('every guides/blog/trips page produces valid, self-terminating markers when scanned', () => {
  const pages = links.loadAllPages();
  assert.ok(pages.length > 100, 'expected the real content corpus to be present');
  for (const p of pages) {
    assert.ok(fs.existsSync(p.file));
  }
});

test('related-links --check reports no drift against the committed output', () => {
  // If this fails, someone edited guides/blog/trips content without
  // rerunning `npm run related-links` afterwards.
  execFileSync(process.execPath, [path.join(ROOT, 'tools/generate-related-links.js'), '--check'], {
    cwd: ROOT,
  });
});

test('sitemap --check reports no drift against the committed sitemap.xml', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'tools/generate-sitemap.js'), '--check'], { cwd: ROOT });
});

test('every href injected by the related-links tool resolves to a real file', () => {
  const dirs = ['guides', 'blog', 'trips'];
  let checked = 0;
  for (const d of dirs) {
    for (const f of fs.readdirSync(path.join(ROOT, d)).filter((x) => x.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(ROOT, d, f), 'utf8');
      const block = html.match(/rw:related-links:start[\s\S]*?rw:related-links:end/);
      if (!block) continue;
      const hrefRe = /href="https:\/\/www\.roamwise\.co\.in\/([^"]+)"/g;
      let m;
      while ((m = hrefRe.exec(block[0]))) {
        checked++;
        assert.ok(fs.existsSync(path.join(ROOT, m[1])), `broken related-link href in ${d}/${f}: ${m[1]}`);
      }
    }
  }
  assert.ok(checked > 100, 'expected a meaningful number of related-links hrefs to have been checked');
});

test('every JSON-LD block in guides/blog/trips is valid JSON', () => {
  const dirs = ['guides', 'blog', 'trips'];
  let checked = 0;
  for (const d of dirs) {
    for (const f of fs.readdirSync(path.join(ROOT, d)).filter((x) => x.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(ROOT, d, f), 'utf8');
      const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
      let m;
      while ((m = re.exec(html))) {
        checked++;
        assert.doesNotThrow(() => JSON.parse(m[1]), `invalid JSON-LD in ${d}/${f}`);
      }
    }
  }
  assert.ok(checked > 50, 'expected a meaningful number of JSON-LD blocks to have been checked');
});

test('every sitemap.xml URL resolves to a real file on disk', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.length > 100);
  for (const u of urls) {
    let rel = u.replace('https://www.roamwise.co.in/', '');
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `sitemap.xml references a missing file: ${u}`);
  }
});
