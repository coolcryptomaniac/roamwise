export const canonical = p => JSON.stringify(Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]])));
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function validRecord(record,keys){
 if(record?.payload?.schema!==2 || !keys[record.keyId])return false;
 const key=await crypto.subtle.importKey('raw',b64(keys[record.keyId]),{name:'Ed25519'},false,['verify']);
 return crypto.subtle.verify('Ed25519',key,b64(record.signature),new TextEncoder().encode(canonical(record.payload)));
}
async function getJSON(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error('Record unavailable');return r.json();}
export async function verifyV2(id,out,file){
 out.replaceChildren();const message=t=>{const p=document.createElement('p');p.textContent=t;out.append(p);};
 if(!/^RW-[A-Z0-9-]{6,36}$/.test(id)){message('No matching certificate found.');return;}
 const year=id.match(/-(\d{4})-/)?.[1];if(!year){message('No matching certificate found.');return;}
 try {
  const [r,keys,revoked]=await Promise.all([getJSON(`/certificates/records/${year}/${id}.json`),getJSON('/certificates/keys.json'),getJSON('/certificates/revocations.json')]);
  if(r.payload.id!==id || !await validRecord(r,keys)){message('Registry signature invalid. Do not accept this record.');return;}
  if(Object.hasOwn(revoked,id)){message('Certificate revoked or superseded. '+String(revoked[id]));return;}
  const p=r.payload;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(p.status!=='issued'||p.issued_on>today){message('Certificate pending; not issued.');return;}
  message('Issued certificate — registry signature verified');
  for(const text of [p.name,p.type,p.event,p.role,`Duration: ${p.duration}`,`Issued: ${p.issued_on}`,`Certificate ID: ${id}`])message(text);
  for(const format of ['A4_Landscape.pdf','A4_Portrait.pdf','LinkedIn.png','LinkedIn.jpg']){const a=document.createElement('a');a.href=`/certificates/files/${id}/${id}_${format}`;a.textContent='Download '+format.replaceAll('_',' ');a.style.display='block';out.append(a);}
  const li=document.createElement('a');const q=new URLSearchParams({startTask:'CERTIFICATION_NAME',name:`${p.type} — ${p.event}`,organizationName:p.issuer,issueYear:p.issued_on.slice(0,4),issueMonth:String(Number(p.issued_on.slice(5,7))),certId:id,certUrl:location.origin+'/certificates/verify/?id='+id});li.href='https://www.linkedin.com/profile/add?'+q;li.textContent='Add to LinkedIn profile';li.target='_blank';li.rel='noopener';out.append(li);
  if(file){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');message(p.sha256.includes(hash)?'PDF integrity verified: exact registered file.':'PDF mismatch: do not accept this copy.');}
 }catch{message('Unable to verify this record. Check the reference, connection and browser support; no authenticity claim can be made.');}
}
