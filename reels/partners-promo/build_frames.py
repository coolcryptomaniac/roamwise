"""Renders the partners promo reel frames (1080x1920, 30 fps) with PIL. Original skit + graphics only.
Usage: python3 build_frames.py <outdir> [start end]   needs the captured homepage frames in HOME_DIR."""
import sys, os, math, numpy as np
from functools import lru_cache
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageFile

W, H, FPS, DUR = 1080, 1920, 30, 40.0
ROOT = os.environ.get('RW_ROOT', '/home/claude/roamwise')
HOME_DIR = os.environ.get('HOME_FRAMES', '/tmp/claude-0/-home-claude/4daddd1d-6e7c-53d0-8edd-21964ff1bd8e/scratchpad/reel/hf')
PB = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
PM = '/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf'
EMO = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
GOLD = (232, 186, 108); CREAM = (255, 240, 194); INK = (21, 15, 38)

@lru_cache(None)
def F(size, bold=True): return ImageFont.truetype(PB if bold else PM, max(2, int(size)))
@lru_cache(None)
def emoji_img(ch, size):
    f = ImageFont.truetype(EMO, 109); im = Image.new('RGBA', (136, 128), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), ch, font=f, embedded_color=True)
    return im.resize((int(136 * size / 128), size), Image.LANCZOS)
def put_emoji(img, ch, cx, cy, size, rot=0):
    if size < 4: return
    e = emoji_img(ch, int(size))
    if rot: e = e.rotate(rot, expand=True, resample=Image.BICUBIC)
    img.alpha_composite(e, (int(cx - e.width / 2), int(cy - e.height / 2)))

def ease_out_back(x, s=1.9): x = min(1, max(0, x)); return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2
def ease_out(x): x = min(1, max(0, x)); return 1 - (1 - x) ** 3
def clamp(x): return min(1, max(0, x))

def _segs(s):
    out = []; i = 0
    while i < len(s):
        c = s[i]
        if ord(c) >= 0x2190 and c not in '\u2013\u2014\u2019\u201c\u201d\u2026\u2022':
            j = i + 1
            while j < len(s) and s[j] in '\ufe0f\u200d': j += 1
            out.append((s[i:j], True)); i = j
        else:
            j = i
            while j < len(s) and not (ord(s[j]) >= 0x2190 and s[j] not in '\u2013\u2014\u2019\u201c\u201d\u2026\u2022'): j += 1
            out.append((s[i:j], False)); i = j
    return out
def tw(s, size, bold=True): return sum((size * 1.1 if e else F(size, bold).getlength(p)) for p, e in _segs(s))
def text(img, xy, s, size, fill=(255, 255, 255), stroke=0, sfill=(0, 0, 0), anchor='mm', bold=True, alpha=1.0):
    if size < 3: return
    total = tw(s, size, bold); x, y = xy
    x = x - total / 2 if anchor[0] == 'm' else (x - total if anchor[0] == 'r' else x)
    lay = img if alpha >= 1 else Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); a = int(255 * alpha)
    for p, e in _segs(s):
        if e:
            em = emoji_img(p[0] + (p[1:] if len(p) > 1 and p[1] == '\ufe0f' else ''), int(size * 1.0))
            lay.alpha_composite(em if alpha >= 1 else Image.eval(em, lambda v: v), (int(x + (size * 1.1 - em.width) / 2), int(y - em.height / 2))); x += size * 1.1
        else:
            d.text((x, y), p, font=F(size, bold), fill=tuple(fill) + (a,), anchor='lm', stroke_width=stroke, stroke_fill=tuple(sfill) + (a,)); x += F(size, bold).getlength(p)
    if alpha < 1: img.alpha_composite(lay)
def rrect(img, box, r, fill, outline=None, width=0, alpha=255):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); ImageDraw.Draw(lay).rounded_rectangle(box, r, fill=fill + (alpha,) if len(fill) == 3 else fill, outline=outline, width=width); img.alpha_composite(lay)
def shadow(img, box, r, blur=30, off=18, a=150):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); x0, y0, x1, y1 = box
    ImageDraw.Draw(lay).rounded_rectangle((x0, y0 + off, x1, y1 + off), r, fill=(0, 0, 0, a)); img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(blur)))
