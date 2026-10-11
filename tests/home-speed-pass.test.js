'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const rd=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Outfit is self-hosted: preload + @font-face, no Google Fonts on the home page',()=>{
  const html=rd('index.html');
  assert.match(html,/rel="preload"[^>]*outfit-latin-wght\.woff2[^>]*as="font"[^>]*crossorigin/);
  assert.doesNotMatch(html,/fonts\.(googleapis|gstatic)\.com/);
  assert.match(rd('css/base/01-tokens.css'),/@font-face\{font-family:'Outfit'[^}]*outfit-latin-wght\.woff2[^}]*\}/);
  const f=path.join(__dirname,'..','assets/fonts/outfit-latin-wght.woff2');
  assert.ok(fs.statSync(f).size<60000);
  assert.ok(fs.existsSync(path.join(__dirname,'..','assets/fonts/OFL-Outfit.txt')));
});
test('big sections skip off-screen rendering, but not when printing',()=>{
  const css=rd('css/base/02-shell.css');
  assert.match(css,/\.xsec\{content-visibility:auto;contain-intrinsic-size:auto 520px\}/);
  assert.match(css,/@media print\{\.xsec\{content-visibility:visible\}\}/);
});
test('search shimmer animates transform only',()=>{
  assert.match(rd('css/base/01-tokens.css'),/@keyframes shimmerX\{[^}]*translateX/);
  assert.match(rd('css/base/02-shell.css'),/animation:shimmerX/);
});
test('JS-built images are lazy and async-decoded',()=>{
  for(const p of ['js/misc/profile.js','js/misc/misc-features-2.js','js/itinerary/eco-certificate.js'])
    assert.match(rd(p),/<img[^>]*loading="lazy"[^>]*decoding="async"/,p);
});
