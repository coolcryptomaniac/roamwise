import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
test('destination library builds only reviewed editorial records as public SEO URLs',()=>{
 const result=execFileSync(process.execPath,['tools/build-destination-library.cjs'],{cwd:ROOT,encoding:'utf8',timeout:20000});
 assert.match(result,/reviewed|editorial/i);
 const hub=read('places/index.html'),index=read('places/data/assistant-index.json');
 const published=JSON.parse(index);
 assert.ok(published.records.length>=4);
 assert.match(hub,/Search|Find a reviewed destination/);
 assert.match(hub,/application\/ld\+json/);
 assert.match(hub,/rel="canonical"/);
 assert.match(hub,/data-search=/);
 assert.ok(published.records.every(x=>/^\/guides\/[a-z0-9-]+\.html$|^\/places\/[a-z0-9-]+\/$/.test(x.url)));
 assert.doesNotMatch(hub,/53,000 verified travel guides|guaranteed travel|all 53,000 pages/);
 execFileSync(process.execPath,['tools/build-destination-library.cjs','--check'],{cwd:ROOT,timeout:20000});
});
test('the research candidate scheduler yields exactly 50 deterministic non-published atlas briefs',()=>{
 const exec=()=>JSON.parse(execFileSync(process.execPath,['tools/knowledge-candidates.cjs','--date','2026-11-16','--count','50'],{cwd:ROOT,encoding:'utf8',timeout:45000,maxBuffer:8*1024*1024}));
 const d=exec();assert.equal(d.count,50);assert.equal(d.items.length,50);
 assert.ok(d.totalIdentities.india>1000);
 assert.ok(d.totalIdentities.world>1000);
 assert.equal(new Set(d.items.map(x=>x.country+'|'+x.name+'|'+x.region)).size,50);
 assert.ok(d.items.every(x=>x.noindex===true&&x.publicationStatus==='research-candidate-only'&&x.requiredChecks.length>=5));
 assert.deepEqual(d.items.map(x=>x.candidateId),exec().items.map(x=>x.candidateId));
});
test('Ailon guide bridge is narrow and never steals bookings, refund, or weather questions',async()=>{
 const source=read('js/copilot/knowledge-bridge.js'),out=[];
 const ctx={console,URL,setTimeout:()=>{},window:null,location:{href:'https://www.roamwise.co.in/'},
  document:{readyState:'complete',getElementById:()=>null,addEventListener:()=>{}},
  fetch:async()=>({ok:true,json:async()=>({version:1,records:[
    {name:'Rishikesh',region:'Uttarakhand',summary:'A researched destination',url:'/guides/rishikesh-uttarakhand.html',checkedAt:'2026-11-16',aliases:[]}]})}),
  cpFinish:(_b,h)=>out.push(h)};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(ctx.RWKnowledgeBridge.reply({}, {dest:'Rishikesh'},'What to see in Rishikesh?'),true);
 assert.match(out[0],/rishikesh-uttarakhand\.html/);
 for(const q of ['book a hotel in Rishikesh','check my refund for Rishikesh','weather in Rishikesh tomorrow','pay for 5 nights in Rishikesh'])
  assert.equal(ctx.RWKnowledgeBridge.reply({}, {dest:'Rishikesh'},q),false,q);
});
test('home page links to the public library; no 53k crawlable thin URLs are generated',()=>{
 assert.match(read('index.html'),/knowledge-bridge\.js/);
 assert.match(read('index.html'),/rwOpenSite\('places\/'\)/);
 assert.match(read('sitemap.xml'),/https:\/\/www\.roamwise\.co\.in\/places\//);
 assert.match(read('.github/workflows/static.yml'),/node tools\/build-destination-library\.cjs/);
 const yaml=read('.github/workflows/destination-research.yml');
 assert.match(yaml,/schedule:/);assert.match(yaml,/upload-artifact/);
 assert.doesNotMatch(yaml,/git push|wrangler|create-pull-request|actions\/deploy-pages|contents: write/);
});
