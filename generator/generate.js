const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CITIES = [
    {name: "Pune", state: "Maharashtra", best_month: "December", temp: 22, attractions: ["Lonavala", "Sinhagad Fort"]},
    {name: "Manali", state: "Himachal", best_month: "March", temp: 10, attractions: ["Solang Valley", "Rohtang Pass"]},
    {name: "Goa", state: "Goa", best_month: "November", temp: 28, attractions: ["Baga Beach", "Dudhsagar Falls"]},
    {name: "Udaipur", state: "Rajasthan", best_month: "October", temp: 25, attractions: ["Lake Pichola", "City Palace"]},
    {name: "Coorg", state: "Karnataka", best_month: "August", temp: 20, attractions: ["Raja's Seat", "Abbey Falls"]},
    {name: "Rishikesh", state: "Uttarakhand", best_month: "February", temp: 15, attractions: ["Laxman Jhula", "River Rafting"]},
    {name: "Alleppey", state: "Kerala", best_month: "January", temp: 27, attractions: ["Houseboats", "Backwaters"]},
    {name: "Ooty", state: "Tamil Nadu", best_month: "May", temp: 18, attractions: ["Botanical Garden", "Nilgiri Railway"]},
    {name: "Jaipur", state: "Rajasthan", best_month: "November", temp: 23, attractions: ["Hawa Mahal", "Amber Fort"]},
    {name: "Kashmir", state: "J&K", best_month: "April", temp: 14, attractions: ["Dal Lake", "Gulmarg"]}
];

const TRIP_TYPES = ["budget-weekend", "luxury-honeymoon", "solo-backpacking", "family-trip", "spiritual-pilgrimage"];
const DURATIONS = ["2-days", "3-days", "5-days"];

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
    });
}
const db = admin.firestore();

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en-in">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <meta name="description" content="{{DESCRIPTION}}">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="stylesheet" href="/assets/css/style.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "TravelAction",
      "name": "{{TITLE}}",
      "location": {
        "@type": "City",
        "name": "{{CITY}}",
        "containedInPlace": {
          "@type": "State",
          "name": "{{STATE}}"
        }
      },
      "bestTimeToVisit": "{{BEST_MONTH}}"
    }
    </script>
</head>
<body>
    <header class="main-header">
        <div class="logo"><a href="/">Roamwise</a></div>
        <nav>
            <a href="/">Home</a>
            <a href="/guide/" class="active">Guides</a>
            <a href="/about">About</a>
        </nav>
    </header>
    <main class="container">
        <div class="breadcrumb"><a href="/">Home</a> > <a href="/guide/">Guides</a> > {{CITY}}</div>
        <h1>The Ultimate {{TRIP_TYPE}} Guide to {{CITY}}</h1>
        <p><strong>Best Time:</strong> {{BEST_MONTH}} (Avg {{TEMP}}°C) | <strong>State:</strong> {{STATE}}</p>
        <p>Looking for a {{TRIP_TYPE}} to {{CITY}}? This {{DURATION}} itinerary covers: {{ATTRACTIONS}}.</p>
        <h2>Top Attractions</h2>
        <ul>{% for attr in ATTRACTIONS %}<li>{{attr}}</li>{% endfor %}</ul>
    </main>
    <footer class="main-footer"><p>&copy; 2026 Roamwise India.</p></footer>
</body>
</html>`;

async function main() {
    const genDoc = await db.collection('meta').doc('generated').get();
    let generated = genDoc.exists ? genDoc.data().slugs || [] : [];

    let allCombos = [];
    for (let city of CITIES) {
        for (let trip of TRIP_TYPES) {
            for (let dur of DURATIONS) {
                const slug = `${city.name.toLowerCase()}-${trip}-${dur}`;
                allCombos.push({ slug, city, trip, dur });
            }
        }
    }

    let newCombos = allCombos.filter(c => !generated.includes(c.slug));
    const toGenerate = newCombos.slice(0, 20);
    if (toGenerate.length === 0) return;

    const distDir = path.join(__dirname, 'dist', 'guide');
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    for (let item of toGenerate) {
        const title = `${item.trip.replace(/-/g, ' ').toUpperCase()} to ${item.city.name} – Complete Guide`;
        const desc = `Plan your ${item.trip} to ${item.city.name}. Best time ${item.city.best_month}, avg temp ${item.city.temp}°C.`;
        let html = HTML_TEMPLATE
            .replace(/{{TITLE}}/g, title)
            .replace(/{{DESCRIPTION}}/g, desc)
            .replace(/{{CITY}}/g, item.city.name)
            .replace(/{{STATE}}/g, item.city.state)
            .replace(/{{TRIP_TYPE}}/g, item.trip.replace(/-/g, ' '))
            .replace(/{{BEST_MONTH}}/g, item.city.best_month)
            .replace(/{{TEMP}}/g, item.city.temp)
            .replace(/{{DURATION}}/g, item.dur.replace(/-/g, ' '))
            .replace(/{{ATTRACTIONS}}/g, item.city.attractions.join(', '));
        html = html.replace(/{% for attr in ATTRACTIONS %}(.*?){% endfor %}/g, 
            item.city.attractions.map(a => `<li>${a}</li>`).join(''));
        const folder = path.join(distDir, item.slug);
        if (!fs.existsSync(folder)) fs.mkdirSync(folder);
        fs.writeFileSync(path.join(folder, 'index.html'), html);
    }

    // Generate Guide Index
    let allSlugs = [...generated, ...toGenerate.map(i => i.slug)];
    let indexHtml = `<html><head><title>All Travel Guides - Roamwise</title><link rel="stylesheet" href="/assets/css/style.css"></head><body>
    <header><div class="logo"><a href="/">Roamwise</a></div><nav><a href="/">Home</a><a href="/guide/" class="active">Guides</a></nav></header>
    <main><h1>All Travel Guides</h1><ul>`;
    for (let slug of allSlugs) {
        let parts = slug.split('-');
        let city = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        let trip = parts.slice(1, -2).join(' ').replace(/-/g, ' ');
        indexHtml += `<li><a href="/guide/${slug}/">${trip} to ${city}</a></li>`;
    }
    indexHtml += `</ul></main></body></html>`;
    fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

    const newSlugs = toGenerate.map(i => i.slug);
    await db.collection('meta').doc('generated').set({
        slugs: admin.firestore.FieldValue.arrayUnion(...newSlugs)
    }, { merge: true });
    console.log(`✅ Added ${toGenerate.length} new pages to /guide/`);
}
main().catch(console.error);
