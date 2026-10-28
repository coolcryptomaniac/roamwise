'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), vm=require('node:vm'), fs=require('node:fs');
function setup(){
 const elements=new Map(),blobs=[],downloads=[];
 function element(id){return {id,handlers:{},children:[],value:'',textContent:'',style:{},hidden:true,files:[],addEventListener(n,fn){this.handlers[n]=fn},replaceChildren(){this.children=[]},append(...x){this.children.push(...x)},click(){downloads.push(this)},scrollIntoView(){}}}
 const get=id=>{if(!elements.has(id))elements.set(id,element(id));return elements.get(id)};
 const c={document:{getElementById:get,createElement:()=>element('new')},URL:{createObjectURL(b){blobs.push(b);return 'blob:test'},revokeObjectURL(){}},Image:class{constructor(){this.style={}}async decode(){}},navigator:{},TextEncoder,Uint8Array,Blob,btoa:s=>Buffer.from(s,'binary').toString('base64'),setTimeout(){},console,Date,Array};c.window=c;
 vm.runInNewContext(fs.readFileSync('creators/join-artist-photos.js','utf8'),c);
 return {c,get,blobs,downloads};
}
const file=(name='painting.jpg',size=10)=>({name,type:'image/jpeg',size,arrayBuffer:async()=>Uint8Array.from([255,216,255,217]).buffer});
test('photo count, type and size limits prevent invalid applications',async()=>{
 const {c,get}=setup();for(const files of [Array.from({length:7},()=>file()),[file('large.jpg',4*1024*1024)],[{...file(),type:'image/svg+xml'}]]){get('artPhotos').files=files;await get('artPhotos').handlers.change();assert(c.RWArtistPhotos.error());assert.deepEqual(Array.from(c.RWArtistPhotos.names()),[])}
});
test('photos preview locally, MIME download contains text and attachment, clearing invalidates',async()=>{
 const {c,get,blobs,downloads}=setup();get('artPhotos').files=[file('painting.jpg')];await get('artPhotos').handlers.change();assert.equal(get('photoPreview').children.length,1);assert.equal(c.RWArtistPhotos.error(),'');c.RWArtistPhotos.prepare('Aipan ₹2000\nDATA: consent true','Rakhi');await get('downloadMail').handlers.click();assert.equal(downloads[0].download,'roamwise-artist-application.eml');const mime=await blobs.at(-1).text();assert(mime.includes('To: founder@roamwise.co.in'));assert(mime.includes('filename="painting.jpg"'));assert(mime.includes(Buffer.from('Aipan ₹2000\nDATA: consent true').toString('base64')));assert(mime.includes('/9j/2Q=='));get('clearPhotos').handlers.click();assert.equal(c.RWArtistPhotos.names().length,0);await get('downloadMail').handlers.click();assert.equal(downloads.length,1);
});
test('unsupported file sharing gives honest email fallback',async()=>{
 const {c,get}=setup();c.RWArtistPhotos.prepare('Application','Artist');await get('sharePhotos').handlers.click();assert.match(get('formMsg').textContent,/not supported/);
});
test('join application includes image filenames and metadata but sends nothing automatically',async()=>{
 const {c,get}=setup();get('artPhotos').files=[file()];await get('artPhotos').handlers.change();const data={name:'Test Artist',studio:'Studio',state:'Almora',themes:'Aipan',instagram:'',whatsapp:'919876543210',bio:'Artist',artworkDetails:'painting.jpg: Aipan, 12 inches, acrylic, original, ₹2000',portfolio:'https://example.com/',consent:'on'};
 c.fetch=()=>Promise.resolve({ok:true,json:async()=>({artists:[],plans:{}})});c.FormData=class{forEach(fn){Object.entries(data).forEach(([k,v])=>fn(v,k))}get(k){return data[k]}};
 vm.runInNewContext(fs.readFileSync('creators/join-artist.js','utf8'),c);get('joinForm').handlers.submit({preventDefault(){}});assert.equal(get('outBox').hidden,false);assert.match(get('outText').textContent,/painting.jpg/);assert.match(get('outText').textContent,/artworkDetails/);assert.match(get('sendMail').href,/^mailto:founder@roamwise.co.in/);data.consent='';get('joinForm').handlers.submit({preventDefault(){}});assert.equal(get('outBox').hidden,true);
});
