#!/usr/bin/env node
/* ============================================================================
   generate-sitemap.js
   ----------------------------------------------------------------------------
   Regenerates sitemap.xml from the actual files on disk in the
   content-heavy directories this task covers (guides/, blog/, trips/),
   plus a small fixed list of top-level pages the sitemap already carried.

   Scope note: this intentionally does NOT try to enumerate every .html
   file in the repo (e.g. about.html, pricing.html, terms.html, account
   pages) — that's a broader decision about what should be publicly
   indexable outside the scope of this pass (blog/guides/content
   directories). See TOP_LEVEL_URLS below for exactly what's carried over.

   This does NOT filter out pages carrying <meta name="robots"
   content="noindex,...">. Google's own guidance is that a noindex'd URL
   shouldn't be in the sitemap — but silently dropping ~32 guides pages and
   all of blog/ here would be a large, undiscussed behavior change. That
   contradiction (noindex pages present in the sitemap) is flagged
   explicitly in the PR description instead, for a human to decide.

   Usage:
     node tools/generate-sitemap.js
     npm run sitemap
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.roamwise.co.in';
const OUT = path.join(ROOT, 'sitemap.xml');

// Carried over verbatim from the sitemap as it existed before this task —
// not derived from a directory scan, since deciding what else on the site
// should be publicly indexable is outside this task's scope.
const TOP_LEVEL_URLS = [
  `${SITE}/`,
  `${SITE}/privacy.html`,
  `${SITE}/delete-account.html`,
];

// Each of these gets its own hub/index URL plus one URL per individual
// content page found in the directory.
const SECTION_DIRS = ['guides', 'blog', 'trips'];
const SKIP_FILES = new Set(['index.html', 'read.md', 'readme.md']);

function listContentSlugs(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.html') && !SKIP_FILES.has(f.toLowerCase()))
    .sort();
}

function buildUrls() {
  const urls = [...TOP_LEVEL_URLS];
  for (const dir of SECTION_DIRS) {
    if (!fs.existsSync(path.join(ROOT, dir, 'index.html'))) continue;
    urls.push(`${SITE}/${dir}/`);
    for (const file of listContentSlugs(dir)) {
      urls.push(`${SITE}/${dir}/${file}`);
    }
  }
  return urls;
}

function render(urls) {
  const body = urls
    .map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const urls = buildUrls();
  const xml = render(urls);

  if (checkOnly) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (current !== xml) {
      console.error('generate-sitemap --check: sitemap.xml is out of date. Run `npm run sitemap` to refresh it.');
      process.exit(1);
    }
    console.log(`generate-sitemap --check: OK — sitemap.xml matches ${urls.length} URLs on disk.`);
    return;
  }

  fs.writeFileSync(OUT, xml, 'utf8');
  console.log(`generate-sitemap: wrote ${urls.length} URLs to sitemap.xml`);
}

main();
