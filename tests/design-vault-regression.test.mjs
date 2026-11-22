import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (p) => fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'),css=read('design/design-vault.css'),vault=read('design/design-vault.js');
test('all three historic design editions are wired into Settings without changing checkout',()=>{
 assert.match(index,/design\/design-vault\.css/);
 assert.match(index,/design\/design-vault\.js/);
 assert.match(read('js/ui/settings-modal.js'),/RWDesignVault\.mountSettings/);
 assert.match(index,/rw-vault-wallet-link/);
 assert.match(vault,/himalayan-saanjh/);
 assert.match(vault,/kasar-cloud/);
 assert.match(vault,/buransh-bazaar/);
 const onMain=['rwSalesCarousels','rwSalesStays','rwSalesPackages','rwSalesWeddings','rwSalesShop','brand-ambassador'];
 onMain.forEach(x=>{assert.match(index,new RegExp('id="'+x+'"'),x+' remains in main HTML');});
 assert.match(css,/#rwSalesCarousels\s*\{\s*display:block!important/);
 assert.match(css,/#rwSalesShop\s*\{\s*display:flex!important/);
 assert.match(css,/#brand-ambassador\s*\{\s*display:block!important/);
});
test('Design Vault defaults to latest and persists a selected legacy edition',()=>{
 const attrs={};
 const storage=new Map();
 const dom={
  documentElement:{setAttribute:(a,b)=>{attrs[a]=b;}},
  body:{setAttribute:(a,b)=>{attrs['body-'+a]=b;}},
  readyState:'loading',
  addEventListener:()=>{},
  dispatchEvent:()=>{},
  getElementById:()=>null,
  querySelector:()=>null
 };
 const context={window:{},document:dom,
   localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
   CustomEvent:function(){},console};
 vm.runInNewContext(vault,context);
 assert.equal(context.window.RWDesignVault.current(),'himalayan-saanjh');
 assert.equal(context.window.RWDesignVault.editions.length,3);
 context.window.RWDesignVault.select('kasar-cloud');
 assert.equal(storage.get('rw_design_edition'),'kasar-cloud');
 assert.equal(attrs['data-rw-design'],'kasar-cloud');
 context.window.RWDesignVault.select('not-an-edition');
 assert.equal(storage.get('rw_design_edition'),'kasar-cloud');
});
test('AI outage gives a safe local trip planning card for a long generic prompt',()=>{
 const source=read('js/copilot/sourced-search.js'); const finished=[];const calls=[];
 const ctx={window:{RW_CONFIG:{backend:'firebase',workerUrl:''}},
  document:{getElementById:()=>null},URL,encodeURIComponent,
  cpSmartAnswer:()=>'',rwAiDownNote:()=>'Unavailable',cpFinish:(_thinking,answer)=>finished.push(answer),
  rwApi:()=>null,fetch:(...args)=>{calls.push(args);throw new Error('Unexpected public search');}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const query='Help arrange transport for my future trip. Ask me my origin, destination, dates and passengers. Compare train, bus, flight and taxi routes and focus on electric options where possible, then give clear booking steps.';
 assert.equal(ctx.rwTuskIsPublicQuery(query),false,'long query is not eligible for public search');
 ctx.rwTuskSearchFailure({},query,{},{});
 assert.equal(calls.length,0);
 assert.match(finished[0],/Transport plan/);
 assert.doesNotMatch(finished[0],/Private question/);
 assert.doesNotMatch(finished[0],/confirmed reservation/);
});
test('retired plural partner link has a non-JS redirect and safe fallback',()=>{
 const page=read('partners/index.html');
 assert.match(page,/url=\/partner\//);
 assert.match(page,/href="\/partner\/join\/"/);
});
