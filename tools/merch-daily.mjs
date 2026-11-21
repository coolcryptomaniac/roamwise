#!/usr/bin/env node
/**
 * One original design-review concept per IST day. No model calls, API expenditure,
 * supplier catalogue edits, live product promises or checkout permissions.
 * The action opens a review PR; it never publishes to Qikink.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const themes = [
  {name:'Buransh Frequencies',kind:'rave',sub:'Himalayan signal waves',palette:['#e24a4a','#f8ac66','#ffe3b3']},
  {name:'Kasar Sky Observatory',kind:'kumaon',sub:'Unhurried mountain nights',palette:['#7c69d1','#95b8f3','#fbe9ce']},
  {name:'Rave to Shadow',kind:'rave',sub:'Original nocturne geometry',palette:['#7748bc','#bd6add','#e8e0ff']},
  {name:'Panchachuli Sunrise',kind:'kumaon',sub:'Five peaks one horizon',palette:['#ba4c4a','#ffad6e','#f7e9c8']},
  {name:'Rave to Dream',kind:'rave',sub:'Echoes across the nebula',palette:['#4569cd','#77d6ec','#f9e9cb']},
  {name:'Aipan Geometry',kind:'kumaon',sub:'Traditional motifs, original arrangement',palette:['#ae2e3d','#e3ab79','#ffebca']},
  {name:'Rave to Realm',kind:'rave',sub:'Mountain portal geometry',palette:['#0b746a','#56c5a1','#e9d5ac']},
  {name:'Myar Pahad',kind:'kumaon',sub:'Home is a direction',palette:['#6b8560','#d6ad68','#fbf0d8']},
  {name:'Rave to Rise',kind:'rave',sub:'Sunlight beyond the ridge',palette:['#ce3852','#f28a55','#fce8bf']},
  {name:'Buransh Blooms',kind:'kumaon',sub:'Rhododendrons in the rain',palette:['#bf3552','#e17772','#fff0cf']},
  {name:'Rave to Hell',kind:'rave',sub:'Fire and resolve',palette:['#c72837','#f47a3d','#fce1a8']},
  {name:'Almora After Dark',kind:'kumaon',sub:'Himalayan night contours',palette:['#484b93','#b2aed7','#f2d5ae']}
];
export function todayIST(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get=n=>parts.find(x=>x.type===n)?.value;
  return get('year')+'-'+get('month')+'-'+get('day');
}
export function buildDailyConcept(date=todayIST()){
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)
    throw new Error('Date must be a real YYYY-MM-DD');
  const index=Math.floor(Date.parse(date+'T00:00:00Z')/86400000);
  const theme=themes[index%themes.length];
  const productKind=index%2===0?'Oversized graphic T-shirt':'Oversized hoodie';
  const category=theme.kind==='rave'?'rave':'wear';
  const id='daily-'+date;
  return {id,name:theme.name+' · '+productKind,type:productKind,
    description:theme.sub+'. Original RoamWise motif, concept only; print placement, garment fabric, sizes, price and Qikink production SKU require approval.',
    image:'/shop/img/'+id+'.svg',category,visual:productKind.includes('hoodie')?'hoodie':'tee',
    status:'design-review',live:false,sizes:true,price:null,qikinkSku:null,inventory:null,fulfilment:'unapproved',
    creativeSource:'Original procedural vector illustration, curated theme rotation, not a supplier SKU',
    trendEvidence:'Qualitative design themes; no search volume or sales rank claim',
    createdOnIST:date,rightsStatus:'original_concept_requires_final_review',
    palette:theme.palette,theme:theme.name};
}
const xml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function renderArt(p){
 const [primary,secondary,light]=p.palette;
 const dateDigits=Number(p.createdOnIST.replaceAll('-',''));
 const count=8+dateDigits%5;
 const leaves=Array.from({length:count},(_,i)=>{
   const angle=i*360/count,colour=i%2?secondary:primary;
   return '<ellipse cx="500" cy="155" rx="'+(17+i%3*6)+'" ry="100" transform="rotate('+angle+' 500 270)" fill="'+colour+'" opacity=".78"/>';
 }).join('');
 const ticks=Array.from({length:48},(_,i)=>{
   const a=i*2*Math.PI/48;
   const x=(500+330*Math.cos(a)).toFixed(1),y=(590+330*Math.sin(a)).toFixed(1);
   return '<circle cx="'+x+'" cy="'+y+'" r="'+(i%6?3:8)+'" fill="'+(i%6?light:secondary)+'"/>';
 }).join('');
 const lines=Array.from({length:5},(_,i)=>'<path d="M'+(155+i*22)+' '+(750+i*30)+' Q'+(500+i*6)+' '+(690+i*20)+' '+(840-i*15)+' '+(750+i*27)+'" fill="none" stroke="'+(i%2?secondary:light)+'" stroke-width="'+(6-i)+'"/>').join('');
 const title=xml(p.theme.toUpperCase());
 const subtitle=xml(p.type.toUpperCase());
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1200" role="img" aria-label="${title} original apparel design review">
<defs>
<linearGradient id="sun" x2="0" y2="1"><stop stop-color="${light}"/><stop offset=".6" stop-color="${secondary}"/><stop offset="1" stop-color="${primary}"/></linearGradient>
</defs>
<g stroke-linecap="round" stroke-linejoin="round">
<circle cx="500" cy="590" r="306" fill="none" stroke="${light}" stroke-width="6"/>
<circle cx="500" cy="590" r="320" fill="none" stroke="${secondary}" stroke-width="4" stroke-dasharray="5 16"/>
${ticks}
<circle cx="500" cy="516" r="224" fill="url(#sun)"/>
<path d="M140 760 276 553 383 668 514 414 637 655 738 530 860 764Z" fill="#24263b" stroke="${secondary}" stroke-width="8"/>
<path d="M275 557 384 671 514 417 634 655 513 518 440 661 384 624 350 649Z" fill="${light}"/>
<path d="M145 805 315 680 456 799 615 649 850 818 845 859 135 859Z" fill="${primary}" stroke="${light}" stroke-width="6"/>
${lines}
<circle cx="500" cy="270" r="66" fill="none" stroke="${light}" stroke-width="8"/>
<g transform="translate(0 -115)">${leaves}</g>
<path d="m500 85 10 45-10 45-10-45Zm-96 87 43 7-43 7-43-7Zm192 0 43 7-43 7-43-7Z" fill="${light}"/>
<g fill="${light}" text-anchor="middle" font-family="Georgia,serif">
 <text x="500" y="993" font-size="58" font-weight="700" letter-spacing="5">${title}</text>
 <text x="500" y="1045" font-size="21" letter-spacing="7">ROAMWISE • ORIGINALS</text>
 <text x="500" y="1091" font-size="16" letter-spacing="4">${subtitle}</text>
</g>
<g stroke="${secondary}" stroke-width="5" fill="none"><path d="m430 1133 70-25 70 25-70 25Z"/><circle cx="500" cy="1133" r="11" fill="${light}"/></g>
</g></svg>`;
}
export function applyDaily(manifest,date){
 if(!manifest||!Array.isArray(manifest.products)) throw new Error('Missing review inventory manifest');
 if(manifest.products.some(p=>p.id==='daily-'+date))return {changed:false,manifest,product:null};
 const product=buildDailyConcept(date);
 const all=[...manifest.products,product].slice(-45);
 return {changed:true,product,manifest:{...manifest,updatedAt:date,products:all}};
}
export function run({date=todayIST(),dryRun=false}={}){
 const manifestFile=new URL('shop/daily-products.json',ROOT);
 const existing=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 const output=applyDaily(existing,date);
 if(!output.changed){console.log('Daily concept already exists for '+date);return output;}
 if(!dryRun){
   const artFile=new URL('shop/img/'+output.product.id+'.svg',ROOT);
   fs.writeFileSync(artFile,renderArt(output.product));
   fs.writeFileSync(manifestFile,JSON.stringify(output.manifest,null,2)+'\n');
 }
 console.log((dryRun?'Previewed':'Created')+' one review-only concept: '+output.product.id);
 return output;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const a=process.argv.find(x=>x.startsWith('--date='));
 run({date:a?a.slice(7):todayIST(),dryRun:process.argv.includes('--dry-run')});
}
