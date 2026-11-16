/* Tusk knowledge lifecycle: immutable VERSIONED records versus expiry of an
   answer. "Evergreen" means source anchors survive deployments, NOT that
   airport codes, borders, time zones, visas or museum hours never change.
   All classification happens before public cache/vector lookup. */
export const KNOWLEDGE_POLICY_VERSION=1;
export const KNOWLEDGE_BUCKETS=Object.freeze({
 anchor:{ttlSeconds:604800,reviewDays:365,vectorEligible:true},
 reference:{ttlSeconds:86400,reviewDays:90,vectorEligible:true},
 policy:{ttlSeconds:0,reviewDays:1,vectorEligible:false},
 dynamic:{ttlSeconds:0,reviewDays:0,vectorEligible:false},
 private:{ttlSeconds:0,reviewDays:0,vectorEligible:false}
});
const PRIVATE=/(?:\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:\+?\d[\d\s().-]{9,}\d)\b|\b(?:my|our)\s+(?:booking|account|refund|payment|wallet|ticket|reservation|hotel|stay|itinerary|trip history)\b|\b(?:password|otp|private key|access token|api key|upi pin)\b)/i;
const LIVE=/(?:\b(?:now|today|tomorrow|tonight|latest|current|currently|right now|open now|available|availability|bookable|booking status|live|urgent|delay|cancelled|strike|closed today|forecast|storm|flood|landslide|traffic|road closed|air quality|aqi|flight fare|train fare|ticket price|exchange rate|currency rate|seat|occupancy|inventory|stock|cashfree|buy now|checkout|order status)\b|aaj|abhi|आज|अभी|मौसम आज|अभी खुला|ಈಗ|ಇಂದು)/i;
const POLICY=/(?:\b(?:visa|passport validity|passport rules?|entry requirements?|vaccination requirements?|customs duty|travel advisory|travel advisories|travel warnings?|permit requirements?|driving regulation|travel ban|tax rules?|gst rules?)\b|वीजा|पासपोर्ट नियम|ಪ್ರವೇಶ ನಿಯಮ)/i;
const OPERATIONAL=/(?:\b(?:book|packages?|hoodies?|prices?|costs?|fares?|rates?|rentals?|room rates?|museum hours?|opening hours?|timings?|operating hours?|train schedule|bus schedule|flight schedule|timetable|departure|arrival time|reservation|purchase|buy|order|checkout|shop|hoodie|tote|headband|package deal|hotel rate|safari permit price|festival date|this week|this month|202[7-9] date)\b|कितने रुपये|किराया|कीमत|दाम|बुक|खरीद|पैकेज|ಹಣ|ದರ|ದರಗಳು)/i;
const ANCHOR=/(?:\b(?:where is|where was|geograph(?:y|ic|ical)|mountain range|river source|history of|historical|founded in|constructed in|heritage|architecture|ancient|cultural heritage|which deity|origin of|tradition|traditional cuisine|native language|located in|which state|world heritage)\b|कहाँ है|इतिहास|इतिहास क्या|भूगोल|संस्कृति|परंपरा|ಇತಿಹಾಸ)/i;
const REFERENCE=/(?:\b(?:airport code|iata|icao|time zone|timezone|standard time|plug type|socket|voltage|electricity|highway|border|national park boundary|typical climate|rainy season|best season|language spoken|official language|road network|railway route|distance|driving side|maps?)\b|मौसम आम तौर|औसत मौसम|भाषा|हवाईअड्डा कोड)/i;
export function classifyKnowledgeQuestion(question){
 const q=String(question||'').normalize('NFKC').trim();
 if(!q || PRIVATE.test(q))return {bucket:'private',reason:'personal_or_empty',...KNOWLEDGE_BUCKETS.private};
 if(POLICY.test(q))return {bucket:'policy',reason:'regulation_can_change',...KNOWLEDGE_BUCKETS.policy};
 if(LIVE.test(q)||OPERATIONAL.test(q)||(/\b20(?:2[7-9]|[3-9]\d)\b/.test(q)&&/\b(?:date|festival|calendar|holiday|diwali|eid|holi)\b/i.test(q)))return {bucket:'dynamic',reason:'operational_or_price',...KNOWLEDGE_BUCKETS.dynamic};
 if(ANCHOR.test(q))return {bucket:'anchor',reason:'historical_or_physical_anchor',...KNOWLEDGE_BUCKETS.anchor};
 if(REFERENCE.test(q))return {bucket:'reference',reason:'slow_but_can_change',...KNOWLEDGE_BUCKETS.reference};
 return {bucket:'reference',reason:'unknown_requires_review',...KNOWLEDGE_BUCKETS.reference};
}
