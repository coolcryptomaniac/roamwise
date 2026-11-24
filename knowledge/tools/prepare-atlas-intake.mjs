/* Deterministic, offline candidate generation. No paid model, remote writes,
 * approval, image generation or scraped content. Existing rows are never overwritten. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {TUSK_ATLAS} from '../../worker/data/tusk-travel-atlas.js';
import {WORLD_ATLAS} from '../../worker/data/tusk-world-atlas.js';
const q=v=>"'"+String(v).replace(/'/g,"''")+"'";
const json=v=>q(JSON.stringify(v));
export function prepareIntake(at=new Date().toISOString()){
 if(!Number.isFinite(Date.parse(at)))throw Error('Invalid date');
 const seen=new Set(), rows=[], sql=[], translations=[];
 for(const d of [...TUSK_ATLAS,...WORLD_ATLAS]){
  if(!/^[a-z0-9-]{1,96}$/.test(d.id)||seen.has(d.id))throw Error('Duplicate/invalid atlas ID '+d.id);
  seen.add(d.id);
  const country=d.countryIso||'IN', candidate={sourcePage:d.sourcePage,sourceStatus:d.status,summary:d.summary,highlights:d.highlights,food:d.foodSuggestions,itinerary:d.suggestedItinerary,reviewed:false};
  if(!/^[A-Z]{2}$/.test(country)||new URL(d.sourcePage).protocol!=='https:')throw Error('Invalid candidate');
  rows.push({id:d.id,name:d.name,country,source:d.sourcePage});
  sql.push("INSERT INTO public_destination(id,slug,name,country_iso,region,status,indexed,created_at,updated_at) VALUES("+[d.id,d.id,d.name,country,d.region,'candidate'].map(q).join(',')+",0,"+q(at)+","+q(at)+") ON CONFLICT(id) DO NOTHING;");
  function queue(kind,locale,payload){
   const id=[d.id,kind,locale,'v1'].join(':');
   sql.push("INSERT INTO public_editorial_intake(id,destination_id,kind,locale,candidate_json,status,created_at) VALUES("+[id,d.id,kind,locale].map(q).join(',')+","+json(payload)+",'needs_review',"+q(at)+") ON CONFLICT(id) DO NOTHING;");
  }
  queue('source','en-IN',candidate);
  // Hindi itinerary scaffold is original generic text, not a translated verified guide.
  const h=d.highlights;
  const hi={locale:'hi-IN',title:d.name,reviewed:false,method:'template-draft',days:[
   {day:1,description:'आगमन के बाद '+h[0]+' के आसपास आराम से घूमने पर विचार करें।'},
   {day:2,description:h[1]+' और '+h[2]+' की यात्रा से पहले स्थानीय स्थिति और खुलने का समय जाँचें।'},
   {day:3,description:'प्रस्थान के लिए पर्याप्त समय रखें और सुबह की योजना लचीली रखें।'}]};
  translations.push({id:d.id,...hi});
  queue('translation','hi-IN',hi);
  for(const locale of ['kfy-IN','gbm-IN'])queue('translation',locale,{locale,reviewed:false,method:'native-review-required',sourceLocale:'en-IN',source:candidate});
 }
 return {sql:sql.join('\n')+'\n',rows,translations,stats:{destinations:rows.length,international:WORLD_ATLAS.length,hindiDrafts:translations.length,translationReviewJobs:translations.length*3,autoPublished:0}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const dest=path.resolve(process.argv[2]||'/tmp/roamwise-atlas-intake');
 const result=prepareIntake();fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'atlas-candidates.sql'),result.sql);
 fs.writeFileSync(path.join(dest,'candidate-index.json'),JSON.stringify(result.rows,null,2)+'\n');
 fs.writeFileSync(path.join(dest,'hindi-drafts.json'),JSON.stringify(result.translations,null,2)+'\n');
 fs.writeFileSync(path.join(dest,'intake-report.json'),JSON.stringify(result.stats,null,2)+'\n');
 console.log(JSON.stringify(result.stats));
}
