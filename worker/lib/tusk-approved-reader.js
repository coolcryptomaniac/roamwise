/* Optional service binding only. No public external URL, secrets, or full chat. */
export async function approvedDestinationAnswer(env,atlas){
 if(!env.PUBLIC_KNOWLEDGE_READER||!atlas?.atlas?.id)return null;
 const slug=atlas.atlas.id;
 if(!/^[a-z0-9-]{1,96}$/.test(slug))return null;
 try{
  const response=await env.PUBLIC_KNOWLEDGE_READER.fetch('https://knowledge.internal/v1/destinations/'+slug,{method:'GET',signal:AbortSignal.timeout(1800)});
  if(!response.ok)return null;
  const d=await response.json();
  if(d.slug!==slug||!d.humanReviewedAt||typeof d.summary!=='string'||!d.summary.trim())return null;
  return {available:true,route:'curated',source:'RoamWise reviewed D1 knowledge',summary:d.summary.slice(0,650),checkedAt:d.sourceCheckedAt||d.humanReviewedAt,requiresLiveVerification:true,hits:[{title:atlas.atlas.name+' — editorial reference',url:atlas.hits[0].url,description:'Confirm live details before travel',source:'Travel reference'}],cache:'none'};
 }catch(_){return null;}
}
