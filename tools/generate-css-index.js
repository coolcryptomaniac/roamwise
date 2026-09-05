#!/usr/bin/env node
/* ============================================================================
   generate-css-index.js
   ----------------------------------------------------------------------------
   Low-AI-credit-usage tooling, sibling to generate-function-index.js (see
   ARCHITECTURE.md's "low AI credit usage" section). Answers two questions
   FUNCTION-INDEX.md doesn't cover, both of which currently mean a repo-wide
   grep across 462+ HTML files every time a future session needs them:
     - "Where is `.tk-fold` actually styled?" -> CSS-INDEX.md's class table.
     - "Which pages include `partials/marketing-footer.html`?" -> its
       partials table. Also covers the more common case of the same
       question for a linked stylesheet (`<link rel="stylesheet" href=...>`),
       since that's the same "which pages pull in file X" shape of question
       and the scan is effectively free once we're already walking the HTML
       tree for data-include.

   Like generate-function-index.js, this is a deliberately simple, "good
   enough" scanner — not a real CSS/HTML parser — with known, accepted
   limitations documented inline below. Regenerate with `npm run index:css`
   after adding/removing/renaming a CSS class selector, a stylesheet
   <link>, or a `data-include` partial reference.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const OUT_MD = path.join(ROOT, 'CSS-INDEX.md');

// Directories we don't want to walk for HTML (huge, irrelevant, or vendored).
const HTML_SKIP_DIRS = new Set(['node_modules', '.git', 'worker', 'platform-v5', 'android']);

function walk(dir, exts, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return out;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (HTML_SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), exts, out);
    } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

/* ----------------------------------------------------------------------
   CSS class-selector scan.
   Not line-based like generate-function-index.js — this codebase's CSS is
   hand-minified (many selectors + declaration blocks per physical line,
   e.g. `.a{color:red}.b span{color:blue}`), so a per-line regex would
   both miss selectors and, worse, misread declaration VALUES as class
   names. Instead this does a single-pass character scan tracking brace
   depth, so it can tell "this `.name` is in a selector" from "this
   `.name`-shaped text is inside a declaration body" (which never
   legitimately contains a leading-dot class-shaped token in this
   codebase's CSS, but the point is we don't have to assume that — we
   only ever look at text collected between an open brace/file-start and
   the next `{`, which is exactly a selector list by construction).

   KNOWN LIMITATION: a class selector nested inside a plain rule block
   (not a valid concept in classic CSS, and not used here) would be
   missed; `@media`/`@supports`/`@layer` wrappers ARE transparent (their
   *contents* are still real selectors, correctly captured), but their
   own condition text is not scanned for class names (correct — a media
   query condition never contains a class selector). `@keyframes` bodies
   (percentage/from/to selectors, never classes) are skipped by the same
   mechanism automatically, since nothing inside them matches the class
   token regex anyway.
   ---------------------------------------------------------------------- */
const CLASS_TOKEN_RE = /\.([a-zA-Z_-][A-Za-z0-9_-]*)/g;
const CONTAINER_AT_RULE_RE = /^@(media|supports|layer|document)\b/i;

function scanCssFile(file, classMap) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');
  // Blank out /* ... */ comment bodies (keep newlines, for accurate line
  // numbers) so commented-out selectors never get indexed as real ones.
  const content = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

  let selBuf = '';
  let selStart = 0;
  const stack = []; // 'container' | 'rule', one entry per currently-open brace
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') {
      const sel = selBuf.trim();
      const isContainer = CONTAINER_AT_RULE_RE.test(sel);
      const inRuleBody = stack.length > 0 && stack[stack.length - 1] === 'rule';
      if (!isContainer && !inRuleBody) {
        // sel is selBuf.trim() — offsets inside `sel` (from the regex match)
        // must be shifted by however much LEADING whitespace trim() removed,
        // or the reported line number is off by however many newlines were
        // in that leading whitespace (a real bug caught by manually
        // cross-checking the `.tk-fold` example against the source file).
        const leadingTrim = selBuf.length - selBuf.trimStart().length;
        const trueSelStart = selStart + leadingTrim;
        let m;
        CLASS_TOKEN_RE.lastIndex = 0;
        while ((m = CLASS_TOKEN_RE.exec(sel))) {
          const name = '.' + m[1];
          const line = content.slice(0, trueSelStart + m.index).split('\n').length;
          if (!classMap.has(name)) classMap.set(name, []);
          classMap.get(name).push({ file: rel, line });
        }
      }
      stack.push(isContainer ? 'container' : 'rule');
      selBuf = '';
      selStart = i + 1;
    } else if (ch === '}') {
      stack.pop();
      selBuf = '';
      selStart = i + 1;
    } else {
      selBuf += ch;
    }
  }
}

/* ----------------------------------------------------------------------
   HTML scan: stylesheet <link> hrefs and data-include partial refs.
   Regex over raw file text (not a real HTML parser) — deliberately so,
   for the same "cheap and good enough" reasons as the rest of this
   tool family. Misses hrefs built at runtime via JS template strings
   (there aren't any for these two patterns in this codebase, verified
   by grep before writing this).
   ---------------------------------------------------------------------- */
