#!/usr/bin/env python3
"""Shop engine: turn the next theme in shop/engine/themes.json into a print-ready design + mockup.

Steps: AI emblem (Cloudflare Workers AI, free tier) -> 4x upscale -> black background keyed out ->
title typography -> 3600x4200 (12x14 in @300 dpi) transparent print PNG -> garment mockup ->
automatic QC (size, coverage, no AI-garbled text in the art, visible on a dark garment).

Output folder: <out>/<design-id>/{print.png, mockup.jpg, art.png, design.json}. design.json carries the D1 row
(status 'review'; the Worker's daily cron makes QC-passed designs live when SHOP_ENGINE_AUTOPUBLISH=true).
No network writes here: upload.sh puts the files in R2 and the row in D1.

usage: design.py --out build/shop-engine [--theme KEY] [--date YYYY-MM-DD] [--media-base URL]
Env: CF_ACCOUNT_ID + CF_AI_TOKEN (or CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN). Without a working
token the run stops with exit code 3 and changes nothing (never a low-quality fallback product).
"""
import argparse, base64, datetime, io, json, os, pathlib, re, subprocess, sys, urllib.request, uuid

ROOT = pathlib.Path(__file__).resolve().parents[2]
THEMES = ROOT / 'shop/engine/themes.json'
USED = ROOT / 'shop/engine/used.json'
FONTS = ROOT / 'build/fonts'
PRINT_W, PRINT_H = 3600, 4200
MODEL = '@cf/black-forest-labs/flux-2-klein-9b'
FONT_URLS = {
    'Anton-Regular.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf',
    'NotoSansDevanagari.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf',
}
BLOCKLIST = re.compile(r'\b(gta|grand theft|rockstar|vice city|leonida|marvel|disney|pokemon|naruto|nike|adidas|supreme|ferrari|lamborghini|bmw|coca)\b', re.I)


def ist_today():
    return (datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) + datetime.timedelta(hours=5, minutes=30)).date().isoformat()


def pick_theme(key=None):
    themes = json.loads(THEMES.read_text())['themes']
    used = json.loads(USED.read_text()) if USED.exists() else {}
    if key:
        t = next((t for t in themes if t['key'] == key), None)
        if not t:
            raise SystemExit('unknown theme ' + key)
        return t
    fresh = [t for t in themes if t['key'] not in used]
    if fresh:
        return fresh[0]
    return min(themes, key=lambda t: used.get(t['key'], ''))  # all used: oldest first, a new variant


def check_rights(theme):
    blob = ' '.join(str(theme.get(k, '')) for k in ('title', 'tagline', 'text', 'sub', 'art'))
    if BLOCKLIST.search(blob):
        raise SystemExit('theme names a protected brand/franchise: ' + theme['key'])


def cf_generate(prompt, seed, w=1024, h=1024):
    """Workers AI image. Direct REST when CF_AI_TOKEN works; otherwise through the RoamWise Worker's own AI
    binding, authorised by a one-time nonce written to the private R2 records bucket with wrangler."""
    acc = os.environ.get('CF_ACCOUNT_ID') or os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    tok = os.environ.get('CF_AI_TOKEN')
    if acc and tok:
        b = '----' + uuid.uuid4().hex
        fields = {'prompt': prompt, 'width': w, 'height': h, 'seed': seed}
        data = (''.join(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n' for k, v in fields.items()) + f'--{b}--\r\n').encode()
        req = urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{acc}/ai/run/{MODEL}', data=data,
                                     headers={'Authorization': 'Bearer ' + tok, 'Content-Type': 'multipart/form-data; boundary=' + b})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return base64.b64decode(json.loads(r.read())['result']['image'])
        except urllib.error.HTTPError as e:
            print('Workers AI REST refused:', e.code, e.read()[:200], '- trying the Worker bridge', file=sys.stderr)
    api = os.environ.get('SHOP_API', 'https://roamwise-api.founder-f53.workers.dev').rstrip('/')
    nonce = uuid.uuid4().hex + uuid.uuid4().hex
    nf = FONTS / 'nonce.txt'; FONTS.mkdir(parents=True, exist_ok=True); nf.write_text('1')
    try:
        subprocess.run(['wrangler', 'r2', 'object', 'put', 'roamwise-records/shop-engine/nonce/' + nonce, '--remote', '--file', str(nf)],
                       check=True, capture_output=True, timeout=120)
    except Exception as e:  # noqa: BLE001
        print('could not write bridge nonce:', e, file=sys.stderr)
        raise SystemExit(3)
    req = urllib.request.Request(api + '/shop/engine/art', data=json.dumps({'nonce': nonce, 'prompt': prompt, 'seed': seed}).encode(),
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            d = json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('Worker AI bridge refused:', e.code, e.read()[:200], file=sys.stderr)
        raise SystemExit(3)
    print('art model:', d.get('model'), file=sys.stderr)
    return base64.b64decode(d['image'])


def fonts():
    FONTS.mkdir(parents=True, exist_ok=True)
    for name, url in FONT_URLS.items():
        p = FONTS / name
        if not p.exists():
            urllib.request.urlretrieve(url, p)
    return FONTS


def upscale(img):
    """4x with OpenCV FSRCNN when available, else Lanczos."""
    from PIL import Image
    try:
        import cv2, numpy as np
        model = FONTS / 'FSRCNN_x4.pb'
        if not model.exists():
            urllib.request.urlretrieve('https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x4.pb', model)
        sr = cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel(str(model)); sr.setModel('fsrcnn', 4)
        out = sr.upsample(cv2.cvtColor(np.array(img.convert('RGB')), cv2.COLOR_RGB2BGR))
        return Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB)), 'fsrcnn-x4'
    except Exception as e:  # noqa: BLE001 - any failure falls back to a plain resize
        print('upscale fallback:', e, file=sys.stderr)
        return img.resize((img.width * 4, img.height * 4), Image.LANCZOS), 'lanczos-x4'


