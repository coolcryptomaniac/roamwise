#!/usr/bin/env node
// Onboard an artist: node tools/add-artist.js submission.json [--plan studio] [--write]   (dry run unless --write)
// Plan defaults to free; pass --plan studio only after the one-time contribution is confirmed.
// Validates the application JSON (from the Join page), then appends a record to creators/artists-data.json.
const fs = require('fs'), path = require('path');
(async () => {
  const { validateArtist, toRecord } = await import(path.join(__dirname, '../creators/artist-core.mjs'));
  const file = process.argv[2], write = process.argv.includes('--write'), pi = process.argv.indexOf('--plan'), plan = pi > 0 ? process.argv[pi + 1] : 'free';
  if (!['free', 'studio'].includes(plan)) { console.error('--plan must be free or studio'); process.exit(2); }
  if (!file) { console.error('usage: node tools/add-artist.js submission.json [--write]'); process.exit(2); }
  const sub = JSON.parse(fs.readFileSync(file, 'utf8')), dataPath = path.join(__dirname, '../creators/artists-data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')), errs = validateArtist(sub, data.artists.map(a => a.id));
  if (errs.length) { console.error('Not added:\n - ' + errs.join('\n - ')); process.exit(1); }
  const rec = toRecord(sub, plan);
  if (!write) { console.log('OK (dry run). Would add:\n' + JSON.stringify(rec, null, 2)); return; }
  data.artists.push(rec); fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n'); console.log('Added ' + rec.id + ' -> ' + rec.page);
})();
