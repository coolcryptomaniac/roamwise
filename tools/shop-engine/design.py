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
                                 headers={'Content-Type': 'application/json', 'User-Agent': 'RoamWise-ShopEngine/1.0 (+https://roamwise.co.in)'})
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
    box = art.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()  # trim the keyed-out margin
    emblem = (art.crop(box) if box else art.copy()); emblem.thumbnail((3300, 2900), Image.LANCZOS)
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
    return fill_print(canvas)


def _hex(c, a=255):
    c = c.lstrip('#')
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)


def ornament(d, kind, pal, top, h):
    """Original geometric ornaments drawn in code (no AI quota): Aipan-style dots and petals, mountain lines, stars."""
    import math
    cx, cy = PRINT_W // 2, top + h // 2
    txt, acc, sub = (_hex(c) for c in pal)
    if kind == 'aipan':
        r0 = h // 2 - 40
        for k, r in enumerate((r0, r0 - 150, r0 - 300)):
            n = 48 - k * 12
            for i in range(n):
                a = 2 * math.pi * i / n
                x, y = cx + r * math.cos(a), cy + r * math.sin(a)
                rr = 26 if i % 2 else 14
                d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(txt if k != 1 else sub))
        for i in range(8):
            a = 2 * math.pi * i / 8
            for t in range(6):
                rr = 60 + t * 38
                x, y = cx + rr * math.cos(a), cy + rr * math.sin(a)
                w = 46 - t * 5
                d.ellipse((x - w, y - w, x + w, y + w), fill=acc)
        d.ellipse((cx - 70, cy - 70, cx + 70, cy + 70), fill=txt)
    elif kind == 'stars':
        for i in range(5):
            a = math.pi * (1.15 + 0.175 * i)
            x, y = cx + 1000 * math.cos(a), cy + 300 + 650 * math.sin(a)
            R, r = (230 if i == 2 else 170), (95 if i == 2 else 70)
            pts = [(x + (R if j % 2 == 0 else r) * math.cos(-math.pi / 2 + j * math.pi / 5),
                    y + (R if j % 2 == 0 else r) * math.sin(-math.pi / 2 + j * math.pi / 5)) for j in range(10)]
            d.polygon(pts, fill=(acc if i % 2 else sub))
        for i in range(26):
            x = 300 + (i * 977) % (PRINT_W - 600); y = top + 60 + (i * 613) % (h - 200)
            d.ellipse((x - 10, y - 10, x + 10, y + 10), fill=txt)
    else:  # peaks
        d.ellipse((cx - 420, top + 120, cx + 420, top + 960), fill=sub)
        for k, (col, off, amp) in enumerate(((acc, 260, 620), (txt, 520, 420))):
            base = top + h - 80 - k * 40
            pts = [(140, base)]
            xs = [140, 700, 1100, 1500, 1800, 2150, 2600, 3000, 3460]
            for j, x in enumerate(xs):
                y = base - (amp if j % 2 else amp // 3) - (off if j in (3, 5) else 0) // (k + 1)
                pts.append((x, max(top + 40, y)))
            pts.append((3460, base))
            d.line(pts, fill=col, width=70 - k * 18, joint='curve')
        d.line((240, top + h - 20, PRINT_W - 240, top + h - 20), fill=txt, width=18)


def fill_print(canvas, margin=140):
    """Scale the drawn content up to fill the print area (top-aligned, centred): designs print big, not tiny."""
    from PIL import Image
    box = canvas.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if not box:
        return canvas
    art = canvas.crop(box)
    k = min((PRINT_W - 2 * margin) / art.width, (PRINT_H - 2 * margin) / art.height)
    art = art.resize((max(1, int(art.width * k)), max(1, int(art.height * k))), Image.LANCZOS)
    out = Image.new('RGBA', (PRINT_W, PRINT_H), (0, 0, 0, 0))
    out.alpha_composite(art, ((PRINT_W - art.width) // 2, margin))
    return out


def compose_typo(theme, fdir):
    """Typographic design: ornament on top, the words stacked large below."""
    from PIL import Image, ImageDraw
    pal = theme.get('palette') or ['#f6efe2', '#d9534f', '#f0b35a']
    canvas = Image.new('RGBA', (PRINT_W, PRINT_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    ornament(d, theme.get('ornament', 'peaks'), pal, 140, 1700)
    words = (theme.get('text') or theme['title'].upper()).split()
    lines, cur = [], ''
    for w in words:  # greedy wrap to ~11 characters per line, at most 3 lines
        if cur and len(cur) + 1 + len(w) > 11 and len(lines) < 2:
            lines.append(cur); cur = w
        else:
            cur = (cur + ' ' + w).strip()
    lines.append(cur)
    lines = [ln.strip(' ·') for ln in lines if ln.strip(' ·')]
    y = 2000
    for ln in lines:
        f = fit_text(d, ln, fdir / 'Anton-Regular.ttf', PRINT_W - 360, 760 if len(lines) == 1 else 620)
        b = d.textbbox((0, 0), ln, font=f)
        d.text(((PRINT_W - (b[2] - b[0])) / 2 - b[0], y - b[1]), ln, font=f, fill=_hex(pal[0]))
        y += (b[3] - b[1]) + 90
    sub = theme.get('sub') or ''
    if sub:
        sf = fit_text(d, sub, fdir / 'Anton-Regular.ttf', PRINT_W - 900, 200, 60)
        b = d.textbbox((0, 0), sub, font=sf)
        d.text(((PRINT_W - (b[2] - b[0])) / 2 - b[0], y + 40 - b[1]), sub, font=sf, fill=_hex(pal[2]))
    return fill_print(canvas)


def mockup(print_png, kind):
    """Flat garment preview drawn in code (honest 'design preview', not a photo of a sample)."""
    from PIL import Image, ImageDraw, ImageFilter
    W, H = 1600, 1800
    bg = Image.new('RGB', (W, H), (232, 228, 222))
    g = Image.new('L', (W, H), 0); d = ImageDraw.Draw(g)
    if kind == 'tote':
        d.rounded_rectangle((330, 420, 1270, 1600), 30, fill=255)
        d.arc((560, 120, 1040, 640), 180, 360, fill=255, width=46)
        box = (400, 520, 1200, 1500); colour = (24, 24, 26)
    else:
        body = [(470, 260), (640, 200), (960, 200), (1130, 260), (1500, 560), (1360, 760), (1210, 660), (1210, 1640), (390, 1640), (390, 660), (240, 760), (100, 560)]
        d.polygon(body, fill=255)
        if kind != 'hoodie':
            d.ellipse((650, 150, 950, 330), fill=0)
        if kind == 'hoodie':
            d.ellipse((600, 70, 1000, 360), fill=255)  # hood behind the neck
        box = (470, 400, 1130, 1170); colour = (18, 18, 20)
    shade = Image.new('RGB', (W, H), colour)
    shadow = g.filter(ImageFilter.GaussianBlur(28))
    bg.paste((200, 196, 190), mask=shadow)
    bg.paste(shade, mask=g)
    art = print_png.copy(); art.thumbnail((box[2] - box[0], box[3] - box[1]), Image.LANCZOS)
    x = box[0] + (box[2] - box[0] - art.width) // 2; y = box[1]
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); layer.alpha_composite(art, (x, y))
    out = bg.convert('RGBA'); out.alpha_composite(layer)
    return out.convert('RGB')


def _pixels(img):
    f = getattr(img, 'get_flattened_data', None)  # Pillow >= 12.1; getdata() is deprecated there
    return f() if f else img.getdata()


def qc(print_png, art_raw):
    """art_raw None = typographic design (its words are intended, so no OCR check)."""
    from PIL import ImageStat
    alpha = print_png.getchannel('A')
    coverage = sum(1 for v in _pixels(alpha.resize((180, 210))) if v > 40) / (180 * 210)
    vis = print_png.convert('RGB').resize((180, 210))
    mask = alpha.resize((180, 210)).point(lambda v: 255 if v > 40 else 0)
    lum = ImageStat.Stat(vis.convert('L'), mask).mean[0] / 255 if coverage else 0
    words = ocr_words(art_raw) if art_raw is not None else []
    checks = {
        'size': print_png.size == (PRINT_W, PRINT_H),
        'coverage': 0.10 <= coverage <= 0.80,
        'visible_on_dark': lum >= 0.22,
        'no_ai_text_in_art': words is not None and len(words) <= 1,
    }
    return {'passed': all(checks.values()), 'checks': checks, 'coverage': round(coverage, 3), 'luminance': round(lum, 3),
            'ocr_words': (words or [])[:8]}


def make_one(theme, a, fdir, ai_left):
    """Returns (made, ai_calls_used)."""
    from PIL import Image
    check_rights(theme)
    design_id = 'auto-' + a.date.replace('-', '') + '-' + theme['key'][:40]
    out = pathlib.Path(a.out) / design_id; out.mkdir(parents=True, exist_ok=True)
    used_ai = 0
    if not theme.get('art'):
        pr = compose_typo(theme, fdir); raw = None; method = 'typographic'
        report = qc(pr, None)
        print(design_id, 'typographic', json.dumps(report))
    else:
        prompt = ('Isolated centred emblem illustration for a premium streetwear t-shirt print: ' + theme['art'] +
                  '. Bold clean shapes, rich saturated colours, crisp edges, high contrast, on a PURE SOLID BLACK background, '
                  'nothing touching the edges, absolutely no text, no letters, no words, no logos, no watermark, no frame.')
        best = None
        for i in range(a.tries):
            if not a.art and used_ai >= ai_left:
                break
            src = open(a.art, 'rb').read() if a.art else cf_generate(prompt, seed=int(a.date.replace('-', '')) % 100000 + i * 7919)
            used_ai += 0 if a.art else 1
            raw = Image.open(io.BytesIO(src)).convert('RGB')
            big, method = upscale(raw)
            pr = compose(key_black(big), theme, fdir)
            report = qc(pr, raw)
            print(design_id, 'try', i + 1, json.dumps(report))
            best = (pr, raw, report, method)
            if report['passed']:
                break
        if not best:
            return False, used_ai
        pr, raw, report, method = best
        raw.save(out / 'art.png')
        method = MODEL + ' + ' + method
    pr.save(out / 'print.png', dpi=(300, 300), optimize=True)
    mockup(pr, theme['type']).save(out / 'mockup.jpg', quality=90)
    base = a.media_base.rstrip('/') + '/shop/designs/' + design_id
    row = {
        'id': design_id, 'product_type': theme['type'], 'title': theme['title'], 'tagline': theme['tagline'],
        'collection': theme.get('collection', 'drops'), 'print_url': base + '/print.png', 'mockup_url': base + '/mockup.jpg',
        'placement': theme.get('placement', 'back'), 'print_w_in': 12, 'print_h_in': 14, 'status': 'review',
        'source': method + ' + engine typography', 'qc_json': json.dumps(report),
    }
    (out / 'design.json').write_text(json.dumps(row, indent=1))
    used = json.loads(USED.read_text()) if USED.exists() else {}
    used[theme['key']] = a.date
    USED.write_text(json.dumps(used, indent=1, sort_keys=True) + '\n')
    print('DESIGN', design_id, 'QC', 'PASS' if report['passed'] else 'FAIL')
    return True, used_ai


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='build/shop-engine')
    ap.add_argument('--theme', help='one theme key (ignores --count)')
    ap.add_argument('--count', type=int, default=1, help='designs to make this run')
    ap.add_argument('--ai-max', type=int, default=6, help='most AI image calls this run (protects the shared free quota)')
    ap.add_argument('--date', default=ist_today())
    ap.add_argument('--media-base', default=os.environ.get('MEDIA_BASE', 'https://roamwise-api.founder-f53.workers.dev/media/r2'))
    ap.add_argument('--tries', type=int, default=2)
    ap.add_argument('--art', help='use this image instead of generating (tests)')
    a = ap.parse_args()
    fdir = fonts()
    themes = json.loads(THEMES.read_text())['themes']
    if a.theme:
        queue = [t for t in themes if t['key'] == a.theme] or [pick_theme(a.theme)]
    else:
        used = json.loads(USED.read_text()) if USED.exists() else {}
        queue = [t for t in themes if t['key'] not in used]
    made, ai_used = 0, 0
    for t in queue:
        if made >= (1 if a.theme else a.count):
            break
        if t.get('art') and not a.art and ai_used >= a.ai_max:
            continue  # AI budget spent: keep going with typographic themes only
        try:
            ok, n = make_one(t, a, fdir, a.ai_max - ai_used)
        except SystemExit as e:
            if e.code == 3:
                print('AI unavailable; continuing with typographic themes', file=sys.stderr)
                ai_used = a.ai_max
                continue
            if isinstance(e.code, str):
                print('skipped', t['key'], '-', e.code, file=sys.stderr)
                continue
            raise
        ai_used += n
        made += 1 if ok else 0
    print('made', made, 'designs;', ai_used, 'AI calls')
    if made == 0 and any(t.get('art') for t in queue[:1]) and ai_used == 0:
        return 3
    return 0


if __name__ == '__main__':
    sys.exit(main())
