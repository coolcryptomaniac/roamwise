import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {webcrypto,createHash} from 'node:crypto';
import {validRecord} from '../certificates/verify-v2.mjs';
if (!globalThis.crypto) globalThis.crypto=webcrypto;
const read=p=>JSON.parse(fs.readFileSync(new URL('../certificates/'+p,import.meta.url)));
const keys=read('keys.json');
for(const id of ['RW-EV-SP-2026-003','RW-EV-DH-2026-004']){
 const r=read('records/2026/'+id+'.json');
 test(id+' signature, tampering, and pinned-key rejection',async()=>{assert.equal(await validRecord(r,keys),true);const changed=structuredClone(r);changed.payload.name='Other Person';assert.equal(await validRecord(changed,keys),false);assert.equal(await validRecord(r,{}),false);});
 test(id+' PDF hashes match both downloadable originals',()=>{for(const format of ['A4_Landscape','A4_Portrait']){const bytes=fs.readFileSync(new URL('../certificates/files/'+id+'/'+id+'_'+format+'.pdf',import.meta.url));assert.ok(r.payload.sha256.includes(createHash('sha256').update(bytes).digest('hex')));assert.ok(!r.payload.sha256.includes(createHash('sha256').update(Buffer.concat([bytes,Buffer.from('altered')])).digest('hex')));}});
}
test('all dedicated verifier aliases are identical and preserve old IDs',()=>{const text=fs.readFileSync(new URL('../certificates/verify/index.html',import.meta.url),'utf8');for(const p of ['../certificates/verify.html','../certificate-verification.html'])assert.equal(fs.readFileSync(new URL(p,import.meta.url),'utf8'),text);assert.match(text,/RW-EC-DM-2026-001/);assert.match(text,/RW-EC-FS-2026-002/);assert.match(text,/await verifyV2/);});
