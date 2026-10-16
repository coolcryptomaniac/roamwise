'use strict';
/* Loads Ailon Tusk's real client modules (parser, event answers, answer cache)
   in a sandbox so tests and the daily GitHub bot can ask: "what would Tusk do
   with this question?" with no browser and no AI call. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

function loadEvents(){
  const html = read('index.html');
  const m = html.match(/var EVENTS=\[([\s\S]*?)\n\s*\];/);
  if(!m) throw new Error('EVENTS array not found in index.html');
  return vm.runInNewContext('[' + m[1] + ']');
}

function makeTusk(opts){
  opts = opts || {};
  const storage = new Map();
  const ls = {
    getItem: k => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k)
  };
  const state = {
    console, localStorage: ls, navigator: { onLine: false }, document: { getElementById: () => null },
    lsGet: k => storage.get(k) || '', lsSet: (k, v) => storage.set(k, String(v)),
    DB: [], RW_PLACE_OVERRIDES: {}, RW_COMMON_WORDS: /^(plan|trip|from|to)$/i,
    rwDetectState: () => null, rwDetectCountry: () => null, track: () => {}, esc2: s => String(s),
    cpFinish: () => {}, window: null
  };
  state.window = state;
  state.RW_MUSIC_EVENTS = loadEvents();
  for(const f of ['js/core/text-utils.js', 'js/copilot/core.js', 'js/copilot/event-trips.js', 'js/copilot/answer-cache.js']){
    vm.runInNewContext(read(f), state, { filename: f });
  }
  return {
    state,
    events: state.RW_MUSIC_EVENTS,
    parse: q => state.cpParseRegex(q),
    event: (q, now) => state.rwEventTripAnswer(q, now),
    key: (q, intents) => state.rwAnsKey(q, intents),
    relevant: (q, a) => state.rwAnsRelevant(q, a)
  };
}

/* The exact request the "Ask Ailon Tusk to plan this" button writes (index.html). */
function eventPrompt(e, origin){
  return 'Plan a trip around ' + e.name + ' (' + e.place + ', ' + e.when + '). '
    + (origin ? 'My starting city is ' + origin + '. ' : '')
    + 'Include how to get there, where to stay near the venue, how many days to allow, a rough budget, and a reminder to confirm ticket and timing details on the official page.';
}

module.exports = { makeTusk, eventPrompt, loadEvents };
