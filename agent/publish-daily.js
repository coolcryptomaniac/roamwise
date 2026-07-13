/* RoamWise Agent — daily SEO publisher.
   Publishes N data-rich pages/day from agent/topics.json using REAL climate
   data (Open-Meteo, free, no key). Optional GEMINI_API_KEY secret upgrades
   the prose. Queue self-extends with month pages → 1,500+ page runway. */
const fs = require('fs');
const N = parseInt(process.env.PAGES_PER_DAY || '3', 10);
const BASE = 'https://www.roamwise.co.in';
const YEAR = new Date().getFullYear();
const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#0A0C14;color:#EDEAE2;line-height:1.75;font-size:16px}a{color:#E8BA6C;text-decoration:none}a:hover{text-decoration:underline}.wrap{max-width:760px;margin:0 auto;padding:24px 20px 60px}header{border-bottom:1px solid #1E1E28;padding:14px 0;margin-bottom:28px}header .brand{font-weight:800;font-size:18px}header .brand span{color:#C4302B}header nav{font-size:13px;color:#8A8880;margin-top:4px}header nav a{margin-right:14px;color:#8A8880}h1{font-size:30px;line-height:1.25;margin:10px 0 14px;color:#fff}h2{font-size:21px;margin:34px 0 10px;color:#E8BA6C}h3{font-size:16px;margin:20px 0 8px}p{margin-bottom:14px;color:#C9C5BB}ul{margin:0 0 16px 22px;color:#C9C5BB}li{margin-bottom:7px}table{width:100%;border-collapse:collapse;margin:14px 0 22px;font-size:14px}th{text-align:left;color:#E8BA6C;font-size:12px;text-transform:uppercase;letter-spacing:.06em;padding:8px;border-bottom:1px solid #2A2A34}td{padding:8px;border-bottom:1px solid #17171F;color:#C9C5BB}.bar{height:8px;border-radius:4px;background:#1E1E28;overflow:hidden;min-width:90px}.bar i{display:block;height:100%;border-radius:4px}.best{color:#16BF96;font-weight:700}.worst{color:#E8524A;font-weight:700}.callout{border:1px solid rgba(232,186,108,.35);background:rgba(232,186,108,.06);border-radius:14px;padding:16px 18px;margin:20px 0}.cta{display:block;text-align:center;background:linear-gradient(135deg,#E8BA6C,#C8913E);color:#0A0C14!important;font-weight:800;border-radius:14px;padding:16px;margin:30px 0;font-size:17px;text-decoration:none!important}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin:20px 0}.card{border:1px solid #1E1E28;border-radius:14px;padding:15px;background:#0E1018}.card b{display:block;color:#fff;margin-bottom:4px}.card span{font-size:12.5px;color:#8A8880}footer{border-top:1px solid #1E1E28;margin-top:44px;padding-top:18px;font-size:12.5px;color:#54524C}.meta{font-size:13px;color:#54524C;margin-bottom:18px}`;

const head = (title, desc, canon, ld) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${desc}"><link rel="canonical" href="${canon}"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:type" content="article"><meta property="og:url" content="${canon}"><meta name="theme-color" content="#0A0C14">${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}<style>${CSS}</style></head><body><div class="wrap"><header><div class="brand">🥷 Roam<span>Wise</span> Pro</div><nav><a href="${BASE}/">App</a><a href="${BASE}/guides/">Travel Guides</a><a href="${BASE}/blog/">Blog</a></nav></header>`;
const foot = () => `<footer>© ${YEAR} RoamWise · Mohit Pandey, Almora, India · Climate data: Open-Meteo (ERA5) · Figures indicative — verify before booking.<br><a href="${BASE}/privacy.html">Privacy</a> · <a href="${BASE}/">Open the free planner →</a></footer></div></body></html>`;
const cta = n => `<a class="cta" href="${BASE}/?utm_source=guide&utm_medium=seo">🥷 Plan ${n} free — crowd calendar, budget & AI itinerary →</a>`;

async function j(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status + ' ' + url.slice(0, 60)); return r.json(); }

async function geocode(name, country) {
  const g = await j(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en`);
  const hit = (g.results || []).find(r => !country || (r.country || '').toLowerCase().includes(country.toLowerCase().slice(0, 6))) || (g.results || [])[0];
  if (!hit) throw new Error('geocode miss: ' + name);
  return { lat: hit.latitude, lon: hit.longitude, admin: hit.admin1 || '' };
}

