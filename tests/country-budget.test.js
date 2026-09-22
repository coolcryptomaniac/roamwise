'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const code=fs.readFileSync(path.join(__dirname,'../js/ui/currency-budget.js'),'utf8');
function app(){
  const dom=new JSDOM(`<!doctype html><html><head></head><body><div id="currGrid"></div><div class="slider-row"><span class="slider-lbl">$200</span><input type="range" id="budgetSlider" min="200" max="10000" value="1200" step="10"><span class="slider-lbl">$10k+</span></div><span id="budgetDisplay"></span><span id="budgetExactSym"></span><input type="number" id="budgetExact"><aside id="drawer"><div id="drAcct"></div></aside><div class="v v-home" id="original"><div class="rowhead"><b>Popular now</b></div><div class="prow"></div></div><div id="copilotHero"></div><div id="results"></div><input id="destInput"><input id="dur" value="7"></body></html>`);
  const storage=new Map();
  const country={india:{iso:'IN'},japan:{iso:'JP'},france:{iso:'FR'},'united states':{iso:'US'},indonesia:{iso:'ID'}};
  const DB=[{name:'Goa',country:'India',cost:{budget:1400,mid:3200},bestM:[9],crowd:Array(12).fill(30),food:['Fish curry rice']},{name:'Kyoto',country:'Japan',cost:{budget:1100,mid:2400},bestM:[9],crowd:Array(12).fill(40),food:['Yudofu']},{name:'Paris',country:'France',cost:{budget:800,mid:1600},bestM:[9],crowd:Array(12).fill(40),food:['Baguette']}];
  let searched;
  const state={document:dom.window.document,window:dom.window,Option:dom.window.Option,Event:dom.window.Event,CURR:[{c:'INR',s:'₹',r:83.5},{c:'USD',s:'$',r:1},{c:'JPY',s:'¥',r:149},{c:'EUR',s:'€',r:.92}],AC:'INR',COUNTRY_INFO:country,DB,lsGet:k=>storage.get(k)||'',lsSet:(k,v)=>storage.set(k,v),el:id=>dom.window.document.getElementById(id),themeFor:()=>({acc:[25,30,40],deep:[15,20,25]}),rwPaintPhotos:()=>{},tabGo:()=>{},runSearch:()=>{},smartSearch:(m,b,q)=>{searched={m,b,q};return [];},renderForYou:()=>{}};
  vm.runInNewContext(code,state);state.rwInitCurrencyBudget();
  return {dom,state,storage,getSearch:()=>searched};
}
test('Indian slider begins at ₹500 and exact input accepts ₹500',()=>{
  const {dom,state}=app();const doc=dom.window.document;assert.equal(Number(doc.getElementById('budgetSlider').min)*83.5,500);assert.equal(doc.querySelector('.slider-lbl').textContent,'₹500');
  const exact=doc.getElementById('budgetExact');exact.value='500';exact.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(doc.getElementById('budgetDisplay').textContent,'₹500');assert.ok(Math.abs(Number(doc.getElementById('budgetSlider').value)*83.5-500)<.001);
  assert.equal(state.rwBrowseCountry(),'India');
});
test('Country menu updates currency and home recommendations without hiding global discovery',()=>{
  const {dom,state,storage}=app();const doc=dom.window.document;const pick=doc.getElementById('rwCountryPick');assert.ok(pick);pick.value='Japan';pick.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
  assert.equal(state.rwBrowseCountry(),'Japan');assert.equal(state.AC,'JPY');assert.equal(storage.get('rw_browse_country_v1'),'Japan');
  assert.match(doc.body.textContent,/Discover Japan/);assert.match(doc.body.textContent,/Kyoto/);assert.match(doc.body.textContent,/Worldwide inspiration/);assert.equal(doc.getElementById('original').style.display,'none');
  pick.value='Worldwide';pick.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(state.AC,'USD');assert.equal(doc.querySelectorAll('.rw-country-feed').length,0);assert.equal(doc.getElementById('original').style.display,'');
});
test('Anywhere search respects selected country and scales trip amount into comparable daily/weekly units',()=>{
  const {state,getSearch}=app();state.smartSearch('September',60,'Anywhere','any',[]);assert.equal(getSearch().q,'India');assert.ok(getSearch().b>600&&getSearch().b<800);
  state.window.rwSetBrowseCountry('Japan');state.smartSearch('September',100,'Anywhere','any',[]);assert.equal(getSearch().q,'Japan');assert.equal(getSearch().b,100);
  state.smartSearch('September',100,'Goa, India','any',[]);assert.equal(getSearch().q,'Goa, India');
});
test('Unsupported local currency is not assigned a made-up exchange rate',()=>{const {state,dom}=app();assert.equal(state.rwCountryCurrency('Indonesia'),'USD');state.window.rwSetBrowseCountry('indonesia');assert.match(dom.window.document.getElementById('rwCountryNote').textContent,/USD planning display/);});
