const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const { rwAtlasIndex, rwAtlasNorm } = require('../js/data/atlas-world.js');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/atlas/world-countries.json'), 'utf8'));
const idx = rwAtlasIndex(data);
const look = (n) => idx[rwAtlasNorm(n)] || null;

test('dataset is complete and well-formed', () => {
  assert.ok(data.countries.length >= 240);
  const isos = new Set();
  for (const c of data.countries) {
    assert.match(c.iso, /^[A-Z]{2}$/); assert.ok(!isos.has(c.iso), 'dup ' + c.iso); isos.add(c.iso);
    assert.ok(c.name && c.continent);
  }
  assert.ok(/geonames/i.test(data.source), 'attribution present');
});
test('aliases resolve to the right country', () => {
  const cases = { 'USA':'US', 'U.K.':'GB', 'England':'GB', 'UAE':'AE', 'Burma':'MM', 'Holland':'NL', 'Türkiye':'TR', 'Czechia':'CZ',
    'Ivory Coast':'CI', 'Siam':'TH', 'Ceylon':'LK', 'Bharat':'IN', 'Swaziland':'SZ', 'Cabo Verde':'CV', 'Vatican':'VA', 'India':'IN', 'IN':'IN' };
  for (const [k, v] of Object.entries(cases)) assert.strictEqual(look(k) && look(k).iso, v, k);
});
test('every country the planner already knows resolves', () => {
  const src = fs.readFileSync(path.join(root, 'js/data/country-info.js'), 'utf8');
  const keys = [...src.matchAll(/^\s*'([^']+)':\{iso:'([A-Z]{2})'/gm)];
  assert.ok(keys.length > 90);
  const miss = keys.filter(([, k, iso]) => !(look(k) || look(iso)));
  assert.deepStrictEqual(miss.map(m => m[1]), []);
  const wrong = keys.filter(([, k, iso]) => look(iso) && look(iso).iso !== iso);
  assert.deepStrictEqual(wrong.map(m => m[1]), []);
});
test('India record and no ambiguous alias collisions', () => {
  const india = look('india'); assert.strictEqual(india.capital, 'New Delhi'); assert.strictEqual(india.currency, 'INR');
  const seen = {};
  for (const c of data.countries) for (const a of [c.name, ...c.aliases]) {
    const n = rwAtlasNorm(a); if (seen[n] && seen[n] !== c.iso) assert.fail('alias collision: ' + a);
    seen[n] = c.iso;
  }
});
