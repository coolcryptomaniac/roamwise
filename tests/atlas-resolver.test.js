const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const j = (f) => JSON.parse(fs.readFileSync(path.join(root, 'data/atlas', f), 'utf8'));
const R = require('../js/data/atlas-resolver.js');
const ans = require('../js/copilot/atlas-answers.js');
R.use({ countries: j('world-countries.json'), admin: j('india-admin.json'), places: j('india-places.json'), namesakes: j('india-namesakes.json'), cities: j('world-cities.json') });
const top = (q) => R.find(q).best;

test('data covers India and the world at the expected scale', () => {
  const a = j('india-admin.json').states;
  assert.ok(a.length >= 36); assert.ok(a.reduce((n, s) => n + s.districts.length, 0) >= 740);
  assert.ok(j('india-places.json').places.length > 15000); assert.ok(j('world-cities.json').cities.length > 30000);
  assert.ok(/geonames/i.test(j('india-admin.json').source) && /geonames/i.test(j('world-cities.json').source));
});
test('famous Indian places resolve to the right state and district', () => {
  const cases = [['Almora', 'Uttarakhand', 'Almora'], ['Kasar Devi', 'Uttarakhand', 'Almora'], ['Jageshwar', 'Uttarakhand', 'Almora'], ['Nainital', 'Uttarakhand', 'Nainital'],
    ['Lansdowne', 'Uttarakhand', 'Garhwal'], ['Manali', 'Himachal Pradesh', 'Kulu'], ['Hampi', 'Karnataka', 'Ballari'], ['Pushkar', 'Rajasthan', 'Ajmer'], ['Taj Mahal', 'Uttar Pradesh', 'Agra'],
    ['Munnar', 'Kerala', 'Idukki'], ['Kedarnath', 'Uttarakhand', 'Rudraprayag'], ['Golden Temple', 'Punjab', 'Amritsar'], ['Cherrapunji', 'Meghalaya', 'East Khasi Hills']];
  for (const [q, st, di] of cases) { const m = top(q); assert.ok(m, q); assert.strictEqual(m.state, st, q); assert.strictEqual(m.district, di, q); assert.strictEqual(m.iso, 'IN', q); }
});
test('old names and spelling variants map to the modern place', () => {
  const cases = { Benares: 'Varanasi', Banaras: 'Varanasi', Kashi: 'Varanasi', Bombay: 'Mumbai', Madras: 'Chennai', Calcutta: 'Kolkata', Bangalore: 'Bengaluru', 'Naini Tal': 'Nainital',
    Poona: 'Pune', Trivandrum: 'Thiruvananthapuram', Cochin: 'Kochi', Mysore: 'Mysuru', Allahabad: 'Prayagraj', Gurgaon: 'Gurugram', Simla: 'Shimla', Alleppey: 'Alappuzha', Pondicherry: 'Puducherry', Ooty: 'Ooty' };
  for (const [q, want] of Object.entries(cases)) { const m = top(q); assert.ok(m, q); assert.ok(R.norm(m.name) === R.norm(want) || (m.aliases || []).includes(want) || R.norm(m.name).startsWith(R.norm(want)), q + ' -> ' + m.name); }
});
test('namesakes are flagged, not guessed', () => {
  for (const q of ['Rampur', 'Springfield', 'Hamirpur']) { const f = R.find(q); assert.ok(f.best, q); assert.strictEqual(f.ambiguous, true, q); }
  assert.ok(R.find('Rampur').namesakes.total > 500);
  const tx = R.find('Paris, Texas').best; assert.strictEqual(tx.state, 'Texas');
  assert.strictEqual(R.find('Paris, France').best.iso, 'FR');
  assert.strictEqual(R.find('Paris').best.iso, 'FR');
  assert.strictEqual(R.find('Almora').ambiguous, false);
});
test('world places, landmarks and countries resolve', () => {
  assert.strictEqual(top('Machu Picchu').iso, 'PE'); assert.strictEqual(top('Eiffel Tower').iso, 'FR'); assert.strictEqual(top('Dubai').iso, 'AE');
  assert.strictEqual(top('Tokyo').iso, 'JP'); assert.ok(top('Bali'));
  assert.strictEqual(top('USA').kind, 'country'); assert.strictEqual(top('Nepal').iso, 'NP');
  assert.strictEqual(R.find('Zzqxjv').best, null);
});
test('text extraction finds the places in a sentence', () => {
  const names = R.extract('Plan Kasar Devi and Jageshwar from Almora then Naini Tal, and maybe Paris').map((x) => x.best.name);
  for (const n of ['Kasar Devi', 'Jageshwar', 'Almora', 'Nainital']) assert.ok(names.includes(n), n + ' in ' + names);
  assert.deepStrictEqual(R.extract('what is the best time to go'), []);
});
test('distance and nearby are sane', () => {
  const d = R.distance('Almora', 'Nainital'); assert.ok(d.km > 20 && d.km < 45);
  const dd = R.distance('Delhi', 'Mumbai'); assert.ok(dd.km > 1100 && dd.km < 1250);
  const n = R.nearby(29.597, 79.659, 8, ['T']); assert.ok(n.some((x) => /Kasar Devi/.test(x.name)));
});
test('Tusk intents parse and compose answers', () => {
  assert.deepStrictEqual(ans.intent('Where is Jageshwar?'), { type: 'where', a: 'Jageshwar' });
  assert.strictEqual(ans.intent('which district is Kasar Devi in').type, 'where');
  assert.deepStrictEqual(ans.intent('how far is Nainital from Almora'), { type: 'distance', a: 'Almora', b: 'Nainital' });
  assert.deepStrictEqual(ans.intent('distance between Delhi and Jaipur'), { type: 'distance', a: 'Delhi', b: 'Jaipur' });
  assert.strictEqual(ans.intent('places near Almora').type, 'near');
  assert.strictEqual(ans.intent('plan a 5 day trip to Goa'), null);
  const w = ans.compose(ans.intent('where is Kasar Devi'), R); assert.match(w, /Almora district/); assert.match(w, /Uttarakhand/);
  const dist = ans.compose(ans.intent('how far is Nainital from Almora'), R); assert.match(dist, /km by road/);
  const nr = ans.compose(ans.intent('what is near Almora'), R); assert.match(nr, /Kasar Devi/);
  assert.match(ans.compose(ans.intent('where is Rampur'), R), /several places called Rampur/);
  assert.strictEqual(ans.compose(ans.intent('where is Qzxwv'), R), null);
});
