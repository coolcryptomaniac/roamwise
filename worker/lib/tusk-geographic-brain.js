/* Geographic recognition, not invented destination facts. No private context. */
export function geographicPlaceQuery(query){
 const q=String(query||'').normalize('NFKC').trim();
 const place=q.replace(/^(?:plan (?:a )?trip to|travel to|visit|explore|guide to|where is|tell me about)\s+/i,'').replace(/[?!.]+$/,'').trim();
 if(place.length<2||place.length>80||!/^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u.test(place))return null;
 if(/\b(?:my|our|and|from|to|near|weather|price|cost|book|booking|payment|refund|private|password|otp|emergency|help|safety|visa|permit|flight|train|bus|hotel|who|what|why|how|when|today|tomorrow)\b/i.test(place))return null;
 return place;
}
export async function geographicAnswer(env,query){
 if(!env.PUBLIC_KNOWLEDGE_READER)return null;
 const place=geographicPlaceQuery(query);if(!place)return null;
 try{
  const r=await env.PUBLIC_KNOWLEDGE_READER.fetch('https://knowledge.internal/v1/places?q='+encodeURIComponent(place),{method:'GET',signal:AbortSignal.timeout(1800)});
  if(!r.ok)return null;
  const d=await r.json();
  const items=(Array.isArray(d.items)?d.items:[]).slice(0,6).filter(x=>/^[A-Z]{2}$/.test(x.country_iso)&&typeof x.name==='string'&&/^https:\/\/(?:www\.geonames\.org\/\d+\/|whc\.unesco\.org\/en\/list\/\d+\/)$/.test(x.source_url));
  if(!items.length)return null;
  const hits=items.map(x=>({title:x.name.slice(0,100)+' · '+x.country_iso+(x.admin_region?' · '+String(x.admin_region).slice(0,30):''),url:x.source_url,source:String(x.attribution||'Geographic reference').slice(0,90),description:'Geographic identity only; no reviewed itinerary or verified booking inventory.'}));
  return {available:true,route:'geographic-reference',source:'RoamWise geographic index',summary:items.length>1?'Several places match. Specify the country or region before planning; these are geographic references, not verified travel guides.':hits[0].title+' is indexed as a geographic reference. A reviewed travel guide is not available yet; verify local attractions and conditions before booking.',hits,requiresLiveVerification:true,cache:'none'};
 }catch(_){return null;}
}
