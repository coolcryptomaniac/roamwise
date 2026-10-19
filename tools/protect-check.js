// Cheap pre-merge guard: licence present, no source maps or secret-looking
// strings shipped, canary still in place. Runs in `npm run check`; no runtime cost.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const skip = new Set(['node_modules', '.git', 'vendor', 'tests', 'tools', 'docs', 'worker']);
const problems = [];
if (!fs.existsSync(path.join(root, 'LICENSE'))) problems.push('LICENSE missing');
if (!/rw-canary:7f3a/.test(fs.readFileSync(path.join(root, 'index.html'), 'utf8'))) problems.push('canary missing in index.html');
const secret = /(gsk_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{32,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|cfat_[A-Za-z0-9]{20,})/;
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (skip.has(f.name) || f.name.startsWith('.')) continue;
    const p = path.join(d, f.name), rel = path.relative(root, p);
    if (f.isDirectory()) { walk(p); continue; }
    if (/\.map$/.test(f.name)) { problems.push('source map shipped: ' + rel); continue; }
    if (!/\.(js|mjs|cjs|html|json|css|txt|md)$/.test(f.name) || fs.statSync(p).size > 2e6) continue;
    const m = fs.readFileSync(p, 'utf8').match(secret);
    if (m) problems.push('secret-like string in ' + rel + ': ' + m[0].slice(0, 8) + '…');
  }
})(root);
if (problems.length) { console.error('protect-check FAILED:\n - ' + problems.join('\n - ')); process.exit(1); }
console.log('protect-check OK');
