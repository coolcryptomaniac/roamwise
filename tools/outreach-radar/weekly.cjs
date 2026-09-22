'use strict';
// Read-only official release discovery. No scraping people, no mail delivery,
// no credentials, no payment actions. GitHub workflow publishes the output.
const fs = require('node:fs');
const path = require('node:path');
const sources = Object.freeze([
  {company:'OpenAI',repo:'openai/openai-node',category:'technology'},
  {company:'Anthropic',repo:'anthropics/anthropic-sdk-typescript',category:'technology'}
]);
function bounded(text, limit=160){return String(text||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').slice(0,limit)}
function isOfficialRelease(item, repo, now){
  if (!item || item.draft || item.prerelease || !item.published_at) return false;
  const published=Date.parse(item.published_at);
  if(!Number.isFinite(published) || published>now.getTime()+3600000 || now.getTime()-published>15*86400000) return false;
  try {const u=new URL(item.html_url);return u.protocol==='https:'&&u.hostname==='github.com'&&u.pathname.startsWith('/'+repo+'/releases/tag/')} catch{return false}
}
async function scan({request=fetch, now=new Date()}={}){
  const signals=[],errors=[];
  for(const source of sources){
    const url='https://api.github.com/repos/'+source.repo+'/releases?per_page=8';
    try{
      const response=await request(url,{headers:{'Accept':'application/vnd.github+json','User-Agent':'roamwise-weekly-outreach-radar'},signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error('Official GitHub releases unavailable ('+response.status+')');
      const releases=await response.json();if(!Array.isArray(releases))throw Error('Unexpected releases response');
      for(const item of releases){
        if(!isOfficialRelease(item,source.repo,now))continue;
        signals.push({company:source.company,category:source.category,title:bounded(item.name||item.tag_name),url:item.html_url,publishedAt:item.published_at,source:'Official '+source.repo+' GitHub release'});
      }
    }catch(err){errors.push(source.company+': '+bounded(err.message,85))}
  }
  signals.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  return {schemaVersion:1,checkedAt:now.toISOString(),signals:signals.slice(0,12),sourceErrors:errors,note:'Official SDK release signals, not live model pricing, investor interest, verified people or personal contact data. Research additional partner and investor leads separately using primary sources.'};
}
function report(data){return [
  '### RoamWise weekly partner and technology scout',
  'Source check: '+data.checkedAt,
  '',
  ...data.signals.map(x=>'- **'+x.company+'** · '+x.title+' — '+x.url),
  ...(data.signals.length?[]:['- No new official SDK release in the last 15 days.']),
  '',
  ...data.sourceErrors.map(x=>'- Source check failed: '+x),
  '',
  'Review OpenAI for Startups https://openai.com/startups and Partner Network https://openai.com/business/partners/; Anthropic Partner Network https://claude.com/partners and Leadership https://www.anthropic.com/company/leadership.',
  'For any new **person**, manually confirm role, publicly invited professional contact route, LinkedIn identity, source date and relevance before adding to the private CRM. Do not guess emails or infer that an official partnership programme is a funding offer.',
  'Outreach is draft-only. No unsolicited bulk email, automatic send or payments.'
].join('\n')+'\n'}
async function main(){const data=await scan();const out=path.join(__dirname,'../../admin/opportunity-radar-weekly.json');fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');const md=path.join(__dirname,'../../opportunity-radar-report.md');fs.writeFileSync(md,report(data));console.log('Official release signals:',data.signals.length,'source failures:',data.sourceErrors.length);if(data.sourceErrors.length===sources.length)process.exitCode=1;}
if(require.main===module)main().catch(err=>{console.error('Weekly scan failed:',bounded(err.message));process.exitCode=1});
module.exports={bounded,isOfficialRelease,scan,report};
