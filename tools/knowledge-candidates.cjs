#!/usr/bin/env node
'use strict';
/* Daily 50-item research candidate sampler over RoamWise's licensed atlas.
 * These ARE NOT guides, source-verified claims, or SEO pages. The output is a
 * private GitHub Actions artifact, never auto-committed or auto-published.
 * Deterministic UTC day rotation; the same day's rerun produces the same list.
 */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);
function opt(key,def){const i=args.indexOf(key);return i>=0?args[i+1]:def;}
const day=opt('--date',new Date().toISOString().slice(0,10));
const count=Number(opt('--count','50'));
if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isInteger(count)||count<1||count>100){console.error('Need ISO UTC date and 1–100 candidates');process.exit(1);}
const out=opt('--out','');
const days=Math.floor((Date.parse(day+'T00:00:00Z')-Date.parse('2026-11-16T00:00:00Z'))/86400000);
if(!Number.isFinite(days)||days<0){console.error('date must be >= 2026-11-16');process.exit(1);}
const india=JSON.parse(fs.readFileSync(path.join(root,'data/atlas/india-places.json'),'utf8'));
const world=JSON.parse(fs.readFileSync(path.join(root,'data/atlas/world-cities.json'),'utf8'));
const known=new Set();
const dir=path.join(root,'content/editorial/articles');
if(fs.existsSync(dir))for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){
 const a=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
 for(const term of [a.slug,...(a.tags||[])])known.add(String(term).toLowerCase().replace(/[^a-z0-9]/g,''));
}
const norm=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
const valid=s=>typeof s==='string'&&s.length>=3&&s.length<=80&&!/^[0-9 -]+$/.test(s);
const places=[],foreign=[],used=new Set();
function add(list,record){
 const k=(record.country||'IN')+'|'+norm(record.name)+'|'+norm(record.region);
 if(used.has(k)||!valid(record.name))return;
 used.add(k);record.identity='atlas-record-not-reviewed';
 record.publicationStatus='research-candidate-only';
 record.requiredChecks=['Confirm identity/coordinates and disambiguate namesakes','Locate official or original dated source(s) for every fact',
 'Add genuinely useful original route analysis, trade-offs, accessibility and local context','Verify image licence and attribution before including any media',
 'Check seasonal closure and permits with current authority, if relevant','Human fact/source/originality review before any public URL'];
 list.push(record);
}
for(const r of india.places||[]){
 if(!Array.isArray(r)||!['C','A','a','T','F','W','M','B','I','N','X','R','v'].includes(r[3]))continue;
 const priority=({C:500,A:450,T:410,F:410,N:400,W:370,M:340,I:320,B:320,R:310,a:280,X:280,v:80})[r[3]]||0;
 add(places,{name:r[0],country:'IN',region:'India',kind:r[3],lat:r[1],lng:r[2],score:priority+Math.min(100,Math.log10(Number(r[6])||1)*12),aliases:(r[7]||[]).slice(0,5)});
}
for(const r of world.cities||[]){
 if(!Array.isArray(r)||!valid(r[0])||!r[3])continue;
 const flag=Number(r[7])||0;
 add(foreign,{name:r[0],country:String(r[3]),region:String(r[4]||''),kind:flag===3?'landmark':flag===1?'capital':'city',
 lat:r[1],lng:r[2],score:(flag===3?420:flag===1?390:230)+Math.min(150,Math.log10(Number(r[5])||1)*15),aliases:(r[6]||[]).slice(0,5)});
}
function rank(a,b){return b.score-a.score||a.country.localeCompare(b.country)||a.name.localeCompare(b.name);}
places.sort(rank);foreign.sort(rank);
function sample(arr,n,start){const v=[];for(let i=0;i<n&&i<arr.length;i++)v.push(arr[(start+i)%arr.length]);return v;}
const ni=Math.ceil(count*0.6),nw=count-ni;
const batch=[...sample(places,ni,days*ni),...sample(foreign,nw,days*nw)];
const items=batch.map((x,i)=>({
 candidateId:day+'-'+String(i+1).padStart(3,'0'),
 ...x,
 previousPublishedGuidePotentialMatch:known.has(norm(x.name)),
 researchDecision:'Review only; no public page and no unverified factual assertions',
 noindex:true
}));
const result={version:1,date:day,count:items.length,selection:'Deterministic rotating atlas sampler, India first',
 totalIdentities:{india:places.length,world:foreign.length},cost:'No AI, scraping or database writes',
 caveat:'Atlas identities and source suggestions are not verified tourist facts. Do not auto-publish.',
 items};
const json=JSON.stringify(result,null,2)+'\n';
if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,json);}else process.stdout.write(json);
console.error(day+' candidates '+items.length+' | India '+places.length+' | world '+foreign.length+' | 0 public pages');
