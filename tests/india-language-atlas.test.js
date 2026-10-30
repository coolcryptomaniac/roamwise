const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const ctx={window:{}};ctx.window.window=ctx.window;vm.createContext(ctx);
for(const name of ['js/data/india-language-lexicon.js','js/data/atlas-resolver.js']){
  vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx);
}
const lang=ctx.window.RW_INDIA_LANG,atlas=ctx.window.RW_ATLAS;
test('reviewed names normalize Hindi geography queries without guessing unknown villages',()=>{
 for(const [a,b] of [['दिल्ली','Delhi'],['नैनीताल','Nainital'],['चकराता','Chakrata'],['कनाताल','Kanatal'],['मुन्नार','Munnar'],['शिलांग','Shillong'],['अल्मोड़ा','Almora'],['रामपुर, उत्तर प्रदेश','रामपुर, उत्तर प्रदेश']]){
  assert.equal(lang.canonical(a),b,a);
 }
});
test('Hindi names resolve through atlas with context and no network',()=>{
 atlas.use({countries:{countries:[{iso:'IN',name:'India',pop:1}]},admin:{states:[{name:'Uttarakhand',lat:30,lng:79,districts:[]}]},places:{places:[['Nainital',29.38,79.45,'a',0,0,12000,[]],['Chakrata',30.7,77.86,'a',0,0,5000,[]]]},cities:{cities:[]},namesakes:{names:{}}});
 const n=atlas.find('नैनीताल');
 assert.equal(n.best.name,'Nainital');
 assert.equal(atlas.find('चकराता').best.name,'Chakrata');
 assert.equal(atlas.find('रामपुर').best,null);
});
