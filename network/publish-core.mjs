/* Safe public directory compilation. No implicit opt-in, no personal contacts. */
import {instagramUrl} from '../creators/social-links.mjs';
const clean=(x,max=180)=>String(x??'').trim().slice(0,max);
const safeId=x=>/^[a-zA-Z0-9_-]{1,90}$/.test(clean(x))?clean(x):'';
const isApproved=x=>x&&x.publicConsent===true&&x.publicApproved===true&&x.publicVisibility!=='hidden'&&x.unpublished!==true;
const url=x=>{try{const u=new URL(clean(x,500));return u.protocol==='https:'&&['roamwise.co.in','www.roamwise.co.in','www.instagram.com','instagram.com','youtube.com','www.youtube.com'].includes(u.hostname)?u.href:''}catch{return''}};
export function publicRecord(raw,type){
 if(!isApproved(raw)||!['creator','property','artist'].includes(type))return null;
 const id=safeId(raw.publicId||raw.slug);const name=clean(raw.publicName||raw.displayName||raw.name,90);
 if(!id||!name)return null;
 const town=clean(raw.publicTown||'',65),niche=clean(raw.publicNiche||raw.publicCategory||'',90),description=clean(raw.publicBio||'',420);
 const result={id,name,town,niche,description,publicApproved:true,publicConsent:true};
 if(type==='creator'){const ig=instagramUrl(raw.publicInstagram||'');if(ig)result.instagram=ig}
 const portfolio=url(raw.publicPortfolioUrl||'');if(portfolio)result.portfolioUrl=portfolio;
 return result;
}
export function compileDirectory({creators=[],properties=[],artists=[]}={}){
 const groups={creators:[],properties:[],artists:[]};const rejected={creators:0,properties:0,artists:0};
 for(const [key,type,items] of [['creators','creator',creators],['properties','property',properties],['artists','artist',artists]]){
  const seen=new Set();
  for(const raw of items){const r=publicRecord(raw,type);if(!r||seen.has(r.id)){rejected[key]++;continue}seen.add(r.id);groups[key].push(r)}
  groups[key].sort((a,b)=>a.name.localeCompare(b.name));
 }
 return {directory:{updatedAt:new Date().toISOString(),publicationPolicy:'Approved, consented professional fields only',...groups},rejected};
}
