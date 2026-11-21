/* Corporate retreat planner. No cash wallet, booking or supplier-price authority.
   Figures and promotional bonus ceilings are indicative until an approved quote.
   All money calculations are INR rupees excluding tax collected for remittance. */
export const BONUS_TIERS = Object.freeze([
  {min:0,rate:0,label:'Custom enquiry'},
  {min:500000,rate:3,label:'Team'},
  {min:1000000,rate:7,label:'Growth'},
  {min:2000000,rate:25,label:'Scale'},
  {min:5000000,rate:30,label:'Enterprise'},
  {min:10000000,rate:35,label:'Strategic'}
]);
export const MIN_CASH_PROFIT_PCT = 10;
export const VENUES = Object.freeze([
  {id:'tattwaa',name:'The Tattwaa Corbett Spa & Resort',area:'Corbett',region:'Corbett',keys:60,guests:null,status:'Enquiry only · commercial sign-off pending',url:'https://www.tattwaa.com/',kind:'Forest resort',note:'60 listed keys; meeting layout and exclusive inventory require confirmation'},
  {id:'nanau',name:'Nanau Resort & Spa',area:'Corbett',region:'Corbett',keys:23,guests:null,status:'Enquiry only · commercial sign-off pending',url:'https://nanauresort.com/',kind:'Boutique forest',note:'23 listed keys; useful for leadership or a multi-property cluster'},
  {id:'padma',name:'Padma Villa',area:'Manali',region:'Manali',keys:6,guests:12,status:'Enquiry only · commercial sign-off pending',url:'https://www.instagram.com/padmavillamanali/',kind:'Private villa',note:'6 keys; up to 12 people on standard sharing, pending confirmation'},
  {id:'woodbook',name:'Woodbook The Devine',area:'Banjar / Tirthan',region:'Manali',keys:5,guests:14,status:'Signed stay partner · group facilities unverified',url:'https://thedevinehomestay.com/',kind:'Mountain hideaway',note:'5 rooms; listed maximum 12–14 guests'},
  {id:'jungle',name:'Corbett Jungle View Homestay',area:'Lansdowne',region:'Lansdowne',keys:6,guests:12,status:'Founder-introduced enquiry · approval pending',url:'https://roamwise.co.in/stay/',kind:'Village homestay',note:'6 rooms; 12 listed guests'},
  {id:'bigbro',name:'Big Bro Hotel',area:'Almora',region:'Almora',keys:null,guests:null,status:'Signed stay partner · capacity unverified',url:'https://roamwise.co.in/stay/',kind:'Hill hotel',note:'Four rooms in long-stay programme; total retreat capacity not verified'}
]);
/* Publicly researched sourcing prospects, not RoamWise inventory, endorsed partners
   or available conference space. Their own pages are the only source for claims. */
