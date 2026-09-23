'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const rules = fs.readFileSync('firestore.rules','utf8');
const audit = fs.readFileSync('partner/audit/index.html','utf8');
const market = fs.readFileSync('partner/marketplace.js','utf8');

test('curation projection is public-read but admin-write only', () => {
  const start = rules.indexOf('match /partnerPublicProfiles/{uid}');
  assert.ok(start >= 0);
  const block = rules.slice(start, start + 300);
  assert.match(block, /allow read: if true/);
  assert.match(block, /allow create, update, delete: if isAdmin\(\)/);
  assert.doesNotMatch(block, /isPartner\(uid\).*write|allow (?:create|update).*isPartner/s);
});

test('trust audit owns the curation labels and signature has stricter gates', () => {
  for (const id of ['cExperience','cHosted','cLocal','cPremium','cSignature','cLive','cQuiet']) {
    assert.match(audit, new RegExp('id="'+id+'"'));
  }
  assert.match(audit, /collection\('partnerPublicProfiles'\)\.doc\(uid\)/);
  assert.match(audit, /curationVersion:'RW-PROPERTY-CURATION-2026-09-23-V1'/);
  assert.match(audit, /Signature requires both Premium and Experience Partner/);
  assert.match(audit, /experienceSummary\.length<12/);
});

test('marketplace reads only allowlisted admin curation labels', () => {
  assert.match(market, /CURATION_LABELS=\{experience:/);
  assert.match(market, /collection\('partnerPublicProfiles'\)\.doc\(id\)/);
  assert.match(market, /Object\.prototype\.hasOwnProperty\.call\(CURATION_LABELS,x\)/);
  assert.match(market, /RoamWise Signature/);
  assert.match(market, /rw-market-experience/);
});
