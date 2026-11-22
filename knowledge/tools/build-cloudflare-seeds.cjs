#!/usr/bin/env node
'use strict';
/* Offline preparation only: no Cloudflare credentials, writes, uploads or live
 * database mutations. Creates reviewable candidate SQL + rights review manifest.
 * Usage: node knowledge/tools/build-cloudflare-seeds.cjs [OUTPUT_DIRECTORY]
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');

function loadData(){
  const ctx={};
  for(const rel of ['js/data/destinations.js','js/data/country-info.js']){
    vm.runInNewContext(fs.readFileSync(path.join(root,rel),'utf8'),ctx,{filename:rel,timeout:1500});
  }
  if(!Array.isArray(ctx.DB)||!ctx.COUNTRY_INFO)throw Error('Destination data unavailable');
  return {DB:ctx.DB,COUNTRY_INFO:ctx.COUNTRY_INFO};
}
function quote(v){return "'"+String(v==null?'':v).replace(/'/g,"''")+"'";}
function slug(v){return String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function prepare(rows,countryInfo,asOf){
  if(!Array.isArray(rows)||typeof countryInfo!=='object')throw TypeError('Invalid source data');
  const seen=new Set(),prepared=[],skipped=[];
  const at=String(asOf||new Date().toISOString());
  for(const d of rows){
    const name=String(d&&d.name||'').trim(),c=String(d&&d.country||'').trim();
    const id=slug(d&&d.id||name);
    const cinfo=countryInfo[c.toLowerCase()];
    if(!id||!name||!c||!cinfo||!/^[A-Z]{2}$/.test(cinfo.iso)){
      skipped.push({id:id||'',name,reason:'missing canonical name or ISO country mapping'});continue;
    }
    if(seen.has(id))continue;seen.add(id);
    const lat=Number.isFinite(d.lat)&&Math.abs(d.lat)<=90?d.lat:null;
    const lon=Number.isFinite(d.lon)&&Math.abs(d.lon)<=180?d.lon:null;
    prepared.push({id,slug:id,name,country_iso:cinfo.iso,region:String(d.region||''),
      lat,lon,status:'candidate',indexed:0,created_at:at,updated_at:at});
  }
  const sql=['-- RoamWise candidate destinations from current local DB, never reviewed/published automatically.',
    '-- APPLY ONLY to a dedicated reviewed D1 setup after schema 001 is installed.',
    'BEGIN TRANSACTION;'];
  for(const d of prepared){
    const fields=['id','slug','name','country_iso','region','lat','lon','status','indexed','created_at','updated_at'];
    const values=fields.map(f=>d[f]==null?'NULL':typeof d[f]==='number'?String(d[f]):quote(d[f]));
    sql.push('INSERT INTO public_destination ('+fields.join(',')+') VALUES ('+values.join(',')+') ON CONFLICT(id) DO NOTHING;');
  }
  sql.push('COMMIT;');
  return {sql:sql.join('\n')+'\n',prepared,skipped};
}
function mediaReview(){
  const base=path.join(root,'assets/property-photos');
  if(!fs.existsSync(base))return [];
  return fs.readdirSync(base).filter(name=>/\.(?:avif|webp|jpe?g|png)$/i.test(name)).sort().map(name=>{
    const rel='assets/property-photos/'+name;
    const stats=fs.statSync(path.join(root,rel));
    return {source:rel,sizeBytes:stats.size,rights_status:'pending',
      attribution:'',license_proof:'',destination_id:null,r2_key:null,
      approved_to_upload:false,notes:'Verify ownership, model/property permission and geographic attribution before R2 publish'};
  });
}
function main(outDir){
  const {DB,COUNTRY_INFO}=loadData();
  const result=prepare(DB,COUNTRY_INFO);
  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'destinations.candidate.sql'),result.sql);
  fs.writeFileSync(path.join(outDir,'media-rights-review.json'),JSON.stringify(mediaReview(),null,2)+'\n');
  fs.writeFileSync(path.join(outDir,'seed-report.json'),JSON.stringify({
    created_at:new Date().toISOString(),candidate_count:result.prepared.length,
    skipped:result.skipped,uploaded_to_r2:false,applied_to_d1:false
  },null,2)+'\n');
  console.log('Prepared '+result.prepared.length+' candidate destinations. No uploads or database writes.');
  if(result.skipped.length)console.warn('Skipped '+result.skipped.length+' places without verified ISO mappings; see report.');
}
if(require.main===module)main(path.resolve(process.argv[2]||'/tmp/roamwise-knowledge-seeds'));
module.exports={prepare,slug,quote,loadData,mediaReview};
