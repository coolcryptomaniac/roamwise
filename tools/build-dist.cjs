#!/usr/bin/env node
/* tools/build-dist.cjs - builds the optimised copy of the site that GitHub Pages publishes.
   - Copies the repo to _site (same files as before; only .git, node_modules and _site are left out).
   - Minifies every .js and .css with esbuild. Scripts are minified as classic scripts (no bundling, no
     module wrapping), so top-level functions and variables keep their names: inline onclick handlers,
     window globals and script load order are unchanged.
   - No syntax lowering (target esnext): lowering injects one-letter helper vars into the global scope.
   - A file that fails to minify or to re-parse is copied unchanged, so this can only make files smaller.
   Usage: node tools/build-dist.cjs [outDir]          (default _site)
          node tools/build-dist.cjs --report [outDir]  (also prints size table)
   Needs esbuild: npm i --no-save esbuild@0.25 */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), vm = require('vm');

const SKIP_DIRS = new Set(['.git', 'node_modules', '_site']);
/* never minified: service worker (kept readable for debugging), already-minified files, vendor/ (third-party bundles) */
const SKIP_FILES = /(\.min\.(js|css)$)|(^|\/)sw\.js$|(^|\/)vendor\//;

function walk(dir, base, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), base, out); }
    else if (e.isFile()) out.push(path.relative(base, path.join(dir, e.name)));
    /* symlinks are skipped on purpose: Pages rejects them */
  }
  return out;
}

function parses(code) { try { new vm.Script(code); return true; } catch (e) { return false; } }

function buildDist(opts) {
  const src = path.resolve(opts.src || '.'), out = path.resolve(opts.out || '_site');
  const esbuild = opts.esbuild || require('esbuild');
  fs.rmSync(out, { recursive: true, force: true });
  const stats = { files: 0, minified: 0, kept: [], rawBefore: 0, rawAfter: 0, gzBefore: 0, gzAfter: 0 };
  for (const rel of walk(src, src, [])) {
    const from = path.join(src, rel), to = path.join(out, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    stats.files++;
    const isJs = /\.js$/.test(rel), isCss = /\.css$/.test(rel);
    if (!(isJs || isCss) || SKIP_FILES.test(rel)) { fs.copyFileSync(from, to); continue; }
    const buf = fs.readFileSync(from), text = buf.toString('utf8');
    let code = null;
    try {
      code = esbuild.transformSync(text, isJs
        ? { loader: 'js', minify: true, legalComments: 'none' }
        : { loader: 'css', minify: true, legalComments: 'none' }).code;
      if (isJs && !parses(code)) code = null;
    } catch (e) { code = null; }
    if (code == null || code.length >= text.length) { fs.copyFileSync(from, to); stats.kept.push(rel); continue; }
    fs.writeFileSync(to, code);
    stats.minified++;
    stats.rawBefore += buf.length; stats.rawAfter += Buffer.byteLength(code);
    stats.gzBefore += zlib.gzipSync(buf, { level: 9 }).length;
    stats.gzAfter += zlib.gzipSync(code, { level: 9 }).length;
  }
  return stats;
}

module.exports = { buildDist };

if (require.main === module) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const s = buildDist({ src: '.', out: args[0] || '_site' });
  const kb = n => (n / 1024).toFixed(0) + ' KB';
  console.log('dist: ' + s.files + ' files, ' + s.minified + ' minified, ' + s.kept.length + ' kept as-is');
  console.log('dist: minified files ' + kb(s.rawBefore) + ' -> ' + kb(s.rawAfter) + ' raw, ' + kb(s.gzBefore) + ' -> ' + kb(s.gzAfter) + ' gzip');
  if (s.kept.length) console.log('dist: kept unchanged: ' + s.kept.slice(0, 12).join(', ') + (s.kept.length > 12 ? ' ...' : ''));
}