async function climate(lat, lon) {
  const y = YEAR - 2; /* last complete year with margin */
  const d = await j(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${y}-01-01&end_date=${y}-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
  const { time, temperature_2m_max: tx, temperature_2m_min: tn, precipitation_sum: pr } = d.daily;
  const m = [...Array(12)].map(() => ({ tx: 0, tn: 0, pr: 0, n: 0 }));
  time.forEach((t, i) => { const k = +t.slice(5, 7) - 1; m[k].tx += tx[i] || 0; m[k].tn += tn[i] || 0; m[k].pr += pr[i] || 0; m[k].n++; });
  return m.map(o => ({ hi: +(o.tx / o.n).toFixed(1), lo: +(o.tn / o.n).toFixed(1), rain: Math.round(o.pr) }));
}

function scoreMonths(cl) {
  return cl.map(c => {
    let s = 100;
    if (c.hi > 33) s -= (c.hi - 33) * 6; if (c.hi > 38) s -= 15;
    if (c.hi < 10) s -= (10 - c.hi) * 4; if (c.lo < -2) s -= 10;
    s -= Math.min(45, c.rain / 8);
    return Math.max(5, Math.round(s));
  });
}

function archetype(cl) {
  const maxRain = Math.max(...cl.map(c => c.rain));
  const wetIdx = cl.findIndex(c => c.rain === maxRain);
  const avgHi = cl.reduce((t, c) => t + c.hi, 0) / 12;
  const winterLo = Math.min(cl[0].lo, cl[11].lo, cl[1].lo);
  if (maxRain > 250 && wetIdx >= 4 && wetIdx <= 8) return 'monsoon';
  if (winterLo < 0 && avgHi < 20) return 'alpine';
  if (avgHi > 28 && maxRain < 60) return 'desert';
  if (avgHi > 25) return 'tropical';
  return 'temperate';
}

const ARCH = {
  monsoon: { vibe: 'a monsoon-rhythm destination — the year splits into a lush green season and a dry golden one', pack: 'a compact umbrella or poncho, quick-dry layers, and waterproof covers for electronics', warn: 'Peak monsoon weeks can disrupt transport and close trails — build slack into plans', bonus: 'Post-monsoon months are the secret: everything is green, waterfalls are full, and crowds haven\'t returned' },
  alpine: { vibe: 'a mountain-climate destination where the season you pick changes the entire experience', pack: 'proper layers — a warm jacket even in shoulder months, sunscreen for altitude, and broken-in shoes', warn: 'Winter access can close passes and roads; always check conditions before booking', bonus: 'Shoulder months give you snow-capped views with open roads — the photographer\'s window' },
  desert: { vibe: 'a dry-heat destination where mornings and evenings are magic and midday asks for shade', pack: 'breathable full-sleeve layers, a real hat, electrolytes, and a warm layer for surprisingly cold desert nights', warn: 'Summer afternoons are genuinely harsh — plan indoor or water activities for 12–4pm', bonus: 'Winter here is world-class: crisp air, golden light, and perfect outdoor weather all day' },
  tropical: { vibe: 'a warm-all-year destination where rainfall, not temperature, decides your best window', pack: 'light cottons, reef-safe sunscreen, mosquito repellent, and one light rain layer', warn: 'Humidity peaks with the rains — book air-conditioned stays in the wet months', bonus: 'The dry season\'s first and last weeks offer peak weather at below-peak prices' },
  temperate: { vibe: 'a four-season destination where each visit is a different city', pack: 'layers you can add or shed — the daily temperature swing is real', warn: 'Peak summer brings peak crowds and prices; late spring and early autumn are the insider windows', bonus: 'Autumn color or spring bloom weeks are short — time them and the trip upgrades itself' }
};

async function gemini(prompt) {
  const key = process.env.GEMINI_API_KEY; if (!key) return null;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 600 } })
    });
    const d = await r.json();
    return (d.candidates?.[0]?.content?.parts?.[0]?.text || '').trim() || null;
  } catch (e) { return null; }
}

