from pathlib import Path
from io import BytesIO
import os, json, re, html, shutil
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(os.environ.get('ROAMWISE_ITINERARY_OUT', str(ROOT / 'itinerary-library')))
OVR = Path(__file__).resolve().parent / 'overrides'

local = json.loads((OVR/'data/local-intelligence.json').read_text(encoding='utf-8'))
dests = json.loads((OUT/'data/destinations.json').read_text(encoding='utf-8'))
by_slug = {d['slug']: d for d in dests}

def esc_attr(v):
    return html.escape(str(v), quote=True)

def local_section(li):
    return (
        '<section class="section local-intel-section"><h2>Local <em>Intelligence</em></h2>'
        '<p class="lead">The preset keeps the journey language local instead of applying one generic travel template everywhere.</p>'
        '<div class="local-intel">'
        f'<div class="local-intel-card glass"><b>Eat local</b><span>{html.escape(li["food"])}</span></div>'
        f'<div class="local-intel-card glass"><b>Move like a local</b><span>{html.escape(li["movement"])}</span></div>'
        f'<div class="local-intel-card glass"><b>Local nuance</b><span>{html.escape(li["etiquette"])}</span></div>'
        f'<div class="local-intel-card glass"><b>Visual signature</b><span>{html.escape(li["signature"])}</span></div>'
        '</div></section>'
    )

MAP_PANEL = ('<div class="map-panel glass"><div class="map-panel-head"><div>'
             '<b style="display:block;font-size:12px">Local map layer</b>'
             '<span class="map-note">Loads only on demand; the cinematic route above remains the offline fallback.</span>'
             '</div><button class="map-btn" data-main-map>Open local map</button></div><div class="live-map"></div></div>')
SHARE_STAMP = ('<div class="share-stamp" aria-label="RoamWise share attribution">'
               '<img src="../../assets/roamwise-mark.svg" alt="RoamWise"><div>'
               '<div class="made">Travel intelligence</div><div class="for">Made by RoamWise</div></div></div>')

for hp in sorted((OUT/'presets').glob('*/*.html')):
    slug = hp.parent.name
    d = by_slug[slug]
    li = local[slug]
    text = hp.read_text(encoding='utf-8')
    photo_keys = li.get('photoKeys', []) + [d.get('gateway',''), d.get('name','')] + [s['name'] for s in d.get('stops',[])]
    seen=[]
    photo_keys=[x for x in photo_keys if x and not (x in seen or seen.append(x))]
    attrs = (f' data-destination="{esc_attr(d["name"])}" data-region="{esc_attr(d["region"])}" '
             f'data-country="{esc_attr(d["country"])}" data-gateway="{esc_attr(d["gateway"])}" '
             f'data-journey-style="{esc_attr(li["journeyStyle"])}" '
             f'data-photo-keys="{esc_attr(json.dumps(photo_keys, ensure_ascii=False))}"')
    text = re.sub(r'<body class="([^"]+)">', lambda m: f'<body class="{m.group(1)}"{attrs}>', text, count=1)
    text = text.replace('<header class="hero">', '<header class="hero"><div class="hero-photo" aria-hidden="true"></div>', 1)
    text = re.sub(r'(<div class="toolbar">.*?)(<a href="[^"]+\.pdf">PDF</a>)', r'\1<button class="share-btn" data-share>Share itinerary</button>\2', text, count=1)
    marker='</section><section class="section"><h2>Animated <em>Route</em></h2>'
    text = text.replace(marker, '</section>'+local_section(li)+'<section class="section"><h2>Animated <em>Route</em></h2>', 1)
    marker2='</div></section><section class="section"><h2>Day-by-day <em>Scroll</em></h2>'
    text = text.replace(marker2, '</div>'+MAP_PANEL+'</section><section class="section"><h2>Day-by-day <em>Scroll</em></h2>', 1)
    text = text.replace('</div></article>', '<button class="day-map-btn">Local day map</button><div class="day-map"></div></div></article>')
    text = text.replace('<script src="../../assets/preset-runtime.js"></script>', SHARE_STAMP+'<script src="../../assets/preset-runtime.js"></script>', 1)
    hp.write_text(text, encoding='utf-8')

