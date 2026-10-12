/* RoamWise Nomad Match - pure matching engine.
   No network, no storage, no money. Everything here is arithmetic and wording so it can be tested
   and reused by the page, the Worker or a bot. Prices are the property's own; RoamWise never adds a fee
   to a guest total (see COMPLIANCE-FIRST-BUSINESS-MODEL.md). */

export const USD_TO_INR_APPROX = 88; /* editorial estimate for destination costs only; shown as "about" */

export const PERSONAS = Object.freeze([
  { id: 'founder', label: 'Founder', icon: '🚀', blurb: 'Calls, investors, deep focus bursts', wants: ['community', 'callRoom'], wifiBias: 1 },
  { id: 'professional', label: 'Remote professional', icon: '💼', blurb: 'Stable days, video meetings', wants: ['callRoom', 'backup'], wifiBias: 1 },
  { id: 'freelancer', label: 'Freelancer / creator', icon: '🎨', blurb: 'Light, views, flexible hours', wants: ['kitchen', 'community'], wifiBias: 0 },
  { id: 'team', label: 'Small team (2-6)', icon: '👥', blurb: 'Shared desk space, one invoice', wants: ['coworking', 'callRoom'], wifiBias: 1 },
  { id: 'maker', label: 'Writer / researcher', icon: '📚', blurb: 'Quiet first, speed second', wants: ['quiet', 'kitchen'], wifiBias: -1 }
]);

export const STAY_LENGTHS = Object.freeze([
  { id: 15, label: '15 days' }, { id: 30, label: '1 month' }, { id: 90, label: '3 months' }
]);

export const WIFI_NEEDS = Object.freeze([
  { id: 10, label: 'Light', note: 'email, chat, docs' },
  { id: 25, label: 'Video calls', note: 'Meet or Zoom daily' },
  { id: 50, label: 'Heavy', note: 'uploads, many calls' },
  { id: 100, label: 'Studio', note: 'dev, design, big files' }
]);

export const MUST_HAVES = Object.freeze([
  { id: 'backup', label: 'Power backup', icon: '🔋' },
  { id: 'desk', label: 'Proper desk and chair', icon: '🪑' },
  { id: 'callRoom', label: 'Quiet call spot', icon: '🎧' },
  { id: 'kitchen', label: 'Kitchen or meals', icon: '🍳' },
  { id: 'laundry', label: 'Laundry', icon: '🧺' },
  { id: 'coworking', label: 'Coworking on site', icon: '🏢' },
  { id: 'community', label: 'Community and events', icon: '🤝' }
]);

export const VIBES = Object.freeze([
  { id: 'mountain', label: 'Mountains', icon: '🏔️' },
  { id: 'beach', label: 'Beach', icon: '🏖️' },
  { id: 'culture', label: 'Culture and cafes', icon: '🛕' },
  { id: 'city', label: 'City energy', icon: '🏙️' },
  { id: 'nature', label: 'Forest and quiet', icon: '🌿' }
]);

/* Nomad-Ready tiers. A space earns points from what it can show; tier needs a screenshot-verified speed test,
   otherwise it is labelled self-declared. */
export const NOMAD_TIERS = Object.freeze([
  { id: 'studio', label: 'Nomad Studio', min: 80, color: '#efc56f', line: 'Built for serious work: fast, backed up, with a community' },
  { id: 'pro', label: 'Nomad Pro', min: 60, color: '#7bd8ff', line: 'Reliable for daily video calls and long stays' },
  { id: 'essential', label: 'Nomad Essential', min: 40, color: '#9ef0b4', line: 'The basics done properly: Wi-Fi, desk, power' },
  { id: 'none', label: 'Not nomad-ready yet', min: 0, color: '#8f8c9a', line: 'Close the gaps below to qualify' }
]);

function num(v, lo, hi, d) { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; }
function bool(v) { return v === true || v === 'true' || v === 1 || v === 'yes'; }
function str(v, max = 200) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max); }
function digits(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }

