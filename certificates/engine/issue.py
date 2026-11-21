#!/usr/bin/env python3
"""Batch certificates: CSV -> PDFs, social images and signed public records.
Publishing is a separate repository-reviewed action. No email is sent.
"""
import argparse, base64, csv, hashlib, json, re, os
from pathlib import Path
from datetime import date
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image, ImageOps
import fitz
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from xml.sax.saxutils import escape
ROOT=Path(__file__).resolve().parents[2]
ASSETS=Path(__file__).parent/'assets'
NAVY='#17143b'; GOLD='#c9952a'; RED='#a91c3a'; PURPLE='#4d2268'
FONT='/usr/share/fonts/truetype/dejavu/'
for n,f in [('Serif','DejaVuSerif.ttf'),('SerifBold','DejaVuSerif-Bold.ttf'),('Sans','DejaVuSans.ttf'),('SansBold','DejaVuSans-Bold.ttf')]:
 pdfmetrics.registerFont(TTFont(n,FONT+f))
def canonical(p): return json.dumps(p,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def draw(r,path,w,h,photo=None):
 c=canvas.Canvas(str(path),pagesize=(w,h));c.setTitle(r['name']+' - RoamWise Certificate of Participation'); c.setAuthor('RoamWise Technologies')
 c.setFillColor(HexColor('#fffdf9'));c.rect(0,0,w,h,fill=1,stroke=0)
 # Fine ceremonial frame and sweeping crimson/violet/gold corners.
 for color,offset in [(PURPLE,0),(RED,14),(GOLD,28)]:
  c.setFillColor(HexColor(color));p=c.beginPath();p.moveTo(0,h);p.lineTo(180-offset,h);p.curveTo(90,h-25,50,h-50,0,h-125+offset);p.close();c.drawPath(p,fill=1,stroke=0)
  p=c.beginPath();p.moveTo(w,0);p.lineTo(w-190+offset,0);p.curveTo(w-70,25,w-25,40,w,125-offset);p.close();c.drawPath(p,fill=1,stroke=0)
 c.setStrokeColor(HexColor(GOLD));c.setLineWidth(1);c.roundRect(12,12,w-24,h-24,12)
 landscape=w>h; margin=44; top=h-42
 c.drawImage(str(ASSETS/'logo.png'),margin,top-73,73,73,mask='auto')
 x=margin+89
 c.setFillColor(HexColor(NAVY));c.setFont('SerifBold',23 if landscape else 20);c.drawString(x,top-28,'RoamWise Technologies')
 c.setFont('Sans',10);c.drawString(x,top-49,'Almora, Uttarakhand, India')
 c.setFillColor(HexColor(RED));c.setFont('SansBold',8);c.drawString(x,top-66,'RECOGNISING PARTICIPATION & CONTRIBUTION')
 titley=h-155
 c.setFillColor(HexColor(NAVY));c.setFont('SerifBold',27 if landscape else 24);c.drawCentredString(w/2,titley,{'event':'CERTIFICATE OF PARTICIPATION','internship':'INTERNSHIP CERTIFICATE','employment':'EXPERIENCE CERTIFICATE','course':'CERTIFICATE OF COMPLETION'}[r.get('template','event')])
 c.setStrokeColor(HexColor(GOLD));c.line(margin+45,titley-16,w-margin-45,titley-16)
 c.setFillColor(HexColor(RED));c.roundRect(margin+45,titley-57,w-2*margin-90,27,4,fill=1,stroke=0)
 c.setFillColor(HexColor('#ffffff'));c.setFont('SansBold',min(11,(w-2*margin-110)/max(1,pdfmetrics.stringWidth(r.get('event','Bengaluru Tech Summit 2026').upper(),'SansBold',1))));c.drawCentredString(w/2,titley-48,r.get('event','Bengaluru Tech Summit 2026').upper())
 y=titley-88
 c.setFillColor(HexColor(NAVY));c.setFont('Sans',10);c.drawString(margin,y,'This certificate is proudly presented to')
 name_size=25 if landscape else 24
 name_size=min(name_size,(w-2*margin)/max(1,pdfmetrics.stringWidth(r['name'],'SerifBold',1)))
 c.setFont('SerifBold',name_size);c.setFillColor(HexColor(RED));c.drawString(margin,y-38,r['name'])
 bodyy=y-65
 text='In recognition of <b>'+escape(r.get('duration','3 days'))+' of participation</b> in RoamWise’s '+escape(r.get('role','Marketing & Promotion'))+' activities at <b>'+escape(r.get('event','Bengaluru Tech Summit 2026'))+'</b>.'
 text2=r.get('recognition') or 'RoamWise appreciates your contribution to representing the brand and supporting its promotional presence during the event.'
 if r.get('template','event')!='event':
  text='This certifies that <b>'+escape(r['name'])+'</b> completed '+escape(r.get('duration',''))+' as '+escape(r.get('role',''))+' with RoamWise for <b>'+escape(r.get('event',''))+'</b>.'
  text2=r.get('recognition') or 'We acknowledge this contribution and wish the recipient success in future endeavours.'
 text2=escape(text2)
 avail=w-2*margin-(150 if photo and landscape else 0)
 style=ParagraphStyle('body',fontName='Serif',fontSize=12 if landscape else 13,leading=19,textColor=HexColor(NAVY))
 for t in [text,text2]:
  p=Paragraph(t,style);_,ph=p.wrap(avail,140);p.drawOn(c,margin,bodyy-ph);bodyy-=ph+14
 if photo:
  pw,ph=(113,139) if landscape else (105,129)
  px=w-margin-pw if landscape else (w-pw)/2; py=bodyy-145 if not landscape else 200
  im=Image.open(photo);im=ImageOps.fit(im,(452,556),centering=(.5,.43))
  c.setStrokeColor(HexColor(GOLD));c.roundRect(px-4,py-4,pw+8,ph+8,8)
  c.drawImage(ImageReader(im),px,py,pw,ph)
 # Issuer block and verification panel.
 by=45
 c.drawImage(str(ASSETS/'signature.png'),margin,by+55,142,40,mask='auto')
 c.setStrokeColor(HexColor(GOLD));c.line(margin,by+49,margin+153,by+49)
 c.setFillColor(HexColor(NAVY));c.setFont('SerifBold',12);c.drawString(margin,by+31,'Mohit Pandey')
 c.setFont('Sans',8);c.drawString(margin,by+17,'Founder, RoamWise Technologies')
 c.drawImage(str(ASSETS/'seal.png'),margin+164,by+10,77,77,mask='auto')
 qx=w-margin-77;qy=by+18
 qr=QrCodeWidget(r['verification_url']); bounds=qr.getBounds(); size=bounds[2]-bounds[0]; d=Drawing(77,77,transform=[77/size,0,0,77/size,0,0]);d.add(qr);renderPDF.draw(d,c,qx,qy)
 c.setFont('SansBold',8);c.drawRightString(qx-12,by+79,'VERIFY THIS CERTIFICATE')
 c.setFont('Sans',7.7);c.drawRightString(qx-12,by+61,r['id']);c.drawRightString(qx-12,by+46,'Issued: '+r['issued_on'])
 c.drawRightString(qx-12,by+31,'roamwise.co.in/certificates/verify/')
 c.linkURL(r['verification_url'],(qx-200,qy,qx+77,qy+77),relative=0)
 c.setFont('Sans',6.6);c.setFillColor(HexColor('#686077'));c.drawCentredString(w/2,27,'Issued by RoamWise for its own promotional engagement; not an event-organiser credential.')
 c.save()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('csv');ap.add_argument('--issue',action='store_true',help='Explicit issuer authorization to produce issued records');ap.add_argument('--output',default='output');args=ap.parse_args()
 if not args.issue: raise SystemExit('Draft only: review CSV, then pass --issue to generate issued certificates. Nothing written.')
 rows=list(csv.DictReader(open(args.csv,newline='',encoding='utf-8-sig')))
 if not rows: raise SystemExit('Empty batch')
 seen=set();today=date.today().isoformat()
 for r in rows:
  if not re.fullmatch(r'RW-[A-Z0-9-]{6,36}',r['id']) or r['id'] in seen: raise SystemExit('Invalid or duplicate certificate ID')
  seen.add(r['id'])
  if '-'+r['issued_on'][:4]+'-' not in r['id']: raise SystemExit('ID year must match issue year')
  if r.get('template','event') not in ['event','internship','employment','course']: raise SystemExit('Invalid template')
  for field in ['event','role','duration','recognition']:
   if len(r.get(field,'') or '')>180: raise SystemExit('Field too long: '+field)
  if not r['name'].strip() or len(r['name'])>70: raise SystemExit('Invalid recipient')
  if r['issued_on']>today: raise SystemExit('Future issuance not allowed')
  date.fromisoformat(r['issued_on'])
  if (ROOT/'certificates/records'/r['issued_on'][:4]/(r['id']+'.json')).exists(): raise SystemExit('ID already issued; no overwrite permitted')
  if r.get('photo') and not Path(r['photo']).is_file(): raise SystemExit('Photo missing')
 out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
 # A fresh batch key is used once and discarded; public key is pinned by the reviewed repo commit.
 key=Ed25519PrivateKey.generate();pub=base64.b64encode(key.public_key().public_bytes(Encoding.Raw,PublicFormat.Raw)).decode();kid=hashlib.sha256(pub.encode()).hexdigest()[:16]
 records=[]
 for r in rows:
  r['verification_url']='https://roamwise.co.in/certificates/verify/?id='+r['id']
  target=out/r['id'];target.mkdir();files=[]
  for label,size in [('A4_Landscape',(841.89,595.28)),('A4_Portrait',(595.28,841.89))]:
   pdf=target/(r['id']+'_'+label+'.pdf');draw(r,pdf,*size,r.get('photo'));files.append(pdf)
   page=fitz.open(pdf)[0];pix=page.get_pixmap(matrix=fitz.Matrix(2,2));png=pdf.with_suffix('.png');pix.save(png);Image.open(png).convert('RGB').save(pdf.with_suffix('.jpg'),quality=95)
  # Portrait certificate fits cleanly inside a LinkedIn-friendly 4:5 image.
  im=Image.open(target/(r['id']+'_A4_Portrait.png')).convert('RGB');im.thumbnail((1080,1350));social=Image.new('RGB',(1080,1350),'#17143b');social.paste(im,((1080-im.width)//2,(1350-im.height)//2));social.save(target/(r['id']+'_LinkedIn.png'));social.save(target/(r['id']+'_LinkedIn.jpg'),quality=95)
  payload={'schema':2,'id':r['id'],'name':r['name'],'type':{'event':'Event participation','internship':'Internship','employment':'Employment experience','course':'Course completion'}[r.get('template','event')],'event':r.get('event','Bengaluru Tech Summit 2026'),'role':r.get('role','Marketing & Promotion'),'duration':r.get('duration','3 days'),'issued_on':r['issued_on'],'issuer':'RoamWise Technologies','status':'issued','sha256':[digest(f) for f in files]}
  record={'payload':payload,'keyId':kid,'signature':base64.b64encode(key.sign(canonical(payload))).decode()}
  (target/'record.json').write_text(json.dumps(record,indent=2));records.append(record)
 (out/'batch-public-key.json').write_text(json.dumps({kid:pub},indent=2))
 (out/'batch-records.json').write_text(json.dumps(records,indent=2))
 print(f'Generated {len(rows)} certificates. Review files, then publish records and pin batch key; issuance does not publish or email automatically.')
if __name__=='__main__':main()