def cover(im, w, h, zoom=1.0, fx=.5, fy=.5):
    im = im.convert('RGB'); s = max(w / im.width, h / im.height) * zoom
    nw, nh = int(im.width * s) + 1, int(im.height * s) + 1; im = im.resize((nw, nh), Image.LANCZOS)
    x = int((nw - w) * fx); y = int((nh - h) * fy); return im.crop((x, y, x + w, y + h))
def rounded_paste(img, src, xy, r):
    m = Image.new('L', src.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, src.width - 1, src.height - 1), r, fill=255)
    img.paste(src, xy, m)

# ---------- backgrounds ----------
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
ANG = np.arctan2(YY - H * .45, XX - W / 2); RAD = np.hypot(YY - H * .45, XX - W / 2)
def sunburst(t, c1, c2, rays=18, speed=.35, glow=(255, 200, 110)):
    m = (np.sin(ANG * rays + t * speed * 4) > 0).astype(np.float32)
    v = np.clip(1 - RAD / 1500, 0, 1)
    a = np.array(c1, np.float32)[None, None, :] * (1 - m[..., None] * .35) + np.array(c2, np.float32)[None, None, :] * (m[..., None] * .35)
    a = a * (.45 + .55 * v[..., None]); g = np.clip(1 - RAD / 700, 0, 1)[..., None] * np.array(glow, np.float32)[None, None, :] * .35
    return Image.fromarray(np.clip(a + g, 0, 255).astype(np.uint8)).convert('RGBA')
def vgrad(c1, c2):
    t = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]; a = np.array(c1, np.float32) * (1 - t) + np.array(c2, np.float32) * t
    return Image.fromarray(np.repeat(a, W, 1).astype(np.uint8)).convert('RGBA')

# ---------- assets ----------
def load(p):
    im = Image.open(os.path.join(ROOT, p)); im.load(); return im  # decode before the worker pool forks (a shared lazy file handle corrupts frames)
LOGO = load('icons/icon-192.png').convert('RGBA')
MILAN = load('assets/property-photos/milan-heights-front.jpg')
CORB = load('assets/property-photos/corbett-jungle-view-front.jpg')
ART = load('assets/img/natasha/shiva-dhyan.jpg')
_home = {}
def home_frame(i):
    i = max(0, min(299, i))
    if i not in _home:
        if len(_home) > 40: _home.clear()
        _home[i] = Image.open(f'{HOME_DIR}/h{i:04d}.jpg').convert('RGB')
    return _home[i]

def shake(img, amp, t):
    if amp <= 0: return img
    dx, dy = int(amp * math.sin(t * 97)), int(amp * math.cos(t * 83))
    return ImageChops.offset(img.convert('RGB'), dx, dy).convert('RGBA')

def caption(img, t, lines):
    for a, b, s in lines:
        if a <= t < b:
            k = ease_out_back((t - a) / .25, 1.4); size = int(58 * (.85 + .15 * k)); size = min(size, int(58 * 960 / max(960, max(tw(p, 58) for p in s.split(chr(10))))))
            parts = s.split('\n'); y = 1700 - 34 * (len(parts) - 1)
            for j, p in enumerate(parts): text(img, (W / 2, y + j * 72), p, size, (255, 255, 255), stroke=9)
            return
def brand(img):
    img.alpha_composite(LOGO.resize((64, 64)), (36, 34)); text(img, (116, 66), 'RoamWise', 36, CREAM, stroke=4, anchor='lm')

# ---------- scenes ----------
def s_hook(t):
    im = sunburst(t, (150, 20, 30), (255, 110, 40), 16, .8)
    k = ease_out_back(t / .5); put_emoji(im, '😱', W / 2, 560, 520 * k, rot=math.sin(t * 20) * 4)
    lines = [("DOST: \"BHAI,", .5), ("ALMORA TRIP", 1.1), ("KAB BANEGA?!\"", 1.8)]
    for i, (s, st) in enumerate(lines):
        kk = ease_out_back((t - st) / .3); 
        if kk > 0: text(im, (W / 2, 1000 + i * 150), s, int(110 * kk) if i != 1 else int(130 * kk), GOLD if i == 1 else (255, 255, 255), stroke=12, sfill=(60, 0, 10))
    if t > 2.5: text(im, (W / 2, 1560), 'Tag that dost 😭', 64, CREAM, stroke=8, sfill=(60, 0, 10))
    return shake(im, 14 if t < 1.6 else 6, t)

