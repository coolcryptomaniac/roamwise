import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { validateArtist, toRecord, slugify } from '../creators/artist-core.mjs';
const ok = { name: 'Asha Rawat', studio: 'Asha Arts', state: 'Uttarakhand', themes: ['Aipan'], instagram: 'https://www.instagram.com/asha', consent: true, artworks: [{ title: 'Sun', price: '₹4,000' }] };
test('valid artist passes and maps to a record', () => { assert.deepEqual(validateArtist(ok, []), []); const r = toRecord(ok); assert.equal(r.id, 'asha-rawat'); assert.equal(r.plan, 'free'); assert.equal(toRecord(ok, 'studio').plan, 'studio'); assert.equal(r.page, '/creators/artist.html?a=asha-rawat'); });
test('consent, https and duplicates are enforced', () => {
  assert.ok(validateArtist({ ...ok, consent: false }).some(e => /consent/.test(e)));
  assert.ok(validateArtist({ ...ok, instagram: 'http://x.com/a' }).some(e => /instagram/.test(e)));
  assert.ok(validateArtist({ ...ok, artworks: [{ title: 'x', image: 'javascript:alert(1)' }] }).some(e => /image/.test(e)));
  assert.ok(validateArtist(ok, ['asha-rawat']).some(e => /exists/.test(e)));
});
test('slugify handles accents and symbols', () => assert.equal(slugify('  Jägriti  Creates! '), 'jagriti-creates'));
test('data has plans, spotlight points at a real painting, every artist has a plan', () => {
  const d = JSON.parse(fs.readFileSync('creators/artists-data.json', 'utf8'));
  assert.ok(d.plans.free.maxPaintings > 0 && d.plans.studio.price >= 100 && d.plans.spotlight.price <= 500);
  assert.ok(d.plans.concierge.price <= 2000 && d.plans.premier.price <= 2000 && d.plans.premier.price >= 1000);
  assert.ok(d.launchOffer.limit >= 10 && d.launchOffer.invited.every(id => d.artists.some(a => a.id === id)));
  const a = d.artists.find(x => x.id === d.spotlight.artistId); assert.ok(a.artworks.some(w => w.id === d.spotlight.artworkId));
  d.artists.forEach(x => assert.ok(x.plan && x.page, x.id));
});
