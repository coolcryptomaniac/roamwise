const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const about = fs.readFileSync(path.join(root, 'about.html'), 'utf8');

test('founder biography exposes the verified public records', () => {
  const required = [
    'id="founder"',
    'Mohit Pandey',
    'Zindabaad',
    'C.I.D.',
    'D3iprMRGib4',
    'AI Ki Pathshala',
    'Volts &amp; Vengeance',
    'Yuga: The Silicon Age',
    'youtube.com/@mohucool',
    'linkedin.com/in/rockermohit',
    'open.spotify.com/artist/2qbS0OT9WF0Wpf2WnggrKS'
  ];

  for (const value of required) {
    assert.ok(about.includes(value), `missing founder record: ${value}`);
  }
});

test('founder biography distinguishes records from editorial coverage', () => {
  assert.match(about, /not represented as independent editorial coverage/i);
});

test('public founder page uses RoamWise-only branding', () => {
  const retiredBrand = ['gyan', 'verse'].join('');
  assert.ok(!about.toLowerCase().includes(retiredBrand));
});
