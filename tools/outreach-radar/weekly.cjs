'use strict';
// Read-only official signal discovery for the founder Growth & Intelligence tab.
// No people scraping, no email delivery, no credentials and no payment actions.
const fs = require('node:fs');
const path = require('node:path');

const releaseSources = Object.freeze([
  {company:'OpenAI',repo:'openai/openai-agents-python',category:'ai-agent'},
  {company:'OpenAI',repo:'openai/openai-agents-js',category:'ai-agent'},
  {company:'Anthropic',repo:'anthropics/claude-agent-sdk-python',category:'ai-agent'},
  {company:'Anthropic',repo:'anthropics/claude-agent-sdk-typescript',category:'ai-agent'},
  {company:'OpenAI',repo:'openai/openai-node',category:'technology'},
  {company:'Anthropic',repo:'anthropics/anthropic-sdk-typescript',category:'technology'}
]);

const collaborationRoutes = Object.freeze([
  {company:'OpenAI',title:'OpenAI for Startups',category:'collaboration',url:'https://openai.com/startups'},
  {company:'OpenAI',title:'OpenAI Partner Network',category:'collaboration',url:'https://openai.com/business/partners/'},
  {company:'Anthropic',title:'Claude Partner Network',category:'collaboration',url:'https://claude.com/partners'}
]);

const ANDROID_FEED='https://android-developers.googleblog.com/feeds/posts/default?alt=json&max-results=20';
const WINDOW_MS=15*86400000;
const DISTRIBUTION_RE=/google play|play store|discover|distribution|billing|store listing|reach|growth|monetiz|install|app quality/i;

function bounded(text, limit=180){
  return String(text||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,limit);
}
function recentDate(value,now){
  const published=Date.parse(value||'');
  return Number.isFinite(published)&&published<=now.getTime()+3600000&&now.getTime()-published<=WINDOW_MS;
}
function isOfficialRelease(item,repo,now){
  if(!item||item.draft||item.prerelease||!item.published_at||!recentDate(item.published_at,now))return false;
  try{
    const u=new URL(item.html_url);
    return u.protocol==='https:'&&u.hostname==='github.com'&&u.pathname.startsWith('/'+repo+'/releases/tag/');
  }catch{return false}
}
function officialAndroidEntries(payload,now){
  const entries=payload&&payload.feed&&Array.isArray(payload.feed.entry)?payload.feed.entry:[];
  return entries.flatMap(entry=>{
    const title=bounded(entry&&entry.title&&entry.title.$t);
    const summary=bounded(entry&&entry.summary&&entry.summary.$t,400);
    const published=entry&&entry.published&&entry.published.$t;
    if(!title||!recentDate(published,now)||!DISTRIBUTION_RE.test(title+' '+summary))return [];
    const links=Array.isArray(entry.link)?entry.link:[];
    const alt=links.find(x=>x&&x.rel==='alternate'&&/^https:/.test(String(x.href||'')));
    if(!alt)return [];
    return [{
      company:'Google Play / Android',
      category:'distribution',
      title,
      url:alt.href,
      publishedAt:published,
      source:'Official Android Developers Blog'
    }];
  });
}

async function scan({request=fetch,now=new Date()}={}){
  const signals=[],errors=[];
  for(const source of releaseSources){
    const url='https://api.github.com/repos/'+source.repo+'/releases?per_page=8';
    try{
      const response=await request(url,{headers:{'Accept':'application/vnd.github+json','User-Agent':'roamwise-growth-intelligence'},signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error('Official GitHub releases unavailable ('+response.status+')');
      const releases=await response.json();
      if(!Array.isArray(releases))throw Error('Unexpected releases response');
      for(const item of releases){
        if(!isOfficialRelease(item,source.repo,now))continue;
        signals.push({
          company:source.company,
          category:source.category,
          title:bounded(item.name||item.tag_name),
          url:item.html_url,
          publishedAt:item.published_at,
          source:'Official '+source.repo+' GitHub release'
        });
      }
    }catch(err){errors.push(source.company+' '+source.repo+': '+bounded(err.message,95))}
  }

  try{
    const response=await request(ANDROID_FEED,{headers:{'User-Agent':'roamwise-growth-intelligence'},signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error('Android Developers feed unavailable ('+response.status+')');
    signals.push(...officialAndroidEntries(await response.json(),now));
  }catch(err){errors.push('Google Play / Android: '+bounded(err.message,95))}

  const seen=new Set();
  const unique=signals.filter(x=>{
    const key=x.url||x.company+'|'+x.title;
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
  unique.sort((a,b)=>String(b.publishedAt||'').localeCompare(String(a.publishedAt||'')));

  return {
    schemaVersion:2,
    checkedAt:now.toISOString(),
    signals:unique.slice(0,30),
    collaborationRoutes:collaborationRoutes.map(x=>Object.assign({},x)),
    sourceErrors:errors,
    note:'Official public technology, agent and distribution signals plus official programme routes. A programme route is not acceptance, partnership, funding or interest. People interested in RoamWise are shown only from actual private CRM response/meeting/interest states.'
  };
}

function report(data){
  return [
    '### RoamWise growth and collaboration scout',
    'Source check: '+data.checkedAt,
    '',
    ...data.signals.map(x=>'- **'+x.company+' · '+x.category+'** · '+x.title+' — '+x.url),
    ...(data.signals.length?[]:['- No new official AI-agent, SDK or distribution signal in the last 15 days.']),
    '',
    '#### Official collaboration routes to review',
    ...data.collaborationRoutes.map(x=>'- **'+x.company+'** · '+x.title+' — '+x.url),
    '',
    ...data.sourceErrors.map(x=>'- Source check failed: '+x),
    '',
    'For any new person, manually confirm role, publicly invited professional contact route, source date and relevance before adding them to the private CRM.',
    'Do not infer that an official startup/partner programme is a funding offer, partnership acceptance or evidence that a person is interested in RoamWise.',
    'Outreach is draft-only. No unsolicited bulk email, automatic send or payments.'
  ].join('\n')+'\n';
}

async function main(){
  const data=await scan();
  const out=path.join(__dirname,'../../admin/opportunity-radar-weekly.json');
  fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
  const md=path.join(__dirname,'../../opportunity-radar-report.md');
  fs.writeFileSync(md,report(data));
  console.log('Official growth signals:',data.signals.length,'source failures:',data.sourceErrors.length);
  if(data.sourceErrors.length===releaseSources.length+1)process.exitCode=1;
}
if(require.main===module)main().catch(err=>{console.error('Growth intelligence scan failed:',bounded(err.message));process.exitCode=1});
module.exports={bounded,recentDate,isOfficialRelease,officialAndroidEntries,scan,report};