export function cleanBrief(raw = {}) {
  const persona = PERSONAS.some(p => p.id === raw.persona) ? raw.persona : 'professional';
  const stay = [15, 30, 90].includes(Number(raw.stay)) ? Number(raw.stay) : 30;
  const wifi = [10, 25, 50, 100].includes(Number(raw.wifi)) ? Number(raw.wifi) : 25;
  const must = (Array.isArray(raw.must) ? raw.must : []).filter(id => MUST_HAVES.some(m => m.id === id));
  const vibes = [...new Set((Array.isArray(raw.vibes) ? raw.vibes : []).filter(id => VIBES.some(v => v.id === id)))].slice(0, 3);
  return {
    persona, stay, wifi, must: [...new Set(must)], vibes,
    budget: Math.round(num(raw.budget, 8000, 250000, 40000) / 500) * 500,
    people: Math.round(num(raw.people, 1, 6, 1)),
    start: /^\d{4}-\d{2}-\d{2}$/.test(raw.start || '') ? raw.start : '',
    name: str(raw.name, 60)
  };
}

/* ---- Nomad-Ready score for one space ------------------------------------------------------------ */
export function nomadTier(space = {}) {
  const n = space.nomad || space;
  const missing = [];
  let pts = 0;
  const mbps = num(n.mbps, 0, 2000, 0);
  const speedPts = mbps >= 100 ? 30 : mbps >= 50 ? 24 : mbps >= 25 ? 16 : mbps >= 10 ? 8 : 0;
  pts += speedPts; if (speedPts < 16) missing.push('Wi-Fi of 25 Mbps or more, proven with a speed test');
  const backup = n.backup === 'full' ? 20 : n.backup === 'router' ? 12 : 0;
  pts += backup; if (backup < 20) missing.push(backup ? 'Backup for the laptop area too, not only the router' : 'Power backup (inverter or generator)');
  const desk = n.desk === 'ergonomic' ? 12 : n.desk === 'basic' ? 7 : 0;
  pts += desk; if (desk < 12) missing.push(desk ? 'An ergonomic chair and a real desk' : 'A desk and chair in the room');
  if (bool(n.callRoom)) pts += 8; else missing.push('A quiet spot for calls');
  const food = bool(n.kitchen) || bool(n.meals) ? 6 : 0; pts += food; if (!food) missing.push('Kitchen access or meals');
  if (bool(n.laundry)) pts += 4;
  if (bool(n.coworking)) pts += 10; else missing.push('A shared work area on site');
  if (bool(n.community)) pts += 6;
  if (num(n.rate30, 0, 1e7, 0) > 0) pts += 6; else missing.push('A published monthly rate');
  const verified = bool(n.verified);
  const score = Math.min(100, pts);
  const tier = NOMAD_TIERS.find(t => score >= t.min) || NOMAD_TIERS[NOMAD_TIERS.length - 1];
  return { score, tier, verified, missing, needsProof: !verified && score >= 40 };
}

/* The property's monthly rate for a stay length. Longer stays are never priced above shorter ones. */
export function ratePerMonth(space, stayDays) {
  const n = space.nomad || space;
  const r15 = num(n.rate15, 0, 1e7, 0), r30 = num(n.rate30, 0, 1e7, 0), r90 = num(n.rate90, 0, 1e7, 0);
  if (stayDays >= 90) return r90 || r30 || (r15 ? r15 * 2 : 0);
  if (stayDays >= 30) return r30 || (r15 ? r15 * 2 : 0);
  return r15 ? r15 * 2 : r30;
}
export function stayTotal(space, stayDays) {
  const m = ratePerMonth(space, stayDays);
  return Math.round(m * (stayDays / 30) / 100) * 100;
}

function fitBudget(cost, budget) {
  if (!cost) return { pts: 0.5, text: 'Ask the host for the rate' };
  if (cost <= budget) return { pts: 1 - Math.max(0, (budget - cost) / budget) * 0.15, text: 'Fits your budget' };
  const over = (cost - budget) / budget;
  return over <= 0.25 ? { pts: 0.5 - over, text: 'A little over budget' } : { pts: 0, text: 'Over budget' };
}

