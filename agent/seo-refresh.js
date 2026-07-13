const fs = require('fs'), path = require('path');
/* Extract the destination DB straight from the live app file */
const _src = fs.readFileSync('./index.html','utf8');
const _start = _src.indexOf('var DB = [');
const _end = _src.indexOf('];', _start) + 2;
eval(_src.slice(_start, _end));
const OUT = '.';
const BASE = 'https://www.roamwise.co.in';
const YEAR = 2026;
const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#0A0C14;color:#EDEAE2;line-height:1.75;font-size:16px}
a{color:#E8BA6C;text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:760px;margin:0 auto;padding:24px 20px 60px}
header{border-bottom:1px solid #1E1E28;padding:14px 0;margin-bottom:28px}
header .brand{font-weight:800;font-size:18px;color:#EDEAE2}header .brand span{color:#C4302B}
header nav{font-size:13px;color:#8A8880;margin-top:4px}header nav a{margin-right:14px;color:#8A8880}
h1{font-size:30px;line-height:1.25;margin:10px 0 14px;color:#fff}
h2{font-size:21px;margin:34px 0 10px;color:#E8BA6C}
h3{font-size:16px;margin:20px 0 8px;color:#EDEAE2}
p{margin-bottom:14px;color:#C9C5BB}
ul{margin:0 0 16px 22px;color:#C9C5BB}li{margin-bottom:7px}
table{width:100%;border-collapse:collapse;margin:14px 0 22px;font-size:14px}
th{text-align:left;color:#E8BA6C;font-size:12px;text-transform:uppercase;letter-spacing:.06em;padding:8px;border-bottom:1px solid #2A2A34}
td{padding:8px;border-bottom:1px solid #17171F;color:#C9C5BB}
.bar{height:8px;border-radius:4px;background:#1E1E28;overflow:hidden;min-width:90px}
.bar i{display:block;height:100%;border-radius:4px}
.best{color:#16BF96;font-weight:700}.worst{color:#E8524A;font-weight:700}
.callout{border:1px solid rgba(232,186,108,.35);background:rgba(232,186,108,.06);border-radius:14px;padding:16px 18px;margin:20px 0}
.cta{display:block;text-align:center;background:linear-gradient(135deg,#E8BA6C,#C8913E);color:#0A0C14!important;font-weight:800;border-radius:14px;padding:16px;margin:30px 0;font-size:17px;text-decoration:none!important}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin:20px 0}
.card{border:1px solid #1E1E28;border-radius:14px;padding:15px;background:#0E1018}
.card b{display:block;color:#fff;margin-bottom:4px}.card span{font-size:12.5px;color:#8A8880}
footer{border-top:1px solid #1E1E28;margin-top:44px;padding-top:18px;font-size:12.5px;color:#54524C}
.tag{display:inline-block;font-size:11px;border:1px solid #2A2A34;border-radius:99px;padding:3px 10px;margin:0 6px 6px 0;color:#8A8880}
.meta{font-size:13px;color:#54524C;margin-bottom:18px}`;

const head = (title, desc, canon, ld) => `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canon}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:type" content="article"><meta property="og:url" content="${canon}">
<meta property="og:site_name" content="RoamWise Pro">
<meta name="theme-color" content="#0A0C14">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
<style>${CSS}</style></head><body><div class="wrap">
<header><div class="brand">🥷 Roam<span>Wise</span> Pro</div>
<nav><a href="${BASE}/">App</a><a href="${BASE}/guides/">Travel Guides</a><a href="${BASE}/blog/">Blog</a></nav></header>`;

const foot = () => `<footer>© ${YEAR} RoamWise · Mohit Pandey, Almora, India · Crowd & budget figures are indicative estimates — verify before booking.<br>
<a href="${BASE}/privacy.html">Privacy</a> · <a href="${BASE}/">Open the free planner →</a></footer></div></body></html>`;

const cta = (name) => `<a class="cta" href="${BASE}/?utm_source=guide&utm_medium=seo">🥷 Plan ${name} free — crowd calendar, budget & AI itinerary →</a>`;

// ---------- DESTINATION GUIDES ----------
fs.mkdirSync(path.join(OUT,'guides'), {recursive:true});
const guides = DB.map(d => {
  const sl = slug(`${d.name}-${d.country}`);
  const min = d.crowd.indexOf(Math.min(...d.crowd));
  const max = d.crowd.indexOf(Math.max(...d.crowd));
  const bestNames = (d.bestM||[min]).map(i=>MON[i]).join(', ');
  const title = `Best Time to Visit ${d.name}, ${d.country} (${YEAR}) — Crowd Calendar, Budget & Itinerary`;
  const desc = `When is ${d.name} least crowded? Month-by-month crowd data (quietest: ${MON[min]}), real budget from $${d.cost.budget}/week, visa info for Indians, food & hidden gems.`;
  const canon = `${BASE}/guides/${sl}.html`;
  const faq = [
    [`What is the best time to visit ${d.name}?`, `The sweet spot is ${bestNames} — good weather with crowds well below peak. The single quietest month is ${MON[min]} at roughly ${d.crowd[min]}% of peak crowd levels.`],
    [`What is the most crowded month in ${d.name}?`, `${MON[max]} sees peak tourist volume (~${d.crowd[max]}% intensity). Prices rise and queues lengthen — book far ahead or shift your dates.`],
    [`How much does a week in ${d.name} cost?`, `Indicative per-person weekly budgets: backpacker ~$${d.cost.budget}, mid-range ~$${d.cost.mid}, luxury ~$${d.cost.luxury}. Flights, stay and food make up most of it.`],
    [`Do Indians need a visa for ${d.country}?`, `${d.visa.type}${d.visa.cost?` (${d.visa.cost})`:''} for stays up to ${d.visa.days} days. ${d.visa.note||''}`]
  ];
  const ld = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":faq.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))};

  const crowdRows = d.crowd.map((c,i)=>{
    const cls = i===min?'best':(i===max?'worst':'');
    const col = c<35?'#16BF96':(c<60?'#E09030':'#E8524A');
    return `<tr><td class="${cls}">${MON[i]}</td><td><div class="bar"><i style="width:${c}%;background:${col}"></i></div></td><td class="${cls}">${c}%${i===min?' · quietest':''}${i===max?' · peak':''}</td></tr>`;
  }).join('');

  const itin = [
    [`Arrival & first wander`, `Land, drop bags, and walk the nearest old quarter. End with ${d.food?.[0]||'the local specialty'} for dinner.`],
    [`The icons — early`, `Hit the top sights at opening time (crowds arrive after 10am). Afternoon: ${d.gems?.[0]||'a lesser-known neighbourhood'}.`],
    [`The hidden side`, `${d.gems?.[1]||d.gems?.[0]||'A local-recommended spot'} — this is the day the trip becomes yours. Try ${d.food?.[1]||'street food'} where locals queue.`],
    [`Day trip or deep dive`, `Pick one: a nearby excursion, or go deep on the district you liked most. Evenings are for ${(d.tags||[]).includes('food')?'food streets':'sunset viewpoints'}.`],
    [`Slow morning & departure`, `Coffee, one last market run for gifts, and out. You beat the crowds — most visitors never learn the ${MON[min]} secret.`]
  ].map((x,i)=>`<h3>Day ${i+1} — ${x[0]}</h3><p>${x[1]}</p>`).join('');

  const html = head(title, desc, canon, ld) + `
<div class="meta">Travel Guide · ${d.region} · Updated ${MON[new Date().getMonth()]} ${YEAR}</div>
<h1>Best Time to Visit ${d.name}, ${d.country}: the Crowd-Smart Guide</h1>
<p>Most guides tell you <em>where</em> to go in ${d.name}. This one tells you <strong>when</strong> — because the same trip in ${MON[min]} and ${MON[max]} are two different holidays at two different prices. Below: the month-by-month crowd calendar, honest budgets, a 5-day plan, and the food and hidden gems worth planning around.</p>
${(d.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}
<h2>📊 ${d.name} crowd calendar, month by month</h2>
<table><tr><th>Month</th><th>Crowd level</th><th>Intensity</th></tr>${crowdRows}</table>
<div class="callout"><strong>🥷 The verdict:</strong> aim for <strong>${bestNames}</strong>. ${MON[min]} is the quietest month of the year (~${d.crowd[min]}% of peak), while ${MON[max]} is when everyone else goes — skip it unless you must.</div>
<h2>💰 What a week really costs</h2>
<table><tr><th>Style</th><th>Per person / week</th></tr>
<tr><td>Backpacker</td><td>~$${d.cost.budget}</td></tr>
<tr><td>Mid-range</td><td>~$${d.cost.mid}</td></tr>
<tr><td>Luxury</td><td>~$${d.cost.luxury}</td></tr></table>
<p>Typical mid-range split: flights ~$${d.brk?.flights??'—'}, stay ~$${d.brk?.stay??'—'}, food ~$${d.brk?.food??'—'}, activities ~$${d.brk?.act??'—'}, misc ~$${d.brk?.misc??'—'}.</p>
<h2>🛂 Visa for Indian passport holders</h2>
<p><strong>${d.visa.type}</strong>${d.visa.cost?` · ${d.visa.cost}`:''} · up to ${d.visa.days} days. ${d.visa.note||''}</p>
<h2>🗓️ A 5-day ${d.name} plan that dodges the crowds</h2>
${itin}
${cta(d.name)}
<h2>🍽️ Eat this in ${d.name}</h2>
<ul>${(d.food||[]).map(f=>`<li>${f}</li>`).join('')}</ul>
<h2>💎 Hidden gems locals actually rate</h2>
<ul>${(d.gems||[]).map(g=>`<li>${g}</li>`).join('')}</ul>
<h2>❓ FAQ</h2>
${faq.map(([q,a])=>`<h3>${q}</h3><p>${a}</p>`).join('')}
<h2>Keep exploring</h2>
<div class="grid">${DB.filter(o=>o.id!==d.id && o.region===d.region).slice(0,2).concat(DB.filter(o=>o.id!==d.id && o.region!==d.region).slice(0,1)).map(o=>`<a class="card" href="${BASE}/guides/${slug(o.name+'-'+o.country)}.html"><b>${o.name}, ${o.country}</b><span>Quietest: ${MON[o.crowd.indexOf(Math.min(...o.crowd))]} · from $${o.cost.budget}/wk</span></a>`).join('')}</div>
` + foot();
  fs.writeFileSync(path.join(OUT,'guides',`${sl}.html`), html);
  return {sl, name:d.name, country:d.country, min:MON[min], budget:d.cost.budget};
});

// guides hub
fs.writeFileSync(path.join(OUT,'guides','index.html'),
head(`Travel Guides ${YEAR} — Best Time to Visit, Crowd Calendars & Budgets | RoamWise`,
`When to visit ${DB.length} top destinations with month-by-month crowd data, honest weekly budgets, visas for Indians, food and hidden gems.`,
`${BASE}/guides/`, {"@context":"https://schema.org","@type":"CollectionPage","name":"RoamWise Travel Guides"}) + `
<h1>Crowd-Smart Travel Guides</h1>
<p>Every guide answers the question other sites skip: <strong>when is it actually quiet?</strong> Month-by-month crowd calendars, real budgets, visa notes for Indian passports, food and hidden gems — for every destination below.</p>
<div class="grid">${guides.map(g=>`<a class="card" href="${BASE}/guides/${g.sl}.html"><b>${g.name}, ${g.country}</b><span>Quietest month: ${g.min} · from $${g.budget}/week</span></a>`).join('')}</div>
${cta('your next trip')}` + foot());

// ---------- BLOG ----------
fs.mkdirSync(path.join(OUT,'blog'), {recursive:true});
const posts = [
{sl:'hub-and-spoke-india-travel-strategy', t:`The Hub-and-Spoke Strategy: the Fastest, Most Comfortable Way to Travel India (${YEAR})`,
 d:'Skip the 2,000 km drive. Fly to a regional hub, rent a self-drive car, use premium trains and buses between cities, and carry a folding cycle for the last mile.',
 body:`<p>Trying to cover India in one car is the classic mistake: thousands of kilometres of driving, brutal fuel and toll bills, and days lost on highways. The fix used by experienced travellers is the <strong>hub-and-spoke model</strong> — and it changes everything about pace and comfort.</p>
<h2>The model in one line</h2>
<p><strong>Fly</strong> long distances to a regional hub city → <strong>rent a self-drive car</strong> at the airport for the region → use <strong>premium trains and buses</strong> for city-to-city hops → keep a <strong>folding cycle in the boot</strong> for the last mile.</p>
<h2>Trains: premium and crowd-free only</h2>
<p>Skip sleeper and 3AC entirely. Three options give you calm, comfort and availability: <strong>Vande Bharat Express</strong> (CC/EC) — India's fastest day trains with aircraft-like comfort, bookable 1–2 weeks out; <strong>Shatabdi Executive / Anubhuti class</strong> — 2×2 seating with huge legroom; and <strong>1st AC (1A) on Rajdhani or Duronto</strong> for overnight hauls — a lockable private coupe, the quietest way to cross India on rails. Emergency seats? The Tatkal quota on the IRCTC app opens at exactly <strong>10:00 AM the day before travel</strong> for AC classes.</p>
<h2>Buses: the Volvo B11R rule</h2>
<p>State transport is for masochists. Book only multi-axle <strong>Volvo B11R, Scania or Mercedes AC sleepers</strong> — operators like NueGo (electric), National Travels and SRS run genuinely premium fleets. On redBus or AbhiBus, filter for "Prime", "Max Safety" or "Volvo". Comfort hack: a <strong>single lower berth on the right side</strong> sways dramatically less than uppers.</p>
<h2>Self-drive: the pan-India illusion</h2>
<p>Rent locally at each hub — Revv, Zoomcar or MyChoize hand you an SUV straight at the airport. Want the "one dedicated car" feeling for a long regional stay? Subscription rentals (1–3 months) include permits, insurance and maintenance.</p>
<h2>The boot cycle</h2>
<p>Full-size cycles need roof racks rental companies won't allow. A <strong>folding cycle</strong> (Decathlon Tilt, Tern, Brompton) collapses in 30 seconds, lives in any hatchback boot, and glides past every old-city traffic jam.</p>
<h2>Example: the Rajasthan loop</h2>
<p>Fly Delhi/Mumbai → Jaipur. Airport SUV pickup, folded cycle in the boot, drive Jodhpur → Udaipur. Cycle the alleys below Mehrangarh and around Udaipur's lakes past every crowd. Drop the car in Udaipur and glide back on a silent Vande Bharat. Fast, comfortable, and cheaper than driving the whole way.</p>`},
{sl:'tatkal-10am-hack-irctc', t:'The 10:00 AM Tatkal Hack: Guaranteed Last-Minute Train Seats in India',
 d:'How the Tatkal and Premium Tatkal quota on IRCTC actually works — exact timing, AC vs non-AC windows, and how to win the booking race.',
 body:`<p>Every "sold out" Indian train hides a quota that opens the day before travel: <strong>Tatkal</strong>. Most people lose the race because they don't know the two rules that decide everything.</p>
<h2>Rule 1 — the exact clock</h2><p>AC classes (2A/3A/CC/EC) open at <strong>10:00 AM sharp</strong> the day before the journey; non-AC opens at 11:00 AM. Log in to the IRCTC app at 9:55, have passengers saved in your master list, payment via UPI ready. The window that matters is roughly 10:00:00 to 10:02:30.</p>
<h2>Rule 2 — Premium Tatkal is the backup</h2><p>Dynamic-priced Premium Tatkal costs more but hides inventory after regular Tatkal drains. If the fare pain is acceptable, it's the closest thing to a guaranteed seat.</p>
<h2>The comfort ladder</h2><p>For crowd-free travel, aim for Vande Bharat CC/EC for day hops and 1A coupes on Rajdhani for nights — full breakdown in our <a href="${BASE}/blog/hub-and-spoke-india-travel-strategy.html">Hub-and-Spoke India guide</a>.</p>`},
{sl:'premium-volvo-buses-india', t:'Premium Bus Travel in India: Why Volvo B11R Multi-Axle Changes Everything',
 d:'Multi-axle Volvo, Scania and Mercedes sleepers vs ordinary buses — what to book, which berth to pick, and which operators are actually premium.',
 body:`<p>The gap between a state bus and a multi-axle Volvo B11R sleeper is the gap between an ordeal and a night's sleep. India's private premium network is now genuinely world-class if you know the filters.</p>
<h2>What to book</h2><p>Only multi-axle <strong>Volvo B11R, Scania or Mercedes-Benz AC sleepers</strong>. On redBus or AbhiBus, filter "Prime", "Max Safety" or "Volvo". Operators worth trusting: NueGo (electric intercity), National Travels, SRS Travels.</p>
<h2>The berth science</h2><p>Book a <strong>single sleeper, lower berth, right side</strong>. Lower berths sit near the axle line and sway far less; the right side avoids oncoming-headlight glare through curtains.</p>
<h2>When buses beat trains</h2><p>4–8 hour hops where train timings are awkward — overnight Bengaluru→Goa, Delhi→Manali, Mumbai→Udaipur. For longer hauls, 1A train coupes win — see the <a href="${BASE}/blog/hub-and-spoke-india-travel-strategy.html">full strategy</a>.</p>`},
{sl:'folding-cycle-travel-guide', t:'The Folding Cycle: the Most Underrated Travel Gear of ' + YEAR,
 d:'Why a folding bicycle in your car boot beats every taxi and traffic jam — brands, workflow, and how it cuts your travel budget.',
 body:`<p>Old cities were built for feet, not cars. The travellers who enjoy them most park at the edge and glide in on two wheels — with a bike that folds into any car boot in 30 seconds.</p>
<h2>Why folding, not full-size</h2><p>Rental companies rarely allow roof racks; a folder (Decathlon Tilt for value, Tern for quality, Brompton for the icon) fits inside even a hatchback.</p>
<h2>The workflow</h2><p>Drive to the old-city edge → park → unfold → ride past every jam into lanes cars can't enter. Museums, ghats, forts, markets — the last mile becomes the best mile.</p>
<h2>The budget bonus</h2><p>Cycle-mode travel cuts local transport costs to zero. In the RoamWise planner, switching to Cycle mode drops your trip budget by roughly 40% — <a href="${BASE}/?utm_source=blog">try it free</a>.</p>`},
{sl:'least-crowded-months-world', t:`The Least Crowded Month for ${DB.length} Top Destinations (${YEAR} Data)`,
 d:'One table: the quietest month for each major destination, with crowd intensity vs peak. Time your trip like a local, not a tourist.',
 body:`<p>Same city, same money — completely different trip depending on the month. Here's the quietest month for every destination we track, from our crowd-intensity dataset:</p>
<table><tr><th>Destination</th><th>Quietest month</th><th>Crowd vs peak</th></tr>
${DB.map(d=>{const m=d.crowd.indexOf(Math.min(...d.crowd));return `<tr><td><a href="${BASE}/guides/${slug(d.name+'-'+d.country)}.html">${d.name}, ${d.country}</a></td><td>${MON[m]}</td><td>${d.crowd[m]}%</td></tr>`;}).join('')}
</table>
<p>Each link opens the full month-by-month calendar, budget and itinerary for that destination.</p>`},
{sl:'ev-road-trips-india', t:'EV Road Trips in India: Range Kings, Charging Strategy and the Best Routes',
 d:'Planning an electric road trip in India — which EVs go furthest, how to plan charging legs, and the apps that make it painless.',
 body:`<p>Electric road-tripping in India went from brave to genuinely practical. The rules that make it smooth:</p>
<h2>Plan legs, not destinations</h2><p>Think in 200–250 km hops and always know your next <em>two</em> chargers. PlugShare plus Statiq/Tata Power apps cover India; ABRP (A Better Routeplanner) is the global gold standard.</p>
<h2>The machines</h2><p>Range kings by category: Mercedes EQS (~800+ km ARAI) for cars in India, Ultraviolette F77 Mach 2 (~323 km) for e-motorcycles, Simple One (~248 km claimed) for scooters. World best-seller: Tesla Model Y. Best value in India: Tata Tiago.ev and MG Comet.</p>
<h2>Hotels are chargers</h2><p>Book stays with destination chargers — charging time becomes sleep time. Hill routes reward regen braking; Himalayan descents literally refill your battery.</p>
<p>Switch the RoamWise planner to <strong>EV mode</strong> for charging-aware budgets and tips on any route — <a href="${BASE}/?utm_source=blog">free here</a>.</p>`}
];
posts.forEach(p=>{
  const canon = `${BASE}/blog/${p.sl}.html`;
  const ld = {"@context":"https://schema.org","@type":"Article","headline":p.t,"description":p.d,"author":{"@type":"Person","name":"Mohit Pandey"},"publisher":{"@type":"Organization","name":"RoamWise"},"mainEntityOfPage":canon,"datePublished":`${YEAR}-07-12`};
  fs.writeFileSync(path.join(OUT,'blog',`${p.sl}.html`),
    head(`${p.t} | RoamWise Blog`, p.d, canon, ld) +
    `<div class="meta">RoamWise Blog · ${MON[new Date().getMonth()]} ${YEAR}</div><h1>${p.t}</h1>` + p.body + cta('your next trip') + foot());
});
fs.writeFileSync(path.join(OUT,'blog','index.html'),
head(`RoamWise Blog — Crowd-Smart Travel Strategy, India Hacks & EV Trips`,
`Travel strategy that saves money and dodges crowds: hub-and-spoke India, Tatkal timing, premium buses, folding cycles, EV routes.`,
`${BASE}/blog/`, null) + `
<h1>The RoamWise Blog</h1><p>Strategy over listicles: how to travel faster, quieter and cheaper.</p>
<div class="grid">${posts.map(p=>`<a class="card" href="${BASE}/blog/${p.sl}.html"><b>${p.t}</b><span>${p.d.slice(0,90)}…</span></a>`).join('')}</div>` + foot());

// ---------- SITEMAP (scans all files) + ROBOTS ----------
require('./agent-sitemap-shim.js');
fs.writeFileSync(path.join(OUT,'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);

console.log(`generated: ${guides.length} guides, ${posts.length} posts, hub pages, sitemap (${urls.length} URLs), robots.txt`);