def key_black(img, lo=18, hi=70):
    """Pure-black background -> transparent with a soft edge (art is generated on black for dark garments)."""
    from PIL import Image, ImageChops
    rgb = img.convert('RGB')
    lum = rgb.convert('L')
    alpha = lum.point(lambda v: 0 if v <= lo else 255 if v >= hi else int((v - lo) * 255 / (hi - lo)))
    # keep dark-but-coloured pixels: max channel instead of luminance
    r, g, b = rgb.split()
    mx = ImageChops.lighter(ImageChops.lighter(r, g), b)
    alpha = ImageChops.lighter(alpha, mx.point(lambda v: 0 if v <= lo + 10 else 255 if v >= hi + 20 else int((v - lo - 10) * 255 / (hi - lo + 10))))
    out = rgb.convert('RGBA'); out.putalpha(alpha)
    return out


def ocr_words(img):
    """Confident words only: busy art makes tesseract hallucinate low-confidence fragments."""
    try:
        tsv = subprocess.run(['tesseract', '-', '-', '--psm', '11', 'tsv'], input=_png(img.convert('L')),
                             capture_output=True, timeout=90).stdout.decode()
    except Exception:  # noqa: BLE001
        return None
    words = []
    for line in tsv.splitlines()[1:]:
        cols = line.split('\t')
        if len(cols) >= 12 and re.fullmatch(r'[A-Za-z]{3,}', cols[11].strip() or '-'):
            try:
                if float(cols[10]) >= 85:
                    words.append(cols[11].strip())
            except ValueError:
                pass
    return words


def _png(img):
    b = io.BytesIO(); img.save(b, 'PNG'); return b.getvalue()


def fit_text(draw, text, font_path, max_w, start, min_size=60):
    from PIL import ImageFont
    size = start
    while size > min_size:
        f = ImageFont.truetype(str(font_path), size)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 8
    return ImageFont.truetype(str(font_path), min_size)


