#!/usr/bin/env node
/* ============================================================================
   generate-function-index.js
   ----------------------------------------------------------------------------
   Low-AI-credit-usage tooling: generates FUNCTION-INDEX.md, a flat lookup
   table of every top-level global `function NAME(...)` and `window.NAME =`
   declaration across app.js and every file under js/ (recursively).

   WHY THIS EXISTS: this codebase has no bundler/ES modules (see
   ARCHITECTURE.md) — every function is a classic global, spread across
   app.js and 100+ files under js/. Answering "where is function X defined?"
   or "which file owns feature Y?" has historically meant a repo-wide grep
   (or several) every session. This script builds that lookup ONCE, cheaply,
   so a future AI session (or human) can grep FUNCTION-INDEX.md's already-
   in-context table instead of re-grepping the whole tree — see the
   "low AI credit usage" section in ARCHITECTURE.md for how to use it.

   This is intentionally a simple regex-based, line-oriented scanner, NOT a
   real AST parser — it is a cheap, "good enough" lookup table, not a build
   tool. It only sees:
     - `function NAME(` / `async function NAME(` at column 0 (top-level,
       not nested inside another function or object literal).
     - `window.NAME = function` / `window.NAME = async function` /
       `window.NAME = <identifier>;`-style assignments at column 0.
   It will NOT find functions assigned via other patterns (e.g. object
   method shorthand, functions nested inside an IIFE, or reassigned via
   `window['name']`). That's an accepted tradeoff for staying simple and
   fast to regenerate — see the file header note below for why.

   Usage:  node tools/generate-function-index.js   (or: npm run index)
   Regenerate this after any modularization change that adds/moves/removes
   a top-level function (see ARCHITECTURE.md's "low AI credit usage" note).
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const APP_JS = path.join(ROOT, 'app.js');
const OUT_MD = path.join(ROOT, 'FUNCTION-INDEX.md');

// Top-level `function name(` or `async function name(` — anchored to column
// 0 so nested/inner functions (indented) are excluded.
const FN_DECL_RE = /^(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/;
// Top-level `window.name = function|async function|<identifier>` assignment.
const WINDOW_ASSIGN_RE = /^window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(async\s+)?function\b/;

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

/* Best-effort one-line "purpose" for a function: look at the non-blank
   line(s) immediately above the declaration. Handles a trailing-line `//`
   comment or the last content line of a `/* ... *\/` block. Returns '' if
   nothing usable is found — this is a heuristic, not a guarantee. */
function inferPurpose(lines, declIndex) {
  let i = declIndex - 1;
  // Skip blank lines directly above the declaration.
  while (i >= 0 && lines[i].trim() === '') i--;
  if (i < 0) return '';
  const line = lines[i].trim();
  // Single-line `// comment` immediately above.
  const lineComment = line.match(/^\/\/\s*(.+)$/);
  if (lineComment) return lineComment[1].trim().slice(0, 140);
  // Last line of a /* ... */ block, e.g. `   some text */`, `*/`, or a
  // whole single-line block comment `/* some text */`.
  const blockEnd = line.match(/^(?:\/\*)?\*?\s*(.*?)\s*\*\/\s*$/);
  if (blockEnd && blockEnd[1]) return blockEnd[1].replace(/^\*\s*/, '').trim().slice(0, 140);
  return '';
}

function scanFile(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const found = [];
  const seenOnLine = new Set();
  lines.forEach((line, idx) => {
    const fnMatch = line.match(FN_DECL_RE);
    if (fnMatch) {
      found.push({ name: fnMatch[1], file: rel, line: idx + 1, purpose: inferPurpose(lines, idx) });
      seenOnLine.add(idx);
      return;
    }
    const winMatch = line.match(WINDOW_ASSIGN_RE);
    if (winMatch) {
      found.push({ name: winMatch[1], file: rel, line: idx + 1, purpose: inferPurpose(lines, idx) });
    }
  });
  return found;
}

function main() {
  const files = [APP_JS, ...walk(JS_DIR, [])].filter((f) => fs.existsSync(f));

  const rows = [];
  for (const file of files) {
    rows.push(...scanFile(file));
  }
  rows.sort((a, b) => a.name.localeCompare(b.name) || a.file.localeCompare(b.file));

  // Flag duplicate names across different files — the same global name
  // declared twice is worth surfacing (could be an intentional override,
  // e.g. rich-reply.js redefining a stub, or an actual collision).
  const byName = new Map();
  for (const r of rows) {
    if (!byName.has(r.name)) byName.set(r.name, []);
    byName.get(r.name).push(r);
  }
  const duplicates = [...byName.entries()].filter(([, list]) => list.length > 1);

  const generatedAt = new Date().toISOString().slice(0, 10);
  let md = '';
  md += '# RoamWise Function Index\n\n';
  md += 'Auto-generated by `tools/generate-function-index.js` — do not hand-edit.\n';
  md += 'Regenerate with `npm run index` after any modularization change that\n';
  md += 'adds, moves, or removes a top-level function (see ARCHITECTURE.md\'s\n';
  md += '"low AI credit usage" section for how this fits into the workflow).\n\n';
  md += 'Generated: ' + generatedAt + ' · ' + rows.length + ' top-level functions across ' + files.length + ' files.\n\n';
  md += 'Scope: `app.js` and `js/**/*.js` only (not root-level data/config\n';
  md += 'files like `rw-config.js` or `events-data.js`, and not `platform-v5/`\n';
  md += 'or `worker/`). Purpose column is a best-effort one-liner inferred from\n';
  md += 'a comment immediately above the declaration — blank means none was\n';
  md += 'found nearby, not that the function is undocumented.\n\n';

  if (duplicates.length) {
    md += '## Names declared in more than one file\n\n';
    md += 'Usually an intentional override or a same-named helper in two\n';
    md += 'unrelated features — worth a quick look if you did not expect it.\n\n';
    for (const [name, list] of duplicates) {
      md += '- `' + name + '` — ' + list.map((r) => r.file + ':' + r.line).join(', ') + '\n';
    }
    md += '\n';
  }

  md += '## Full index\n\n';
  md += '| Function | File | Line | Purpose |\n';
  md += '|---|---|---|---|\n';
  for (const r of rows) {
    const purpose = r.purpose ? r.purpose.replace(/\|/g, '\\|') : '';
    md += '| `' + r.name + '` | `' + r.file + '` | ' + r.line + ' | ' + purpose + ' |\n';
  }

  fs.writeFileSync(OUT_MD, md);
  console.log('generate-function-index: wrote ' + rows.length + ' entries (' + duplicates.length + ' duplicate name(s)) to ' + path.relative(ROOT, OUT_MD));
}

main();