/* ---- Score one real space against a brief ------------------------------------------------------- */
export function scoreSpace(space, rawBrief) {
  const b = cleanBrief(rawBrief);
  const n = space.nomad || {};
  const tierInfo = nomadTier(space);
  const reasons = [], gaps = [];
  const persona = PERSONAS.find(p => p.id === b.persona);
  const monthly = ratePerMonth(space, b.stay);
  const bud = fitBudget(monthly * b.people, b.budget);
  const budPts = bud.pts * 25; if (monthly) (bud.pts >= 0.5 ? reasons : gaps).push(bud.text);

  const mbps = num(n.mbps, 0, 2000, 0);
  const need = b.wifi;
  const wifiPts = mbps >= need ? 25 : mbps ? Math.round(25 * mbps / need) : 0;
  if (mbps >= need) reasons.push(mbps + ' Mbps covers ' + need + ' Mbps needs'); else gaps.push(mbps ? 'Wi-Fi ' + mbps + ' Mbps is under your ' + need + ' Mbps' : 'Wi-Fi speed not shown yet');

  const wants = [...new Set([...b.must, ...(b.must.length < 2 ? persona.wants : [])])];
  const has = id => id === 'backup' ? n.backup === 'full' || n.backup === 'router' : id === 'desk' ? n.desk === 'ergonomic' || n.desk === 'basic' : bool(n[id]) || (id === 'kitchen' && bool(n.meals));
  const hit = wants.filter(has);
  wants.filter(id => !has(id)).forEach(id => gaps.push('No ' + MUST_HAVES.find(m => m.id === id).label.toLowerCase() + ' listed'));
  hit.forEach(id => reasons.push(MUST_HAVES.find(m => m.id === id).label));
  const mustPts = wants.length ? 25 * hit.length / wants.length : 25;

  const vibeHit = b.vibes.length ? (space.vibes || []).filter(v => b.vibes.includes(v)) : [];
  const vibePts = b.vibes.length ? 15 * (vibeHit.length ? 1 : 0.2) : 10;
  if (vibeHit.length) reasons.push('Matches your ' + vibeHit.map(id => VIBES.find(v => v.id === id).label.toLowerCase()).join(' + ') + ' mood');

  const minOk = !num(n.minNights, 0, 365, 0) || num(n.minNights, 0, 365, 0) <= b.stay;
  const stayPts = minOk ? 10 : 0; if (!minOk) gaps.push('Minimum stay is ' + n.minNights + ' nights');
  const tierPts = Math.min(10, Math.round(tierInfo.score / 10));

  const score = Math.round(Math.min(100, budPts + wifiPts + mustPts + vibePts + stayPts + tierPts));
  return { score, reasons: reasons.slice(0, 5), gaps: gaps.slice(0, 4), monthly, total: stayTotal(space, b.stay), tier: tierInfo };
}

/* ---- Score a destination (works before any property has nomad data) ------------------------------ */
export function scoreDestination(dest, rawBrief) {
  const b = cleanBrief(rawBrief);
  const cost = dest.monthInr || (dest.usdMonth ? Math.round(dest.usdMonth * USD_TO_INR_APPROX / 500) * 500 : 0);
  const budget = fitBudget(cost * (b.people > 1 ? 1.6 : 1), b.budget);
  const reasons = [], gaps = [];
  let pts = budget.pts * 40; if (cost) (budget.pts >= 0.5 ? reasons : gaps).push(budget.text + ' (about ₹' + cost.toLocaleString('en-IN') + '/month)');
  const netNeed = b.wifi >= 100 ? 5 : b.wifi >= 50 ? 4 : b.wifi >= 25 ? 3 : 2;
  const net = num(dest.net, 1, 5, 3);
  pts += net >= netNeed ? 25 : 25 * net / netNeed;
  (net >= netNeed ? reasons : gaps).push(net >= netNeed ? 'Connectivity suits ' + b.wifi + ' Mbps work' : 'Connectivity may fall short for ' + b.wifi + ' Mbps');
  const hit = b.vibes.filter(v => (dest.vibes || []).includes(v));
  pts += b.vibes.length ? (hit.length ? 25 : 5) : 15;
  if (hit.length) reasons.push('Matches your ' + hit.map(id => VIBES.find(v => v.id === id).label.toLowerCase()).join(' + ') + ' mood');
  if (dest.community && b.must.includes('community')) { pts += 10; reasons.push('Established nomad community'); } else pts += b.must.includes('community') ? 0 : 5;
  if (dest.longStay) reasons.push(dest.longStay);
  return { score: Math.round(Math.min(100, pts)), reasons: reasons.slice(0, 4), gaps: gaps.slice(0, 3), cost };
}

