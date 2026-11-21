#!/usr/bin/env python3
"""Import reviewed batch into a local checkout. Commit and PR separately."""
import argparse,json,base64,hashlib,shutil
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
ROOT=Path(__file__).resolve().parents[2]/'certificates'
def main():
 ap=argparse.ArgumentParser();ap.add_argument('batch');args=ap.parse_args();batch=Path(args.batch)
 records=json.loads((batch/'batch-records.json').read_text());keys=json.loads((batch/'batch-public-key.json').read_text())
 existing=json.loads((ROOT/'keys.json').read_text()) if (ROOT/'keys.json').exists() else {}
 index=json.loads((ROOT/'index.json').read_text()) if (ROOT/'index.json').exists() else []
 targets=[];ids=set()
 for record in records:
  p=record['payload'];id=p['id'];year=p['issued_on'][:4]
  import re
  if not re.fullmatch(r'RW-[A-Z0-9-]{6,36}',id) or not re.fullmatch(r'\d{4}',year) or id in ids: raise ValueError('Invalid/duplicate ID')
  ids.add(id);target=ROOT/'records'/year/(id+'.json')
  if target.exists() or any(x['id']==id for x in index): raise ValueError('Existing ID; refusing overwrite')
  pub=keys[record['keyId']]
  if record['keyId'] in existing and existing[record['keyId']]!=pub: raise ValueError('Key collision')
  Ed25519PublicKey.from_public_bytes(base64.b64decode(pub)).verify(base64.b64decode(record['signature']),json.dumps(p,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode())
  pdfs=list((batch/id).glob('*.pdf'))
  if len(pdfs)!=2 or sorted(hashlib.sha256(x.read_bytes()).hexdigest() for x in pdfs)!=sorted(p['sha256']): raise ValueError('PDF integrity failure')
  targets.append((target,record))
 for target,record in targets:
  p=record['payload'];id=p['id'];target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(record,indent=2))
  public=ROOT/'files'/id;public.mkdir(parents=True,exist_ok=False)
  for src in (batch/id).iterdir():
   if src.suffix in ['.pdf','.png','.jpg']:shutil.copy2(src,public/src.name)
  index.append({k:p[k] for k in ['id','name','type','event','role','duration','issued_on']})
 existing.update(keys);(ROOT/'keys.json').write_text(json.dumps(existing,indent=2));(ROOT/'index.json').write_text(json.dumps(index,indent=2))
 if not (ROOT/'revocations.json').exists():(ROOT/'revocations.json').write_text('{}\n')
 print('Imported',len(targets),'reviewed records. Publish through a repository PR.')
if __name__=='__main__':main()
