const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const admin = fs.readFileSync('admin/index.html','utf8');
const investor = fs.readFileSync('admin/investors-data.js','utf8');
const trek = fs.readFileSync('admin/trek-outreach.js','utf8');

test('admin exposes a dedicated trekking-operator workspace',()=>{
  assert.ok(admin.includes('data-page="trek-sales"'));
  assert.ok(admin.includes('id="trek-sales"'));
  assert.ok(admin.includes('src="trek-outreach.js"'));
  assert.match(admin,/never satellite coverage, guaranteed rescue delivery or uninterrupted calls/i);
});

test('trek operator contacts are source-linked and composer remains human reviewed',()=>{
  for(const company of ['Indiahikes','Trek The Himalayas','Bikat Adventures','Himalayan Dream Treks','Trekmunk']) assert.ok(trek.includes(company));
  assert.ok(trek.includes('Nothing is auto-sent'));
  assert.ok(trek.includes('will not guess an address'));
  assert.ok(trek.includes('emailVerified'));
  assert.ok(trek.includes('sourceCheckedAt'));
  assert.ok(trek.includes('opened-gmail'));
});

test('investor outreach offers official routes without inventing addresses',()=>{
  assert.ok(investor.includes('No verified public email in this source'));
  assert.ok(investor.includes('RoamWise will not guess email patterns'));
  assert.ok(investor.includes('anand@indiaquotient.in'));
  assert.ok(investor.includes('https://www.antler.co/apply'));
  assert.ok(investor.includes('https://forms.gle/wpqgz2fkYJ6LRSUu7'));
});

test('trek sales reuses the admin-only CRM boundary',()=>{
  assert.ok(trek.includes("collection('crm')"));
  assert.ok(trek.includes("seg:'trek-company'"));
  assert.doesNotMatch(trek,/allow\s+(read|write)/);
});
