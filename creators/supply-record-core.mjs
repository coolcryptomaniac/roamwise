// Admin-only discovery records are never implicitly public bookable listings.
export function normalizeSupplyRecord(input){
 if(!input||typeof input!=='object') throw new TypeError('Record required');
 const text=(v,max=240)=>String(v??'').trim().slice(0,max);
 const sourceUrl=text(input.sourceUrl,1024);
 if(!/^https:\/\//i.test(sourceUrl)) throw new Error('HTTPS provenance URL required');
 const name=text(input.name); if(!name) throw new Error('Name required');
 return {id:text(input.id,120),name,category:text(input.category,60),sourceUrl,
   sourceLicense:text(input.sourceLicense,120),fetchedAt:text(input.fetchedAt,40),
   status:'discovered',publicApproved:false,consent:false};
}
export function isPublicSupply(record){return Boolean(record&&record.status==='active'&&record.publicApproved===true&&record.consent===true&&record.verified===true);}
