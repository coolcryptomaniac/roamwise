/* ============================================================================
   RW_TRUST_BADGES — the RoamWise trust ladder
   ============================================================================
   NAMING PRINCIPLE: every tier name says HOW it was earned, not how good we
   think it is. "Certified" tells you nothing; "We've Slept Here" tells you
   exactly what happened. That specificity is what makes a badge believable —
   and it's very hard for a competitor to copy, because they'd have to
   actually go.

   Ordered lowest to highest trust.
   ========================================================================= */
window.RW_TRUST_BADGES = {
  partner: {
    id:'partner', label:'Signed RoamWise Partner', short:'Signed Partner', icon:'\u2705',
    color:'#5EEAD4',
    means:'The property has signed with RoamWise. Ask the property to confirm current availability, rates, taxes and booking terms.',
    earn:'Property agreement recorded; booking details are confirmed directly with the property.' },

  listed: {
    id:'listed', label:'On Our Radar', short:'Radar', icon:'\ud83d\udcdd',
    color:'#8B93A7',
    means:'We found it, checked the reviews, and think it looks good. We have not been.',
    earn:'Researched by the RoamWise team.' },

  verified: {
    id:'verified', label:'Verified Real', short:'Verified', icon:'\u2713',
    color:'#5EEAD4',
    means:'Someone confirmed this place exists, the prices are what they say, and the owner is real.',
    earn:'Phone or in-person verification, plus a price check.' },

  slept: {
    id:'slept', label:'We\u2019ve Slept Here', short:'Slept Here', icon:'\ud83c\udf19',
    color:'#4ADE80',
    means:'A RoamWise person actually stayed the night and would go back.',
    earn:'An overnight stay by our team or a paid verifier, written up honestly.' },

  loved: {
    id:'loved', label:'Traveller Loved', short:'Loved', icon:'\ud83d\udc9b',
    color:'#E8BA6C',
    means:'Ten or more RoamWise travellers went, and nearly all of them said go.',
    earn:'10+ completed bookings with 90%+ would-return feedback.' },

  signature: {
    id:'signature', label:'RoamWise Signature', short:'Signature', icon:'\u25c8',
    color:'#A78BFA',
    means:'The best of what India does. We would send our own family here.',
    earn:'Slept Here + Traveller Loved + a full year without a serious complaint.' },

  green: {
    id:'green', label:'Runs on Sunshine', short:'Solar', icon:'\u26a1',
    color:'#4ADE80',
    means:'Solar powered, water reused, no single-use plastic \u2014 and we have seen the bills.',
    earn:'Evidence checked: solar setup photographed, electricity bill seen.' },

  checked: {
    id:'checked', label:'RoamWise Checked', short:'Checked', icon:'\u2705',
    color:'#5EEAD4',
    means:'Signed agreement on file, a booking route that works, and photos shared by the host. This is a paperwork check, not an inspection.',
    earn:'Automatic: signed MOU, working booking route and at least one photo.' },

  gst: {
    id:'gst', label:'GST Verified', short:'GST', icon:'\ud83e\uddfe',
    color:'#60A5FA',
    means:'The property gave a GST number and RoamWise confirmed it on the GST portal, so the stay can show GST on its bill.',
    earn:'GSTIN checked on the GST portal by a RoamWise admin.' },

  trusted: {
    id:'trusted', label:'RoamWise Trusted', short:'Trusted', icon:'\ud83d\udee1\ufe0f',
    color:'#E8BA6C',
    means:'Passed our full paperwork checklist: signed agreement, working booking route, photos, published cancellation terms, verified GST and payout details.',
    earn:'Automatic: Checked plus a checklist score of 80 or more.' },

  local: {
    id:'local', label:'Family Run', short:'Family', icon:'\ud83c\udfe1',
    color:'#F0A63B',
    means:'Owned and run by the family who lives there. Your money stays in the village.',
    earn:'Ownership confirmed \u2014 not a chain, not a manager, not an aggregator.' }
};

/* The collections travellers browse by — names that promise something. */
window.RW_COLLECTIONS = [
  { id:'c_signature', badge:'signature', title:'RoamWise Signature',
    tagline:'The ones we\u2019d send our own family to.' },
  { id:'c_slept', badge:'slept', title:'We\u2019ve Slept Here',
    tagline:'No guesswork. We stayed the night.' },
  { id:'c_green', badge:'green', title:'Runs on Sunshine',
    tagline:'Solar, water-wise, and we\u2019ve seen the bills.' },
  { id:'c_local', badge:'local', title:'Family Run',
    tagline:'Your money stays in the village.' },
  { id:'c_loved', badge:'loved', title:'Traveller Loved',
    tagline:'Ten travellers went. Nearly all said go.' }
];
