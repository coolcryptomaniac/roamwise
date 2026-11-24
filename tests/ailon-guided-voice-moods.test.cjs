const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
test('voice uses canonical hero conversation and preserves typed draft',()=>{
 assert.match(read('js/voice/voice-input.js'),/copilotSend\(true,spoken\)/);
 assert.match(read('js/voice/tusk-studio.js'),/var target='heroInput'/);
 assert.match(read('js/copilot/core.js'),/if\(!direct&&inp\)inp.value=''/);
});
test('guided forms do not submit until user chooses Ask Ailon',()=>{
 assert.match(read('js/ui/ailon-first.js'),/panel.onsubmit=function/);
 assert.match(read('js/ui/ailon-first.js'),/if\(key!=='booking'\)/);
 assert.match(read('js/ui/ailon-first.js'),/Ask Ailon/);
});
test('moods keep edition IDs and use no remote rendering service',()=>{
 assert.match(read('design/design-vault.js'),/rw_visual_mood/);
 assert.match(read('js/ui/ailon-world-experience.js'),/Itinerary visual theme/);
 assert.match(read('design/ailon-world-experience.css'),/data-rw-mood="rave"/);
 assert.match(read('design/ailon-world-experience.css'),/prefers-reduced-motion/);
});
test('destination rail progressively consumes editorial atlas',()=>assert.match(read('js/ui/destination-filmstrip.js'),/root.RW_LOCAL_ATLAS/));
