const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('js/copilot/agent.js','utf8');
test('Tusk result is short, branded, escaped and expandable',()=>{
 const context={};vm.createContext(context);
 vm.runInContext(src.slice(src.indexOf('function rwTuskAgentResultHTML')),context);
 context.esc2=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const html=context.rwTuskAgentResultHTML('Hello <script>alert(1)</script>\nStay one\nStay two');
 assert.match(html,/AILON TUSK/);assert.match(html,/#7357F6/);assert.match(html,/Show full answer/);
 assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);
 assert.match(html,/scroll-snap-type/);
});
