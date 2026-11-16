#!/usr/bin/env node
'use strict';
// Source-first destination library. Indexed pages come ONLY from already
// published editorial sources or explicit, human-signed approved records.
// An atlas point or AI draft alone never becomes a public SEO URL.
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),SRC=path.join(ROOT,'content/editorial/articles');
const SITE='https://www.roamwise.co.in',OUT=path.join(ROOT,'places'),CHECK=process.argv.includes('--check');
const esc=x=>String(x||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const errors=[],changed=[];
function save(file,data){if(CHECK){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==data)changed.push(file);}else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);}}
function parse(file){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){errors.push(file+' invalid JSON');return null;}}
const published=fs.readdirSync(SRC).filter(x=>x.endsWith('.json')).map(f=>parse(path.join(SRC,f))).filter(Boolean)
 .filter(a=>a.section==='guides'&&a.slug!=='what-things-cost-india')
 .map(a=>({name:(a.tags||[])[0]||a.slug,region:(a.tags||[])[1]||'India',title:a.title,description:a.description,
  checkedAt:a.updated,url:'/guides/'+a.slug+'.html',aliases:a.tags||[],sourceCount:a.sources.length,type:'existing-editorial'}));
const staged=path.join(ROOT,'knowledge/approved'),newRecords=[];
if(fs.existsSync(staged))for(const f of fs.readdirSync(staged).filter(x=>x.endsWith('.json'))){
 const x=parse(path.join(staged,f));if(!x)continue;
 const sign=x.approval||{},sources=x.sources||[],sections=x.sections||[],facts=x.facts||[];
 const good=/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug||'')&&x.title&&x.name&&x.region&&x.description
  &&sign.status==='approved'&&sign.humanReviewed===true&&sign.reviewedBy&&sign.reviewedAt&&sign.evidence
  &&sources.length>=2&&sources.every(s=>s.id&&/^https:\/\//.test(s.url||'')&&s.supports&&s.checkedAt)
  &&sections.length>=3&&sections.every(s=>s.heading&&s.text&&s.text.length>=140)
  &&(x.decisions||[]).length>=3&&facts.length>=3&&facts.every(v=>v.text&&sources.some(s=>s.id===v.sourceId));
 if(!good){errors.push(f+' lacks accountable human approval, original substance or source references');continue;}
 newRecords.push(x);
}
const rows=published.concat(newRecords.map(x=>({name:x.name,region:x.region,title:x.title,description:x.description,
 checkedAt:x.approval.reviewedAt,url:'/places/'+x.slug+'/',aliases:x.aliases||[],sourceCount:x.sources.length,
 type:'approved-destination',facts:x.facts.map(f=>f.text),sources:x.sources.map(s=>s.url)}))).sort((a,b)=>a.name.localeCompare(b.name));
