import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function load(){
  const store={};const win={};
  const ls={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)}};
  new Function('window','localStorage','document','fetch',read('js/ui/discover-taste.js'))(win,ls,{},()=>Promise.reject());
  return win.RWTaste;
}
test('loves raise tags, passes lower them, buy taps count most',()=>{
  const T=load();
  T.learn(['spiritual','himalayan'],'like');T.learn(['fashion'],'nope');T.learn(['reading'],'buy');
  assert.ok(T.score(['reading'])>T.score(['spiritual']));
  assert.ok(T.score(['spiritual'])>0);assert.ok(T.score(['fashion'])<0);
  assert.deepEqual(T.top(1),['reading']);
});
test('deck ranking puts the closest match first but keeps exploring',()=>{
  const T=load();T.learn(['wellness'],'like');T.learn(['wellness'],'save');
  const cards=[{key:'a',tags:['tech']},{key:'b',tags:['wellness']},{key:'c',tags:['folk']},{key:'d',tags:['night']},{key:'e',tags:['nature']},{key:'f',tags:['culture']}];
  const r=T.rank(cards);assert.equal(r[0].key,'b');assert.equal(r.length,cards.length);
});
test('text is tagged for shop, books and art',()=>{
  const T=load();
  assert.ok(T.tagsOfText('Oversized hoodie').includes('fashion'));
  assert.ok(T.tagsOfText('AI in simple Hinglish').includes('tech'));
  assert.ok(T.tagsOfText('Shree yantra mandala').includes('spiritual'));
});
test('swipe deck uses the taste model and shows the shelf',()=>{
  const sw=read('js/ui/swipe-discover.js'),html=read('index.html');
  assert.match(sw,/W\.RWTaste\.rank\(fresh\)/);assert.match(sw,/W\.RWTaste\.learn\(/);assert.match(sw,/W\.RWTaste\.shelf\(\)/);
  assert.ok(html.indexOf('js/ui/discover-taste.js')<html.indexOf('js/ui/swipe-discover.js'));
});
