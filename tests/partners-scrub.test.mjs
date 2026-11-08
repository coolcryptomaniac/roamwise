import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrubList } from '../tools/partners-scrub-contacts.mjs';

test('public partner list keeps the listing but loses every host contact', () => {
  const { list, removed } = scrubList([
    { id: 'a', name: 'A', bookingMode: 'whatsapp', bookingWhatsapp: '919876543210', badges: ['local'] },
    { id: 'b', name: 'B', bookingMode: 'phone', bookingPhone: '919876543211' },
    { id: 'c', name: 'C', bookingMode: 'ota', bookingUrl: 'https://ota.example/x', bookingOtaName: 'X' },
    { id: 'd', name: 'D', bookingMode: 'direct' },
    { id: 'e', name: 'E' },
  ]);
  assert.equal(removed, 4);
  assert.doesNotMatch(JSON.stringify(list), /98765|ota\.example/);
  assert.deepEqual(list.map((e) => e.bookingMode || null), ['roamwise', 'roamwise', 'roamwise', 'direct', null]);
  assert.deepEqual(list[0].badges, ['local']);
  assert.equal(scrubList(list).removed, 0);
});