export function rank(items, scorer, brief, limit = 6) {
  return items.map(item => ({ item, ...scorer(item, brief) })).sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ---- Messages (WhatsApp / email). Plain text, no HTML, bounded length ------------------------------ */
export function seekerMessage(brief, target) {
  const b = cleanBrief(brief);
  const p = PERSONAS.find(x => x.id === b.persona);
  const stay = STAY_LENGTHS.find(s => s.id === b.stay).label;
  const lines = [
    'Hello' + (target && target.name ? ' ' + target.name : ' RoamWise') + ', I found this through RoamWise Nomad Match.',
    'I am a ' + p.label.toLowerCase() + ' looking for a ' + stay + ' work stay' + (b.start ? ' from ' + b.start : '') + ' for ' + b.people + ' ' + (b.people > 1 ? 'people' : 'person') + '.',
    'Budget: about Rs ' + b.budget.toLocaleString('en-IN') + ' a month. Wi-Fi needed: ' + b.wifi + ' Mbps or more.',
    b.must.length ? 'Must have: ' + b.must.map(id => MUST_HAVES.find(m => m.id === id).label.toLowerCase()).join(', ') + '.' : '',
    'Please share the monthly rate, a recent Wi-Fi speed test, what power backup you have, and the final total with any taxes. This enquiry came through RoamWise.'
  ];
  return lines.filter(Boolean).join('\n').slice(0, 900);
}

export function hostMessage(raw = {}) {
  const n = {
    name: str(raw.name, 80), place: str(raw.place, 80), owner: str(raw.owner, 60), phone: digits(raw.phone).slice(-12),
    mbps: num(raw.mbps, 0, 2000, 0), rate30: Math.round(num(raw.rate30, 0, 1e7, 0)), rooms: Math.round(num(raw.rooms, 0, 500, 0))
  };
  const t = nomadTier({ nomad: raw });
  return [
    'Hello RoamWise, I want to list my space on Nomad Match.',
    'Space: ' + (n.name || '(name)') + ', ' + (n.place || '(place)') + '. Contact: ' + (n.owner || '(name)') + (n.phone ? ' ' + n.phone : '') + '.',
    'Rooms for long stays: ' + n.rooms + '. Wi-Fi: ' + n.mbps + ' Mbps. Monthly rate: Rs ' + n.rate30.toLocaleString('en-IN') + '.',
    'My self-check tier: ' + t.tier.label + ' (' + t.score + '/100). I can send a speed-test screenshot and photos of the work area.'
  ].join('\n').slice(0, 900);
}

export function waLink(number, text) {
  const d = digits(number);
  return /^91\d{10}$/.test(d) ? 'https://wa.me/' + d + '?text=' + encodeURIComponent(text) : '';
}
export function mailLink(email, subject, text) {
  return 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
}

/* Spaces come from signed partners that carry a nomad profile. Unsigned or unready ones never appear. */
export function liveSpaces(partners = []) {
  return partners.filter(p => p && p.cat === 'stay' && p.verified === 'signed' && p.listingReady !== false && p.nomad && typeof p.nomad === 'object');
}

/* Destination notes. Costs and connectivity come from the cited sources; vibe tags are editorial. */
export const DESTINATIONS = Object.freeze([
  { id: 'bir', name: 'Bir Billing', state: 'Himachal', vibes: ['mountain', 'culture'], net: 4, community: true, usdMonth: 0, monthInr: 0, note: 'Cowork desks from Rs 2,500/month and 100 Mbps fibre reported at one hostel. Tibetan colony, paragliding.', src: 'https://trekgo.in/blog/best-workation-destinations-in-himachal-pradesh', longStay: 'Monthly guesthouse rooms reported at Rs 5,000-12,000' },
  { id: 'dharamkot', name: 'Dharamkot and McLeod Ganj', state: 'Himachal', vibes: ['mountain', 'culture'], net: 3, community: true, usdMonth: 715, note: 'Established nomad scene, NomadGao coliving, cafes with fibre Wi-Fi.', src: 'https://www.nomada.tools/countries/india' },
  { id: 'rakkar', name: 'Rakkar (Ghoomakad area)', state: 'Himachal', vibes: ['mountain', 'nature'], net: 4, community: false, usdMonth: 0, monthInr: 0, note: 'A mud-house and cabin stay with 200 Mbps coworking and monthly plans; pricing on request.', src: 'https://ghoomakad.com/' },
  { id: 'jibhi', name: 'Jibhi and Tirthan', state: 'Himachal', vibes: ['mountain', 'nature'], net: 2, community: false, usdMonth: 0, monthInr: 0, note: 'Monthly rooms Rs 7,000-14,000 reported; cafe Wi-Fi 15-25 Mbps, so plan for lighter work.', src: 'https://trekgo.in/blog/best-workation-destinations-in-himachal-pradesh' },
  { id: 'manali', name: 'Manali', state: 'Himachal', vibes: ['mountain'], net: 3, community: false, usdMonth: 600, note: 'Lower-cost mountain base.', src: 'https://www.nomada.tools/countries/india' },
  { id: 'rishikesh', name: 'Rishikesh (Tapovan)', state: 'Uttarakhand', vibes: ['culture', 'nature'], net: 5, community: true, usdMonth: 980, note: 'Tapovan broadband reported up to 300 Mbps; hostels with coworking.', src: 'https://trekgo.in/blog/best-workation-destinations-in-uttarakhand' },
  { id: 'almora', name: 'Almora and Kasar Devi', state: 'Uttarakhand', vibes: ['mountain', 'culture', 'nature'], net: 3, community: true, usdMonth: 0, monthInr: 0, note: 'Kasar Devi has a work-deck hostel; RoamWise has signed stays here. Rates on request.', src: 'https://www.thehosteller.com/blogs/best-workation-destinations-in-uttarakhand-2024' },
  { id: 'mussoorie', name: 'Mussoorie and Landour', state: 'Uttarakhand', vibes: ['mountain', 'culture'], net: 4, community: false, usdMonth: 0, monthInr: 35000, note: 'Fibre of 100+ Mbps reported in town; workation villas about Rs 25,000-45,000/month (area estimate).', src: 'https://trekgo.in/blog/best-workation-destinations-in-uttarakhand' },
  { id: 'goa', name: 'Goa (Anjuna, Assagao)', state: 'Goa', vibes: ['beach', 'city', 'culture'], net: 3, community: true, usdMonth: 1270, note: 'Biggest nomad community; NomadGao desks Rs 7,000/month. Wi-Fi varies by place.', src: 'https://www.thedigitalnomad.asia/coworking-spaces/india/coworking-space-in-goa/' },
  { id: 'dandeli', name: 'Dandeli (Jungli village)', state: 'Karnataka', vibes: ['nature'], net: 4, community: true, usdMonth: 0, monthInr: 0, note: 'A 150-acre nomad village advertising 210 Mbps and shared meals.', src: 'https://www.thedigitalnomad.asia/inspiration/digital-nomads/digital-nomad-india/' },
  { id: 'hampi', name: 'Hampi', state: 'Karnataka', vibes: ['culture', 'nature'], net: 2, community: true, usdMonth: 455, note: 'Lowest monthly cost of 38 cities compared.', src: 'https://www.nomada.tools/countries/india' },
  { id: 'kochi', name: 'Kochi and Fort Kochi', state: 'Kerala', vibes: ['culture', 'beach', 'city'], net: 4, community: true, usdMonth: 1010, note: 'Cowork cafes and a hostel with dedicated workspaces.', src: 'https://www.nomada.tools/countries/india' },
  { id: 'yakten', name: 'Yakten', state: 'Sikkim', vibes: ['mountain', 'nature'], net: 3, community: true, usdMonth: 0, monthInr: 0, note: "Declared India's first digital nomad village in 2025.", src: 'https://www.thedigitalnomad.asia/inspiration/digital-nomads/digital-nomad-india/' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', vibes: ['culture', 'city'], net: 4, community: false, usdMonth: 875, note: 'City comforts with heritage; steady fibre.', src: 'https://www.nomada.tools/countries/india' },
  { id: 'pondicherry', name: 'Pondicherry', state: 'Puducherry', vibes: ['beach', 'culture'], net: 4, community: true, usdMonth: 1130, note: 'Cafe culture by the sea.', src: 'https://www.nomada.tools/countries/india' }
]);
