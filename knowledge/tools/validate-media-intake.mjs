/* Validate private R2 intake; never upload or publish on its own. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const types={'image/jpeg':['.jpg','.jpeg'],'image/webp':['.webp'],'image/png':['.png'],'image/avif':['.avif'],'video/mp4':['.mp4'],'video/webm':['.webm']};
export function validateIntake(manifest,root){
 if(manifest?.version!==1||!Array.isArray(manifest.assets)||manifest.assets.length>100)throw Error('Invalid media intake');
 const seen=new Set(),entries=[];
 const assetRoot=fs.realpathSync(path.join(root,'assets'));
 for(const a of manifest.assets){
  if(!/^[a-z0-9-]{1,96}$/.test(a.id)||seen.has(a.id)||!/^[a-z0-9-]{1,96}$/.test(a.destinationId))throw Error('Invalid or duplicate asset identity');
  seen.add(a.id);
  if(!['owned','licensed','public-domain'].includes(a.rightsStatus)||typeof a.licenseProof!=='string'||a.licenseProof.trim().length<12||typeof a.reviewer!=='string'||!a.reviewer.trim()||!Number.isFinite(Date.parse(a.reviewedAt))||!a.attribution||!a.alt)throw Error('Missing human review or rights evidence');
  if(typeof a.file!=='string'||!a.file.startsWith('assets/')||a.file.includes('..')||a.file.includes('\\'))throw Error('Only repo assets may be ingested');
  const filename=fs.realpathSync(path.resolve(root,a.file));
  if(!filename.startsWith(assetRoot+path.sep)||!fs.statSync(filename).isFile())throw Error('Asset outside root');
  const ext=path.extname(filename).toLowerCase();
  if(!types[a.mime]?.includes(ext))throw Error('Media type mismatch');
  const size=fs.statSync(filename).size, max=a.mime.startsWith('video/')?25*1024*1024:4*1024*1024;
  if(size<1||size>max)throw Error('Media size cap exceeded');
  const sha=crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
  if(a.sha256!==sha)throw Error('Asset checksum mismatch');
  entries.push({file:a.file,key:'intake/'+a.destinationId+'/'+sha+ext,mime:a.mime,size,sha256:sha,assetId:a.id,published:false});
 }
 return entries;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const root=process.cwd(),manifest=JSON.parse(fs.readFileSync(path.join(root,'knowledge/media-intake.json'),'utf8'));
 const entries=validateIntake(manifest,root);
 const dest=path.resolve(process.argv[2]||'/tmp/roamwise-atlas-intake/media-upload-plan.json');
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify({entries,uploaded:0,published:0},null,2)+'\n');
 console.log('Rights-reviewed private upload candidates: '+entries.length);
}