function monthTable(cl, scores) {
  const best = scores.indexOf(Math.max(...scores)), worst = scores.indexOf(Math.min(...scores));
  return `<table><tr><th>Month</th><th>Day / Night</th><th>Rain</th><th>Travel score</th></tr>` + cl.map((c, i) => {
    const col = scores[i] > 70 ? '#16BF96' : scores[i] > 45 ? '#E09030' : '#E8524A';
    const cls = i === best ? 'best' : i === worst ? 'worst' : '';
    return `<tr><td class="${cls}">${MON[i]}</td><td>${c.hi}° / ${c.lo}°C</td><td>${c.rain}mm</td><td><div class="bar"><i style="width:${scores[i]}%;background:${col}"></i></div> ${scores[i]}${i === best ? ' · best' : ''}${i === worst ? ' · toughest' : ''}</td></tr>`;
  }).join('') + `</table>`;
}

function loadReg() { try { return JSON.parse(fs.readFileSync('agent/pages.json', 'utf8')); } catch (e) { return []; } }
function saveReg(r) { fs.writeFileSync('agent/pages.json', JSON.stringify(r, null, 1)); }

function related(reg, self, n) {
  const pool = reg.filter(p => p.slug !== self);
  const same = pool.filter(p => p.country === (reg.find(x => x.slug === self) || {}).country);
  const pick = [...same.slice(0, 2), ...pool.filter(p => !same.includes(p)).slice(0, n)].slice(0, n);
  if (!pick.length) return '';
  return `<h2>Keep exploring</h2><div class="grid">` + pick.map(p => `<a class="card" href="${BASE}/guides/${p.slug}.html"><b>${p.title}</b><span>Best window: ${p.best}</span></a>`).join('') + `</div>`;
}

async function makeGuide(task, reg) {
  const { name, country } = task;
  const sl = slug(`${name}-${country}`);
  if (fs.existsSync(`guides/${sl}.html`)) return null;
  const geo = await geocode(name, country);
  const cl = await climate(geo.lat, geo.lon);
  const scores = scoreMonths(cl);
  const rank = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]);
  const bestIdx = rank.slice(0, 3).map(x => x[1]).sort((a, b) => a - b);
  const bestNames = bestIdx.map(i => MON[i]).join(', ');
  const worstIdx = scores.indexOf(Math.min(...scores));
  const arch = archetype(cl), A = ARCH[arch];
  const title = `Best Time to Visit ${name}, ${country} (${YEAR}) — Month-by-Month Weather & Travel Guide`;
  const desc = `When should you visit ${name}? Real climate data for all 12 months (best: ${bestNames}), what to pack, what to expect, and a free AI trip planner.`;
  const canon = `${BASE}/guides/${sl}.html`;
  const faq = [
    [`What is the best time to visit ${name}?`, `${bestNames} score highest on our weather-comfort index — daytime around ${cl[bestIdx[0]].hi}°C with manageable rainfall. ${A.bonus}.`],
    [`Which month should I avoid in ${name}?`, `${MON[worstIdx]} is the toughest window (${cl[worstIdx].hi}°C days, ~${cl[worstIdx].rain}mm rain). ${A.warn}.`],
    [`What should I pack for ${name}?`, `Pack ${A.pack}.`],
    [`How many days do I need in ${name}?`, `Most travelers are happy with 3–5 focused days; add 2 more if you want day trips around ${geo.admin || country}. The free RoamWise planner builds the day-by-day plan.`]
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq.map(([q, a]) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } })) };

  let intro = `<p>${name} is ${A.vibe}. The numbers below are real — monthly weather computed from the ERA5 climate archive for ${name}'s exact coordinates — so this page answers the question most guides dodge: <strong>which months are actually worth your leave days?</strong></p><p>The short answer: aim for <strong>${bestNames}</strong>, skip ${MON[worstIdx]} if you can, and read the packing notes before you book. ${A.bonus}.</p>`;
  const g = await gemini(`Write 2 short paragraphs (total 90-120 words, plain HTML <p> tags only, no headings) introducing ${name}, ${country} for travelers deciding WHEN to go. Facts to weave in naturally: best months are ${bestNames}; toughest is ${MON[worstIdx]}; climate style: ${arch}. Warm, specific, no fluff, no exclamation marks.`);
  if (g && g.includes('<p>')) intro = g;

  const html = head(title, desc, canon, ld) + `
<div class="meta">Travel Guide · ${country} · Updated ${MON[new Date().getMonth()]} ${YEAR}</div>
<h1>Best Time to Visit ${name}: the Month-by-Month Truth</h1>
${intro}
<h2>📊 ${name} weather, all 12 months (real data)</h2>
${monthTable(cl, scores)}
<div class="callout"><strong>🥷 The verdict:</strong> <strong>${bestNames}</strong> are the smart-money months. ${MON[worstIdx]} scores lowest — ${A.warn.toLowerCase()}.</div>
<h2>🎒 What to pack for ${name}</h2>
<p>Pack ${A.pack}. ${arch === 'alpine' ? 'Altitude amplifies sun and cold at once — respect both.' : arch === 'monsoon' ? 'Footwear that survives wet streets earns its space twice over.' : 'Comfortable walking shoes beat everything else in your bag.'}</p>
<h2>🗓️ How to plan the days</h2>
<p>Give ${name} 3–5 focused days. Mornings for the headline sights (crowds arrive after 10), afternoons for neighbourhoods, evenings for food. The free RoamWise planner turns this into a full day-by-day itinerary with budgets in your currency — and shows the crowd calendar for ${name} next to 195+ other destinations.</p>
${cta(name)}
<h2>❓ FAQ</h2>
${faq.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('')}
${related(reg, sl, 3)}
` + foot();
  fs.mkdirSync('guides', { recursive: true });
  fs.writeFileSync(`guides/${sl}.html`, html);
  return { slug: sl, title: `${name}, ${country}`, name, country, best: bestNames, arch, cl: cl.map(c => c.hi), scores };
}

