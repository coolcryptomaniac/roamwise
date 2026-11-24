/* Public, no-key travel atlas responses. Editorial suggestions are NOT verified
 * schedules, transport fares, opening status, supplier inventory or bookings. */
import { searchTravelAtlas, TUSK_ATLAS_STATS } from '../data/tusk-travel-atlas.js';

import { searchWorldAtlas } from '../data/tusk-world-atlas.js';

const compact=x=>String(x||'').replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim();
const live=/\b(?:live|price|cost|fare|book|booking|reserve|available|availability|today|tomorrow|now|current|weather|traffic|open|closed|schedule|ticket|hotel rate)\b|अभी|आज/i;
const food=/\b(?:food|eat|dishes|cuisine|specialit(?:y|ies)|meal|restaurant|taste|local food)\b|खाना|भोजन|पकवान/i;
const people=/\b(?:people|person|famous|notable|historical figure|artist|poet|leader|historian)\b|प्रसिद्ध|व्यक्ति|कलाकार/i;
const pictures=/\b(?:photo|picture|image|photograph|gallery|visual)\b|फोटो|तस्वीर/i;
const plan=/\b(?:itinerary|itineraries|trip|travel|plan|day|days|visit|things to do|tour|route)\b|यात्रा|घूम|योजना/i;

export function atlasAnswer(question){
 const india=searchTravelAtlas(question)[0], world=searchWorldAtlas(question);
 const match=india&&world?null:india||world;
 if(!match)return null;
 const subject=compact(question),isLive=live.test(subject);
 const asksFood=food.test(subject),asksPeople=people.test(subject),asksPhoto=pictures.test(subject),asksPlan=plan.test(subject);
 // The atlas is a discovery source, not a live commercial or safety provider.
 const bits=[match.name+' — '+match.summary];
 if(asksFood)bits.push('Regional food ideas: '+match.foodSuggestions.join(', ')+'. Ask locally about preparation and availability.');
 if(asksPeople)bits.push(match.people.length?'Notable people: '+match.people.map(p=>p.name+' ('+p.context+')').join('; ')+'.':'No sourced notable-person profile has been reviewed for this destination yet.');
 if(asksPhoto)bits.push('Photo reference is available on the source page; image reuse rights have not been cleared.');
 if(asksPlan)bits.push('Three-day editorial itinerary starter; adjust stops to the actual dates, mobility needs, local conditions and verified opening information.');
 if(!asksPlan&&!asksFood&&!asksPeople&&!asksPhoto)bits.push('Potential attractions: '+match.highlights.join(', ')+'.');
 if(isLive)bits.push('This atlas cannot confirm live prices, availability, weather, travel conditions or booking status.');
 const source=match.status==='source-backed-overview'?'RoamWise source-backed destination overview':'RoamWise editorial destination lead';
 return {
  available:true,route:'atlas',source,knowledgeClass:match.status,
  summary:bits.join(' ').slice(0,650),
  checkedAt:match.checkedAt,requiresLiveVerification:true,
  hits:[{title:match.name+(match.sourceType==='unreviewed-travel-reference'?' — travel reference (review pending)':' — government tourism reference'),description:'Open source and verify local details before travel',url:match.sourcePage,source:match.sourceType==='unreviewed-travel-reference'?'Travel reference — editorial lead':match.status==='source-backed-overview'?'Government tourism guide':'Tourism directory — editorial lead'}],
  atlas:{
    id:match.id,name:match.name,region:match.region,status:match.status,
    itinerary:match.suggestedItinerary.map(d=>({day:d.day,description:compact(d.description)})),
    food:match.foodSuggestions.map(compact),
    people:match.people.map(p=>({name:compact(p.name),context:compact(p.context)})),
    highlights:match.highlights.map(compact),
    facts:match.facts.map(compact),
    photo:{referencePage:match.photo.referencePage,rights:'not-cleared',displayAllowed:false}
  },
  cache:'none'
 };
}
export const atlasStats=()=>TUSK_ATLAS_STATS;
