const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const admin = fs.readFileSync('admin/index.html','utf8');
const investor = fs.readFileSync('admin/investors-data.js','utf8');
const trek = fs.readFileSync('admin/trek-outreach.js','utf8');

test('admin exposes a dedicated trekking-operator workspace',()=>{
  assert.match(admin,/data-page="trek-sales"/);
  assert.match(admin,/id="trek-sales"/);
  assert.match(admin,/src="trek-outreach\\.js"/);
  assert.match(admin,/never satellite coverage, guaranteed rescue delivery or uninterrupted calls/i);
});

test('trek operator contacts are source-linked and composer remains human reviewed',()=>{
  for(const company of ['Indiahikes','Trek The Himalayas','Bikat Adventures','Himalayan Dream Treks','Trekmunk']) assert.ok(trek.includes(company));
  assert.match(trek,/Nothing is auto-sent/);
  assert.match(trek,/will not guess an address/);
  assert.match(trek,/emailVerified/);
  assert.match(trek,/sourceCheckedAt/);
  assert.match(trek,/opened-gmail/);
});

test('investor outreach offers official routes without inventing addresses',()=>{
  assert.match(investor,/No verified public email in this source/);
  assert.match(investor,/RoamWise will not guess email patterns/);
  assert.match(investor,/anand@indiaquotient\\.in/);
  assert.match(investor,/antler\\.co\\/apply/);
  assert.match(investor,/forms\\.gle\\/wpqgz2fkYJ6LRSUu7/);
});

test('trek sales reuses the admin-only CRM boundary',()=>{
  assert.match(trek,/collection\\('crm'\\)/);
  assert.match(trek,/seg:'trek-company'/);
  assert.doesNotMatch(trek,/allow\\s+(read|write)/);
});