async function makeMonth(task, reg) {
  const { name, country, mi } = task;
  const parent = reg.find(p => p.name === name && p.country === country);
  if (!parent || !parent.scores) return null;
  const sl = slug(`${name}-in-${MON[mi]}`);
  if (fs.existsSync(`guides/${sl}.html`)) return null;
  const s = parent.scores[mi], hi = parent.cl[mi];
  const verdictWord = s > 70 ? 'a great' : s > 45 ? 'a decent' : 'a challenging';
  const title = `${name} in ${MON[mi]} (${YEAR}): Weather, Crowds & Is It Worth It?`;
  const desc = `${name} in ${MON[mi]}: ~${hi}°C days, travel score ${s}/100. What it feels like, what to pack, and whether to book — with a free AI planner.`;
  const canon = `${BASE}/guides/${sl}.html`;
  const A = ARCH[parent.arch];
  const faq = [
    [`Is ${MON[mi]} a good time to visit ${name}?`, `It scores ${s}/100 on our weather-comfort index — ${verdictWord} month. The top window overall is ${parent.best}.`],
    [`How hot is ${name} in ${MON[mi]}?`, `Daytime averages around ${hi}°C. ${A.warn}.`],
    [`What should I pack for ${name} in ${MON[mi]}?`, `Pack ${A.pack}.`]
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq.map(([q, a]) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } })) };
  const html = head(title, desc, canon, ld) + `
<div class="meta">Month Guide · ${country} · Updated ${MON[new Date().getMonth()]} ${YEAR}</div>
<h1>${name} in ${MON[mi]}: the Honest Answer</h1>
<p>Thinking about ${name} for a ${MON[mi]} trip? Here is the real picture, from actual climate data: daytime temperatures average <strong>${hi}°C</strong>, and the month scores <strong>${s}/100</strong> on our travel-comfort index. That makes it ${verdictWord} pick — the standout window for ${name} remains <strong>${parent.best}</strong>.</p>
<div class="callout"><strong>🥷 Quick verdict:</strong> ${s > 70 ? `Book it. ${MON[mi]} is one of ${name}'s sweet spots — ${A.bonus.toLowerCase()}.` : s > 45 ? `Workable with eyes open. ${A.warn}.` : `Only if dates are fixed. ${A.warn} Consider shifting to ${parent.best} if you can.`}</div>
<h2>🎒 Packing for ${MON[mi]}</h2>
<p>Pack ${A.pack}. ${name} is ${A.vibe}, and ${MON[mi]} sits ${s > 60 ? 'inside' : 'outside'} its comfort zone — dress for the score, not the brochure.</p>
<h2>🗓️ Make it work anyway</h2>
<p>Whatever the month, the pattern that wins: headline sights at opening time, indoor or shaded plans for early afternoon, food and neighbourhoods in the evening. The free RoamWise planner builds this for ${name} automatically — with the full 12-month crowd calendar so you can compare ${MON[mi]} against ${parent.best} in one glance.</p>
${cta(`${name} in ${MON[mi]}`)}
<h2>❓ FAQ</h2>
${faq.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('')}
<p><a href="${BASE}/guides/${slug(name + '-' + country)}.html">→ Full ${name} guide: every month compared</a></p>
` + foot();
  fs.writeFileSync(`guides/${sl}.html`, html);
  return { slug: sl, title: `${name} in ${MON[mi]}`, name: `${name}·${MON[mi]}`, country, best: parent.best, month: true };
}

function rebuildHub(reg) {
  const cards = reg.filter(p => !p.month).map(p => `<a class="card" href="${BASE}/guides/${p.slug}.html"><b>${p.title}</b><span>Best window: ${p.best}</span></a>`).join('');
  let hub = fs.readFileSync('guides/index.html', 'utf8');
  const mark = '<!--AGENT-->';
  if (!hub.includes(mark)) hub = hub.replace('</div>\n<a class="cta"', `</div>\n<h2>Fresh from the agent — data-driven guides</h2><div class="grid">${mark}</div>\n<a class="cta"`).replace('</div><a class="cta"', `</div><h2>Fresh from the agent — data-driven guides</h2><div class="grid">${mark}</div><a class="cta"`);
  hub = hub.replace(new RegExp(`<h2>Fresh from the agent[^]*?</div>`), `<h2>Fresh from the agent — data-driven guides</h2><div class="grid">${cards}${mark}</div>`);
  fs.writeFileSync('guides/index.html', hub);
}

(async () => {
  const topics = JSON.parse(fs.readFileSync('agent/topics.json', 'utf8'));
  const reg = loadReg();
  /* self-extend queue with month pages when low */
  if (topics.queue.length < 15) {
    reg.filter(p => !p.month && p.scores).forEach(p => {
      for (let mi = 0; mi < 12; mi++) {
        const sl = slug(`${p.name}-in-${MON[mi]}`);
        if (!fs.existsSync(`guides/${sl}.html`) && !topics.queue.some(q => q.t === 'month' && q.name === p.name && q.mi === mi))
          topics.queue.push({ t: 'month', name: p.name, country: p.country, mi });
      }
    });
    console.log('queue extended →', topics.queue.length);
  }
  const madeList = [];
  while (madeList.length < N && topics.queue.length) {
    const task = topics.queue.shift();
    try {
      const made = task.t === 'month' ? await makeMonth(task, reg) : await makeGuide(task, reg);
      if (made) { reg.push(made); madeList.push(made.title); console.log('✅', made.slug); }
      topics.done.push(task);
      await new Promise(r => setTimeout(r, 1200)); /* be polite to free APIs */
    } catch (e) {
      console.log('⚠️ skip', task.name, String(e.message || e).slice(0, 80));
      topics.done.push({ ...task, err: 1 });
    }
  }
  saveReg(reg); fs.writeFileSync('agent/topics.json', JSON.stringify(topics));
  if (madeList.length) rebuildHub(reg);
  require('./sitemap.js');
  fs.writeFileSync('published.txt', madeList.join(', ') || 'none');
  console.log(`published ${madeList.length}/${N} · queue left: ${topics.queue.length} · total pages: ${reg.length}`);
})();
