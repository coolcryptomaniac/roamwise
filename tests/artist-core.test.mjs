import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { validateArtist, toRecord, slugify } from '../creators/artist-core.mjs';
const ok = { name: 'Asha Rawat', studio: 'Asha Arts', state: 'Uttarakhand', themes: ['Aipan'], instagram: 'https://www.instagram.com/asha', consent: true, artworks: [{ title: 'Sun', price: '₹4,000' }] };
test('valid artist passes and maps to a record', () => { assert.deepEqual(validateArtist(ok, []), []); const r = toRecord(ok); assert.equal(r.id, 'asha-rawat'); assert.equal(r.plan, 'founding'); assert.equal(r.role, 'RoamWise Founding Artist'); assert.equal(toRecord(ok, 'free').plan, 'free'); assert.equal(r.page, '/creators/asha-rawat/'); });
test('consent, https and duplicates are enforced', () => {
  assert.ok(validateArtist({ ...ok, consent: false }).some(e => /consent/.test(e)));
  assert.ok(validateArtist({ ...ok, instagram: 'http://x.com/a' }).some(e => /instagram/.test(e)));
  assert.ok(validateArtist({ ...ok, artworks: [{ title: 'x', image: 'javascript:alert(1)' }] }).some(e => /image/.test(e)));
  assert.ok(validateArtist(ok, ['asha-rawat']).some(e => /exists/.test(e)));
});
test('slugify handles accents and symbols', () => assert.equal(slugify('  Jägriti  Creates! '), 'jagriti-creates'));
test('data: founding now, paid tiers planned for after 100, spotlight points at a real painting', () => {
  const d = JSON.parse(fs.readFileSync('creators/artists-data.json', 'utf8')), P = d.plans;
  assert.equal(P.founding.price, 0); assert.equal(P.thankyou.price, 0); assert.equal(d.launchOffer.limit, 100);
  assert.ok(P.autopilot.price >= 100 && P.autopilot.price <= 500 && P.spotlight.price <= 500 && P.premium.price >= 1000 && P.premium.price <= 2000);
  assert.ok(d.launchOffer.invited.every(id => d.artists.some(a => a.id === id)));
  const a = d.artists.find(x => x.id === d.spotlight.artistId); assert.ok(a.artworks.some(w => w.id === d.spotlight.artworkId));
  d.artists.forEach(x => { assert.ok(x.plan && x.page, x.id); assert.notEqual(x.plan, 'free', x.id); });
});
