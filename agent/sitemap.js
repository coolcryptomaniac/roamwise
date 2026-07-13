/* Rebuild sitemap.xml by scanning the actual site files — shared by all agent jobs */
const fs = require('fs');
const BASE = 'https://www.roamwise.co.in';
const urls = [`${BASE}/`, `${BASE}/guides/`, `${BASE}/blog/`, `${BASE}/privacy.html`, `${BASE}/delete-account.html`];
for (const dir of ['guides', 'blog']) {
  if (!fs.existsSync(dir)) continue;
  fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html')
    .forEach(f => urls.push(`${BASE}/${dir}/${f}`));
}
fs.writeFileSync('sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n') + `\n</urlset>`);
console.log('sitemap:', urls.length, 'URLs');
