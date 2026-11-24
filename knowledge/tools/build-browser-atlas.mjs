import fs from 'node:fs';
import {TUSK_ATLAS} from '../../worker/data/tusk-travel-atlas.js';
import {WORLD_ATLAS} from '../../worker/data/tusk-world-atlas.js';
export function snapshot(){return '/* Generated from RoamWise atlas sources; rebuild with knowledge/tools/build-browser-atlas.mjs. */\nwindow.RW_LOCAL_ATLAS='+JSON.stringify([...TUSK_ATLAS,...WORLD_ATLAS].map(d=>({id:d.id,name:d.name,country:d.country,region:d.region,aliases:d.aliases,highlights:d.highlights,food:d.foodSuggestions,facts:d.facts,people:d.people,itinerary:d.suggestedItinerary,summary:d.summary,status:d.status,source:d.sourcePage})))+';\n';}
const dest=new URL('../../data/ailon-atlas-snapshot.js',import.meta.url);
if(process.argv.includes('--check')){if(fs.readFileSync(dest,'utf8')!==snapshot())throw Error('Browser atlas is stale');}else fs.writeFileSync(dest,snapshot());
