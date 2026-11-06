/* RoamWise transparent stay matcher: non-AI fallback for launch.
 * No fabricated availability, ratings, prices, or partner commitments.
 * Public data only. Scores are preference fit, NOT quality verification. */
export const STAYS = Object.freeze([
 {id:'tattwaa',name:'The Tattwaa Corbett Spa & Resort',tags:['students','groups','weddings','corporate','family','forest'],area:'Corbett',url:'https://www.tattwaa.com/',slug:'Corbett Forest Escape',capacity:'60 keys'},
 {id:'nanau',name:'Nanau Resort & Spa',tags:['couples','wellness','family','forest','nature'],area:'Corbett',url:'https://nanauresort.com/',slug:'Slow Forest & Wellness',capacity:'23 keys'},
 {id:'padma',name:'Padma Villa',tags:['couples','groups','family','private','manali','longstay'],area:'Manali',url:'https://www.instagram.com/padmavillamanali/',slug:'Private Manali Escape',capacity:'6 keys; up to 12 guests on standard room sharing'},
 {id:'aramness',name:'Aramness Gir',tags:['luxury','wildlife','couples','family','gir'],area:'Gir',url:'https://www.amorhospitality.in/',slug:'Gir Wildlife Signature',capacity:'private-pool Kothis'}
]);
const synonyms={college:'students',student:'students',nmims:'students',friends:'groups',team:'corporate',office:'corporate',work:'corporate',marriage:'weddings',wedding:'weddings',romantic:'couples',honeymoon:'couples',spa:'wellness',meditation:'wellness',exclusive:'private',villa:'private',safari:'wildlife',lion:'wildlife',pet:'family'};
export function matchStays(query,{limit=4}={}){
 const words=String(query||'').toLowerCase().match(/[a-z]+/g)||[];
 const asked=new Set(words.map(w=>synonyms[w]||w));
 return STAYS.map(p=>{let matched=p.tags.filter(t=>asked.has(t));if(words.some(w=>p.area.toLowerCase()===w))matched.push(p.area.toLowerCase());
 const score=matched.length;return {...p,score,why:matched.length?'Matches: '+[...new Set(matched)].join(', '):'Ask RoamWise to personalize this itinerary',status:'Enquiry only · dates, supplier approval and final price require confirmation'};})
 .sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,limit);
}
