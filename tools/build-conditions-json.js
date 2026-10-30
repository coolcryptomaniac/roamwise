#!/usr/bin/env node
/* Builds data/conditions.json from conditions-data.js + features/travel-safety/data/places.js.
   The Worker's advisory alerts (worker/handlers/advisory-alerts.js) fetch this JSON from the
   live site, so a new advisory added to conditions-data.js reaches guests, followers, partners
   and the team on the next run after the site deploys.
   Usage: node tools/build-conditions-json.js [--check]   (--check fails if the JSON is stale) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'conditions.json');
const { RW_CONDITIONS, RW_CONDITIONS_CHECKED } = require(path.join(ROOT, 'conditions-data.js'));
const { RW_UK_REGIONS, rwUkRegionsForText } = require(path.join(ROOT, 'features', 'travel-safety', 'data', 'places.js'));

const ISO = /^20\d\d-\d\d-\d\d$/;
function build() {
  const advisories = RW_CONDITIONS.map((c) => {
    if (!c.id || !ISO.test(c.until) || !/^https:\/\//.test(c.sourceUrl || '')) throw new Error('bad advisory ' + (c.id || '?'));
    return {
      id: c.id, kind: c.kind, official: !!c.official, auto: !!c.auto, title: c.title, detail: c.detail,
      from: ISO.test(c.from || '') ? c.from : null, until: c.until, source: c.source, sourceUrl: c.sourceUrl,
      match: c.match, regions: rwUkRegionsForText((c.match || []).join(' | ')),
    };
  });
  return {
    version: 1, checked: RW_CONDITIONS_CHECKED || null,
    regions: RW_UK_REGIONS.map((r) => ({ id: r.id, name: r.name, words: r.words })),
    advisories,
  };
}
const json = JSON.stringify(build(), null, 1) + '\n';
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== json) { console.error('data/conditions.json is stale: run node tools/build-conditions-json.js'); process.exit(1); }
  console.log('data/conditions.json up to date (' + build().advisories.length + ' advisories)');
} else {
  fs.writeFileSync(OUT, json);
  console.log('wrote data/conditions.json');
}
