#!/usr/bin/env node
// Onboard an artist: node tools/add-artist.js submission.json [--write]   (dry run unless --write)
// Every artist is a founding artist for now (plan 'studio', full features, free). Pass --plan free only for a restricted listing.
const fs = require('fs'), path = require('path');
(async () => {
  const { validateArtist, toRecord } = await import(path.join(__dirname, '../creators/artist-core.mjs'));
  const file = process.argv[2], write = process.argv.includes('--write'), pi = process.argv.indexOf('--plan'), plan = pi > 0 ? process.argv[pi + 1] : 'studio';
  if (!['free', 'studio'].includes(plan)) { console.error('--plan must be studio or free'); process.exit(2); }
  if (!file) { console.error('usage: node tools/add-artist.js submission.json [--write]'); process.exit(2); }
  const sub = JSON.parse(fs.readFileSync(file, 'utf8')), dataPath = path.join(__dirname, '../creators/artists-data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')), errs = validateArtist(sub, data.artists.map(a => a.id));
  if (errs.length) { console.error('Not added:\n - ' + errs.join('\n - ')); process.exit(1); }
  const rec = toRecord(sub, plan); if (plan === 'studio') rec.founding = true;
  if (!write) { console.log('OK (dry run). Would add:\n' + JSON.stringify(rec, null, 2)); return; }
  data.artists.push(rec); fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n'); console.log('Added ' + rec.id + ' -> ' + rec.page);
})();
