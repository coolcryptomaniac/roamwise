/* Regression checks for India-first destination name aliases. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/data/place-overrides.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const cases = {
  'Chakrata': 'Chakrata', 'चकराता': 'Chakrata', 'Chakrataa': 'Chakrata',
  'Kanatal': 'Kanatal', 'कनाताल': 'Kanatal', 'Kanataal': 'Kanatal',
  'Mukteshvar': 'Mukteshwar', 'मुक्तेश्वर': 'Mukteshwar',
  'Dhanolti': 'Dhanaulti', 'बिनसर': 'Binsar', 'कौसानी': 'Kausani',
  'Chopta': 'Chopta', 'हर्षिल': 'Harsil', 'Jibhi': 'Jibhi',
  'Rampur': 'Rampur', 'Unlisted Village': 'Unlisted Village'
};
for (const [input, expected] of Object.entries(cases)) {
  const canonical = context.rwPlaceCanonicalName(input);
  assert.equal(canonical.toLowerCase(), expected.toLowerCase(), input);
  const key = canonical.toLowerCase().replace(/[^a-z]/g, '');
  if (!['rampur','unlistedvillage'].includes(key)) {
    assert.ok(context.RW_PLACE_OVERRIDES[key], input + ' must resolve to curated override');
  }
}
assert.match(context.RW_PLACE_OVERRIDES.chakrata.admin, /^Dehradun\s*[,·]\s*Uttarakhand$/);
assert.match(context.RW_PLACE_OVERRIDES.kanatal.admin, /^Tehri Garhwal\s*[,·]\s*Uttarakhand$/);
console.log('India place recognition regression checks passed (' + Object.keys(cases).length + ' cases)');