if(new Set(rows.map(x=>x.url)).size!==rows.length)errors.push('duplicate published canonical URL');
const css='*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top right,#302245,#090c17 58%);color:#f5eff3;font:16px/1.65 system-ui,sans-serif}a{color:#ebc378}h1{font-size:clamp(32px,5vw,54px);line-height:1.12;letter-spacing:-.035em}h2{font-size:26px}p{color:#d2cedc}.wrap{max-width:1120px;margin:auto;padding:20px 20px 65px}nav{display:flex;gap:18px;flex-wrap:wrap;border-bottom:1px solid #4c465b;padding:12px 0}nav a{text-decoration:none}.brand{color:#fff;font-weight:900;font-size:22px}.lead{font-size:20px;max-width:740px}.small{font-size:13px;color:#b7b5c5}.eyebrow{color:#ebc378;font-size:12px;font-weight:750;text-transform:uppercase;letter-spacing:.12em}.panel,.card{background:#171d2f;border:1px solid #4b485b;border-radius:16px;padding:18px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:14px}.card h3{margin:7px 0}.controls{display:flex;gap:16px;flex-wrap:wrap;margin:24px 0}.controls label{flex:1 1 240px}input,select{display:block;width:100%;padding:12px;color:#fff;background:#0b1321;border:1px solid #706d82;border-radius:12px;font:inherit}.action{display:inline-block;background:#e8ba6c;color:#111;border:0;border-radius:10px;padding:12px 16px;font-weight:800;text-decoration:none}.columns{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(230px,1fr);gap:26px}.tablewrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:470px}td,th{border:1px solid #4c4859;text-align:left;padding:11px}th{background:#24263c}section{margin:25px 0}details{border:1px solid #52516a;border-radius:11px;padding:10px 14px;margin:10px 0}summary{cursor:pointer;font-weight:700}footer{margin-top:55px;border-top:1px solid #4c465b;padding-top:20px;color:#b8b5bd;font-size:13px}[hidden]{display:none!important}@media(max-width:720px){.columns{display:block}}';
save(path.join(OUT,'places.css'),css+'\n');
function page(title,description,url,content,jsonld,script){
 return '<!doctype html>\n<html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' | RoamWise</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+SITE+url+'"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><script type="application/ld+json">'+JSON.stringify(jsonld).replace(/</g,'\\u003c')+'</script><link rel="stylesheet" href="/places/places.css"></head><body><div class="wrap"><nav><a class="brand" href="/">RoamWise</a><a href="/places/">Destination atlas</a><a href="/guides/">Travel guides</a><a href="/editorial-policy.html">Editorial policy</a></nav><main>'+content+'</main><footer>RoamWise · Source-backed guidance, not confirmed availability · <a href="/contact.html">Corrections</a></footer></div>'+(script||'')+'</body></html>\n';
}
for(const x of newRecords){
 const url='/places/'+x.slug+'/',q=encodeURIComponent('Plan a trip in '+x.name+' using source-linked places and sensible pacing');
 const sections=x.sections.map(s=>'<section><h2>'+esc(s.heading)+'</h2><p>'+esc(s.text)+'</p></section>').join('');
 const table='<div class="tablewrap"><table><thead><tr><th>Traveller goal</th><th>Consider</th><th>Trade-off</th></tr></thead><tbody>'+x.decisions.map(d=>'<tr><td>'+esc(d.goal)+'</td><td>'+esc(d.choice)+'</td><td>'+esc(d.caveat)+'</td></tr>').join('')+'</tbody></table></div>';
 const facts='<ul>'+x.facts.map(f=>'<li>'+esc(f.text)+' <a href="#source-'+esc(f.sourceId)+'">Source</a></li>').join('')+'</ul>';
 const sources='<ol>'+x.sources.map(s=>'<li id="source-'+esc(s.id)+'"><a target="_blank" rel="noopener noreferrer" href="'+esc(s.url)+'">'+esc(s.label||s.url)+'</a> · '+esc(s.supports)+' · checked '+esc(s.checkedAt)+'</li>').join('')+'</ol>';
 const days=(x.days||[]).map((d,i)=>'<details><summary>Day '+(i+1)+' · '+esc(d.title)+'</summary><p>'+esc(d.plan)+'</p></details>').join('');
 const body='<section><div class="eyebrow">Human-reviewed · '+esc(x.region)+'</div><h1>'+esc(x.title)+'</h1><p class="lead">'+esc(x.description)+'</p><p class="small">Reviewed '+esc(x.approval.reviewedAt)+' · '+esc(x.approval.reviewedBy)+'</p><a class="action" href="/?tusk='+q+'">⚡ Plan with Ailon Tusk</a></section><div class="columns"><article>'+sections+'<h2>Decision matrix</h2>'+table+'<h2>Flexible sample days</h2>'+days+'</article><aside class="panel"><h2>Verified-source notes</h2>'+facts+'</aside></div><section><h2>Sources and corrections</h2><p>Facts are sourced; trade-offs are editorial suggestions. Always verify live conditions.</p>'+sources+'</section>';
 const ld={'@context':'https://schema.org','@type':'Article',headline:x.title,description:x.description,datePublished:x.firstPublished||x.approval.reviewedAt,dateModified:x.approval.reviewedAt,mainEntityOfPage:SITE+url,author:{'@type':'Organization',name:'RoamWise Editorial'},publisher:{'@type':'Organization',name:'RoamWise'}};
 save(path.join(OUT,x.slug,'index.html'),page(x.title,x.description,url,body,ld));
}
const cards=rows.map(a=>'<article class="card" data-search="'+esc([a.name,a.region,a.title,...a.aliases].join(' ').toLowerCase())+'"><div class="eyebrow">'+esc(a.region)+'</div><h3><a href="'+esc(a.url)+'">'+esc(a.title)+'</a></h3><p>'+esc(a.description)+'</p><div class="small">'+esc(a.checkedAt)+' · '+a.sourceCount+' original sources</div></article>').join('');
const content='<section><div class="eyebrow">Ailon Tusk × RoamWise Travel Atlas</div><h1>Every place exists. Every detailed guide must earn its page.</h1><p class="lead">Search the reviewed RoamWise destination library. The much larger world atlas can identify a place, but it will never invent a destination guide or claim a booking is available.</p><div class="panel">Source-backed articles, practical route decisions, original analysis and an honest last-reviewed date. Unreviewed and AI-only drafts are excluded from search indexing.</div><div class="controls"><label>Find a reviewed destination<input id="rw-place-search" type="search" placeholder="Rishikesh, Jaipur, Binsar…"></label><label>Ask Ailon in<select id="rw-place-lang"><option value="en">English</option><option value="hi">हिन्दी</option></select></label></div><p id="rw-place-count" class="small">'+rows.length+' reviewed guides</p></section><section id="rw-place-cards" class="cards">'+cards+'</section><p id="rw-place-empty" class="panel" hidden>No reviewed guide matches. Ailon can still resolve the place using its geographic atlas.</p><section><h2>Explore a city not yet published</h2><a id="rw-place-ask" class="action" href="/?tusk=Plan%20a%20trip%20in%20Almora">⚡ Ask Ailon Tusk</a></section>';
const js='<script>(function(){var q=document.getElementById("rw-place-search"),lang=document.getElementById("rw-place-lang"),items=[].slice.call(document.querySelectorAll("#rw-place-cards .card")),cnt=document.getElementById("rw-place-count"),empty=document.getElementById("rw-place-empty"),ask=document.getElementById("rw-place-ask");function run(){var v=q.value.toLowerCase().trim(),n=0;items.forEach(function(x){var ok=!v||x.dataset.search.includes(v);x.hidden=!ok;if(ok)n++;});cnt.textContent=n+" reviewed guides";empty.hidden=n>0;ask.href="/?tusk="+encodeURIComponent(lang.value==="hi"?"हिंदी में "+(v||"अल्मोड़ा")+" की यात्रा योजना बनाओ":"Plan a source-backed trip in "+(v||"Almora"));}q.addEventListener("input",run);lang.addEventListener("change",run);run();}());</script>';
const ld={'@context':'https://schema.org','@type':'CollectionPage',name:'RoamWise destination knowledge library',url:SITE+'/places/',hasPart:rows.map(r=>({'@type':'Article',headline:r.title,url:SITE+r.url}))};
save(path.join(OUT,'index.html'),page('Destination knowledge library','Human-reviewed India travel guides and original route decisions, with sources and one-click AI planning.','/places/',content,ld,js));
const compact=rows.map(r=>({name:r.name,region:r.region,url:r.url,aliases:r.aliases,summary:r.description,checkedAt:r.checkedAt,facts:r.facts||[],sources:r.sources||[]}));
save(path.join(OUT,'data/assistant-index.json'),JSON.stringify({version:1,records:compact})+'\n');
save(path.join(OUT,'data/assistant-index.js'),'/* Published and reviewed sources only. */\nwindow.RW_DEST_GUIDES='+JSON.stringify(compact)+';\n');
if(errors.length||changed.length){console.error(errors.concat(changed.map(x=>'Generated file stale: '+x)).join('\n'));process.exitCode=1;}
else console.log((CHECK?'Checked':'Built')+' '+rows.length+' existing reviewed guide entries, '+newRecords.length+' approved destination guides.');
