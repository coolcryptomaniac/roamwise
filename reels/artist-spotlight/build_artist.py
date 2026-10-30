"""Artist spotlight reel, 1080x1920, 30 fps, ~24 s. Same look as the Big Bro / partner-network reels (helpers from ../partners-promo).
Facts come ONLY from creators/artists-data.json (artists who gave consent): name, studio, state, services/themes, their own artworks.
No prices, no sales or reach claims. Usage: python3 build_artist.py <artist-id> <outdir> [start end]
Also writes <outdir>/timeline.json for audio_artist.py."""
import sys, os, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'partners-promo'))
from build_frames import *   # helpers + constants (W, H, FPS, text, badge, speech, put_emoji, rrect, shadow, ...)

DATA = json.load(open(os.path.join(ROOT, 'creators/artists-data.json')))
AID = sys.argv[1] if len(sys.argv) > 1 else 'natasha-guleria'
A = next(a for a in DATA['artists'] if a['id'] == AID)
PLUM = (40, 10, 50)

def ld(p):
    im = Image.open(os.path.join(ROOT, p.lstrip('/'))); im.load(); return im.convert('RGB')
WORKS = []
for w in A.get('artworks', []):
    try: WORKS.append((w['title'].split(' — ')[0].replace(' (title to be confirmed)', ''), ld(w['image'])))
    except Exception: pass
WORKS.sort(key=lambda x: -(x[1].width * x[1].height)); WORKS = WORKS[:4]
PHOTO = ld(A['photo']['src']) if A.get('photo') else None
FIRST = A['name'].split()[0]

def services():
    s = list(A.get('confirmedServices') or [])
    if not s:
        b = (A.get('bio') or '').lower()
        if 'acrylic' in b: s.append('Acrylic paintings')
        if 'nature' in b: s.append('Nature art and scenery')
        if 'custom' in b: s.append('Customised paintings')
        if 'canvas' in b: s.append('Work on canvas, wood, cloth and metal')
        if 'workshop' in b: s.append('Workshops')
        if not s and A.get('themes'): s = [t.capitalize() for t in A['themes']]
        if A['id'] == 'ritesh-devarmani': s = ['Urban portraits', 'Originals: enquire for availability']
    return s[:4]
SERV = services()

# ---- timeline ----
HOOK = 2.8; INTRO = 3.2; PER = 3.2
GAL = max(1, len(WORKS)) * PER if WORKS else 4.0
SERVT = 3.6; CTA = 3.4
T_INTRO = HOOK; T_GAL = T_INTRO + INTRO; T_SERV = T_GAL + GAL; T_CTA = T_SERV + SERVT; DUR = T_CTA + CTA
EDGES = [T_INTRO, T_GAL, T_SERV, T_CTA]

def blur_bg(im, t):
    bg = cover(im, W, H, 1.3 + .03 * t, .5, .5).filter(ImageFilter.GaussianBlur(40)).convert('RGBA')
    return Image.blend(bg, Image.new('RGBA', (W, H), PLUM + (255,)), .55)