CHAT = [(4.0, 'Rohan', 'Hotel kaunsa lein? 🏨', 0), (4.9, 'Mummy', 'Sasta wala dekho beta!', 1), (5.8, 'Chintu', 'MMT pe ₹2,200 😭', 0), (6.7, 'Papa', 'Airbnb pe aur mehenga!', 1),
        (7.5, 'Rohan', 'Reviews padh lo sab 📖', 0), (8.2, 'Mummy', 'Hum ghar hi rahenge 🙄', 1), (8.8, 'Chintu', 'Bhai main out 💀', 0), (9.2, 'Papa', 'Plan cancel?!', 1)]
def chat_bubble(img, y, who, msg, right, a):
    size = 52; w = max(tw(msg, size, False), tw(who, 34)) + 90; h = 140
    x0 = W - 60 - w if right else 60; col = (220, 248, 198) if right else (255, 255, 255)
    xo = (1 - a) * (160 if right else -160); x0 += xo
    rrect(img, (x0, y, x0 + w, y + h), 36, col, alpha=int(255 * a))
    text(img, (x0 + 40, y + 36), who, 32, (200, 90, 40) if right else (30, 120, 180), anchor='lm', alpha=a)
    text(img, (x0 + 40, y + 98), msg, size, (30, 30, 30), anchor='lm', bold=False, alpha=a)
def s_chaos(t):
    lt = t - 3.5; im = vgrad((12, 20, 40), (30, 10, 50))
    rrect(im, (30, 160, W - 30, 1560), 50, (234, 226, 214, 255) if False else (22, 30, 45), outline=(70, 90, 120), width=3, alpha=255)
    rrect(im, (30, 160, W - 30, 300), 50, (18, 120, 100)); text(im, (90, 230), 'Almora Trip 🏔️', 56, (255, 255, 255), anchor='lm'); text(im, (W - 90, 230), f'{min(99, 12 + int(lt * 14))}+ 🔔', 46,(255,255,255),anchor='rm') if False else text(im, (W - 90, 230), f'{min(99, 12 + int(lt * 14))}+ 🔔', 46, (255, 255, 255), anchor='rm')
    shown = [c for c in CHAT if t >= c[0]]; y = 1470
    for st, who, msg, right in reversed(shown):
        a = ease_out_back((t - st) / .3, 1.2); y -= 160
        if y > 330: chat_bubble(im, y, who, msg, right, clamp(a))
    amp = 2 + lt * 2.2
    return shake(im, amp, t)
def s_freeze(t):
    lt = t - 9.5; prev = s_chaos(9.499).convert('L').convert('RGBA')
    im = Image.blend(prev.filter(ImageFilter.GaussianBlur(6)), Image.new('RGBA', (W, H), (0, 0, 0, 255)), .55)
    if lt < .12: im = Image.blend(im, Image.new('RGBA', (W, H), (255, 255, 255, 255)), 1 - lt / .12)
    k = ease_out_back((lt - .1) / .3); put_emoji(im, '✋', W / 2, 640, 420 * k)
    if lt > .5: text(im, (W / 2, 1010), 'RUKO ZARA...', int(120 * ease_out_back((lt - .5) / .25)), (255, 255, 255), stroke=12)
    if lt > .9: text(im, (W / 2, 1170), 'SABAR KARO!', int(130 * ease_out_back((lt - .9) / .25)), GOLD, stroke=12)
    return im

