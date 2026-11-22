/**
 * Small, source-reviewed PUBLIC catalog for AI discovery.
 * These are landing-page pointers, NOT live supplier inventory, prices, or
 * payment instructions. No personal contacts, owner rates or booking tokens.
 * Adding an artist image/artwork requires explicit syndication permission.
 */
const ROOT='https://www.roamwise.co.in';
export const CATALOG_VERSION='2026-11-22';
const entries=[
 {id:'natasha-guleria',type:'artist',title:'Natasha Guleria',subtitle:'Bhavitavya Kala · Himachal Pradesh',region:'Himachal Pradesh, India',description:'Artist and RoamWise public-profile collaborator; original paintings, prints and custom commissions. Confirm artwork availability and terms directly before purchase.',tags:['artist','natasha guelria','bhavitavya kala','painting','original art','himalayan','custom commission','spiritual'],url:ROOT+'/creators/natasha.html',image_url:null,partner_status:'public_profile',rights_note:'Additional third-party image syndication not yet confirmed',reviewed_at:'2026-10-18'},
 {id:'milan-heights',type:'stay',title:'Milan Heights',subtitle:'Milan Chowk · Almora',region:'Almora, Uttarakhand, India',description:'Signed RoamWise hotel partner in Almora. Room stock, dates, cancellation terms and final price must be confirmed by RoamWise and the hotel.',tags:['hotel','almora','kumaon','stay','milan heights'],url:ROOT+'/',image_url:ROOT+'/assets/property-photos/milan-heights-front.jpg',partner_status:'signed_partner',rights_note:'Existing partner-listing photograph',reviewed_at:'2026-10-18'},
 {id:'soulmate-homestay',type:'stay',title:'Soulmate Homestay',subtitle:'Kotyura · Almora',region:'Almora, Uttarakhand, India',description:'Signed RoamWise homestay listing with a cafe and garden setting. Enquire to confirm rooms, availability and full booking terms.',tags:['homestay','almora','kumaon','quiet','stay','cafe'],url:ROOT+'/',image_url:ROOT+'/assets/property-photos/soulmate-front.jpg',partner_status:'signed_partner',rights_note:'Existing partner-listing photograph',reviewed_at:'2026-10-18'},
 {id:'woodbook-the-devine',type:'stay',title:'Woodbook The Devine Homestay',subtitle:'Banjar · Tirthan Valley',region:'Banjar, Kullu, Himachal Pradesh, India',description:'Signed RoamWise homestay partner offering a treehouse and cottages. Enquire for confirmed dates, availability and the final all-inclusive price.',tags:['treehouse','banjar','tirthan valley','kullu','homestay','quiet'],url:ROOT+'/',image_url:ROOT+'/assets/property-photos/woodbook-treehouse.webp',partner_status:'signed_partner',rights_note:'Existing property-authorised listing photograph',reviewed_at:'2026-10-18'},
 {id:'big-bro-hotel',type:'stay',title:'Big Bro Hotel',subtitle:'Ghurson · Almora',region:'Almora, Uttarakhand, India',description:'RoamWise-listed hotel near Almora; enquiries for short or long stays are subject to partner confirmation. No inventory is reserved by this listing.',tags:['hotel','almora','long stay','nomad','kumaon','workation'],url:ROOT+'/',image_url:ROOT+'/assets/property-photos/big-bro-room.webp',partner_status:'founder_confirmed',rights_note:'Existing listing photograph supplied for RoamWise',reviewed_at:'2026-10-18'},
 {id:'corporate-offsites',type:'package',title:'Corporate Offsites & Retreats',subtitle:'RoamWise · Curated group experiences',region:'India',description:'Explore corporate retreat and team-offsite enquiries. Package inclusions, locations, supplier dates and final group quotes are confirmed individually.',tags:['corporate','offsite','retreat','team','package','himalaya'],url:ROOT+'/packages/',image_url:null,partner_status:'category_handoff',rights_note:'RoamWise-owned category description',reviewed_at:'2026-11-22'},
 {id:'destination-weddings',type:'package',title:'Destination Wedding Enquiries',subtitle:'RoamWise · Venues and providers',region:'India',description:'Browse curated venue and wedding-provider introductions. No venue capacity, price or availability is guaranteed until the partner confirms.',tags:['wedding','destination wedding','venue','package','event','manali'],url:ROOT+'/packages/',image_url:null,partner_status:'category_handoff',rights_note:'RoamWise-owned category description',reviewed_at:'2026-11-22'},
 {id:'ailon-tusk',type:'assistant',title:'Ailon Tusk',subtitle:'RoamWise AI travel copilot',region:'India',description:'Explore travel ideas, discover stays and packages, and continue enquiries on the official RoamWise app. AI suggestions are not paid or confirmed reservations.',tags:['ai','travel copilot','ailon tusk','trip planner','packages','booking','itinerary','voice'],url:ROOT+'/',image_url:null,partner_status:'roamwise_service',rights_note:'RoamWise-owned service information',reviewed_at:'2026-11-22'}
];
const validType=new Set(['artist','stay','package','assistant']);
const safeLower=v=>String(v||'').toLocaleLowerCase('en').trim();
export function publicCatalog(){return entries.map(item=>({...item,booking_mode:['stay','package'].includes(item.type)?'assisted_enquiry':'external_handoff',availability_verified:false,price_verified:false,payment_started:false,booking_confirmed:false}));}
export function publicItem(id){return publicCatalog().find(i=>i.id===safeLower(id))||null;}
export function publicSearch({q='',type='',region='',limit=6}={}){
 if(typeof q!=='string'||q.length>120||typeof region!=='string'||region.length>100||!Number.isInteger(Number(limit)))throw new Error('invalid_search');
 if(type&&!validType.has(type))throw new Error('invalid_type');
 const max=Math.max(1,Math.min(12,Number(limit))),needle=safeLower(q),area=safeLower(region);
 const tokens=needle.split(/\s+/).filter(Boolean);
 const ranked=publicCatalog().filter(i=>(!type||i.type===type)&&(!area||safeLower(i.region+' '+i.subtitle).includes(area))).map(i=>{
  const hay=safeLower([i.title,i.subtitle,i.region,i.description,...i.tags].join(' '));
  const match=tokens.every(t=>hay.includes(t));
  const score=(safeLower(i.title).includes(needle)&&needle?4:0)+tokens.filter(t=>safeLower(i.title+' '+i.subtitle).includes(t)).length*2;
  return {item:i,match,score};
 }).filter(x=>x.match).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title));
 return {version:CATALOG_VERSION,count:ranked.length,items:ranked.slice(0,max).map(x=>x.item),disclaimer:'Discovery listings only; no live room or artwork stock, verified quote, booking confirmation or payment. Follow official URLs and request a current quote.'};
}
export function toCard(item){
 return {id:item.id,title:item.title,subtitle:item.subtitle,image_url:item.image_url,url:item.url,category:item.type,region:item.region,booking_mode:item.booking_mode,partner_status:item.partner_status,availability_verified:false,price_verified:false};
}
