import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/copilot/core.js',import.meta.url),'utf8');
const start=source.indexOf('function rwWebAnswerHTML(q,res){');
const end=source.indexOf('/* One canonical known-place map',start);
assert.ok(start>=0 && end>start,'source result renderer exists');
const context={URL,encodeURIComponent,esc2(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context);
const render=context.rwWebAnswerHTML;

test('result sources appear as swipeable accessible cards',()=>{
  const html=render('BTS 2026 official timetable',{abs:'Latest programme',absSrc:'Official',absUrl:'https://www.bengalurutechsummit.com/',hits:[{t:'Timetable page',u:'https://www.bengalurutechsummit.com/programme_at_a_glance.php',s:'web'}]});
  assert.match(html,/data-rw-carousel="sources"/);
  assert.match(html,/scroll-snap-type:x mandatory/);
  assert.match(html,/Timetable page/);
  assert.match(html,/Source|source/);
  assert.match(html,/Google Search/);
});

test('unsafe external links are omitted, even when provider returns HTML',()=>{
  const html=render('travel',{hits:[
    {t:'bad',u:'javascript:alert(1)',s:'fake'},
    {t:'<img src=x onerror=alert(1)>',u:'https://example.com/path?q="hi"',s:'<script>'},
    {t:'data:text/html,hi',u:'data:text/html,hi'}
  ]});
  assert.doesNotMatch(html,/href="javascript:/);
  assert.doesNotMatch(html,/<img src=x/);
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/https:\/\/example.com/);
});

test('unknown and empty result lists remain honest',()=>{
  const html=render('2026 private guest list',{hits:[]});
  assert.match(html,/no confirmed matches/i);
  assert.match(html,/not independent fact-checking/i);
});

test('service worker updates cache generation for summit fixes',()=>{
  const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(sw,/rw-v162-summit-event-handoff/);
});