def compose(art, theme, fdir):
    from PIL import Image, ImageDraw, features
    canvas = Image.new('RGBA', (PRINT_W, PRINT_H), (0, 0, 0, 0))
    emblem = art.copy(); emblem.thumbnail((3300, 3000), Image.LANCZOS)
    canvas.alpha_composite(emblem, ((PRINT_W - emblem.width) // 2, 120))
    d = ImageDraw.Draw(canvas)
    text = theme.get('text') or theme['title'].upper()
    deva = bool(re.search(r'[ऀ-ॿ]', text))
    if deva and not features.check('raqm'):
        text = theme.get('sub') or theme['title'].upper()  # never print broken Devanagari
        deva = False
    font = fit_text(d, text, fdir / ('NotoSansDevanagari.ttf' if deva else 'Anton-Regular.ttf'), PRINT_W - 300, 520)
    y = 120 + emblem.height + 90
    tw = d.textlength(text, font=font)
    d.text(((PRINT_W - tw) / 2, y), text, font=font, fill=(250, 244, 232, 255))
    sub = theme.get('sub') or ''
    if sub and sub != text:
        sf = fit_text(d, sub, fdir / 'Anton-Regular.ttf', PRINT_W - 900, 170, 60)
        sy = d.textbbox(((PRINT_W - tw) / 2, y), text, font=font)[3] + 90
        d.text(((PRINT_W - d.textlength(sub, font=sf)) / 2, sy), sub, font=sf, fill=(245, 178, 92, 255))
    return canvas


def mockup(print_png, kind):
    """Flat garment preview drawn in code (honest 'design preview', not a photo of a sample)."""
    from PIL import Image, ImageDraw, ImageFilter
    W, H = 1600, 1800
    bg = Image.new('RGB', (W, H), (232, 228, 222))
    g = Image.new('L', (W, H), 0); d = ImageDraw.Draw(g)
    if kind == 'tote':
        d.rounded_rectangle((330, 420, 1270, 1600), 30, fill=255)
        d.arc((560, 120, 1040, 640), 180, 360, fill=255, width=46)
        box = (420, 560, 1180, 1460); colour = (24, 24, 26)
    else:
        body = [(470, 260), (640, 200), (960, 200), (1130, 260), (1500, 560), (1360, 760), (1210, 660), (1210, 1640), (390, 1640), (390, 660), (240, 760), (100, 560)]
        d.polygon(body, fill=255)
        d.ellipse((650, 150, 950, 330), fill=0)
        if kind == 'hoodie':
            d.ellipse((600, 90, 1000, 420), outline=255, width=40)
        box = (520, 470, 1080, 1120); colour = (18, 18, 20)
    shade = Image.new('RGB', (W, H), colour)
    shadow = g.filter(ImageFilter.GaussianBlur(28))
    bg.paste((200, 196, 190), mask=shadow)
    bg.paste(shade, mask=g)
    art = print_png.copy(); art.thumbnail((box[2] - box[0], box[3] - box[1]), Image.LANCZOS)
    x = box[0] + (box[2] - box[0] - art.width) // 2; y = box[1]
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); layer.alpha_composite(art, (x, y))
    out = bg.convert('RGBA'); out.alpha_composite(layer)
    return out.convert('RGB')


def qc(print_png, art_raw):
    from PIL import ImageStat
    alpha = print_png.getchannel('A')
    coverage = sum(1 for v in alpha.resize((180, 210)).get_flattened_data() if v > 40) / (180 * 210)
    vis = print_png.convert('RGB').resize((180, 210))
    mask = alpha.resize((180, 210)).point(lambda v: 255 if v > 40 else 0)
    lum = ImageStat.Stat(vis.convert('L'), mask).mean[0] / 255 if coverage else 0
    words = ocr_words(art_raw)
    checks = {
        'size': print_png.size == (PRINT_W, PRINT_H),
        'coverage': 0.10 <= coverage <= 0.80,
        'visible_on_dark': lum >= 0.22,
        'no_ai_text_in_art': words is not None and len(words) <= 1,
    }
    return {'passed': all(checks.values()), 'checks': checks, 'coverage': round(coverage, 3), 'luminance': round(lum, 3),
            'ocr_words': (words or [])[:8]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='build/shop-engine')
    ap.add_argument('--theme')
    ap.add_argument('--date', default=ist_today())
    ap.add_argument('--media-base', default=os.environ.get('MEDIA_BASE', 'https://roamwise-api.founder-f53.workers.dev/media/r2'))
    ap.add_argument('--tries', type=int, default=3)
    ap.add_argument('--art', help='use this image instead of generating (tests)')
    a = ap.parse_args()
    from PIL import Image
    theme = pick_theme(a.theme)
    check_rights(theme)
    design_id = 'auto-' + a.date.replace('-', '') + '-' + theme['key'][:40]
    out = pathlib.Path(a.out) / design_id; out.mkdir(parents=True, exist_ok=True)
    fdir = fonts()
    prompt = ('Isolated centred emblem illustration for a premium streetwear t-shirt print: ' + theme['art'] +
              '. Bold clean shapes, rich saturated colours, crisp edges, high contrast, on a PURE SOLID BLACK background, '
              'nothing touching the edges, absolutely no text, no letters, no words, no logos, no watermark, no frame.')
    best = None
    for i in range(a.tries):
        src = open(a.art, 'rb').read() if a.art else cf_generate(prompt, seed=int(a.date.replace('-', '')) % 100000 + i * 7919)
        raw = Image.open(io.BytesIO(src)).convert('RGB')
        big, method = upscale(raw)
        art = key_black(big)
        pr = compose(art, theme, fdir)
        report = qc(pr, raw)
        print(design_id, 'try', i + 1, json.dumps(report))
        best = (pr, raw, report, method)
        if report['passed']:
            break
    pr, raw, report, method = best
    pr.save(out / 'print.png', dpi=(300, 300), optimize=True)
    raw.save(out / 'art.png')
    mockup(pr, theme['type']).save(out / 'mockup.jpg', quality=90)
    base = a.media_base.rstrip('/') + '/shop/designs/' + design_id
    row = {
        'id': design_id, 'product_type': theme['type'], 'title': theme['title'], 'tagline': theme['tagline'],
        'collection': theme.get('collection', 'drops'), 'print_url': base + '/print.png', 'mockup_url': base + '/mockup.jpg',
        'placement': theme.get('placement', 'back'), 'print_w_in': 12, 'print_h_in': 14, 'status': 'review',
        'source': MODEL + ' + ' + method + ' + engine typography', 'qc_json': json.dumps(report),
    }
    (out / 'design.json').write_text(json.dumps(row, indent=1))
    used = json.loads(USED.read_text()) if USED.exists() else {}
    used[theme['key']] = a.date
    USED.write_text(json.dumps(used, indent=1, sort_keys=True) + '\n')
    print('DESIGN', design_id, 'QC', 'PASS' if report['passed'] else 'FAIL')
    return 0


if __name__ == '__main__':
    sys.exit(main())
