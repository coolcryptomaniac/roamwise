const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const proposal = read('nmims/index.html');
const creators = read('nmims/creators/index.html');
const css = read('nmims/campus-theme.css');

test('proposal and creators reuse a single branded campus stylesheet', () => {
  for (const html of [proposal, creators]) {
    assert.match(html, /<meta name="theme-color" content="#07090F">/);
    assert.match(html, /href="\/nmims\/campus-theme\.css\?v=1"/);
    assert.match(html, /family=Outfit/);
  }
  for (const color of ['#07090f', '#c4302b', '#e8ba6c', '#16bf96', '#bf8cff']) {
    assert.ok(css.toLowerCase().includes(color), `expected canonical brand color ${color}`);
  }
  assert.match(css, /--rw-accent-sunset:#f46f64/);
  assert.match(css, /--rw-accent-amber:#f6b26e/);
});

test('animations are lightweight, avoid motion for accessibility, and do not touch redemption', () => {
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /animation:none!important/);
  assert.match(css, /@keyframes rwCampusEnter/);
  assert.match(css, /@keyframes rwPassFloat/);
  assert.doesNotMatch(css, /@import|url\(https?:|javascript:/i);
  assert.match(proposal, /PROPOSAL ONLY · NOT LIVE · NO PASSES ISSUED/);
  assert.doesNotMatch(proposal, /<form\b|submitClaim\s*\(/i);
  assert.match(creators, /id="creatorForm"/);
  assert.match(creators, /location\.href='mailto:'/);
  assert.match(creators, /navigator\.clipboard\.writeText/);
  assert.match(proposal, /organising team or participating students/i);
  assert.match(proposal, /A paid sale earns at most one referral bonus/i);
});
