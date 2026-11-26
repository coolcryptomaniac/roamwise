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
/* Founder-listed creator: the founder chose to list an applicant from their public Instagram profile.
   Only name, Instagram, niche, town and a self-reported follower count leave the CRM; no email, phone or notes. */
const isHidden=x=>!x||x.publicVisibility==='hidden'||x.unpublished===true||x.removalRequested===true;
export function founderListedCreator(raw){
 if(isHidden(raw)||raw.seg&&raw.seg!=='creator')return null;
 const ig=instagramUrl(raw.publicInstagram||raw.instagram||raw.handle||'');
 const id=safeId(raw.publicId||raw.slug||raw.id);const name=clean(raw.publicName||raw.displayName||raw.name,90);
 if(!ig||!id||!name||/@/.test(name))return null;
 const m=raw.barter&&raw.barter.metrics||{};const followers=Math.max(0,Math.min(1e8,Math.round(Number(raw.publicFollowers||m.followers||0))||0));
 const town=clean(raw.publicTown||raw.barter&&raw.barter.location&&raw.barter.location.town||'',65);
 const niche=clean(raw.publicNiche||raw.niche||'',90);
 const r={id,name,town,niche,description:clean(raw.publicBio||'',420),instagram:ig,listing:'founder',publicApproved:true,publicConsent:false};
 if(followers)r.followers=followers;if(raw.featured===true)r.featured=true;
 return r;
}
/* Up to two banner creators: the founder's featured picks first, then the largest self-reported followings of at least 10,000. */
export function pickFeatured(list,max=2){
 return list.filter(x=>x.featured===true||(x.followers||0)>=10000).sort((a,b)=>(b.featured===true)-(a.featured===true)||(b.followers||0)-(a.followers||0)).slice(0,max).map(x=>x.id);
}
export function compileDirectory({creators=[],properties=[],artists=[]}={},{includeFounderListed=false}={}){
 const groups={creators:[],properties:[],artists:[]};const rejected={creators:0,properties:0,artists:0};
 for(const [key,type,items] of [['creators','creator',creators],['properties','property',properties],['artists','artist',artists]]){
  const seen=new Set();
  for(const raw of items){const r=publicRecord(raw,type)||(includeFounderListed&&type==='creator'?founderListedCreator(raw):null);if(!r||seen.has(r.id)){rejected[key]++;continue}seen.add(r.id);groups[key].push(r)}
  groups[key].sort((a,b)=>a.name.localeCompare(b.name));
 }
 const featured=pickFeatured(groups.creators);groups.creators.forEach(c=>{if(featured.includes(c.id))c.featured=true;else delete c.featured});
 return {directory:{updatedAt:new Date().toISOString(),publicationPolicy:includeFounderListed?'Consented profiles plus founder-listed creators (public Instagram fields only; contacts never published)':'Approved, consented professional fields only',...groups},rejected};
}