# Keep v1.1 runtime/styles/loader exactly aligned with the handoff package.
for src, dst in [
    (OVR/'assets/preset-runtime.js', OUT/'assets/preset-runtime.js'),
    (OVR/'assets/preset-library.css', OUT/'assets/preset-library.css'),
    (OVR/'assets/roamwise-mark.svg', OUT/'assets/roamwise-mark.svg'),
    (OVR/'preset-loader.js', OUT/'preset-loader.js'),
    (OVR/'data/local-intelligence.json', OUT/'data/local-intelligence.json'),
]:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dst)

# Add one local-intelligence page to each static PDF. Personalized PDFs should be printed from share-mode HTML.
def wrap(c, text, x, y, width, size=10, leading=14):
    words=str(text).split(); line=''; lines=[]
    for w in words:
        test=(line+' '+w).strip()
        if c.stringWidth(test,'Helvetica',size) <= width: line=test
        else:
            if line: lines.append(line)
            line=w
    if line: lines.append(line)
    for ln in lines:
        c.drawString(x,y,ln); y-=leading
    return y

def intel_page(d, li):
    buf=BytesIO(); c=canvas.Canvas(buf,pagesize=A4); W,H=A4
    c.setFillColor(HexColor('#07090F')); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(HexColor('#E8BA6C')); c.setFont('Helvetica-Bold',9); c.drawString(42,H-54,'ROAMWISE // LOCAL INTELLIGENCE')
    c.setFillColor(HexColor('#FFFFFF')); c.setFont('Helvetica-Bold',23); c.drawString(42,H-88,d['name'][:52])
    y=H-126
    cards=[('EAT LOCAL',li['food']),('MOVE LIKE A LOCAL',li['movement']),('LOCAL NUANCE',li['etiquette']),('VISUAL SIGNATURE',li['signature'])]
    for label,txt in cards:
        c.setFillColor(HexColor('#15151E')); c.roundRect(42,y-115,W-84,103,10,fill=1,stroke=0)
        c.setFillColor(HexColor('#E8BA6C')); c.setFont('Helvetica-Bold',8); c.drawString(56,y-36,label)
        c.setFillColor(HexColor('#E5E1DD')); c.setFont('Helvetica',10); wrap(c,txt,56,y-57,W-112,10,14)
        y-=125
    c.setFillColor(HexColor('#8D8985')); c.setFont('Helvetica',8)
    wrap(c,'Cached destination context. Verify weather, access, permits, prices, opening hours and safety conditions before travel.',42,55,W-84,8,11)
    c.save(); buf.seek(0); return buf

for pp in sorted((OUT/'presets').glob('*/*.pdf')):
    slug=pp.parent.name; d=by_slug[slug]; li=local[slug]
    old=PdfReader(str(pp)); add=PdfReader(intel_page(d,li)); wr=PdfWriter()
    for pg in old.pages: wr.add_page(pg)
    wr.add_page(add.pages[0])
    tmp=pp.with_suffix('.pdf.tmp')
    with tmp.open('wb') as f: wr.write(f)
    tmp.replace(pp)

manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
manifest['version']='1.1.0'
manifest['localIntelligence']='data/local-intelligence.json'
manifest['shareAttribution']='Made by RoamWise for <user>'
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')

readme=OUT/'README.md'
if readme.exists():
    txt=readme.read_text(encoding='utf-8').replace('v1.0.0','v1.1.0',1)
    if '## Local intelligence & sharing' not in txt:
        txt += '''\n## Local intelligence & sharing\n\nThe v1.1 cinematic runtime adds destination-specific photo hooks, lazy local/day maps, local food/movement/etiquette/visual context, and share mode attribution (`Made by RoamWise for <user>`). Normal viewing stays clean; personalized attribution is activated for share/print flows.\n'''
    readme.write_text(txt,encoding='utf-8')

htmls=list((OUT/'presets').glob('*/*.html')); pdfs=list((OUT/'presets').glob('*/*.pdf'))
assert len(htmls)==192, len(htmls)
assert len(pdfs)==192, len(pdfs)
assert all('share-stamp' in p.read_text(encoding='utf-8') for p in htmls)
assert all('local-intel-section' in p.read_text(encoding='utf-8') for p in htmls)
print(f'Enhanced {len(htmls)} HTML and {len(pdfs)} PDFs to v1.1.0')
