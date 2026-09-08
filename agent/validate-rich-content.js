const fs = require('fs');

const listFile = process.argv[2] || 'published.txt';
const published = fs.readFileSync(listFile, 'utf8').trim();
if (!published || published === 'none') throw new Error('No rich article was published');

const registry = JSON.parse(fs.readFileSync('agent/pages.json', 'utf8'));
const titles = published.split(',').map(s => s.trim()).filter(Boolean);
const failures = [];

for (const title of titles) {
  const entry = [...registry].reverse().find(page => page.title === title);
  if (!entry) { failures.push(`${title}: missing registry entry`); continue; }
  const file = `guides/${entry.slug}.html`;
  const html = fs.readFileSync(file, 'utf8');
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&\w+;/g, ' ');
  const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  const externalLinks = new Set([...html.matchAll(/href="https?:\/\/([^/"#?]+)[^"]*"/g)].map(m => m[1]).filter(host => !host.endsWith('roamwise.co.in')));
  const images = (html.match(/<img\b/gi) || []).length;
  const youtube = /youtube-nocookie\.com\/embed\/[\w-]{6,}/i.test(html);
  const canonical = html.includes(`<link rel="canonical" href="https://www.roamwise.co.in/guides/${entry.slug}.html">`);
  if (words < 3000) failures.push(`${file}: ${words} words (minimum 3000)`);
  if (externalLinks.size < 4) failures.push(`${file}: ${externalLinks.size} external reference domains (minimum 4)`);
  if (images < 2) failures.push(`${file}: ${images} images (minimum 2)`);
  if (!youtube) failures.push(`${file}: missing privacy-enhanced YouTube embed`);
  if (!canonical) failures.push(`${file}: canonical URL mismatch`);
}

if (failures.length) throw new Error(`Rich-content gate failed:\n- ${failures.join('\n- ')}`);
console.log(`Validated ${titles.length} rich article(s): 3000+ words, references, images, video and canonical URLs.`);
