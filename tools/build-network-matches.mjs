#!/usr/bin/env node
/* Build a safe public profile slice and a separate optional matchmaking report.
 * Strict allowlist in core.mjs: NO private CRM import, no firestore reads,
 * no scraping, payments, outreach, "verified" status inference or LLM calls.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizePublicDirectory,buildMatchReport} from '../network/match/core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
const val=(k,def='')=>{const at=args.indexOf(k);return at>=0?args[at+1]:def;};
const input=val('--source',path.join(root,'network/directory.json'));
const out=val('--out',path.join(root,'network/match/data.json'));
const reportOut=val('--report-out','');
const check=args.includes('--check');
const date=val('--date',new Date().toISOString().slice(0,10));
if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('ISO date required');
const original=JSON.parse(fs.readFileSync(input,'utf8'));
const safe=normalizePublicDirectory(original);
const payload={
 version:1,
 source:'public-network-directory-only',
 sourceUpdatedAt:typeof original.updatedAt==='string'?original.updatedAt:null,
 publicMatchingPolicy:'Only publicApproved+publicConsent+matchConsent+matchApproved. Traveller identity is never exported.',
 profiles:safe.profiles,limited:safe.limited
};
const data=JSON.stringify(payload,null,2)+'\n';
if(check){
 if(!fs.existsSync(out)||fs.readFileSync(out,'utf8')!==data){
  console.error('Public match index is out of date. Run node tools/build-network-matches.mjs');process.exitCode=1;
 }
}else{
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,data);
}
if(reportOut){
 const report=buildMatchReport(original,{date,maxPairs:300});
 fs.mkdirSync(path.dirname(reportOut),{recursive:true});
 fs.writeFileSync(reportOut,JSON.stringify(report,null,2)+'\n');
 console.log('Match suggestions:',report.matches.length,'among',report.profileCount,'opted-in public professionals. No messages or agreements.');
}
console.log('Public profiles:',safe.profiles.length,'limited:',safe.limited,'privacy-safe output:',check?'verified':out);
