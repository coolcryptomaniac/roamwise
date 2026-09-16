const { test } = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const pass = require('../nmims/pass-issuer/pass-utils.js');
test('readable code fits existing redeem sanitizer and excludes email', () => {
  const id = pass.code('Anaya Sharma', 42, new Uint8Array([1, 3, 5, 7, 9, 11, 13, 15]));
  assert.match(id, /^NMIMS-ANAYASH-0042-[0-9A-HJKMNP-TV-Z]{13}$/);
  assert.ok(id.length <= 32);
  assert.ok(!id.includes('@') && !id.includes('EXAMPLE'));
  assert.notEqual(id, pass.code('Anaya Sharma', 42, new Uint8Array(8)));
});
test('invalid entropy and serial fail closed', () => {
  assert.throws(() => pass.code('Anaya', 1, []), /random bytes/);
  assert.throws(() => pass.code('Anaya', 0, new Uint8Array(8)), /Serial/);
  assert.throws(() => pass.name(''), /name/);
});
test('allocation requires explicit activation, role caps and total cap', () => {
  const pool = { issuanceEnabled: true, cap: 500, claimed: 40, nextSerial: 52, studentCap: 450, studentClaimed: 39, organiserCap: 50, organiserClaimed: 1 };
  assert.deepEqual(pass.allocation(pool, 'student'), { serial: 52, claimed: 41, field: 'studentClaimed', roleUsed: 40 });
  assert.throws(() => pass.allocation({...pool, issuanceEnabled: false}, 'student'), /disabled/);
  assert.throws(() => pass.allocation({...pool, claimed: 500}, 'student'), /limit/);
  assert.throws(() => pass.allocation({...pool, organiserClaimed: 50}, 'organiser'), /full/);
  assert.throws(() => pass.allocation({...pool, cap: 1000}, 'student'), /unconfigured/);
});
test('email dedup ID is stable, case-normalized, and contains no email', async () => {
  const a = await pass.emailIndex(' Anaya@Example.COM ', webcrypto.subtle);
  const b = await pass.emailIndex('anaya@example.com', webcrypto.subtle);
  assert.equal(a, b);
  assert.match(a, /^nmims2026_[0-9a-f]{64}$/);
  assert.ok(!a.includes('example.com'));
  await assert.rejects(pass.emailIndex('invalid', webcrypto.subtle), /valid/);
});