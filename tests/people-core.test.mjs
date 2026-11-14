import test from 'node:test';
import assert from 'node:assert/strict';
import { igKey, phoneKey, fromCreatorRow, fromPartner, fromCrmLead, fromArtist, mergePeople, messageTier, peopleKpis, toCsv } from '../admin/people/people-core.mjs';

const row = (o) => ({ id: o.id, name: o.name, email: o.email, phone: o.phone || '', handle: o.handle || '', location: { town: o.town || '' }, niches: ['travel'], stage: 'new', flags: [], metrics: {}, best: o.best || null });

test('keys normalise Instagram, phone and junk', () => {
  assert.equal(igKey('https://www.instagram.com/arshiyakhanstyles?stkn=x'), 'arshiyakhanstyles');
  assert.equal(igKey('Instagram @arshiyakhanstyles'), 'arshiyakhanstyles');
  assert.equal(igKey('https://www.instagram.com/reels/abc'), '');
  assert.equal(phoneKey('+91 98765-43210'), '9876543210');
  assert.equal(phoneKey('123'), '');
});

test('duplicate applications become one person (email, handle or phone)', () => {
  const people = mergePeople([
    fromCreatorRow(row({ id: 'a', name: 'Arshiya Patni', email: 'arshiyakhanstyles@gmail.com', handle: 'https://www.instagram.com/arshiyakhanstyles?x=1', town: 'himachal' })),
    fromCreatorRow(row({ id: 'b', name: 'Arshiya Khan', email: 'ARSHIYAKHANSTYLES@gmail.com' })),
    fromCreatorRow(row({ id: 'c', name: 'Arshiya patni', email: 'other@x.com', handle: 'Instagram @arshiyakhanstyles' })),
    fromCreatorRow(row({ id: 'd', name: 'Shivani', email: 's@x.com', phone: '+91 99999 11111' })),
    fromCreatorRow(row({ id: 'e', name: 'Shivani Sharma', email: 's2@x.com', phone: '9999911111' })),
  ]);
  assert.equal(people.length, 2);
  const a = people.find((p) => p.instagram === 'arshiyakhanstyles');
  assert.equal(a.records, 3);
  assert.equal(a.town, 'Himachal');
  assert.match(a.flags[0], /3 records merged/);
  assert.ok(!a.flags.some((f) => /same email/.test(f)));
});

test('one person can be both artist and creator', () => {
  const p = mergePeople([fromArtist({ id: 'n', name: 'Natasha', instagram: 'https://www.instagram.com/bhavitavya_kala/', themes: ['art'] }),
    fromCreatorRow(row({ id: 'z', name: 'Natasha G', email: 'n@x.com', handle: 'https://instagram.com/bhavitavya_kala' }))]);
  assert.equal(p.length, 1);
  assert.deepEqual(p[0].types.sort(), ['artist', 'creator']);
  assert.equal(p[0].stage, 'active');
});

test('auto-inform policy: perfect, routine, review, skip', () => {
  const ok = { consent: true, email: 'a@b.com', verified: true, stage: 'new' };
  assert.equal(messageTier(ok, { kind: 'match', score: 90, verdict: 'send' }), 'perfect');
  assert.equal(messageTier(ok, { kind: 'match', score: 60, verdict: 'negotiate' }), 'routine');
  assert.equal(messageTier(ok, { kind: 'news' }), 'routine');
  assert.equal(messageTier(ok, { kind: 'payout', amount: 5000 }), 'review');
  assert.equal(messageTier({ ...ok, verified: false }, { kind: 'match', needsIdentity: true }), 'review');
  assert.equal(messageTier({ ...ok, consent: false }, { kind: 'match', score: 99, verdict: 'send' }), 'skip');
  assert.equal(messageTier({ consent: true }, { kind: 'news' }), 'skip');
  assert.equal(messageTier({ ...ok, stage: 'declined' }, { kind: 'news' }), 'skip');
});

test('KPIs count merges, leads and data worth', () => {
  const list = [fromPartner({ id: 'p1', name: 'Big Bro Hotel', email: 'bb@x.com', city: 'nainital', status: 'live' }),
    fromCrmLead({ id: 'l1', seg: 'property', name: 'Lead Inn', city: 'almora' }),
    fromCrmLead({ id: 'x', seg: 'investor', name: 'Fund' }),
    fromCreatorRow(row({ id: 'c1', name: 'C', email: 'c@x.com' }))];
  const people = mergePeople(list);
  const k = peopleKpis(people, 3);
  assert.equal(k.people, 3);
  assert.equal(k.types.property, 1);
  assert.equal(k.types.lead, 1);
  assert.equal(k.reachable, 2);
  assert.equal(k.dataWorth, 2 * 150 + 1 * 1500 + 1 * 5000);
  assert.match(k.worthNote, /Not a valuation/);
});

test('CSV escapes quotes and blocks formula injection', () => {
  const csv = toCsv(mergePeople([fromCreatorRow(row({ id: 'q', name: '=HYPERLINK("x")', email: 'q@x.com' }))]));
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
});
