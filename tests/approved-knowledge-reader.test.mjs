import test from 'node:test';
import assert from 'node:assert/strict';
import reader,{safeQuery,approved,mediaApproved,mediaOrigin} from '../cloudflare/knowledge/approved-reader.mjs';
const okDest={id:'tokyo',slug:'tokyo',name:'Tokyo',country_iso:'JP',region:'Kanto',
 summary:'Editorial Tokyo overview',canonical_url:'https://roamwise.co.in/places/tokyo/',
 human_approved_at:'2026-11-20',source_checked_at:'2026-11-20',status:'published',indexed:1};
const okMedia={id:'tokyo-v1',destination_id:'tokyo',slug:'tokyo',r2_key:'media/destinations/tokyo/v1.webp',
 alt_text:'Tokyo skyline at dusk',attribution:'Licensed RoamWise media',rights_status:'licensed',
 license_proof:'media-approval-2026-11-22',mime_type:'image/webp',size_bytes:64000,
 status:'published',published_at:'2026-11-22'};
function fakeEnv(overrides={}){
 let getCount=0;
 const db={prepare(sql){return {bind(...args){
  return {
   async all(){
    if(sql.includes('FROM public_destination_media m'))return {results:[okMedia,{...okMedia,id:'not-cleared',rights_status:'pending'}]};
    if(sql.includes('FROM public_destination_faq'))return {results:[]};
    if(sql.includes('FROM public_destination_itinerary'))return {results:[]};
    if(sql.includes('FROM public_destination'))return {results:[okDest,{...okDest,id:'draft',name:'Draft',status:'candidate',indexed:0}]};
    throw Error('Unexpected SQL '+sql);
   },
   async first(){
    if(sql.includes('FROM public_destination_media'))return overrides.mediaRow||okMedia;
    if(sql.includes('FROM public_destination'))return overrides.destinationRow||okDest;
    throw Error('Unexpected SQL '+sql);
   }
  };
 }};}};
 const bucket={async get(key){getCount++;return {body:new Uint8Array([82,73,70,70]),size:4}}};
 return {env:{
  PUBLIC_KNOWLEDGE_DB:db,PUBLIC_MEDIA_BUCKET:bucket,
  PUBLIC_MEDIA_ORIGIN:'https://assets.roamwise.co.in',
  ...overrides},getCount:()=>getCount};
}
function req(path,origin){return new Request('https://assets.roamwise.co.in'+path,{headers:origin?{origin}:{}});}
test('rejects short, malformed and oversized queries',()=>{
 assert.equal(safeQuery('a'),null);assert.equal(safeQuery('<script>'),null);
 assert.equal(safeQuery('x'.repeat(82)),null);
 assert.equal(safeQuery(' Almora  India '),'Almora India');
 assert.equal(mediaOrigin({PUBLIC_MEDIA_ORIGIN:'https://evil.com'}),null);
});
test('published data requires human approval and published media requires rights plus size',()=>{
 assert.ok(approved(okDest));assert.equal(approved({...okDest,status:'candidate'}),false);
 assert.ok(mediaApproved(okMedia));
 for(const props of [{status:'draft'},{rights_status:'pending'},{license_proof:''},{size_bytes:10e6},{mime_type:'text/html'}])
  assert.equal(mediaApproved({...okMedia,...props}),false);
});
test('search only returns reviewed public rows, never customer data or payment claims',async()=>{
 const {env}=fakeEnv();
 const res=await reader.fetch(req('/v1/search?q=tokyo'),env);
 assert.equal(res.status,200);
 const d=await res.json();
 assert.equal(d.items.length,1);assert.equal(d.items[0].name,'Tokyo');
 assert.equal(d.liveBooking,false);
 assert.equal(JSON.stringify(d).includes('cashfree'),false);
});
test('destination detail includes reviewed facts only, no inferred booking price',async()=>{
 const {env}=fakeEnv();
 const res=await reader.fetch(req('/v1/destinations/tokyo'),env);
 assert.equal(res.status,200);
 const d=await res.json();assert.equal(d.name,'Tokyo');
 assert.equal(d.availabilityVerified,false);assert.equal(d.pricesVerified,false);
});
test('media manifest includes approved image only and trusted custom domain',async()=>{
 const {env}=fakeEnv();
 const res=await reader.fetch(req('/v1/media-manifest','https://roamwise-web.pages.dev'),env);
 assert.equal(res.status,200);
 const body=await res.json();
 assert.deepEqual(Object.keys(body.assets),['tokyo']);
 assert.equal(body.assets.tokyo.src,'https://assets.roamwise.co.in/media/tokyo-v1');
 assert.equal(res.headers.get('access-control-allow-origin'),'https://roamwise-web.pages.dev');
});
test('media cannot serve pending rights or arbitrary R2 keys',async()=>{
 const {env,getCount}=fakeEnv({mediaRow:{...okMedia,rights_status:'pending'}});
 const res=await reader.fetch(req('/media/tokyo-v1'),env);
 assert.equal(res.status,404);assert.equal(getCount(),0);
});
test('licensed image can be served by ID only, not by arbitrary R2 key',async()=>{
 const {env,getCount}=fakeEnv();
 const res=await reader.fetch(req('/media/tokyo-v1'),env);
 assert.equal(res.status,200);
 assert.equal(res.headers.get('content-type'),'image/webp');
 assert.equal(getCount(),1);
 assert.equal((await res.arrayBuffer()).byteLength,4);
});
test('unconfigured resources fail closed without exposing SQL or secrets',async()=>{
 const res=await reader.fetch(req('/v1/search?q=almora'),{});
 assert.equal(res.status,503);
 assert.deepEqual(await res.json(),{error:'knowledge_not_configured'});
});
test('untrusted browser origin does not receive CORS approval',async()=>{
 const {env}=fakeEnv();const res=await reader.fetch(req('/v1/search?q=tokyo','https://evil.example'),env);
 assert.equal(res.headers.get('access-control-allow-origin'),null);
 assert.equal(res.headers.get('vary'),'Origin');
});
