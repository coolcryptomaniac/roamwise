#!/usr/bin/env node
// Onboard an artist: node tools/add-artist.js submission.json [--plan studio] [--write]   (dry run unless --write)
// Plan defaults to free; pass --plan studio only after the contribution is confirmed, or --founding to grant Studio free under the launch offer (limit in artists-data.json `launchOffer`).
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
  let rec;
  if (process.argv.includes('--founding')) {
    const o = data.launchOffer || {}, n = data.artists.filter(a => a.founding).length;
    if (!o.active || n >= o.limit) { console.error('Founding offer is closed or full (' + n + '/' + (o.limit || 0) + ')'); process.exit(1); }
    rec = toRecord(sub, 'studio'); rec.founding = true;
  } else rec = toRecord(sub, plan);
  if (!write) { console.log('OK (dry run). Would add:\n' + JSON.stringify(rec, null, 2)); return; }
  data.artists.push(rec); fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n'); console.log('Added ' + rec.id + ' -> ' + rec.page);
})();