def phone(img, cx, top, wd, t_frame, rot=0):
    ht = int(wd * 932 / 430); bez = 22
    box = (cx - wd // 2 - bez, top - bez, cx + wd // 2 + bez, top + ht + bez); shadow(img, box, 90, 40, 24, 190)
    rrect(img, box, 90, (14, 14, 20), outline=(90, 80, 60), width=5)
    scr = home_frame(t_frame).resize((wd, ht), Image.LANCZOS); rounded_paste(img.convert('RGB') if False else img, scr, (cx - wd // 2, top), 70)
    rrect(img, (cx - 90, top + 10, cx + 90, top + 44), 17, (0, 0, 0))
def s_hero(t):
    lt = t - 11.0; im = sunburst(t, (60, 20, 110), (150, 70, 200), 20, .5)
    k = ease_out_back(lt / .45); size = int(150 * k)
    if size > 4: text(im, (W / 2, 140), 'ENTRY! 😎', size, GOLD, stroke=12, sfill=(30, 10, 60))
    y = int(260 + (1 - ease_out(lt / .9)) * 1600); fi = int(clamp((lt - .6) / 7.6) * 299)
    phone(im, W // 2, y, 640, fi)
    for i in range(14):  # sparkles
        px = (i * 211 + t * 70) % W; py = (i * 397 - t * 120) % 1500 + 200; sz = 30 + (i % 3) * 14
        if lt > .3: text(im, (px, py), '✨', sz, CREAM, alpha=.5 + .5 * math.sin(t * 6 + i))
    return im

def badge(im, cx, cy, s, size, fill, tcol, a=1.0, rot=0):
    w = int(tw(s, size) + 70); h = int(size * 1.9)
    lay = Image.new('RGBA', (w + 20, h + 20), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((10, 10, w + 10, h + 10), h // 2, fill=fill + (int(255 * a),)); text(lay, (w // 2 + 10, h // 2 + 10), s, size, tcol)
    if rot: lay = lay.rotate(rot, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)))
def stamp(im, cx, cy, lines, t0, t, col, tcol, rot=-6):
    k = ease_out_back((t - t0) / .35, 2.4)
    if k <= 0: return
    ws = max(tw(s, sz) for s, sz in lines) + 90; hs = sum(sz * 1.35 for s, sz in lines) + 40
    lay = Image.new('RGBA', (int(ws), int(hs)), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((0, 0, ws - 1, hs - 1), 36, fill=col + (255,), outline=(255, 255, 255, 255), width=6); y = 20
    for s_, sz in lines: text(lay, (ws / 2, y + sz * .62), s_, sz, tcol); y += sz * 1.35
    lay = lay.resize((max(2, int(lay.width * k)), max(2, int(lay.height * k))), Image.LANCZOS).rotate(rot, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)))
def speech(im, cx, cy, who_emoji, s, t0, t, size=50):
    k = ease_out_back((t - t0) / .3, 1.5)
    if k <= 0: return
    w = int(tw(s, size) + 80); h = 120; x0 = cx - w / 2; sc = max(.05, k)
    lay = Image.new('RGBA', (w + 160, h + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((120, 0, 120 + w, h), 50, fill=(255, 255, 255, 255)); text(lay, (120 + w / 2, h / 2), s, size, (30, 30, 30))
    lay.alpha_composite(emoji_img(who_emoji, 100), (0, 10)); lay = lay.resize((int(lay.width * sc), int(lay.height * sc)), Image.LANCZOS)
    im.alpha_composite(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)))
def prop_card(im, photo, t, lt, name, sub, fx, fy, zoom0, h=1080, cw=900):
    z = zoom0 + .06 * lt / 7; ph = cover(photo, cw, h, z, fx, fy)
    if photo.width < 500: ph = ph.filter(ImageFilter.SMOOTH)
    x0 = (W - cw) // 2; y0 = 250; slide = (1 - ease_out(lt / .6)) * 1300
    shadow(im, (x0, int(y0 + slide), x0 + cw, int(y0 + slide) + h), 60, 40, 24, 200)
    rounded_paste(im, ph, (x0, int(y0 + slide)), 60)
    g = Image.new('RGBA', (cw, 300), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    for yy in range(300): gd.line((0, yy, cw, yy), fill=(0, 0, 0, int(220 * (yy / 300) ** 1.5)))
    gm = Image.new('L', (cw, 300), 255); rounded_paste(im, Image.new('RGB', (1, 1)), (0, 0), 1) if False else None
    im.alpha_composite(g, (x0, int(y0 + slide) + h - 300)); text(im, (x0 + 50, int(y0 + slide) + h - 120), name, 62, (255, 255, 255), stroke=4, anchor='lm'); text(im, (x0 + 52, int(y0 + slide) + h - 52), sub, 38, GOLD, stroke=3, anchor='lm', bold=False)
    return y0 + slide

def s_milan(t):
    lt = t - 19.5; im = vgrad((40, 18, 12), (16, 8, 30))
    sunb = sunburst(t, (80, 30, 20), (170, 80, 40), 14, .25); im = Image.blend(im, sunb, .35)
    prop_card(im, MILAN, t, lt, 'MILAN HEIGHTS', 'Dharanaula, Almora  ·  stay + restaurant', .5, .35, 1.0)
    badge(im, W / 2, 232, '⭐ EXCLUSIVE ROAMWISE TIE-UP', 38, GOLD, INK, a=clamp((lt - .5) / .3))
    stamp(im, 760, 1010, [('₹1,500 – ₹3,000', 66), ('/ night + GST', 38)], 2.7, lt, (232, 186, 108), INK)
    speech(im, 400, 1500, '🧑', 'Neeche gaming zone bhi hai?! 🎮', 4.2, lt, 44)
    k = 1 + .04 * math.sin(lt * 8) if lt > 3.4 else 0
    if k: badge(im, W / 2, 1610, 'Book now on WhatsApp 👉', int(46 * k), (37, 211, 102), (255, 255, 255))
    return im
def s_corbett(t):
    lt = t - 26.5; im = vgrad((10, 30, 24), (14, 10, 34))
    prop_card(im, CORB, t, lt, 'CORBETT JUNGLE VIEW', 'Near Lansdowne  ·  6-bedroom homestay', .5, .45, 1.0, h=1100)
    badge(im, W / 2, 232, '⭐ EXCLUSIVE ROAMWISE TIE-UP', 38, GOLD, INK, a=clamp((lt - .5) / .3))
    stamp(im, 760, 960, [('From ₹1,830', 70), ('/ room / night', 38)], 2.6, lt, (232, 186, 108), INK)
    if lt > 3.8:
        a = ease_out_back((lt - 3.8) / .35, 1.6); badge(im, W / 2, 1500, '✅ ₹370 (17%) less than MakeMyTrip', int(40 * clamp(a)) + 1, (20, 150, 110), (255, 255, 255))
        text(im, (W / 2, 1565), 'same room, per night · checked 22 Oct 2026', 30, (210, 240, 230), bold=False, stroke=2)
    speech(im, 420, 470, '👨', '₹370 bach gaye?! 🤯', 4.5, lt, 44)
    speech(im, 640, 620, '👩', 'Chai meri taraf se ☕', 5.6, lt, 44)
    return im

def s_more(t):
    lt = t - 33.5; im = sunburst(t, (30, 20, 70), (90, 40, 140), 16, .4)
    text(im, (W / 2, 190), 'AUR BHI HAIN...', int(118 * ease_out_back(lt / .35)) + 1, GOLD, stroke=10, sfill=INK)
    tiles = [(0.5, 'ART', 'Natasha Guleria\nBrand Ambassador', ART), (1.2, '🏪', 'Shops & cafes\nget creators', None), (1.9, '📚', '4 books\nPothi·Amazon·Flipkart', None), (2.6, '🎬', 'Memories\nevents & videos', None)]
    for i, (st, ic, lab, photo) in enumerate(tiles):
        k = ease_out_back((lt - st) / .35, 1.7)
        if k <= 0: continue
        x0 = 60 + (i % 2) * 500; y0 = 340 + (i // 2) * 600; w, h = 460, 540; s = max(.05, k)
        lay = Image.new('RGBA', (w, h), (0, 0, 0, 0)); rrect(lay, (0, 0, w - 1, h - 1), 50, (28, 20, 52), outline=GOLD, width=5)
        if photo is not None: rounded_paste(lay, cover(photo, w - 40, 330, 1.0), (20, 20), 38)
        else: put_emoji(lay, ic, w // 2, 190, 210)
        for j, p in enumerate(lab.split('\n')): text(lay, (w // 2, 400 + j * 56), p, 40 if j == 0 else 32, CREAM if j == 0 else GOLD, bold=j == 0)
        lay = lay.resize((int(w * s), int(h * s)), Image.LANCZOS); im.alpha_composite(lay, (int(x0 + w / 2 - lay.width / 2), int(y0 + h / 2 - lay.height / 2)))
    return im
def s_cta(t):
    lt = t - 37.0; im = sunburst(t, (150, 20, 30), (255, 110, 40), 18, .7); k = ease_out_back(lt / .5)
    put_emoji(im, '🏔️', W / 2, 560, 260 * k)
    im.alpha_composite(LOGO.resize((220, 220)), (W // 2 - 110, 760)) if lt > .2 else None
    text(im, (W / 2, 1060), 'ROAMWISE', int(150 * clamp(k)) + 1, (255, 255, 255), stroke=12, sfill=(60, 0, 10))
    if lt > .6: text(im, (W / 2, 1200), 'roamwise.co.in', int(90 * ease_out_back((lt - .6) / .3)) + 1, GOLD, stroke=8, sfill=(60, 0, 10))
    if lt > 1.0: text(im, (W / 2, 1340), 'Plan smart. Book direct.', 58, CREAM, stroke=6, sfill=(60, 0, 10))
    if lt > 1.5: text(im, (W / 2, 1520), 'Mummy ko bhi bhej do 😄', 60, (255, 255, 255), stroke=7, sfill=(60, 0, 10))
    rng = np.random.default_rng(3)
    for i in range(40):  # confetti
        x = rng.uniform(0, W); sp = rng.uniform(300, 700); ph0 = rng.uniform(0, 3); y = ((lt * sp + ph0 * 500) % (H + 200)) - 100
        col = [(255, 210, 90), (255, 255, 255), (255, 120, 90), (120, 230, 200)][i % 4]
        ImageDraw.Draw(im).rectangle((x, y, x + 18, y + 30), fill=col + (255,))
    return im

CAPS = [(0.4, 3.4, "Har trip ki shuruaat yahi se..."), (4.0, 9.4, "Group chat: 99+ messages, 0 plan 💀"), (10.4, 11.0, ""), (12.0, 18.8, "RoamWise: homepage pe sab ek jagah"),
        (20.5, 26.0, "Almora ka hotel + restaurant + gaming zone"), (27.5, 33.0, "Lansdowne ka jungle view, direct rate pe"), (34.0, 36.9, "Art, shops, books, memories - sab yahin"), (39.0, 40.0, "")]
def frame(i):
    t = i / FPS
    for k, (a, b) in dict(hook=(0, 3.5), chaos=(3.5, 9.5), freeze=(9.5, 11.0), hero=(11.0, 19.5), milan=(19.5, 26.5), corbett=(26.5, 33.5), more=(33.5, 37.0), cta=(37.0, 40.0)).items():
        if a <= t < b: im = globals()['s_' + k](t); break
    else: im = s_cta(39.99)
    im = im.convert('RGBA')
    if t > 3.5: brand(im)
    caption(im, t, CAPS)
    # scene-change flash
    for edge in (3.5, 11.0, 19.5, 26.5, 33.5, 37.0):
        d = t - edge
        if 0 <= d < .12: im = Image.blend(im, Image.new('RGBA', (W, H), (255, 255, 255, 255)), .6 * (1 - d / .12))
    return im.convert('RGB')
def work(i):
    frame(i).save(f'{OUT}/f{i:05d}.jpg', quality=92); return i
if __name__ == '__main__':
    OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
    a = int(sys.argv[2]) if len(sys.argv) > 2 else 0; b = int(sys.argv[3]) if len(sys.argv) > 3 else int(DUR * FPS)
    with Pool(min(6, os.cpu_count() or 2)) as p:
        for n, _ in enumerate(p.imap_unordered(work, range(a, b), chunksize=8)):
            if n % 120 == 0: print(n, flush=True)
