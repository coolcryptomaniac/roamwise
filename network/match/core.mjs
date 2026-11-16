/* RoamWise public collaboration matching V1.
 * Only approved, opted-in professional listing data. Never process raw CRM,
 * personal traveller cards, confidential room rates or private identifiers.
 * This is explainable deterministic matching (not an LLM or automated outreach).
 */
export const ROLE_INFO=Object.freeze({
 creator:{name:'Travel creator',icon:'🎥',join:'/creators/match.html?role=creator&src=match-deck'},
 influencer:{name:'Influencer',icon:'📱',join:'/creators/match.html?role=creator&src=match-deck'},
 property:{name:'Stay / property',icon:'🏡',join:'/partner/join/?src=match-deck'},
 artist:{name:'Artist / musician',icon:'🎨',join:'/creators/join-artist.html'},
 yoga_teacher:{name:'Yoga / wellness guide',icon:'🧘',join:'/yoga/match.html'},
 trekking_company:{name:'Trekking company',icon:'🥾',join:'/providers/join/?category=trek'},
 trekking_guide:{name:'Trekking guide',icon:'🧭',join:'/providers/join/?category=guide'},
 travel_provider:{name:'Travel provider',icon:'🗺️',join:'/providers/join/?category=operator'},
 transport:{name:'Transport provider',icon:'🚐',join:'/providers/join/?category=transport'},
 wedding_venue:{name:'Wedding venue',icon:'💒',join:'/partner/join/?src=match-deck&wedding=1'},
 wedding_provider:{name:'Wedding professional',icon:'💐',join:'/providers/join/?category=service'},
 wedding_planner:{name:'Destination wedding planner',icon:'💍',join:'/providers/join/?category=service'},
 experience:{name:'Local experience provider',icon:'🏕️',join:'/providers/join/?category=operator'},
 traveller:{name:'Traveller / customer',icon:'🧳',join:'/'}
});
const COMPLEMENTS=Object.freeze({
 creator:['property','wedding_venue','travel_provider','trekking_company','experience','wedding_provider'],
 influencer:['property','wedding_venue','travel_provider','trekking_company','experience','wedding_provider'],
 property:['creator','influencer','artist','yoga_teacher','travel_provider','wedding_planner','wedding_provider','experience'],
 artist:['property','wedding_venue','wedding_planner','wedding_provider','experience'],
 yoga_teacher:['property','wedding_venue','travel_provider','experience'],
 trekking_company:['creator','influencer','trekking_guide','transport','travel_provider','property','experience'],
 trekking_guide:['trekking_company','transport','travel_provider','property','traveller'],
 travel_provider:['property','creator','influencer','trekking_company','trekking_guide','transport','wedding_planner','experience','traveller'],
 transport:['trekking_company','trekking_guide','travel_provider','wedding_venue','wedding_planner','property','traveller'],
 wedding_venue:['wedding_planner','wedding_provider','artist','creator','influencer','property','transport','yoga_teacher','traveller'],
 wedding_provider:['wedding_venue','wedding_planner','artist','creator','influencer','property'],
 wedding_planner:['wedding_venue','wedding_provider','artist','transport','property','travel_provider'],
 experience:['property','travel_provider','creator','influencer','yoga_teacher','trekking_company','traveller'],
 traveller:['property','travel_provider','trekking_company','trekking_guide','transport','experience','wedding_venue']
});
const TYPE_TO_ROLE=Object.freeze({
 creators:'creator',properties:'property',artists:'artist',
 influencers:'influencer',yogaTeachers:'yoga_teacher',
 trekkingCompanies:'trekking_company',trekkingGuides:'trekking_guide',
 travelProviders:'travel_provider',transportProviders:'transport',
 weddingVenues:'wedding_venue',weddingProviders:'wedding_provider',
 weddingPlanners:'wedding_planner',experiences:'experience'
});
const MAX_PUBLIC=2000;
const trim=(v,max=160)=>String(v??'').replace(/[\u0000-\u001f<>]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const list=(v,max=12)=>[...new Set((Array.isArray(v)?v:String(v||'').split(',')).map(x=>trim(x,60).toLowerCase()).filter(Boolean))].slice(0,max);
const normal=v=>trim(v,150).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu,'').replace(/\s+/g,' ');
function internalUrl(v){
 const s=String(v||'').trim();
 return s.startsWith('/')&&!s.startsWith('//')&&!/[\r\n<>"']/.test(s)&&/^\/(?:creators\/|partner\/|network\/|treks\/|providers\/|yoga\/)/.test(s)?s.slice(0,250):'';
}
function publicPortfolio(v){
 try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!u.hostname.endsWith('.local')&&u.hostname!=='localhost'&&!/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)?u.href.slice(0,450):'';}catch{return'';}
}
export function normalizePublicDirectory(data){
 const found=[],seen=new Set();
 for(const [key,role] of Object.entries(TYPE_TO_ROLE)){
  for(const p of (Array.isArray(data?.[key])?data[key]:[])){
   if(!p||p.publicApproved!==true||p.publicConsent!==true||p.matchConsent!==true||p.matchApproved!==true||p.active===false)continue;
   const id=trim(p.id,65),name=trim(p.name,95);
   if(!/^[a-z0-9_-]{3,65}$/i.test(id)||name.length<2)continue;
   const unique=role+'|'+id;
   if(seen.has(unique))continue;seen.add(unique);
   found.push({
    id,role,name,town:trim(p.town,80),region:trim(p.region||p.state,80),
    niche:trim(p.niche,120),description:trim(p.description,360),
    topics:list(p.topics||p.niches||p.tags,12),goals:list(p.goals,8),
    offers:list(p.offers||p.services,8),lookingFor:list(p.lookingFor,8),
    modes:list(p.modes||p.dealModes,5),
    destinations:list(p.destinations||p.zones,8),
    profileUrl:internalUrl(p.publicProfileUrl||''),
    portfolioUrl:publicPortfolio(p.portfolioUrl||p.website||''),
    publicStatus:'approved_for_public_matching',
    // Never copy emails, phones, contact IDs, bank/payout details, exact
    // street address, private notes, user UID or unapproved audience metrics.
   });
   if(found.length>=MAX_PUBLIC)return {profiles:found,limited:true};
  }
 }
 return {profiles:found,limited:false};
}
const intersect=(a,b)=>a.filter(x=>b.includes(x));
export function scoreFit(viewer,partner){
 const role=viewer?.role,other=partner?.role;
 if(!ROLE_INFO[role]||!ROLE_INFO[other]||!(COMPLEMENTS[role]||[]).includes(other))return null;
 if(viewer.id&&viewer.id===partner.id&&role===other)return null;
 let score=42,reasons=['Complementary professional roles'];
 const placeA=[normal(viewer.town),normal(viewer.region),...list(viewer.destinations).map(normal)].filter(Boolean);
 const placeB=[normal(partner.town),normal(partner.region),...list(partner.destinations).map(normal)].filter(Boolean);
 const commonPlace=intersect(placeA,placeB);
 if(commonPlace.length){score+=24;reasons.push('Shared destination: '+commonPlace[0]);}
 else if(!placeA.length||!placeB.length)reasons.push('Location preference needs confirmation');
 else reasons.push('Different or unconfirmed service areas');
 const topics=intersect(list(viewer.topics||viewer.niche),list(partner.topics||partner.niche));
 if(topics.length){score+=16;reasons.push('Common focus: '+topics.slice(0,2).join(', '));}
 const modes=intersect(list(viewer.modes),list(partner.modes));
 if(modes.length){score+=11;reasons.push('Shared collaboration mode: '+modes[0]);}
 else if(list(viewer.modes).length&&list(partner.modes).length)reasons.push('Commercial mode needs agreement');
 const goals=intersect(list(viewer.goals||viewer.lookingFor),list(partner.offers));
 const reverse=intersect(list(partner.goals||partner.lookingFor),list(viewer.offers));
 if(goals.length||reverse.length){score+=7;reasons.push('Offer matches a stated need');}
 return {score:Math.min(100,score),reasons,proof:'Public profile preferences, not a verified agreement'};
}
export function rankCandidates(viewer,approvedProfiles,{limit=25}={}){
 if(!ROLE_INFO[viewer?.role])return [];
 return (Array.isArray(approvedProfiles)?approvedProfiles:[]).map(profile=>{
  const fit=scoreFit(viewer,profile);
  return fit?{profile,fit}:null;
 }).filter(Boolean).sort((a,b)=>b.fit.score-a.fit.score||a.profile.name.localeCompare(b.profile.name)).slice(0,Math.max(0,Math.min(100,limit)));
}
export function buildMatchReport(directory,{date='1970-01-01',maxPairs=200}={}){
 const result=normalizePublicDirectory(directory);
 const ranked=[];
 for(const profile of result.profiles){
  const best=rankCandidates(profile,result.profiles,{limit:3});
  for(const item of best){
   if(profile.role+'|'+profile.id>=item.profile.role+'|'+item.profile.id)continue;
   ranked.push({a:{id:profile.id,role:profile.role,name:profile.name},b:{id:item.profile.id,role:item.profile.role,name:item.profile.name},
    score:item.fit.score,why:item.fit.reasons});
  }
 }
 ranked.sort((a,b)=>b.score-a.score||a.a.id.localeCompare(b.a.id));
 return {version:1,generatedFor:date,source:'network/directory.json: match/public approvals only',
  privateDataIncluded:false,automatedOutreach:false,agreementsCreated:false,
  profileCount:result.profiles.length,limited:result.limited,matchCount:ranked.length,
  matches:ranked.slice(0,maxPairs),
  note:'Suggested fit only. Both parties confirm interest, consent, specific availability, commercial terms, safety and verification before contact.'};
}
export const MATCH_IDEAS=Object.freeze([
 {forRole:'creator',withRole:'property',title:'Creator × quiet mountain stay',explanation:'Develop travel stories with a host who explicitly wants content',tags:['culture','mountains']},
 {forRole:'influencer',withRole:'travel_provider',title:'Influencer × local experience',explanation:'Introduce a licensed local experience to a relevant audience',tags:['adventure','culture']},
 {forRole:'artist',withRole:'wedding_venue',title:'Artist × destination wedding venue',explanation:'Offer original installations or live art for an appropriate event',tags:['art','wedding']},
 {forRole:'yoga_teacher',withRole:'property',title:'Yoga instructor × retreat host',explanation:'Explore a small, calm retreat when the space and group size genuinely fit',tags:['wellness','quiet']},
 {forRole:'trekking_guide',withRole:'trekking_company',title:'Guide × trekking operator',explanation:'Discuss a route, verified qualifications, safety plan and guiding terms',tags:['trekking','safety']},
 {forRole:'trekking_company',withRole:'transport',title:'Trek operator × transport partner',explanation:'Coordinate trailhead logistics with an appropriate permitted operator',tags:['trekking','transport']},
 {forRole:'wedding_planner',withRole:'wedding_venue',title:'Wedding planner × venue',explanation:'Develop a destination wedding concept with transparent capacity and costs',tags:['wedding','venue']},
 {forRole:'wedding_provider',withRole:'wedding_venue',title:'Wedding professional × venue',explanation:'Offer specific photography, decor, music or production services',tags:['wedding','services']},
 {forRole:'traveller',withRole:'experience',title:'Traveller × local experience',explanation:'Discover a small-group activity after checking safety and availability',tags:['local','experience']},
 {forRole:'transport',withRole:'travel_provider',title:'Transport × trip organiser',explanation:'Coordinate legitimate customer transport with routes and written terms',tags:['travel','transport']},
 {forRole:'property',withRole:'creator',title:'Property × creator',explanation:'Consider non-binding creative collaborations with opt-in professionals',tags:['stay','creator']}
]);
export function conceptIdeasFor(role){
 return MATCH_IDEAS.filter(x=>x.forRole===role||x.withRole===role).slice(0,10);
}
