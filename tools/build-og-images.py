#!/usr/bin/env python3
"""Render a 1200x630 share image (og:image) for every editorial article.

Reads content/editorial/articles/*.json and writes assets/og/<slug>.jpg.
An article can override the card text with "ogTitle" and "ogKicker".
Run: python3 tools/build-og-images.py   (needs Pillow; fonts fall back to DejaVu)
"""
import json, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content', 'editorial', 'articles')
OUT = os.path.join(ROOT, 'assets', 'og')
W, H = 1200, 630
BG, GOLD, RED, TEXT, MUTED = (7, 9, 15), (232, 186, 108), (234, 90, 80), (237, 232, 223), (169, 165, 156)

def font(names, size):
    for n in names:
        for d in ('/usr/share/fonts/opentype/inter', '/usr/share/fonts/truetype/dejavu',
                  '/System/Library/Fonts/Supplemental', '/Library/Fonts'):
            p = os.path.join(d, n)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()

BOLD = ['Inter-ExtraBold.otf', 'Inter-Bold.otf', 'DejaVuSans-Bold.ttf']
SEMI = ['Inter-SemiBold.otf', 'DejaVuSans-Bold.ttf']
REG = ['Inter-Medium.otf', 'Inter-Regular.otf', 'DejaVuSans.ttf']

def wrap(draw, text, f, max_w):
    lines, cur = [], ''
    for word in text.split():
        trial = (cur + ' ' + word).strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            lines.append(cur); cur = word
    if cur: lines.append(cur)
    return lines

def ridge(seed):
    rnd = random.Random(seed)
    pts, x, y = [(0, H)], 0, H - 110
    while x < W:
        pts.append((x, y))
        x += rnd.randint(40, 90)
        lo, hi = H - 165, H - 72
        y += rnd.choice((-1, 1)) * rnd.randint(18, 55)
        if y < lo: y = lo + (lo - y)
        if y > hi: y = hi - (y - hi)
    pts += [(W, y), (W, H)]
    return pts

def card(a):
    img = Image.new('RGB', (W, H), BG)
    glow = Image.new('RGB', (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse((700, -300, 1500, 400), fill=(40, 32, 20))
    gd.ellipse((-300, 300, 500, 900), fill=(14, 20, 40))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(120)), 1)
    d = ImageDraw.Draw(img)
    rnd = random.Random(a['slug'])
    for _ in range(70):  # faint starfield
        sx, sy = rnd.randint(0, W), rnd.randint(0, H - 260)
        c = rnd.randint(60, 140); d.point((sx, sy), fill=(c, c, c + 10))
    back = ridge(a['slug'] + 'b'); d.polygon(back, fill=(16, 21, 34))
    front = ridge(a['slug']); d.polygon(front, fill=(11, 15, 26))
    d.line(front[1:-1], fill=GOLD, width=3)

    pad = 72
    fb = font(BOLD, 40)
    d.text((pad, 58), 'Roam', font=fb, fill=(255, 255, 255))
    d.text((pad + d.textlength('Roam', font=fb), 58), 'Wise', font=fb, fill=RED)
    kicker = (a.get('ogKicker') or ' · '.join(a.get('tags', [])[:2]) or 'Planning notes').upper()
    fk = font(SEMI, 24)
    d.text((pad, 140), kicker, font=fk, fill=GOLD)

    title = a.get('ogTitle') or a['title']
    for size in (66, 60, 54, 48, 44):
        ft = font(BOLD, size)
        lines = wrap(d, title, ft, W - 2 * pad)
        if len(lines) <= 3: break
    y = 186
    for ln in lines[:3]:
        d.text((pad, y), ln, font=ft, fill=TEXT); y += int(size * 1.16)

    fr = font(REG, 24)
    section = 'Travel guides' if a.get('section') == 'guides' else 'Planning notes'
    d.text((pad, H - 52), f'roamwise.co.in  ·  {section}  ·  Made in Almora', font=fr, fill=MUTED)
    return img

def main():
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    n = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.json'): continue
        a = json.load(open(os.path.join(SRC, f), encoding='utf-8'))
        if only and a['slug'] not in only: continue
        card(a).save(os.path.join(OUT, a['slug'] + '.jpg'), 'JPEG', quality=86, optimize=True, progressive=True)
        n += 1
    print(f'Wrote {n} share images to assets/og/')

if __name__ == '__main__':
    main()
