'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/ui/destination-filmstrip.js'),'utf8');

function fixture(){
  const nodes={},events={},window={};
  class Node{
    constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.handlers={};this.className='';this.textContent='';this.clientWidth=320;this.scrollWidth=4000;this.scrollLeft=0;this.hidden=false;this.parentNode=null;
      this.classList={add:(v)=>{this.className+=(this.className?' ':'')+v;},contains:(v)=>this.className.split(' ').includes(v)};
    }
    appendChild(child){
      if(child.tagName==='fragment'){child.children.forEach(x=>this.appendChild(x));return child;}
      this.children.push(child);child.parentNode=this;return child;
    }
    removeChild(child){this.children=this.children.filter(x=>x!==child);child.parentNode=null;return child;}
    setAttribute(k,v){this.attributes[k]=v;}
    addEventListener(name,fn){this.handlers[name]=fn;}
    scrollBy(v){this.scrollLeft+=v.left;}
    scrollIntoView(){this.didScrollIntoView=true;}
  }
  ['rwDestinationsRail','rwDestinationTrack','rwDestinationCount','rwDestinationPrev','rwDestinationNext','heroInput','copilotHero'].forEach(id=>nodes[id]=new Node('div'));
  const document={
    readyState:'interactive',
    getElementById:id=>nodes[id]||null,
    createElement:tag=>new Node(tag),
    createDocumentFragment:()=>new Node('fragment'),
    addEventListener:(name,fn)=>{events[name]=fn;}
  };
  window.window=window;window.document=document;window.matchMedia=()=>({matches:false});
  window.location={href:''};
  const context={window,document,console,DB:undefined};
  vm.runInNewContext(source,context,{filename:'destination-filmstrip.js'});
  return {nodes,window,context,events,Node};
}
test('waits for DOMContentLoaded after deferred destination DB, then renders local and world places',()=>{
  const t=fixture();
  assert.equal(t.nodes.rwDestinationTrack.children.length,0,'deferred dependencies have not loaded yet');
  assert.equal(typeof t.events.DOMContentLoaded,'function');
  t.context.DB=[{id:'manali',name:'Manali',country:'India'},{id:'tokyo',name:'Tokyo',country:'Japan'}];
  t.events.DOMContentLoaded();
  assert.equal(t.nodes.rwDestinationTrack.children.length,8);
  assert.match(t.nodes.rwDestinationCount.textContent,/8 of 8/);
});
test('destination Plan opens current place in Ailon, Find stays stays an enquiry',()=>{
  const t=fixture();
  t.context.DB=[{id:'manali',name:'Manali',country:'India'}];
  const calls=[];t.window.copilotSend=(hero)=>calls.push(hero);
  t.events.DOMContentLoaded();
  const tok=t.nodes.rwDestinationTrack.children.find(x=>x.attributes['aria-label']==='Explore Manali');
  assert.ok(tok);
  const content=tok.children[1], actions=content.children.find(x=>x.className==='rw-destination-actions');
  assert.ok(actions);
  actions.children[0].handlers.click();
  assert.equal(t.nodes.heroInput.value,'Plan a trip to Manali, India');
  assert.deepEqual(calls,[true]);
  assert.match(actions.children[1].href,/^\/partner\/\?role=customer&destination=Manali$/);
  assert.doesNotMatch(actions.children[1].href,/checkout|pay/);
});
test('missing destination photo becomes a branded fallback; no Pollinations dependency',()=>{
  const t=fixture();
  t.context.DB=[{id:'manali',name:'Manali',country:'India'}];
  t.events.DOMContentLoaded();
  const tok=t.nodes.rwDestinationTrack.children.find(x=>x.attributes['aria-label']==='Explore Manali');
  const media=tok.children[0],image=media.children.find(x=>x.tagName==='img');
  assert.ok(image);
  image.handlers.error();
  assert.ok(media.classList.contains('rw-photo-fallback'));
  assert.ok(media.children.some(x=>x.className==='rw-destination-mark'));
  assert.doesNotMatch(source,/image\.pollinations\.ai/);
});
test('source includes R2 media path guard and avoids synthetic payment orders',()=>{
  assert.match(source,/RW_DEST_MEDIA/);
  assert.match(source,/assets\.roamwise\.co\.in/);
  assert.doesNotMatch(source,/cashfree\/order|paymentSessionId/);
});
