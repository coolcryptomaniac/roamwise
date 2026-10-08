#!/usr/bin/env node
// Print a bounded module map before reading implementation. No network/AI calls.
'use strict';
const manifest = require('../feature.json');
const area = process.argv[2];
if (area && !['data', 'core', 'ui'].includes(area)) { console.error('Usage: npm run kainchi:context -- data|core|ui'); process.exit(1); }
console.log('RoamWise Kainchi Dham Yatra | local-only advisory planner (Phase 0)');
console.log('Read: features/kainchi-yatra/AGENTS.md and docs/CHATGPT-BRIEF.md');
console.log('Page: /kainchi/ | No API, Firestore, auth or payments');
for (const [file, purpose] of Object.entries(manifest.modules)) if (!area || file.startsWith(area + '/')) console.log(file + ' — ' + purpose);
console.log('Browser order: ' + manifest.browserScripts.join(' → '));
console.log('Check: npm run kainchi:check | Test: npm run kainchi:test');
console.log('Empty rate cards, slot capacities and district contact are intentional: never invent them.');