def art_card(im, art, lt, cw=920, ch=1060, y0=300):
    z = 1.0 + .05 * lt / PER; w0, h0 = art.size; s = min(cw / w0, ch / h0) * z
    nw, nh = int(w0 * s), int(h0 * s); a = art.resize((nw, nh), Image.LANCZOS) if nw > w0 else art.resize((nw, nh), Image.LANCZOS)
    if nw > cw or nh > ch:
        l = max(0, (nw - cw) // 2); tp = max(0, (nh - ch) // 2); a = a.crop((l, tp, l + min(nw, cw), tp + min(nh, ch))); nw, nh = a.size
    slide = (1 - ease_out(lt / .5)) * 1300; x0 = (W - nw) // 2; y = int(y0 + (ch - nh) // 2 + slide)
    shadow(im, (x0, y, x0 + nw, y + nh), 36, 40, 24, 210); rounded_paste(im, a, (x0, y), 36)
    rrect(im, (x0 - 10, y - 10, x0 + nw + 10, y + nh + 10), 42, (0, 0, 0, 0), outline=GOLD, width=5)

def s_hook(t):
    im = sunburst(t, (90, 20, 90), (230, 120, 60), 16, .7)
    k = ease_out_back(t / .5); put_emoji(im, '🎨', W / 2, 560, 520 * k, rot=math.sin(t * 18) * 5)
    for i, (s, st) in enumerate([('GHAR KI DEEWAR', .5), ('KHAALI HAI?', 1.1)]):
        kk = ease_out_back((t - st) / .3)
        if kk > 0: text(im, (W / 2, 1000 + i * 160), s, int(118 * kk), GOLD if i else (255, 255, 255), stroke=12, sfill=PLUM)
    if t > 1.8: text(im, (W / 2, 1420), 'Artist se seedhi baat 🖌️', 56, CREAM, stroke=8, sfill=PLUM)
    return shake(im, 12 if t < 1.5 else 4, t)

def s_intro(t):
    lt = t - T_INTRO; base = PHOTO or (WORKS[0][1] if WORKS else None)
    im = blur_bg(base, lt) if base else sunburst(t, (60, 20, 90), (150, 60, 120), 14, .3)
    if base:
        art_card(im, base, lt, 760, 760, 250)
    nm = int(96 * ease_out_back((lt - .2) / .35)) + 1
    text(im, (W / 2, 1180), A['name'].upper(), min(nm, int(96 * 940 / max(940, tw(A['name'].upper(), 96)))), GOLD, stroke=10, sfill=PLUM)
    if lt > .5: text(im, (W / 2, 1290), A.get('studio') or '', 54, (255, 255, 255), stroke=6, sfill=PLUM)
    if lt > .8: badge(im, W / 2, 1420, '📍 ' + (A.get('state') or ''), 44, (20, 150, 110), (255, 255, 255), a=clamp((lt - .8) / .3))
    if lt > 1.2: badge(im, W / 2, 1540, '✅ ' + (A.get('role') or 'RoamWise Artist'), 38, GOLD, INK, a=clamp((lt - 1.2) / .3))
    return im

def s_gal(t):
    lt = t - T_GAL
    if not WORKS:   # no artwork on file: text-only card from the artist's own words
        im = vgrad((40, 14, 60), (20, 8, 40)); k = ease_out_back(lt / .4)
        put_emoji(im, '🖌️', W / 2, 520, 300 * k)
        import textwrap
        line = ' '.join((A.get('bio') or '').split('. ')[:2]); line = line if line.endswith('.') else line + '.'
        parts = textwrap.wrap(line, 24)[:7]
        text(im, (W / 2, 760), '\u201c', 160, GOLD, stroke=0)
        for i, p in enumerate(parts): text(im, (W / 2, 900 + i * 90), p, 50, CREAM, stroke=5, sfill=PLUM)
        text(im, (W / 2, 900 + len(parts) * 90 + 40), '\u2014 ' + A['name'], 42, GOLD, stroke=5, sfill=PLUM)
        return im
    i = min(len(WORKS) - 1, int(lt // PER)); llt = lt - i * PER; title, art = WORKS[i]
    im = blur_bg(art, llt); art_card(im, art, llt)
    badge(im, W / 2, 232, '🖼️ ORIGINAL ARTWORK', 40, GOLD, INK, a=clamp((llt - .3) / .3))
    if llt > .5: text(im, (W / 2, 1460), title, min(70, int(70 * 900 / max(900, tw(title, 70)))), (255, 255, 255), stroke=8, sfill=PLUM)
    if llt > .9: text(im, (W / 2, 1550), 'by ' + A['name'], 40, CREAM, stroke=5, sfill=PLUM, bold=False)
    return im

def s_serv(t):
    lt = t - T_SERV; im = sunburst(t, (50, 20, 90), (110, 50, 140), 16, .35)
    text(im, (W / 2, 190), 'KYA MILEGA?', int(110 * ease_out_back(lt / .35)) + 1, GOLD, stroke=10, sfill=INK)
    for i, s in enumerate(SERV):
        k = ease_out_back((lt - .5 - i * .55) / .35, 1.5)
        if k <= 0: continue
        y0 = 400 + i * 190; x0 = 70 + (1 - clamp(k)) * 1100
        rrect(im, (int(x0), y0, int(x0) + 940, y0 + 150), 44, (28, 20, 52), outline=GOLD, width=4)
        put_emoji(im, '🎨', int(x0) + 80, y0 + 75, 80)
        text(im, (int(x0) + 150, y0 + 75), s, min(46, int(46 * 700 / max(700, tw(s, 46)))), CREAM, anchor='lm')
        put_emoji(im, '✅', int(x0) + 880, y0 + 75, 64)
    if lt > 3.0: text(im, (W / 2, 1300), 'Price aur details: artist se seedha poochho', 38, (210, 200, 230), bold=False, stroke=3)
    speech(im, 470, 1480, '🧑', 'Ye painting mere ghar ke liye perfect! 😍', 2.4, lt, 38)
    return im

def s_cta(t):
    lt = t - T_CTA; im = sunburst(t, (90, 20, 90), (230, 120, 60), 18, .7); k = ease_out_back(lt / .5)
    put_emoji(im, '🖼️', W / 2, 430, 260 * k)
    im.alpha_composite(LOGO.resize((200, 200)), (W // 2 - 100, 600)) if lt > .2 else None
    text(im, (W / 2, 900), 'MEET ' + FIRST.upper(), int(120 * clamp(k)) + 1, (255, 255, 255), stroke=12, sfill=PLUM)
    if lt > .5: text(im, (W / 2, 1040), 'on RoamWise', int(84 * ease_out_back((lt - .5) / .3)) + 1, GOLD, stroke=9, sfill=PLUM)
    if lt > .9: text(im, (W / 2, 1200), 'roamwise.co.in' + (A.get('page') or '/creators/artists.html'), 44, CREAM, stroke=6, sfill=PLUM)
    if lt > 1.4: text(im, (W / 2, 1360), 'Seedha artist se. Bina dalaal.', 56, (255, 255, 255), stroke=7, sfill=PLUM)
    if lt > 1.8: text(im, (W / 2, 1520), 'Dost ko bhi bhej do 🎁', 56, GOLD, stroke=7, sfill=PLUM)
    rng = np.random.default_rng(5)
    for i in range(40):
        x = rng.uniform(0, W); sp = rng.uniform(300, 700); ph0 = rng.uniform(0, 3); y = ((lt * sp + ph0 * 500) % (H + 200)) - 100
        ImageDraw.Draw(im).rectangle((x, y, x + 18, y + 30), fill=[(255, 210, 90), (255, 255, 255), (255, 120, 90), (120, 230, 200)][i % 4] + (255,))
    return im

CAPS = [(0.4, 2.4, 'Khaali deewar, bore ghar 😴'), (T_INTRO + .3, T_INTRO + 2.9, 'Ek asli artist, ek asli studio'),
        (T_SERV + 3.2, T_SERV + 3.55, '')]
SCENES = dict(hook=(0, T_INTRO), intro=(T_INTRO, T_GAL), gal=(T_GAL, T_SERV), serv=(T_SERV, T_CTA), cta=(T_CTA, DUR))
def frame(i):
    t = i / FPS
    for k, (a, b) in SCENES.items():
        if a <= t < b: im = globals()['s_' + k](t); break
    else: im = s_cta(DUR - .01)
    im = im.convert('RGBA')
    if t > HOOK: brand(im)
    caption(im, t, CAPS)
    for edge in EDGES + [T_GAL + PER * j for j in range(1, len(WORKS))]:
        d = t - edge
        if 0 <= d < .12: im = Image.blend(im, Image.new('RGBA', (W, H), (255, 255, 255, 255)), .6 * (1 - d / .12))
    return im.convert('RGB')
def work(i):
    frame(i).save(f'{OUT}/f{i:05d}.jpg', quality=92); return i
if __name__ == '__main__':
    OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
    json.dump(dict(dur=DUR, hook=HOOK, intro=T_INTRO, gal=T_GAL, serv=T_SERV, cta=T_CTA, per=PER, n=max(1, len(WORKS))), open(os.path.join(OUT, 'timeline.json'), 'w'))
    a = int(sys.argv[3]) if len(sys.argv) > 3 else 0; b = int(sys.argv[4]) if len(sys.argv) > 4 else int(DUR * FPS)
    with Pool(min(6, os.cpu_count() or 2)) as p:
        for n, _ in enumerate(p.imap_unordered(work, range(a, b), chunksize=8)):
            if n % 120 == 0: print(n, flush=True)
