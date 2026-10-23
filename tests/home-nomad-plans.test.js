'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..');
const { plans } = require('../js/ui/nomad-plans.js');
const w = {}; vm.createContext({ window: w }); vm.runInContext(fs.readFileSync(path.join(root, 'partners-data.js'), 'utf8'), vm.createContext({ window: w }));
const bro = (w.RW_PARTNER_SEED || []).find(p => p.id === 'p_big_bro_hotel');

test('Big Bro plans match the agreed rates: 15 nights 30,000; 1 month 50,000; 3 months 1,50,000', () => {
  const by = Object.fromEntries(plans(bro.nomad).map(p => [p.id, p]));
  assert.equal(by['15n'].total, 30000); assert.equal(by['1m'].total, 50000); assert.equal(by['3m'].total, 150000);
  assert.equal(by['2m'].total, 100000); assert.equal(by['2m'].derived, true); assert.equal(by['3m'].derived, false);
  assert.equal(by['15n'].perNight, 2000); assert.equal(by['1m'].perNight, 1667);
});
test('long stays are never dearer per night than shorter ones', () => {
  const ps = plans(bro.nomad); for (let i = 1; i < ps.length; i++) assert.ok(ps[i].perNight <= ps[0].perNight, ps[i].id);
});
test('no rate means no plan; bad input is ignored; minimum nights respected', () => {
  assert.deepEqual(plans({}), []); assert.deepEqual(plans(null), []);
  assert.deepEqual(plans({ rate30: 'x', rate15: -5 }), []);
  assert.deepEqual(plans({ rate15: 20000, rate30: 30000, minNights: 20 }).map(p => p.id), ['1m', '2m', '3m']);
});
test('home promo: Milan Heights is at Milan Chowk and non-exclusive partners are not starred', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'data/home-promo.json'), 'utf8'));
  const milan = cfg.stays.find(s => s.partnerId === 'p_milan_heights'); assert.equal(milan.area, 'Milan Chowk, Almora');
  const seed = Object.fromEntries(w.RW_PARTNER_SEED.map(p => [p.id, p]));
  assert.match(seed.p_milan_heights.area, /Milan Chowk/);
  const non = cfg.stays.filter(s => !s.exclusive); assert.ok(non.length >= 3);
  cfg.stays.forEach(s => assert.ok(seed[s.partnerId], s.partnerId));
  assert.ok(cfg.nomad && seed[cfg.nomad.partnerId].nomad.enabled);
  assert.ok(!/Dharanaula/.test(fs.readFileSync(path.join(root, 'data/home-promo.json'), 'utf8')));
});
