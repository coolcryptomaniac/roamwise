/* Pure validation for prospective corporate retreat enquiries.
   Never accepts money, creates a wallet, grants bonuses or confirms inventory. */
import {estimateRetreat} from '../../corporate/retreat-core.mjs';
export const CORPORATE_RETENTION_DAYS=365;
export const CORPORATE_CONSENT_VERSION='corporate-enquiry-2026-11';
const clean=(v,max)=>String(v==null?'':v).replace(/[\u0000-\u001f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const int=(v,min,max)=>Number.isInteger(Number(v))&&Number(v)>=min&&Number(v)<=max;
const isoDay=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))&&!isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
const PREFS=new Set(['Workshops','Nature & wellness','Team building','Fast Wi-Fi','Accessibility','Low crowd','EV transport','Dietary needs']);
export function parseCorporateLead(b){
  b=b&&typeof b==='object'&&!Array.isArray(b)?b:{};
  if(b.consent!==true)return {error:'consent_required'};
  const company=clean(b.company,100),contact=clean(b.contact,80),email=clean(b.email,160).toLowerCase();
  if(company.length<2||contact.length<2)return {error:'name_required'};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:'email_invalid'};
  let quote;
  try{quote=estimateRetreat({employees:b.employees,nights:b.nights,perPerson:b.perPerson,sharing:b.sharing});}
  catch(_){return {error:'retreat_invalid'};}
  if(!int(b.allocation,100000,100000000)||!int(b.centralSharePct,0,100)||Number(b.centralSharePct)%5!==0)return {error:'allocation_invalid'};
  const a=String(b.startDate||''),z=String(b.endDate||'');
  if(!!a!==!!z)return {error:'dates_incomplete'};
  if(a||z){
    if(!isoDay(a)||!isoDay(z))return {error:'dates_invalid'};
    const span=(Date.parse(z+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000;
    if(span!==quote.nights||a<new Date().toISOString().slice(0,10))return {error:'dates_invalid'};
  }
  const dest=String(b.destination||'Any');
  if(!['Any','Corbett','Manali','Almora','Lansdowne'].includes(dest))return {error:'destination_invalid'};
  const prefs=Array.isArray(b.preferences)?[...new Set(b.preferences)].filter(v=>PREFS.has(v)).slice(0,8):[];
  return {value:{company,contact,email,role:clean(b.role,80),phone:clean(b.phone,22),
    employees:quote.employees,nights:quote.nights,sharing:quote.roomsNeeded?Number(b.sharing):2,
    perPerson:quote.perPerson,estimate:quote.total,destination:dest,
    startDate:a,endDate:z,preferences:prefs,notes:clean(b.notes,800),
    allocation:Number(b.allocation),centralSharePct:Number(b.centralSharePct),
    source:'corporate-page',consentVersion:CORPORATE_CONSENT_VERSION}};
}
export function corporateLeadId(now,rand){return 'CR'+(now||Date.now()).toString(36).toUpperCase()+(rand||Math.random().toString(36).slice(2,7)).toUpperCase().replace(/[^A-Z0-9]/g,'X').slice(0,5);}
export function expiredCorporateLead(createdAt,now){const t=Date.parse(createdAt||'');return Number.isFinite(t)&&((now||Date.now())-t)>CORPORATE_RETENTION_DAYS*86400000;}
