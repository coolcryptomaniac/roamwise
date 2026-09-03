#!/usr/bin/env node
/* ============================================================================
   check-line-limits.js
   ----------------------------------------------------------------------------
   Durable architecture rule for the app.js -> js/ (recursive) modularization
   effort: every file under js/ should stay small and single-purpose.

   - HARD CAP:  1000 lines. Any file under js/ (any depth) over this fails
                the check (non-zero exit) and prints the offending file(s)
                and their line counts.
   - SOFT TARGET: 300-500 lines. Any file over 500 lines gets a printed
                warning but does not fail the check.

   app.js itself is deliberately exempt for now: it is the ~19k line
   migration source being incrementally emptied out into js/ files as part
   of a multi-phase modularization (see the phase plan in the modularization
   PRs). Once migration completes in a future phase, app.js should be moved
   into js/ (or split up) and this exemption removed.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const HARD_CAP = 1000;
const SOFT_TARGET = 500;

// app.js is the migration source — exempt until the migration is complete.
const EXEMPT_FILES = new Set([
  path.join(ROOT, 'app.js'),
]);

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function countLines(file) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.length === 0) return 0;
  // Count newlines; add 1 if the file doesn't end with a trailing newline
  // (so a single-line file with no trailing \n still counts as 1 line).
  const newlines = (content.match(/\n/g) || []).length;
  return content.endsWith('\n') ? newlines : newlines + 1;
}

function main() {
  if (!fs.existsSync(JS_DIR)) {
    console.log('check-line-limits: no js/ directory found yet, nothing to check.');
    process.exit(0);
  }

  const files = walk(JS_DIR, []).filter((f) => !EXEMPT_FILES.has(path.resolve(f)));

  const failures = [];
  const warnings = [];

  for (const file of files) {
    const lines = countLines(file);
    const rel = path.relative(ROOT, file);
    if (lines > HARD_CAP) {
      failures.push({ rel, lines });
    } else if (lines > SOFT_TARGET) {
      warnings.push({ rel, lines });
    }
  }

  if (warnings.length) {
    console.warn('check-line-limits: WARNING — files over the ' + SOFT_TARGET + '-line soft target (target is 300-500 lines):');
    for (const w of warnings) {
      console.warn('  ' + w.rel + ': ' + w.lines + ' lines');
    }
  }

  if (failures.length) {
    console.error('check-line-limits: FAIL — files over the ' + HARD_CAP + '-line hard cap:');
    for (const f of failures) {
      console.error('  ' + f.rel + ': ' + f.lines + ' lines');
    }
    process.exit(1);
  }

  console.log('check-line-limits: OK — ' + files.length + ' file(s) under js/ within the ' + HARD_CAP + '-line hard cap.');
}

main();
