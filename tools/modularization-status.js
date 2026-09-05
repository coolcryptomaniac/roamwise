#!/usr/bin/env node
/* ============================================================================
   modularization-status.js
   ----------------------------------------------------------------------------
   Low-AI-credit-usage tooling: a fast, cheap answer to "is there more
   modularization work to do here, or is ARCHITECTURE.md's account of the
   repo still accurate?" — without a future session having to re-read the
   whole ~850-line ARCHITECTURE.md, re-run `wc -l app.js`/`find js -name
   "*.js" | wc -l` by hand, and mentally diff them against what the doc
   claims.

   Does two cheap things:
     1. DRIFT CHECK — parses the three headline numbers out of
        ARCHITECTURE.md's "Module map" opening paragraph (app.js line
        count, js/ file count, css/ file count) and compares them against
        the actual current repo state. Prints a clear PASS/DRIFT verdict.
        A "DRIFT" result means ARCHITECTURE.md needs a refresh before its
        numbers can be trusted — exactly the staleness problem this
        project's own CLAUDE.md warns a stale doc "actively blocks
        legitimate work."
     2. RECENT HISTORY — the last 15 modularization-tagged commits
        (`git log --oneline --all | grep -i modulariz`, the exact command
        ARCHITECTURE.md's own "History" section already tells a session to
        run), so a session can see at a glance what the last few passes
        actually did without opening GitHub or running the grep itself.

   Deliberately NOT a general-purpose changelog generator or a build step —
   just two greps' worth of signal, run together, because both questions
   ("what changed recently" and "is the doc still accurate") tend to get
   asked in the same breath at the start of a modularization session.

   Usage: node tools/modularization-status.js   (or: npm run mod-status)
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function countLines(file) {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  // Match `wc -l`: count newline characters (matches how ARCHITECTURE.md's
  // own line counts, taken from plain `wc -l`, were produced).
  return (content.match(/\n/g) || []).length;
}

function countFiles(dir, ext) {
  let count = 0;
  function walk(d) {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(ext)) count++;
    }
  }
  walk(path.join(ROOT, dir));
  return count;
}

function parseArchitectureDoc() {
  const doc = fs.readFileSync(path.join(ROOT, 'ARCHITECTURE.md'), 'utf8');
  const appJsMatch = doc.match(/`app\.js` is \*\*([\d,]+) lines\*\*/);
  const jsFilesMatch = doc.match(/there are \*\*([\d,]+) files\*\* under `js\/`/);
  const cssFilesMatch = doc.match(/plus \*\*([\d,]+) files\*\* under `css\/`/);
  const toNum = (m) => (m ? parseInt(m[1].replace(/,/g, ''), 10) : null);
  return {
    appJsLines: toNum(appJsMatch),
    jsFiles: toNum(jsFilesMatch),
    cssFiles: toNum(cssFilesMatch),
  };
}

function verdictLine(label, docVal, actualVal) {
  if (docVal === null) return '  ' + label + ': could not find this number in ARCHITECTURE.md (doc format may have changed)';
  const match = docVal === actualVal;
  return '  ' + label + ': doc says ' + docVal + ', actual is ' + actualVal + '  ' + (match ? '✓ match' : '✗ DRIFT');
}

function main() {
  const actual = {
    appJsLines: countLines('app.js'),
    jsFiles: countFiles('js', '.js'),
    cssFiles: countFiles('css', '.css'),
  };
  const doc = parseArchitectureDoc();

  console.log('=== ARCHITECTURE.md drift check ===');
  console.log(verdictLine('app.js line count', doc.appJsLines, actual.appJsLines));
  console.log(verdictLine('js/ file count    ', doc.jsFiles, actual.jsFiles));
  console.log(verdictLine('css/ file count   ', doc.cssFiles, actual.cssFiles));
  const anyDrift = doc.appJsLines !== actual.appJsLines || doc.jsFiles !== actual.jsFiles || doc.cssFiles !== actual.cssFiles;
  console.log(anyDrift
    ? '\n  -> ARCHITECTURE.md is out of date. Re-verify its numbers before trusting it (see its own "read first" instructions).'
    : '\n  -> ARCHITECTURE.md\'s headline numbers match the current repo. Safe to trust as a starting point.');

  console.log('\n=== Last 15 modularization-tagged commits ===');
  try {
    const log = execSync('git log --oneline --all -i --grep=modulariz', { cwd: ROOT, encoding: 'utf8' });
    const lines = log.split('\n').filter(Boolean).slice(0, 15);
    if (lines.length) lines.forEach((l) => console.log('  ' + l));
    else console.log('  (none found — not a git checkout, or no matching commits)');
  } catch (e) {
    console.log('  (git log failed: ' + e.message.split('\n')[0] + ')');
  }
}

main();
