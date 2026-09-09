#!/usr/bin/env node
// Print a bounded module map before reading implementation. No network/AI calls.
'use strict';
const manifest = require('../feature.json');
const area = process.argv[2];
if (area && !['core', 'ui', 'api'].includes(area)) {
  console.error('Usage: npm run business:context -- core|ui|api');
  process.exit(1);
}
console.log('RoamWise Business | local workspace + optional stateless API');
console.log('Read: features/business-travel/AGENTS.md');
console.log('Page: /business/ | API: /v1/business/{reconcile,export}, disabled by default');
for (const [file, purpose] of Object.entries(manifest.modules)) {
  if (!area || file.startsWith(area + '/')) console.log(file + ' — ' + purpose);
}
console.log('Browser order: ' + manifest.browserScripts.join(' → '));
console.log('Check: npm run business:check | Test: npm run business:test');
console.log('Consumer scripts, Firebase, Pro and payment behavior are outside this feature.');
console.log('No implicit approval, live crowd forecasts, bookings, payments or ERP posting.');
