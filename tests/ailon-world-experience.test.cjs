'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const {makeTusk}=require('../tools/ai-ops/tusk-harness.cjs');

test('explicitly named worldwide destination never inherits prior destination',()=>{
  const t=makeTusk();
  t.state.DB=[{name:'Almora',country:'India'},{name:'Manali',country:'India'}];
  const first=t.parse('Plan a 3 day trip to Almora');
  assert.equal(first.dest,'Almora');
  const newPlace=t.parse('Plan a 4 day trip to Ushuaia');
  assert.equal(newPlace.dest,'Ushuaia');
  assert.notEqual(newPlace.dest,'Almora');
  const whatAbout=t.parse('What about Funchal');
  assert.equal(String(whatAbout.dest).toLowerCase(),'funchal');
  assert.notEqual(whatAbout.dest,'Ushuaia');
});

test('true follow-ups may inherit the same city without carrying into another trip',()=>{
  const t=makeTusk();
  t.state.DB=[{name:'Manali',country:'India'},{name:'Almora',country:'India'}];
  const trip=t.parse('Plan 3 days in Manali');
  assert.equal(trip.dest,'Manali');
  const follow=t.parse('What about food there');
  assert.equal(follow.dest,'Manali');
  const change=t.parse('Plan 5 days in Almora');
  assert.equal(change.dest,'Almora');
  assert.notEqual(change.days,3);
});

test('world discovery deduplicates its curated destinations and never books automatically',()=>{
  const state={
    DB:[
      {name:'Almora',country:'India',id:'almora'},
      {name:'Paris',country:'France',id:'paris'},
      {name:'Almora',country:'India',id:'almora'},
      {name:'Kyoto',country:'Japan',id:'kyoto'},
      {name:'Manali',country:'India',id:'manali'}
    ],
    document:{readyState:'loading',addEventListener(){}},
    location:{origin:'https://preview.example'},
    window:null
  };
  state.window=state;
  vm.runInNewContext(read('js/ui/ailon-world-experience.js'),state,{
    filename:'js/ui/ailon-world-experience.js',timeout:1000
  });
  const d=state.RWAilonWorld.destinationPool();
  assert.equal(d.length,4);
  assert.deepEqual(Array.from(d,x=>x.name),['Almora','Paris','Kyoto','Manali']);
  assert.match(state.RWAilonWorld.staysURL(d[0]),/^\/escapes\/\?zone=Almora/);
  assert.deepEqual(Array.from(state.RWAilonWorld.modeChoices),['editorial','cinematic','cards','map']);
});

test('world assets are approval-gated and wedding filter is independently reachable',()=>{
  const manifest=JSON.parse(read('data/ailon/media-manifest-v1.json'));
  assert.equal(manifest.version,1);
  assert.deepEqual(Object.keys(manifest.assets),[]);
  const filter=read('js/ui/home-curated-discovery.js');
  assert.match(filter,/weddings:\['rwSalesWeddings'\]/);
  const page=read('index.html');
  assert.match(page,/ailon-world-experience\.js/);
  assert.match(page,/ailon-world-experience\.css/);
});