const STYLESHEET_RE = /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']|<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/g;
const DATA_INCLUDE_RE = /data-include=["']([^"']+)["']/g;

function scanHtmlFile(file, stylesheetMap, partialMap) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  let m;
  STYLESHEET_RE.lastIndex = 0;
  while ((m = STYLESHEET_RE.exec(content))) {
    const href = (m[1] || m[2] || '').split('?')[0]; // drop cache-busting query strings
    if (!href || !href.endsWith('.css')) continue; // skip Google Fonts etc.
    const base = href.split('/').pop();
    if (!stylesheetMap.has(base)) stylesheetMap.set(base, []);
    stylesheetMap.get(base).push(rel);
  }

  DATA_INCLUDE_RE.lastIndex = 0;
  while ((m = DATA_INCLUDE_RE.exec(content))) {
    const src = m[1];
    if (!partialMap.has(src)) partialMap.set(src, []);
    partialMap.get(src).push(rel);
  }
}

function main() {
  const cssFiles = walk(CSS_DIR, ['.css'], []);
  const htmlFiles = walk(ROOT, ['.html'], []);

  const classMap = new Map();
  for (const f of cssFiles) scanCssFile(f, classMap);

  const stylesheetMap = new Map();
  const partialMap = new Map();
  for (const f of htmlFiles) scanHtmlFile(f, stylesheetMap, partialMap);

  const generatedAt = new Date().toISOString().slice(0, 10);
  let md = '';
  md += '# RoamWise CSS + Partials Index\n\n';
  md += 'Auto-generated by `tools/generate-css-index.js` — do not hand-edit.\n';
  md += 'Regenerate with `npm run index:css` after adding/removing/renaming a\n';
  md += 'CSS class selector, a stylesheet `<link>`, or a `data-include` partial\n';
  md += 'reference (see ARCHITECTURE.md\'s "low AI credit usage" section — this\n';
  md += 'is FUNCTION-INDEX.md\'s sibling for CSS/HTML instead of JS functions).\n\n';
  md += 'Generated: ' + generatedAt + ' · ' + classMap.size + ' CSS class selectors across '
    + cssFiles.length + ' files · ' + stylesheetMap.size + ' linked stylesheets · '
    + partialMap.size + ' `data-include` partials, scanned across ' + htmlFiles.length + ' HTML files.\n\n';
  md += 'Scope: the CSS-class table only covers `css/**/*.css` (matching\n';
  md += 'ARCHITECTURE.md\'s "9 files under css/") — it does NOT cover\n';
  md += '`itinerary-library/assets/preset-library.css` or other stylesheets\n';
  md += 'that live outside `css/`, even though the stylesheet-usage table\n';
  md += 'below does track who links them (that scan walks all HTML files,\n';
  md += 'not just `css/`).\n\n';

  md += '## CSS classes — "where is `.foo` styled?"\n\n';
  md += 'Each class lists every top-level selector-list occurrence that\n';
  md += 'defines it (including inside `@media`/`@supports` blocks) — a class\n';
  md += 'with more than one entry usually means a base style plus one or more\n';
  md += 'responsive/state overrides, not a collision.\n\n';
  md += '| Class | Defined in |\n|---|---|\n';
  const classNames = [...classMap.keys()].sort();
  for (const name of classNames) {
    const locs = classMap.get(name).map((r) => '`' + r.file + ':' + r.line + '`').join(', ');
    md += '| `' + name + '` | ' + locs + ' |\n';
  }

  md += '\n## Stylesheets — "which pages link `X.css`?"\n\n';
  md += '| Stylesheet | Linked by (count) | Sample pages |\n|---|---|---|\n';
  const sheetNames = [...stylesheetMap.keys()].sort();
  for (const name of sheetNames) {
    const pages = stylesheetMap.get(name);
    const sample = pages.slice(0, 3).map((p) => '`' + p + '`').join(', ') + (pages.length > 3 ? ', …' : '');
    md += '| `' + name + '` | ' + pages.length + ' | ' + sample + ' |\n';
  }

  md += '\n## HTML partials — "which pages include `partials/X.html`?"\n\n';
  md += '| Partial | Included by |\n|---|---|\n';
  const partialNames = [...partialMap.keys()].sort();
  for (const name of partialNames) {
    const pages = partialMap.get(name).map((p) => '`' + p + '`').join(', ');
    md += '| `' + name + '` | ' + pages + ' |\n';
  }
  md += partialNames.length ? '' : '_(none found)_\n';

  fs.writeFileSync(OUT_MD, md);
  console.log('generate-css-index: wrote ' + classMap.size + ' CSS classes, '
    + stylesheetMap.size + ' stylesheets, ' + partialMap.size + ' partials to '
    + path.relative(ROOT, OUT_MD));
}

main();
