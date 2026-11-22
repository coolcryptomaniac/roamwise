#!/usr/bin/env node
'use strict';
/* Build a small, auditable inventory of EXISTING public RoamWise destination
 * reference data for a later explicit R2 transfer. No upload and no API calls.
 * Payments, user data, credentials, private CRM and bookings are excluded. */
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const curated=[
 ['data/atlas/world-countries.json','atlas/v1/world-countries.json','CC-BY-4.0: GeoNames, attribution required'],
 ['data/atlas/world-cities.json','atlas/v1/world-cities.json','CC-BY-4.0: GeoNames, attribution required'],
 ['data/atlas/india-admin.json','atlas/v1/india-admin.json','CC-BY-4.0: GeoNames, attribution required'],
 ['data/atlas/india-places.json','atlas/v1/india-places.json','CC-BY-4.0: GeoNames, attribution required'],
 ['data/atlas/india-namesakes.json','atlas/v1/india-namesakes.json','CC-BY-4.0: GeoNames, attribution required'],
 ['itinerary-library/manifest.json','itineraries/v1/manifest.json','RoamWise original; verify individual publication rights'],
 ['itinerary-library/data/local-intelligence.json','itineraries/v1/local-intelligence.json','RoamWise editorial; verify every underlying source']
];
const items=curated.map(([file,key,license])=>{
  const input=path.join(root,file);
  if(!fs.existsSync(input))return {file,key,status:'missing',license};
  const data=fs.readFileSync(input);
  try { JSON.parse(data.toString('utf8')); }
  catch(_){return {file,key,status:'invalid_json',license};}
  return {file,key,status:'ready_for_review',license,bytes:data.length,
    sha256:crypto.createHash('sha256').update(data).digest('hex')};
});
const report={version:1,generated:new Date().toISOString(),intent:'staging review only; no R2 upload performed',
             personalDataIncluded:false,items};
const out=path.join(root,'data/ailon/r2-public-catalog-staging.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log('Wrote public catalog review:',out,'ready:',items.filter(x=>x.status==='ready_for_review').length);
if(items.some(x=>x.status!=='ready_for_review'))process.exitCode=1;
