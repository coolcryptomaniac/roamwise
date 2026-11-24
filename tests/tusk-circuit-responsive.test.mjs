import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
function setup(){const s={window:null,document:{addEventListener(){}},Promise,Date,setTimeout,clearTimeout,setInterval,clearInterval};s.window=s;vm.createContext(s);vm.runInContext(read('js/copilot/itinerary-rescue.js'),s);return s.RWTuskItinerary;}
test('exact screenshot query retains all four destinations and 15 days',()=>{
 const a=setup(),p=a.intent('15 days plan to almora , nainital , ranikhet and bhimtal',{dest:'Bhimtal',days:15});
 assert.equal(p.places.map(d=>d.name).join(','),'Almora,Nainital,Ranikhet,Bhimtal');
 const html=a.render(p,null,null,null);assert.equal((html.match(/class="rw-itinerary-day"/g)||[]).length,15);
 assert.match(html,/Almora → Nainital → Ranikhet → Bhimtal/);
 assert.match(html,/data-rw-map-stops/);
 assert.match(html,/Transfer from the previous base/);
});
test('map button takes card-specific stops and layout does not grid the entire answer',()=>{
 assert.match(read('js/ui/ailon-world-experience.js'),/W\.openTripMap\(name,stops\)/);
 assert.match(read('design/ailon-world-experience.css'),/\.tk-sec\{display:block!important/);
 assert.match(read('js/itinerary/map-view.js'),/rw_tripmap_v3_/);
});
test('Jaipur has named non-cycling attraction suggestions',()=>{
 const a=setup(),p=a.intent('10 days in jaipur',{dest:'Jaipur',days:10});
 const h=a.render(p,{name:'Jaipur',country:'India'},null,null);
 for(const name of ['Amber Fort','City Palace','Hawa Mahal','Johari Bazaar'])assert.ok(h.includes(name),name);
 assert.equal((h.match(/class="rw-itinerary-day"/g)||[]).length,10);
});
