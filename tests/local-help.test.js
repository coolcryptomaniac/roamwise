const test = require('node:test');
const assert = require('node:assert');
const m = require('../local-help-data.js');

test('every town appears once and belongs to a district', () => {
  const towns = m.rwLocalTowns().map(t => t.town);
  assert.strictEqual(new Set(towns).size, towns.length);
  assert.ok(towns.includes('Almora') && towns.includes('Kausani'));
  assert.strictEqual(m.RW_LOCAL_DISTRICTS.length, 6);
});

test('gateways are real towns in the list', () => {
  const towns = m.rwLocalTowns().map(t => t.town);
  m.RW_LOCAL_GATEWAYS.forEach(g => assert.ok(towns.includes(g), g));
});

test('providers without consent are never returned', () => {
  m.RW_LOCAL_PROVIDERS.push({ id: 'a', cat: 'taxi', town: 'Almora', name: 'No consent', phone: '9876543210' });
  m.RW_LOCAL_PROVIDERS.push({ id: 'b', cat: 'taxi', town: 'Almora', name: 'Consented', phone: '9876543210', consentAt: '2026-10-09', verified: 'called' });
  const r = m.rwLocalFind('taxi', 'Almora');
  assert.deepStrictEqual(r.map(p => p.id), ['b']);
  assert.strictEqual(m.rwLocalCount('Almora'), 1);
  assert.strictEqual(m.rwLocalFind('guide', 'Almora').length, 0);
  assert.strictEqual(m.rwLocalFind('all', 'Kausani').length, 0);
  m.RW_LOCAL_PROVIDERS.length = 0;
});

test('whatsapp and tel links are built safely or omitted', () => {
  assert.strictEqual(m.rwLocalWhatsApp({ phone: '98765 43210' }, 'Hi there'), 'https://wa.me/919876543210?text=Hi%20there');
  assert.strictEqual(m.rwLocalWhatsApp({ phone: '123' }), '');
  assert.strictEqual(m.rwLocalWhatsApp(null), '');
  assert.strictEqual(m.rwLocalTel({ phone: '+91 98765-43210' }), 'tel:+919876543210');
  assert.strictEqual(m.rwLocalTel({ phone: '12' }), '');
});

test('get-listed mailto carries the town and a consent line', () => {
  const u = m.rwLocalListMail('Kausani');
  assert.ok(u.startsWith('mailto:support@roamwise.co.in?'));
  assert.ok(decodeURIComponent(u).includes('Town: Kausani'));
  assert.ok(decodeURIComponent(u).includes('I agree to be listed'));
});
