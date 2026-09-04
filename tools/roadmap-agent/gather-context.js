#!/usr/bin/env node
/* ============================================================================
   RoadMap Agent — gather-context.js
   ----------------------------------------------------------------------------
   Collects a bounded, text-only snapshot of live repo + business signal and
   writes it to context.md in the current working directory. Deliberately has
   NO dependency on an LLM key — this step only assembles facts. generate-
   report.js reads context.md and does the actual synthesis via the Claude
   API.

   Design notes:
   - Every gatherer is wrapped in try/catch. A single failing source (GitHub
     API rate limit, npm registry hiccup, missing file) must not abort the
     whole run — it degrades to a "(unavailable: reason)" note in that
     section instead, same pattern as agent/daily.js's Firestore fallback.
   - No network call is required for this script to produce useful output:
     git log/diff work from the local checkout, and reading docs is local
     disk I/O. GitHub API and npm-registry lookups are best-effort extras.
   - Runs standalone: `node tools/roadmap-agent/gather-context.js`
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const MAX_DOC_CHARS = 6000; // keep each grounding doc bounded so the final
                             // prompt stays a reasonable size/cost

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).trim();
}

function readDocExcerpt(file, maxChars = MAX_DOC_CHARS) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return `(missing: ${file})`;
  const text = fs.readFileSync(p, 'utf8');
  return text.length > maxChars
    ? text.slice(0, maxChars) + `\n...[truncated, ${text.length - maxChars} more chars]`
    : text;
}

/* ---------------------------------------------------------- git history */
function gatherGitHistory() {
  try {
    const log = sh('git log --oneline -n 40 --no-merges');
    return log || '(no commit history found)';
  } catch (e) {
    return `(unavailable: ${String(e.message || e).slice(0, 150)})`;
  }
}

/* -------------------------------------------------- recent PR titles (API) */
async function gatherRecentPRs() {
  const repoSlug = process.env.GITHUB_REPOSITORY; // e.g. "owner/repo", set by Actions
  const token = process.env.GITHUB_TOKEN;
  if (!repoSlug) return '(unavailable: GITHUB_REPOSITORY not set — not running in GitHub Actions)';
  try {
    const url = `https://api.github.com/repos/${repoSlug}/pulls?state=closed&per_page=20&sort=updated&direction=desc`;
    const headers = { 'User-Agent': 'roamwise-roadmap-agent', Accept: 'application/vnd.github+json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(url, { headers });
    if (!r.ok) return `(unavailable: GitHub API returned ${r.status})`;
    const prs = await r.json();
    if (!Array.isArray(prs) || !prs.length) return '(no recent closed PRs found)';
    return prs
      .slice(0, 20)
      .map(pr => `- #${pr.number} ${pr.merged_at ? '[merged]' : '[closed]'} ${pr.title}`)
      .join('\n');
  } catch (e) {
    return `(unavailable: ${String(e.message || e).slice(0, 150)})`;
  }
}

/* ------------------------------------------------ dependency staleness */
async function gatherDependencyStaleness() {
  const pkgPath = path.join(ROOT, 'package.json');
  if (!fs.existsSync(pkgPath)) return '(no package.json found)';
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (e) {
    return `(unavailable: package.json failed to parse: ${String(e.message || e).slice(0, 120)})`;
  }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const names = Object.keys(deps);
  if (!names.length) return '(no dependencies declared)';

  const lines = [];
  for (const name of names) {
    const current = String(deps[name]).replace(/^[\^~]/, '');
    try {
      const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
        headers: { 'User-Agent': 'roamwise-roadmap-agent' },
      });
      if (!r.ok) { lines.push(`- ${name}: current ${current}, latest (lookup failed: ${r.status})`); continue; }
      const d = await r.json();
      const latest = d && d.version ? d.version : '(unknown)';
      const stale = latest !== '(unknown)' && latest !== current ? ' <- may be outdated' : '';
      lines.push(`- ${name}: current ${current}, latest ${latest}${stale}`);
    } catch (e) {
      lines.push(`- ${name}: current ${current}, latest (lookup failed: ${String(e.message || e).slice(0, 60)})`);
    }
  }
  return lines.join('\n');
}

/* ------------------------------------------------------------- app.js size */
function gatherAppJsSize() {
  const p = path.join(ROOT, 'app.js');
  if (!fs.existsSync(p)) return '(app.js not found)';
  const text = fs.readFileSync(p, 'utf8');
  const lines = text.split('\n').length;
  return `app.js is currently ${lines} lines (modularization-in-progress source file; see ARCHITECTURE.md and CLAUDE.md for the ongoing js/ migration).`;
}

/* --------------------------------------------------------------- main --- */
async function main() {
  const sections = [];

  sections.push('# RoamWise Roadmap Agent — gathered context');
  sections.push(`*Generated ${new Date().toISOString()}*`);

  sections.push('\n## Recent commit history (last 40, no merges)\n```\n' + gatherGitHistory() + '\n```');

  sections.push('\n## Recent closed/merged pull requests (GitHub API, up to 20)\n' + await gatherRecentPRs());

  sections.push('\n## Dependency staleness (package.json vs npm registry latest)\n' + await gatherDependencyStaleness());

  sections.push('\n## app.js modularization status\n' + gatherAppJsSize());

  sections.push('\n## Architecture doc (ARCHITECTURE.md excerpt)\n```markdown\n' + readDocExcerpt('ARCHITECTURE.md') + '\n```');

  sections.push('\n## Working contract (CLAUDE.md excerpt)\n```markdown\n' + readDocExcerpt('CLAUDE.md') + '\n```');

  sections.push('\n## Business/finance grounding docs (excerpts)\n');
  for (const doc of ['BUSINESS-FINANCE-SETUP.md', 'PRICING-REFERRAL-MATH.md', 'CREATOR-OUTREACH.md', 'REVENUE-INTEGRATIONS.md']) {
    sections.push(`\n### ${doc}\n\`\`\`markdown\n${readDocExcerpt(doc, 4000)}\n\`\`\``);
  }

  const out = sections.join('\n');
  fs.writeFileSync(path.join(process.cwd(), 'context.md'), out);
  console.log(`context.md written (${out.length} chars)`);
}

if (require.main === module) {
  main().catch(e => {
    console.error('gather-context.js failed:', e);
    process.exit(1);
  });
}

module.exports = {
  readDocExcerpt,
  gatherGitHistory,
  gatherRecentPRs,
  gatherDependencyStaleness,
  gatherAppJsSize,
};
