'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/misc/misc-features-2.js'),'utf8');
function section(start,end){
 const a=source.indexOf('function '+start+'('),b=source.indexOf('function '+end+'(',a+10);
 assert.ok(a>=0&&b>a,'function section exists: '+start);
 return source.slice(a,b);
}
test('opening merch card does not consume generated image credits or imply a ready preview',()=>{
 let artCalls=0;
 const htmlModule=section('rwMerchHTML','rwMerchPick');
 const runtime={rwSlogans:()=>['Travel mindfully'],RW_ART_STYLES:[['Retro poster','retro poster']],
  RW_MERCH:{retail:499},esc2:x=>String(x),
  rwArtURL:()=>{artCalls++;return 'https://image.pollinations.ai/unexpected';}};
 const render=vm.runInNewContext(htmlModule+';rwMerchHTML;',runtime);
 const markup=render('Almora');
 assert.equal(artCalls,0,'must not generate an image before the user chooses a style');
 assert.match(markup,/id="merchArt"/);
 assert.doesNotMatch(markup,/id="merchArt"[^>]*src=/);
 assert.match(markup,/Choose an artwork style to generate a preview/);
 assert.match(markup,/style="width:100%;height:100%;object-fit:cover;display:none"/);
});
test('explicitly choosing a merch style requests an image preview',()=>{
 const artModule=section('rwMerchArt','rwMerchOrder');
 let imageCalls=0;
 const img={style:{display:'none'},dataset:{previewFailed:'0'},src:''};
 const fallback={hidden:false};
 const btn={classList:{add(){}},parentNode:{querySelectorAll(){return [{classList:{remove(){}}}]}}};
 const runtime={RW_ART_STYLES:[['Retro','original retro artwork']],el:id=>id==='merchArt'?img:id==='merchPreviewUnavailable'?fallback:null,
  rwArtURL:(prompt)=>{imageCalls++;return 'https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt);}};
 const choose=vm.runInNewContext(artModule+';rwMerchArt;',runtime);
 assert.equal(imageCalls,0);
 choose(0,'Almora',btn);
 assert.equal(imageCalls,1);
 assert.match(img.src,/Almora/);
 assert.equal(img.style.display,'block');
 assert.equal(fallback.hidden,true);
});
test('custom merch order stays gated on successfully loaded preview',()=>{
 const order=section('rwMerchOrder','rwMerchSubmit');
 assert.match(order,/preview\.naturalWidth<100/);
 assert.match(order,/preview\.dataset\.previewFailed==='1'/);
});
