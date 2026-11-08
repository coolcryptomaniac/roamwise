/* Central property registry. Pending supplier details are deliberately non-payable. */
export const PROPERTIES=Object.freeze({
 nanau:{name:'Nanau Resort & Spa',region:'Jim Corbett',room:'Sitabani Studio CPAI + hi-tea',rate:5500,rateInclusive:true,from:'2026-10-01',until:'2027-03-31',pocEmail:'sales@amorhospitality.in',pocPhone:'+919650432605',backupPhone:'+919997317170',supplier:'amor',markup:0.25,blackouts:[['2026-12-24','2027-01-04']],status:'conditional'},
 padma:{name:'Padma Villa',region:'Manali',room:'Royal Chamber EP',rate:5000,rateInclusive:true,from:'2026-10-01',until:'2027-03-31',pocEmail:'sales@amorhospitality.in',pocPhone:'+919650432605',backupPhone:'+919997317170',supplier:'amor',markup:0.25,blackouts:[['2026-12-18','2027-01-11']],status:'conditional'},
 aramness:{name:'Aramness Gir',region:'Gir, Gujarat',room:'One-bedroom Kothi AP',rate:72216,rateInclusive:true,from:'2026-10-16',until:'2027-02-28',pocEmail:'sales@amorhospitality.in',pocPhone:'+919650432605',backupPhone:'+919997317170',supplier:'amor',markup:0.25,blackouts:[['2026-12-18','2027-01-06']],status:'conditional',notes:'Conservation fee and safari extras excluded; advertise as exclusive deal/rack rate'},
 tattwaa:{name:'The Tattwaa Corbett Spa & Resort',region:'Corbett',room:'Forest Room',rate:null,pocEmail:'sales@amorhospitality.in',pocPhone:'+919650432605',backupPhone:'+919997317170',supplier:'amor',status:'rate_expired'},
 milan:{name:'Milan Heights',region:'Almora',rate:null,supplier:'independent',commission:0.07,status:'pending_room_rate_and_contact'},
 bigbro:{name:'Big Bro Hotel',region:'Almora',rate:null,supplier:'independent',status:'pending_rate_and_contact'},
 soulmate:{name:'Soulmate Homestay',region:'Almora',rate:null,supplier:'independent',status:'pending_rate_and_contact'},
 corbettjungle:{name:'Corbett Jungle View Homestay',region:'Lansdowne',rate:null,supplier:'independent',status:'pending_rate_and_contact'},
 woodbook:{name:'Woodbook The Devine',region:'Banjar, Kullu',rate:null,supplier:'independent',status:'pending_tax_terms_and_contact',notes:'Historical cottage ₹5,000 / treehouse ₹6,500, verify dates, inclusions and tax'},
 hygee:{name:'Hygee Home',region:'Manali',rate:null,supplier:'independent',status:'pending_rate_and_contact'},
 himank:{name:'Himank',region:'Manali',rate:null,supplier:'independent',status:'pending_rate_and_contact'},
 waveinn:{name:'Hotel Wave Inn',region:'Sirsa',rate:null,supplier:'independent',status:'pending_rate_and_contact'}
});
const day=s=>{if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(s))return NaN;const n=Date.parse(s+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===s?n:NaN};
export function quoteStay({stay,checkin,checkout,guests=2}){
 const p=PROPERTIES[stay];if(!p)return {ok:false,error:'unknown_property'};
 const a=day(String(checkin||'')),b=day(String(checkout||'')),n=(b-a)/86400000;
 if(!Number.isInteger(n)||n<1||n>14||a<Date.now()-86400000)return {ok:false,error:'invalid_dates'};
 if(!Number.isInteger(Number(guests))||Number(guests)!==2)return {ok:false,error:'guest_pricing_pending'};
 if(p.status!=='conditional'||!Number.isFinite(p.rate))return {ok:false,error:'quote_required',property:p.name,status:p.status};
 if(checkin<p.from||checkout>p.until)return {ok:false,error:'outside_valid_tariff'};
 if((p.blackouts||[]).some(([from,until])=>checkin<until&&checkout>from))return {ok:false,error:'festive_supplement_pending'};
 const total=Math.ceil(p.rate*n*(1+p.markup));return {ok:true,stay,property:p.name,room:p.room,checkin,checkout,nights:n,guests:2,total,currency:'INR',inclusive:true,advance:Math.ceil(total*.25),full:total,confirmation:'pending_supplier',extrasNote:p.notes||'Optional extras not included'};
}
export function publicCatalog(){return Object.entries(PROPERTIES).map(([id,p])=>({id,name:p.name,region:p.region,room:p.room||null,bookingStatus:p.status,fromRate:p.status==='conditional'?Math.ceil(p.rate*(1+p.markup)):null,rateInclusive:p.rateInclusive===true,notes:p.notes||null}))}
