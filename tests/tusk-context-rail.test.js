const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/copilot/rich-reply.js','utf8');
const ctx={window:{}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);
test('travel context recognition is conservative and Hindi aware',()=>{
 const cases=[['Road blocked near Chakrata','safety'],['कनाताल रास्ता बंद है','safety'],
 ['Food in Almora','food'],['कौसानी में खाना','food'],['Mausam in Kanatal','weather'],
 ['best time to go Jibhi','season'],['book homestay in Almora','stay'],
 ['Hello friend','general']];
 for(const [q,expected] of cases) assert.equal(ctx.rwTuskRailContext(q),expected,q);
});
test('rail provides relevant actions but does not assert live status',()=>{
 const h=ctx.rwTuskRail('Chakrata','Is the road blocked near Chakrata?');
 assert.match(h,/Road advisories/);
 assert.doesNotMatch(h,/road is open|road is closed/i);
 assert.match(h,/Read aloud/);
 assert.match(h,/Pause \/ Resume/);
 const food=ctx.rwTuskRail('Almora','food in Almora');
 assert.match(food,/Local food/);
 assert.doesNotMatch(ctx.rwTuskRail('Almora','hi there'),/Road advisories|Local food/);
});
