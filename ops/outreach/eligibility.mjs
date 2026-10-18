const SEGMENTS = ['customer', 'property', 'creator', 'investor'];
const email = v => String(v || '').trim().toLowerCase();
const validEmail = v => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(v);
const https = v => {try {return new URL(v).protocol === 'https:';} catch {return false;}};
export function eligibleLead(lead, {now = Date.now(), sentTo = [], suppressed = []} = {}) {
  const address = email(lead.email);
  if (!validEmail(address) || !SEGMENTS.includes(lead.segment)) return {ok:false, reason:'invalid recipient or segment'};
  if (lead.ambiguous || lead.contactConflict) return {ok:false, reason:'recipient unresolved'};
  if (lead.optedOut || lead.bounced || lead.replied || lead.suppressed || lead.isAmbassador || lead.isStaff || lead.existingPartner) return {ok:false, reason:'suppressed or existing relationship'};
  if ([...sentTo, ...suppressed].some(v=>email(v) === address)) return {ok:false, reason:'already contacted or suppressed'};
  if (lead.segment === 'customer') {
    const age = Number(now) - Date.parse(lead.marketingOptInAt);
    if (lead.marketingOptIn !== true || !lead.marketingOptInEvidence || !Number.isFinite(age) || age < 0) return {ok:false, reason:'no evidenced customer marketing opt-in'};
  } else {
    const age = Number(now) - Date.parse(lead.sourceCheckedAt);
    if (!lead.publishedRouteVerified || !https(lead.emailSource) || !Number.isFinite(age) || age < -86400000 || age > 30*86400000) return {ok:false, reason:'business route needs verification'};
    if (lead.publicBusinessInbox !== true && lead.outreachApproved !== true) return {ok:false, reason:'no public business route or explicit approval'};
  }
  return {ok:true, email:address};
}
export function selectDailyBatch(leads, policy, context = {}) {
  const used = new Set((context.sentTo || []).map(email));
  const counts = Object.fromEntries(SEGMENTS.map(s=>[s,Math.max(0,Number(context.sentToday?.[s] || 0))]));
  const totalLimit = Math.min(12,Math.max(0,Number(policy.dailyTotalLimit || 0)));
  let total = Math.max(Object.values(counts).reduce((a,b)=>a+b,0),Math.max(0,Number(context.sentTodayTotal || 0)));
  const selected = [], skipped = [];
  for (const lead of leads) {
    const check = eligibleLead(lead, {...context,sentTo:[...used]});
    const cap = Math.min(3,Math.max(0,Number(policy.dailySegmentLimits?.[lead.segment] || 0)));
    if (!check.ok || total >= totalLimit || counts[lead.segment] >= cap) {skipped.push({id:lead.id,reason:check.reason || 'daily cap'});continue;}
    selected.push({...lead,email:check.email});used.add(check.email);counts[lead.segment]++;total++;
  }
  return {selected,skipped,counts,total};
}
