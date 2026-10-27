#!/usr/bin/env node
// Onboard an artist: node tools/add-artist.js submission.json [--plan founding|free|autopilot|premium] [--write]   (dry run unless --write)
// Default plan is 'founding' (every feature, free) while founding spots remain (launchOffer.limit in artists-data.json). After that, pass --plan explicitly once any contribution is confirmed.
const fs = require('fs'), path = require('path');
(async () => {
  const { validateArtist, toRecord } = await import(path.join(__dirname, '../creators/artist-core.mjs'));
  const file = process.argv[2], write = process.argv.includes('--write'), pi = process.argv.indexOf('--plan'), plan = pi > 0 ? process.argv[pi + 1] : '';
  if (plan && !['founding', 'free', 'autopilot', 'premium'].includes(plan)) { console.error('--plan must be founding, free, autopilot or premium'); process.exit(2); }
  if (!file) { console.error('usage: node tools/add-artist.js submission.json [--write]'); process.exit(2); }
  const sub = JSON.parse(fs.readFileSync(file, 'utf8')), dataPath = path.join(__dirname, '../creators/artists-data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')), errs = validateArtist(sub, data.artists.map(a => a.id));
  if (errs.length) { console.error('Not added:\n - ' + errs.join('\n - ')); process.exit(1); }
  const o = data.launchOffer || {}, used = data.artists.filter(a => a.plan === 'founding').length, open = o.active && used < (o.limit || 0);
  const use = plan || (open ? 'founding' : '');
  if (!use) { console.error('Founding spots are full (' + used + '/' + (o.limit || 0) + '). Pass --plan free|autopilot|premium.'); process.exit(1); }
  if (use === 'founding' && !open) { console.error('Founding spots are full (' + used + '/' + (o.limit || 0) + ').'); process.exit(1); }
  const rec = toRecord(sub, use);
  if (!write) { console.log('OK (dry run). Would add:\n' + JSON.stringify(rec, null, 2)); return; }
  data.artists.push(rec); fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n'); console.log('Added ' + rec.id + ' -> ' + rec.page); require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build-artist-pages.js')], { stdio: 'inherit' }); console.log('Run npm run sitemap and commit creators/' + rec.id + '/ with the data change.');
})();
