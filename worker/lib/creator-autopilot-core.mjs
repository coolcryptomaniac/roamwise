/* RoamWise Creator Autopilot — deterministic policy brain, no network or side effects.
 * Any model can suggest actions; this module decides which actions are permissible.
 * Safe default: draft_only, never automatic sending or monetary commitments.
 */
const clean = v => String(v == null ? '' : v).trim();
const norm = v => clean(v).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v));
const key = (...v) => v.map(norm).join('|');
export const DEFAULT_POLICY = Object.freeze({
  mode: 'draft_only', maxDraftsPerRun: 40, maxMessagesPerDay: 0,
  cooldownDays: 30, requireOptIn: true, requireHumanApproval: true,
  allowPaidCommitments: false, allowProfileWrites: false,
  maxLeadAgeDays: 365, maxSpendRupees: 0
});
export function assessCreator(creator = {}, property = {}, history = [], policy = DEFAULT_POLICY, now = Date.now()) {
  const reasons = [];
  const email = clean(creator.email).toLowerCase();
  const town = norm(creator.town || creator.city || creator.barter?.location?.town);
  const place = norm(property.town || property.city || property.location?.town);
  const creatorId = clean(creator.id || creator.uid || email);
  const propertyId = clean(property.id);
  if (!validEmail(email)) reasons.push('missing_valid_email');
  if (!creatorId || !propertyId) reasons.push('missing_record_id');
  if (!town || !place || town !== place) reasons.push('no_verified_locality_match');
  if (property.creatorMatching?.enabled !== true || property.status === 'closed') reasons.push('property_not_open');
  if (creator.stage === 'declined' || creator.status === 'blocked') reasons.push('creator_not_eligible');
  if (creator.unsubscribed === true || creator.doNotContact === true || creator.suppressed === true) reasons.push('suppressed');
  if (policy.requireOptIn && creator.outreachConsent !== true) reasons.push('consent_unverified');
  if (creator.emailVerified === false) reasons.push('email_unverified');
  const last = history.filter(x => key(x.creatorId,x.propertyId) === key(creatorId,propertyId) && ['sent','queued','approved'].includes(x.status))
    .sort((a,b) => Date.parse(b.at||0)-Date.parse(a.at||0))[0];
  if (last && now-Date.parse(last.at) < policy.cooldownDays*86400000) reasons.push('cooldown_active');
  const dedupeKey = key(creatorId,propertyId,'creator_intro');
  return {creatorId,propertyId,email,dedupeKey,eligible:reasons.length===0,reasons,
    proposedAction:'draft_outreach',requiresHumanApproval:true,
    confidence:town && town===place ? 'same_town' : 'unknown',
    paidCommitmentAllowed:false};
}
export function planOutreach(creators = [], properties = [], history = [], policy = DEFAULT_POLICY, now = Date.now()) {
  const queue=[], blocked=[],seen=new Set();
  for (const p of properties) for (const c of creators) {
    const result=assessCreator(c,p,history,policy,now);
    if (seen.has(result.dedupeKey)) continue;
    seen.add(result.dedupeKey);
    if (result.eligible && queue.length < policy.maxDraftsPerRun) queue.push(result);
    else if (result.reasons.length) blocked.push(result);
  }
  return {mode:'draft_only',generatedAt:new Date(now).toISOString(),queue,blocked,
    counters:{drafts:queue.length,blocked:blocked.length,sent:0,paidCommitments:0},
    approvalRequired:true};
}
export function decideAction(action = {}, policy = DEFAULT_POLICY) {
  const type=clean(action.type);
  if (['send_email','send_whatsapp','send_sms','pay_creator','refund','book_property','verify_creator','change_role','delete_record','publish_content'].includes(type))
    return {allowed:false,reason:'requires_separate_authenticated_approval_and_audited_executor'};
  if (type === 'draft_outreach' || type === 'summarize_inbox' || type === 'suggest_match' || type === 'review_maintenance')
    return {allowed:true,execution:'read_only_or_draft'};
  return {allowed:false,reason:'unrecognized_action'};
}
