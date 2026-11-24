/* Bounded private collection. Source claims are NOT human approval for publication. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const PLACES=[['almora','Almora'],['nainital','Nainital'],['ranikhet','Ranikhet'],['bhimtal','Bhimtal'],['manali','Manali, Himachal Pradesh'],['jaipur','Jaipur'],['goa','Goa'],['coorg','Kodagu district'],['varanasi','Varanasi'],['paris','Paris'],['tokyo','Tokyo'],['helsinki','Helsinki']];
const AGENT='RoamWise-media-intake/1.0 (contact: founder@roamwise.co.in)';
const MAX=4*1024*1024;
const strip=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,500);
export function selectMedia(info){
 const m=info?.extmetadata||{},license=m.LicenseShortName?.value;
 const licenses={'CC BY 4.0':'https://creativecommons.org/licenses/by/4.0/','CC BY 3.0':'https://creativecommons.org/licenses/by/3.0/','CC0':'https://creativecommons.org/publicdomain/zero/1.0/'};
 if(!Object.hasOwn(licenses,license)||m.Restrictions?.value?.trim())return null;
 if(!['image/jpeg','image/png','image/webp'].includes(info.mime)||!Number.isSafeInteger(info.size)||info.size<=0||info.size>MAX)return null;
 let url,source;try{url=new URL(info.url);source=new URL(info.descriptionurl);}catch{return null;}
 if(url.protocol!=='https:'||url.hostname!=='upload.wikimedia.org'||!url.pathname.startsWith('/wikipedia/commons/')||url.username||url.password||source.protocol!=='https:'||source.hostname!=='commons.wikimedia.org'||!source.pathname.startsWith('/wiki/File:'))return null;
 const author=strip(m.Artist?.value);if(!author&&license!=='CC0')return null;
 return {url:url.href,source:source.href,license,licenseUrl:licenses[license],author:author||'Not stated',title:strip(m.ObjectName?.value),mime:info.mime,sourceSize:info.size};
}
async function json(host,query){
 const url='https://'+host+'/w/api.php?'+new URLSearchParams({...query,format:'json',formatversion:'2'});
 const r=await fetch(url,{headers:{'User-Agent':AGENT},redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('source '+r.status);return r.json();
}
async function imageBytes(m){
 const r=await fetch(m.url,{headers:{'User-Agent':AGENT},redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!r.ok||!r.body||String(r.headers.get('content-type')||'').split(';')[0]!==m.mime)throw Error('media response');
 const reader=r.body.getReader(),parts=[];let size=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX)throw Error('media cap');parts.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const b=Buffer.concat(parts.map(x=>Buffer.from(x)));if(b.length!==m.sourceSize)throw Error('source size changed');
 const ok=m.mime==='image/jpeg'?b[0]===255&&b[1]===216:m.mime==='image/png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
 if(!ok)throw Error('media signature');return b;
}
function put(key,file,mime){
 const p=spawnSync('npx',['--yes','wrangler@4','r2','object','put','roamwise-public-media-dev/'+key,'--remote','--file',file,'--content-type',mime],{stdio:'inherit',timeout:120000});
 if(p.status!==0)throw Error('R2 upload failed');
}
export async function collect({out='/tmp/rw-commons-intake',upload=false}={}){
 await fs.mkdir(out,{recursive:true});const report={version:1,assets:[],skipped:[],uploaded:0,published:0};
 for(const [id,title] of PLACES){
  try{
   const page=await json('en.wikipedia.org',{action:'query',titles:title,prop:'pageimages',piprop:'name',pilicense:'free',redirects:'1'});
   const file=page.query?.pages?.[0]?.pageimage;if(!file)throw Error('no freely licensed lead image');
   const data=await json('commons.wikimedia.org',{action:'query',titles:'File:'+file,prop:'imageinfo',iiprop:'url|mime|size|extmetadata'});
   const m=selectMedia(data.query?.pages?.[0]?.imageinfo?.[0]);if(!m)throw Error('unsupported or unclear licence/size');
   const bytes=await imageBytes(m),sha=createHash('sha256').update(bytes).digest('hex');
   const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[m.mime],key='intake/commons/'+id+'/'+sha+'.'+ext;
   const name=path.join(out,id+'.'+ext),meta=path.join(out,id+'.json');
   await fs.writeFile(name,bytes);
   const row={destinationId:id,sourcePage:m.source,sourceFile:file,license:m.license,licenseUrl:m.licenseUrl,creator:m.author,sourceUrl:m.url,sha256:sha,size:bytes.length,mime:m.mime,r2Key:key,reviewStatus:'pending',published:false,collectedAt:new Date().toISOString()};
   await fs.writeFile(meta,JSON.stringify(row,null,2)+'\n');
   if(upload){put(key,name,m.mime);put(key+'.json',meta,'application/json');report.uploaded++;}
   report.assets.push(row);
  }catch(e){report.skipped.push({destinationId:id,reason:String(e.message).slice(0,150)});}
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({collected:report.assets.length,uploaded:report.uploaded,published:0,skipped:report.skipped}));
 if(!report.assets.length||upload&&report.uploaded!==report.assets.length)throw Error('No verified collection or incomplete upload');
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await collect({upload:process.argv.includes('--upload')});