export const SOURCING_LEADS = Object.freeze([
  {id:'anantum',name:'Anantum Gateway Resorts & Spa',area:'Corbett',region:'Corbett',keys:172,guests:null,seats:300,
   status:'Outside RoamWise network · source and contract required',kind:'Large convention resort',
   url:'https://www.anantumgatewayresorts.com/',note:'Official corporate brochure: 172 rooms; site advertises an Avednam conference hall for 300, seating layout to verify'},
  {id:'corbettgrand',name:'Corbett The Grand',area:'Corbett',region:'Corbett',keys:150,guests:null,seats:null,
   status:'Outside RoamWise network · source and contract required',kind:'Large forest resort',
   url:'https://corbettthegrand.com/',note:'Official website says 150+ rooms, conference facilities; inventory and meeting layout require direct enquiry'},
  {id:'baagh',name:'Resorts By The Baagh',area:'Corbett',region:'Corbett',keys:90,guests:null,seats:600,
   status:'Outside RoamWise network · source and contract required',kind:'Event-focused forest resort',
   url:'https://www.resortsbythebaagh.com/',note:'Public 90-room listing; resort says Hornbill Nest hall holds 600; event seating is not overnight bed capacity'},
  {id:'tribhav',name:'TRIBHAV Rohtang Heights Resort',area:'Manali',region:'Manali',keys:null,guests:null,seats:200,
   status:'Outside RoamWise network · source and contract required',kind:'Manali meeting resort',
   url:'https://tribhav.com/rohtangheights',note:'Official site advertises a 200-person conference hall; bedroom inventory unverified'}
]);
export function tierFor(amount) {
  const cash = Number(amount);
  if (!Number.isFinite(cash) || cash < 0) throw new Error('Enter a non-negative amount.');
  return BONUS_TIERS.reduce((current,t) => cash >= t.min ? t : current, BONUS_TIERS[0]);
}
export function bonusIllustration(amount) {
  const paid = Math.round(Number(amount));
  const tier = tierFor(paid);
  const ceiling = Math.floor(paid * tier.rate / 100);
  return {paid, tier:tier.label, rate:tier.rate, bonusCeiling:ceiling, illustrativeValue:paid+ceiling};
}
export function estimateRetreat({employees,nights,perPerson,sharing=2}) {
  const count = Number(employees), days = Number(nights), pp = Number(perPerson), roomShare = Number(sharing);
  if (!Number.isInteger(count) || count < 1 || count > 10000) throw new Error('Employees must be between 1 and 10,000.');
  if (!Number.isInteger(days) || days < 1 || days > 30) throw new Error('Nights must be between 1 and 30.');
  if (!Number.isFinite(pp) || pp < 1000 || pp > 1000000) throw new Error('Enter a realistic total budget per person.');
  if (![1,2,3].includes(roomShare)) throw new Error('Choose room sharing.');
  return {employees:count,nights:days,perPerson:pp,roomsNeeded:Math.ceil(count/roomShare),total:Math.round(count*pp)};
}
export function checkCapacity(venue,employees,sharing=2) {
  const roomsNeeded = Math.ceil(employees/sharing);
  if (venue.guests != null && venue.guests < employees) return 'Too small for one venue';
  if (venue.keys == null) return 'Capacity must be verified';
  if (roomsNeeded > venue.keys) return 'Needs additional properties';
  return 'Potential room fit · unverified';
}
export function matchVenues(employees,sharing=2,destination='Any') {
  const location = String(destination||'Any').toLowerCase();
  return VENUES.filter(v => location === 'any' || v.region.toLowerCase() === location)
    .map(v => ({...v,capacity:checkCapacity(v,employees,sharing)}))
    .sort((a,b) => (a.capacity.startsWith('Potential')?0:1)-(b.capacity.startsWith('Potential')?0:1));
}
/* Approved-quote guard: includes all fulfilment, supplier, ops and variable
   servicing expenses; refundable principal and GST liability are NOT revenue. */
export function testProfit({cashCollected,supplierCosts,operatingCosts=0,extraCosts=0,minProfitPct=MIN_CASH_PROFIT_PCT}) {
  const inputs = [cashCollected,supplierCosts,operatingCosts,extraCosts,minProfitPct].map(Number);
  if (inputs.some(v => !Number.isFinite(v) || v < 0)) throw new Error('All inputs must be finite and non-negative.');
  const [cash,supplier,ops,extras,target] = inputs;
  if (cash <= 0 || target > 100) throw new Error('Invalid cash or profit target.');
  const cost = supplier + ops + extras;
  const profit = cash-cost;
  return {profit,profitPct:100*profit/cash,maxAllInCost:cash*(1-target/100),passes:profit+0.000001 >= cash*target/100};
}
export function requiredFaceCostCeiling({cash,bonus,opsPct=0,minProfitPct=MIN_CASH_PROFIT_PCT}) {
  const vals=[cash,bonus,opsPct,minProfitPct].map(Number);
  if(vals.some(v=>!Number.isFinite(v)||v<0)) throw new Error('Invalid costs.');
  const [paid,extra,ops,target]=vals;
  if(paid<=0||target>100||ops>=100) throw new Error('Invalid pricing parameters.');
  const face=paid+extra;
  const maxSupplier=paid*(1-(target+ops)/100);
  return {face,maxSupplierCost:maxSupplier,maximumSupplierCostPercentOfFace:100*maxSupplier/face,minimumSupplierSavingPercent:100*(1-maxSupplier/face)};
}
export function bonusAllowed({cash,facePrice,supplierCost,operatingCost=0,extraCost=0,minProfitPct=MIN_CASH_PROFIT_PCT}) {
  const res=testProfit({cashCollected:cash,supplierCosts:supplierCost,operatingCosts:operatingCost,extraCosts:extraCost,minProfitPct});
  return {approved:res.passes && facePrice>=cash,profit:res.profit,profitPct:res.profitPct};
}
