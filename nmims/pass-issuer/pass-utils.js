/* NMIMS pass tools: no secrets, Firebase credentials or writes in this module. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RWNMIMSPass = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const CAMPAIGN = 'nmims2026';
  function email(value) {
    const result = String(value || '').trim().toLowerCase();
    if (result.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error('Enter a valid recipient email.');
    return result;
  }
  function name(value) {
    const result = String(value || '').trim().replace(/\s+/g, ' ');
    if (result.length < 2 || result.length > 80) throw new Error('Enter the student’s name (2–80 characters).');
    return result;
  }
  function slug(value) {
    return name(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) || 'TRAVELR';
  }
  function token(bytes) {
    if (!bytes || bytes.length !== 8) throw new Error('Eight cryptographically random bytes are required.');
    let value = 0, bits = 0, out = '';
    for (const byte of bytes) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        out += ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
        value &= (1 << bits) - 1;
      }
    }
    if (bits) out += ALPHABET[(value << (5 - bits)) & 31];
    return out;
  }
  function code(studentName, serial, bytes) {
    if (!Number.isSafeInteger(serial) || serial < 1 || serial > 9999) throw new Error('Serial number is out of range.');
    const result = 'NMIMS-' + slug(studentName) + '-' + String(serial).padStart(4, '0') + '-' + token(bytes);
    if (result.length > 32) throw new Error('Code exceeds the app’s 32-character limit.');
    return result;
  }
  function allocation(pool, role) {
    if (!pool || pool.issuanceEnabled !== true) throw new Error('NMIMS issuance is disabled until the partnership is approved.');
    if (!['student', 'organiser'].includes(role)) throw new Error('Select student or organiser.');
    const cap = pool.cap;
    const claimed = pool.claimed || 0;
    if (!Number.isSafeInteger(cap) || cap < 1 || cap > 500 || !Number.isSafeInteger(claimed) || claimed < 0 || claimed >= cap) {
      throw new Error('The NMIMS pass pool is unconfigured or has reached its limit.');
    }
    const field = role === 'organiser' ? 'organiserClaimed' : 'studentClaimed';
    const roleCap = pool[role === 'organiser' ? 'organiserCap' : 'studentCap'];
    const used = pool[field] || 0;
    if (!Number.isSafeInteger(roleCap) || roleCap < 1 || !Number.isSafeInteger(used) || used < 0 || used >= roleCap) {
      throw new Error('This NMIMS allocation is unconfigured or full.');
    }
    const serial = Math.max(claimed + 1, pool.nextSerial || 1);
    if (!Number.isSafeInteger(serial) || serial > 9999) throw new Error('Invalid next serial.');
    return { serial, claimed: claimed + 1, field, roleUsed: used + 1 };
  }
  async function emailIndex(address, subtle) {
    const input = new TextEncoder().encode(CAMPAIGN + ':' + email(address));
    const digest = await subtle.digest('SHA-256', input);
    return CAMPAIGN + '_' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }
  /* ---- Bulk coupons (event-day, not tied to an email) ----
     NMIMS-STU-0123-XXXXXXXXXXXXX / NMIMS-ORG-0007-XXXXXXXXXXXXX (28 chars, <= the app's 32 cap).
     The last 13 characters carry 64 random bits. The serial is for audit only and authenticates nothing. */
  const TAGS = { student: 'STU', organiser: 'ORG' };
  const SPLIT = { organiser: 50, student: 450 };
  function coupon(role, serial, bytes) {
    if (!TAGS[role]) throw new Error('Select student or organiser.');
    if (!Number.isSafeInteger(serial) || serial < 1 || serial > 9999) throw new Error('Serial number is out of range.');
    const out = 'NMIMS-' + TAGS[role] + '-' + String(serial).padStart(4, '0') + '-' + token(bytes);
    if (out.length > 32) throw new Error('Code exceeds the app\u2019s 32-character limit.');
    return out;
  }
  /** randomBytes(n) must be a CSPRNG (crypto.getRandomValues). Returns [{code, role, serial}] with unique codes. */
  function couponBatch(randomBytes, split) {
    const plan = split || SPLIT;
    if (plan.organiser + plan.student > 500) throw new Error('A batch may not exceed the 500-pass ceiling.');
    const seen = new Set(), list = [];
    for (const role of ['organiser', 'student']) {
      for (let serial = 1; serial <= plan[role]; serial++) {
        let code;
        for (let tries = 0; tries < 5; tries++) {
          code = coupon(role, serial, randomBytes(8));
          if (!seen.has(code)) break;
          code = '';
        }
        if (!code) throw new Error('Random code collision; run the generator again.');
        seen.add(code);
        list.push({ code, role, serial });
      }
    }
    return list;
  }
  /** SHA-256 over the sorted list of codes: publish it in advance and reveal the list later to prove the set never changed. */
  async function commitment(codes, subtle) {
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(codes.slice().sort().join('\n')));
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }
  function toCsv(list, expiresIso) {
    return 'serial,type,code,redeem_link,valid_until\n' + list.map(c =>
      [c.serial, c.role, c.code, 'https://www.roamwise.co.in/?redeem=' + c.code, expiresIso].join(',')).join('\n') + '\n';
  }
  return { CAMPAIGN, SPLIT, email, name, slug, token, code, allocation, emailIndex, coupon, couponBatch, commitment, toCsv };
});