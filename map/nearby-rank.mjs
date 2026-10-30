// Pure geospatial ranking; only caller-approved public listings are eligible.
export function distanceKm(a,b){
  const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
  if(!valid(a)||!valid(b)) return null;
  const rad=Math.PI/180, dlat=(b.lat-a.lat)*rad, dlon=(b.lon-a.lon)*rad;
  const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
  return 6371.0088*2*Math.asin(Math.min(1,Math.sqrt(h)));
}
export function rankNearby(origin, listings, radiusKm=25){
  if(!Number.isFinite(radiusKm)||radiusKm<=0||radiusKm>500) throw new RangeError('Invalid radius');
  return (Array.isArray(listings)?listings:[]).filter(p=>p&&p.publicApproved===true&&p.consent===true)
    .map(p=>({...p,distanceKm:distanceKm(origin,p)}))
    .filter(p=>p.distanceKm!==null&&p.distanceKm<=radiusKm)
    .sort((a,b)=>a.distanceKm-b.distanceKm||String(a.id).localeCompare(String(b.id)));
}
