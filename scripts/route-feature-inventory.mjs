#!/usr/bin/env node
/* Static-route audit for RoamWise. Read-only: detects possible broken links, no deletion.
   Usage: node scripts/route-feature-inventory.mjs [--out=reports/route-inventory.json] */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const excluded=new Set(['.git','node_modules','vendor','assets','dist','build','coverage','.next','.cache']);
function walk(dir,found=[]){
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  if(item.isDirectory()&& !excluded.has(item.name))walk(path.join(dir,item.name),found);
  else if(item.isFile()&&item.name.endsWith('.html'))found.push(path.join(dir,item.name));
 }
 return found;
}
const files=walk(root),exists=(relative)=>{
 const abs=path.join(root,relative);
 if(!abs.startsWith(root+path.sep)&&abs!==root)return false;
 return fs.existsSync(abs)&&fs.statSync(abs).isFile();
};
function pageUrl(file){
 const rel=path.relative(root,file).replaceAll(path.sep,'/');
 if(rel==='index.html')return '/';
 return rel.endsWith('/index.html')?'/'+rel.slice(0,-10):'/'+rel;
}
function target(raw){
 if(!raw||raw.startsWith('#')||/^(?:https?:|mailto:|tel:|sms:|javascript:|data:|blob:|\/\/)/i.test(raw))return null;
 // Ignore JS template concatenations such as href="/'+esc(url)+'"; these are runtime links, not literal routes.
 if(/[{}$<>'"`]/.test(raw))return null;
 let clean=raw.split(/[?#]/)[0].trim();
 if(!clean)return null;
 try{clean=decodeURIComponent(clean);}catch(e){return null;}
 if(clean.startsWith('/'))return clean;
 return clean;
}
function resolveTarget(source,raw){
 const t=target(raw);if(!t)return null;
 const base=pageUrl(source);
 const url=new URL(t,'https://roamwise.invalid'+base);
 const loc=url.pathname.replace(/^\/+/,'');
 if(!loc)return {route:'/',found:true};
 const candidates=[loc,loc.replace(/\/$/,'')+'/index.html',loc+'.html'];
 return {route:'/'+loc,found:candidates.some(exists)};
}
const pages=files.map(file=>{
 const html=fs.readFileSync(file,'utf8');
 const links=[];
 for(const m of html.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/gis)){
  const link=resolveTarget(file,m[2]);
  if(link)links.push(link);
 }
 return {route:pageUrl(file),source:path.relative(root,file).replaceAll(path.sep,'/'),
  links:links.length,broken:[...new Set(links.filter(x=>!x.found).map(x=>x.route))].sort(),
  commercial:/\b(?:cashfree|wallet|checkout|buy now|book now|booking|package|shop|artist|wedding)\b/i.test(html)};
});
const broken=pages.flatMap(p=>p.broken.map(route=>({from:p.route,to:route})));
const routeSet=new Set(pages.map(p=>p.route));
const watched=['/','/partner/','/partner/join/','/partners/','/wallet/','/shop/','/packages/','/creators/natasha.html','/creators/artists.html','/more/'];
const output={generatedAt:new Date().toISOString(),scope:'static href attributes in HTML only; review JS navigation, redirects, provider and auth routes separately',
 totalPages:pages.length,commercialPages:pages.filter(p=>p.commercial).length,possibleBrokenLinks:broken.length,
 watchedRoutes:watched.map(route=>({route,status:routeSet.has(route)?'present':'review'})),
 pages:pages.sort((a,b)=>a.route.localeCompare(b.route)),brokenLinks:broken};
const to=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(to){const dest=path.resolve(root,to);if(!dest.startsWith(root+path.sep))throw new Error('Output must be inside repo');
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');}
else process.stdout.write(JSON.stringify(output,null,2)+'\n');
