'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const rd=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('track() buffers counters and flushes ONE merged write (not one write per event)',()=>{
  const src=rd('js/misc/engagement.js'); const a=src.indexOf('var _trkBuf'); const b=src.indexOf('/* Per-response thumbs');
  const writes=[]; const timers=[];
  const ctx={AUTH_READY:true,lsSet(){}, setTimeout:(f)=>{timers.push(f);return 1;}, document:{addEventListener(){}},
    firebase:{firestore:{FieldValue:{increment:n=>({inc:n})}}},
    db:{collection:()=>({doc:()=>({set:(o)=>{writes.push(o);return Promise.resolve();}})})}};
  vm.runInNewContext(src.slice(a,b),ctx);
  ctx.track('a');ctx.track('a');ctx.track('b');
  assert.equal(writes.length,0); assert.equal(timers.length,1);
  timers[0]();
  assert.equal(writes.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(writes[0])),{a:{inc:2},b:{inc:1}});
});
test('lastActive + device registration run at most once per 6h per account per browser',()=>{
  const s=rd('js/boot/auth-init.js');
  assert.match(s,/rw_reg_'\+u\.uid/);
  assert.match(s,/6\*3600\*1000/);
  assert.match(s,/if\(rwRegDue\) try\{ ref\.set\(\{lastActive/);
  assert.match(s,/if\(rwRegDue\) try\{\s*ref\.collection\('devices'\)/);
});
test('compressed opening film is already in use',()=>{
  assert.match(rd('platform-v5/atlas-shinobi.js'),/Date\.UTC\(2026, 9, 11\)/);
});

test('first paint: header, menu button and bottom tabs are plain HTML (no wait for scripts)', () => {
  const html = rd('index.html');
  assert.match(html, /<body class="rw-akatsuki-theme shell" data-view="home">/);
  const nav = html.match(/<nav class="tabbar" id="tabbar"[^>]*>([\s\S]*?)<\/nav>/)[1];
  ['home', 'plan', 'copilot', 'store', 'more'].forEach(k => assert.match(nav, new RegExp('id="tb-' + k + '"')));
  assert.match(nav, /window\.rwTabGo&amp;&amp;rwTabGo/);   /* taps before scripts load must not throw */
  assert.match(html, /<button class="hamb" onclick="openDrawer\(\)"/);
  assert.match(html, /Instant shell:[\s\S]{0,400}tier!=="fast"&&n\.tier!=="medium"/);
});
test('stylesheet @import chain is preloaded from the HTML so it is not a 3-step waterfall', () => {
  const html = rd('index.html'), base = rd('app-base.css');
  [...base.matchAll(/@import url\("\.\/([^"]+)"\)/g)].forEach(m => assert.ok(html.includes('rel="preload" href="' + m[1] + '" as="style"'), m[1]));
});
test('opening sound: a blocked autoplay is shown on the button and the next tap starts it', () => {
  const s = rd('platform-v5/atlas-shinobi.js');
  assert.match(s, /Tap for sound/);
  assert.match(s, /rwCueIsPlaying/);
  assert.match(s, /if \(soundBlocked\) \{[\s\S]{0,200}rwPlayCue\('site_opening'/);
});

test('a rejected merged write falls back to single +1 writes so counts still land under older rules', async () => {
  const src=rd('js/misc/engagement.js'); const a=src.indexOf('var _trkBuf'); const b=src.indexOf('/* Per-response thumbs');
  const writes=[]; const timers=[]; let first=true;
  const ctx={AUTH_READY:true,lsSet(){}, setTimeout:(f)=>{timers.push(f);return 1;}, document:{addEventListener(){}},
    firebase:{firestore:{FieldValue:{increment:n=>({inc:n})}}},
    db:{collection:()=>({doc:()=>({set:(o)=>{writes.push(JSON.parse(JSON.stringify(o)));if(first){first=false;return Promise.reject({code:'permission-denied'});}return Promise.resolve();}})})}};
  vm.runInNewContext(src.slice(a,b),ctx);
  ctx.track('visits');ctx.track('visits');ctx.track('signups');
  timers[0]();
  await new Promise(r=>setTimeout(r,20));
  assert.deepEqual(writes,[{visits:{inc:2},signups:{inc:1}},{visits:{inc:1}},{visits:{inc:1}},{signups:{inc:1}}]);
});

test('stats rules accept the batched shape: known keys only, each raised by 1..500, and every tracked event is allowed', () => {
  const rules=rd('firestore.rules');
  const keysBlock=rules.slice(rules.indexOf('function statsKeys'), rules.indexOf('function statsDiff'));
  const keys=new Set([...keysBlock.matchAll(/'([a-z_0-9]+)'/g)].map(m=>m[1]));
  assert.match(rules, /statsDiff\(\)\.size\(\) > 0 && statsDiff\(\)\.hasOnly\(statsKeys\(\)\)/);
  assert.match(rules, /request\.resource\.data\[key\] >= before \+ 1/);
  assert.match(rules, /request\.resource\.data\[key\] <= before \+ 500/);
  for (const k of keys) assert.ok(rules.includes("statsBump('"+k+"')"), k+' is listed but not checked');
  /* every literal track('event') in the app must be an allowed key, or a batch containing it is rejected */
  const files=require('node:child_process').execSync("git ls-files '*.js' '*.html' | grep -v '^tests/' | grep -v '^vendor/'",{cwd:path.join(__dirname,'..')}).toString().trim().split('\n');
  const used=new Set();
  for (const f of files) for (const m of rd(f).matchAll(/\btrack\(['"]([a-z_0-9]+)['"]\)/g)) used.add(m[1]);
  const missing=[...used].filter(k=>!keys.has(k));
  assert.deepEqual(missing, []);
});
