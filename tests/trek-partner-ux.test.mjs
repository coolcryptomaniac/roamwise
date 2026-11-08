import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../treks/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../treks/app.js',import.meta.url),'utf8');

test('invited operators can choose a different Google account',()=>{
 assert.match(html,/id="switchAccountBtn"/);
 assert.match(app,/prompt:'select_account'/);
 assert.match(app,/Hike & Seek must be submitted by Gaurav, Aanchal or another authorised representative/);
 assert.match(app,/email\.value=u\.email\|\|''/);
 assert.match(app,/else\{\$\('joinForm'\)\.elements\.email\.value=''/);
});
test('repeat batch never inherits the original ID or departure date',()=>{
 assert.match(app,/function clonePackage\(id\)/);
 assert.match(app,/e\.name!=='id'&&e\.name!=='start'/);
 assert.match(app,/f\.elements\.id\.value=''/);
 assert.match(app,/f\.elements\.start\.value=''/);
 assert.match(app,/Nothing is published until reviewed/);
});
