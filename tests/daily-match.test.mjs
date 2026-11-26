import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function load(){const win={};new Function('window','document','localStorage','fetch',read('js/ui/daily-match.js'))(win,{readyState:'complete',getElementById:()=>null},{getItem:()=>null,setItem:()=>{}},()=>Promise.reject());return win.rwDailyMatch;}
test('same pairing seed all day, chemistry bands are stable',()=>{
  const M=load();
  assert.equal(M.seedOf('rw-daily-2026-11-26'),M.seedOf('rw-daily-2026-11-26'));
  assert.notEqual(M.seedOf('rw-daily-2026-11-26'),M.seedOf('rw-daily-2026-11-27'));
  assert.equal(M.band(90),'Electric');assert.equal(M.band(75),'Good');assert.equal(M.band(60),'Low');
  const r=()=>0.5;assert.ok(M.chemistry({tags:['spiritual','himalayan']},{tags:['himalayan']},r)>M.chemistry({tags:['urban']},{tags:['beach']},r));
});
test('daily match is wired on home and never claims a real partnership',()=>{
  const html=read('index.html'),js=read('js/ui/daily-match.js');
  assert.match(html,/js\/ui\/daily-match\.js/);assert.match(js,/rwStayPublicEligible/);
  assert.match(js,/Collaborations happen only when both sides agree/);
});
