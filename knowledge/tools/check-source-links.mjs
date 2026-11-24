/* Bounded HTTP link reachability audit. Never equate HTTP 200 with fact approval.
 * Only explicit existing atlas reference URLs; redirects are not followed. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {TUSK_ATLAS} from '../../worker/data/tusk-travel-atlas.js';
import {WORLD_ATLAS} from '../../worker/data/tusk-world-atlas.js';
export async function auditLinks({fetcher=fetch,offset=0,limit=12}={}){
 const allowed=new Set(['en.wikivoyage.org','uttarakhandtourism.gov.in','www.incredibleindia.gov.in','goa-tourism.com','karnatakatourism.org']);
 const links=[...new Set([...TUSK_ATLAS,...WORLD_ATLAS].map(d=>d.sourcePage))].filter(s=>{
  try{const u=new URL(s);return u.protocol==='https:'&&allowed.has(u.hostname)&&!u.username&&!u.password&&!u.search&&!u.hash;}catch(_){return false;}
 });
 const count=Math.max(1,Math.min(12,Math.trunc(limit)||12)),start=Math.max(0,Math.trunc(offset)||0)%links.length;
 const selected=links.slice(start,start+count);
 const results=[];
 for(const url of selected){
  try{const r=await fetcher(url,{method:'HEAD',redirect:'manual',credentials:'omit',signal:AbortSignal.timeout(6000)});
   results.push({url,status:r.status,reachability:r.status>=200&&r.status<300?'reachable':r.status>=300&&r.status<400?'redirect-review':'needs-review',factsVerified:false});
  }catch(_){results.push({url,status:null,reachability:'needs-review',factsVerified:false});}
 }
 return {checkedAt:new Date().toISOString(),totalLinks:links.length,results,autoApproved:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const dest=path.resolve(process.argv[2]||'/tmp/roamwise-atlas-intake/source-link-report.json');
 const offset=Math.floor(Date.now()/604800000)*12;
 const result=await auditLinks({offset});
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 console.log('Reachability checked: '+result.results.length+' links; no facts approved.');
}
