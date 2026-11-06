// Consent-first matching briefs: proposals, never implied contractual collaborations.
// Public professional profiles must be verified against the creator database.
export const AMOR_CREATOR_BRIEFS=Object.freeze([
 {propertyId:'p_amor_tattwaa',region:'Jim Corbett / Ramnagar',radiusKm:100,creatorNiches:['wedding photography','travel reels','wellness','local culture'],offSeasonFirst:true,required:'Property event/creator rules and rights clearance',deliverables:['1 reel','5 cleared photos','referral tracking']},
 {propertyId:'p_amor_nanau',region:'Jim Corbett / Ramnagar',radiusKm:100,creatorNiches:['wellness','yoga','couples travel','nature photography'],offSeasonFirst:true,required:'Pet, spa, wellness shoot approvals',deliverables:['1 reel','5 cleared photos','referral tracking']},
 {propertyId:'p_amor_padma',region:'Manali / Naggar',radiusKm:100,creatorNiches:['honeymoon photography','intimate weddings','mountain travel','travel fashion'],offSeasonFirst:true,required:'Villa exclusivity, decor and content rights',deliverables:['1 reel','5 cleared photos','referral tracking']},
 {propertyId:'p_amor_aramness',region:'Gir / Sasan',radiusKm:100,creatorNiches:['luxury travel','wildlife photography','honeymoon editorial'],offSeasonFirst:true,required:'Park filming permissions and luxury brand-use rights',deliverables:['1 reel','5 cleared photos','referral tracking']}
]);
export function rankCreatorFit(creator,brief){
 if(!creator?.professionalProfilePublic||!creator?.optedIntoMatching)return null;
 const niche=String(creator.niche||'').toLowerCase(),location=String(creator.region||'').toLowerCase();
 let score=0;for(const n of brief.creatorNiches){if(niche.includes(n.toLowerCase()))score+=30}
 if(location.includes(brief.region.split('/')[0].trim().toLowerCase()))score+=25;
 const km=Number(creator.distanceKm);if(Number.isFinite(km)&&km>=0&&km<=brief.radiusKm)score+=30;
 if(creator.offSeasonAvailable===true)score+=10;
 return {creatorId:creator.id,propertyId:brief.propertyId,score,needsCreatorConsent:true,needsPropertyApproval:true};
}
