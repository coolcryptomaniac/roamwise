"""RoamWise partner-network story reel, 1080x1920, 30 fps, 40 s. Reuses helpers from ../partners-promo.
Claims are limited to what the product does: AI shortlists a fit, both sides approve the same terms, nothing moves money automatically.
No stats, no testimonials, no artist artwork (consent pending). Photos used: Big Bro Hotel (signed partner) and Milan Heights front.
Usage: python3 build_pn.py <outdir> [start end]"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'partners-promo'))
from build_frames import *

DUR = 40.0
def ld(n):
    im = Image.open(os.path.join(ROOT, 'assets/property-photos', n)); im.load(); return im.convert('RGB')
BIGBRO = ld('big-bro-lounge.webp'); MILAN_P = ld('milan-heights-front.jpg')
RED = (60, 0, 10)
ROLES6 = ['🎥', '🏡', '🎨', '🎶', '🚕', '🎓']

def s_hook(t):
    im = sunburst(t, (150, 20, 30), (255, 110, 40), 16, .8)
    for i, e in enumerate(ROLES6):
        a = i / 6 * 6.283 + t * 1.6; r = 330 + 30 * math.sin(t * 5 + i)
        put_emoji(im, e, W / 2 + r * math.cos(a), 560 + r * .75 * math.sin(a), 150 * ease_out_back((t - .1 * i) / .3))
    put_emoji(im, '🤷', W / 2, 560, 260 * ease_out_back(t / .4))
    for i, (s, st) in enumerate([("SAB KOI APNA", .5), ("PARTNER", 1.1), ("DHOONDH RAHA HAI!", 1.7)]):
        kk = ease_out_back((t - st) / .3)
        if kk > 0: text(im, (W / 2, 1090 + i * 150), s, int((100 if i != 1 else 150) * kk), GOLD if i == 1 else (255, 255, 255), stroke=12, sfill=RED)
    if t > 2.4: text(im, (W / 2, 1620), 'Creator, hotel, artist, driver, college 😭', 46, CREAM, stroke=7, sfill=RED)
    return shake(im, 12 if t < 1.6 else 5, t)

NOTES = [(3.3, 'Creator', 'Free stay milega kya? 🙏', 0), (4.1, 'Hotel', 'Reel kaun banayega?', 1), (4.9, 'Artist', 'Meri painting ko wall chahiye 🎨', 0),
         (5.6, 'Driver', 'Guest kahan se laun? 🚕', 1), (6.3, 'College', 'Fest ke liye partner?', 0), (7.0, 'Sab', 'DM DM DM 💀', 1)]
def s_chaos(t):
    lt = t - 3.0; im = vgrad((12, 20, 40), (30, 10, 50))
    rrect(im, (30, 160, W - 30, 1560), 50, (22, 30, 45), outline=(70, 90, 120), width=3)
    rrect(im, (30, 160, W - 30, 300), 50, (60, 80, 140)); text(im, (90, 230), 'Group: Sabka Plan 🙃', 54, (255, 255, 255), anchor='lm')
    text(im, (W - 90, 230), f'{min(99, 3 + int(lt * 18))}+ 🔔', 46, (255, 255, 255), anchor='rm')
    y = 1470
    for st, who, msg, right in reversed([n for n in NOTES if t >= n[0]]):
        a = ease_out_back((t - st) / .3, 1.2); y -= 160
        if y > 330: chat_bubble(im, y, who, msg, right, clamp(a))
    return shake(im, 2 + lt * 2, t)
def s_freeze(t):
    lt = t - 7.5; prev = s_chaos(7.499).convert('L').convert('RGBA')
    im = Image.blend(prev.filter(ImageFilter.GaussianBlur(6)), Image.new('RGBA', (W, H), (0, 0, 0, 255)), .55)
    if lt < .12: im = Image.blend(im, Image.new('RGBA', (W, H), (255, 255, 255, 255)), 1 - lt / .12)
    put_emoji(im, '✋', W / 2, 640, 420 * ease_out_back((lt - .1) / .3))
    if lt > .35: text(im, (W / 2, 1010), 'RUKO RUKO!', int(120 * ease_out_back((lt - .35) / .25)), (255, 255, 255), stroke=12)
    return im

def role_scene(t, a, emoji, kicker, title, photo, match, bubble, who, extra=None):
    lt = t - a; im = vgrad((30, 14, 44), (12, 8, 30)); im = Image.blend(im, sunburst(t, (70, 30, 90), (150, 60, 90), 14, .25), .3)
    badge(im, W / 2, 175, kicker, 40, GOLD, INK, a=clamp(lt / .25))
    put_emoji(im, emoji, W / 2, 400, 230 * ease_out_back(lt / .35), rot=math.sin(lt * 4) * 4)
    text(im, (W / 2, 590), title, int(min(96, 96 * 900 / max(1, tw(title, 96))) * ease_out_back((lt - .1) / .3)) + 1, (255, 255, 255), stroke=10, sfill=INK)
    if photo is not None:
        ph = cover(photo, 940, 330, 1.0 + .04 * lt, .5, .5); sl = (1 - ease_out((lt - .2) / .5)) * 900
        shadow(im, (70, int(690 + sl), 1010, int(1020 + sl)), 40, 30, 16, 180); rounded_paste(im, ph, (70, int(690 + sl)), 40)
    elif extra: extra(im, lt)
    text(im, (W / 2, 1090), 'MATCH KIYA JAATA HAI:', 36, GOLD, stroke=5, sfill=INK)
    for i, m in enumerate(match):
        k = ease_out_back((lt - .5 - .35 * i) / .3, 1.4)
        if k <= 0: continue
        y0 = 1150 + i * 112; x0 = 70 + (1 - clamp(k)) * 1100
        rrect(im, (int(x0), y0, int(x0) + 940, y0 + 96), 34, (28, 20, 52), outline=GOLD, width=3)
        text(im, (int(x0) + 40, y0 + 48), m, 38, CREAM, anchor='lm'); put_emoji(im, '✅', int(x0) + 890, y0 + 48, 54)
    speech(im, 470, 1600, who, bubble, 2.0, lt, 36)
    return im
def eq_bars(im, lt):
    for i in range(14):
        h = 60 + 150 * abs(math.sin(lt * 5 + i * .7)); x = 100 + i * 63
        ImageDraw.Draw(im).rounded_rectangle((x, 880 - h / 2 - 20, x + 40, 880 + h / 2 - 20), 16, fill=GOLD + (255,))
def road(im, lt):
    ImageDraw.Draw(im).rounded_rectangle((70, 800, 1010, 940), 40, fill=(40, 40, 60, 255))
    for i in range(9): ImageDraw.Draw(im).rectangle((((i * 120 - lt * 260) % 1000) + 70, 866, ((i * 120 - lt * 260) % 1000) + 130, 876), fill=(230, 230, 230, 255))
    put_emoji(im, '🚕', 150 + ease_out(lt / 2.6) * 700, 860, 150)
def paint(im, lt):
    d = ImageDraw.Draw(im); cols = [(200, 60, 60), (232, 186, 108), (80, 160, 200), (120, 200, 140)]
    for i, c in enumerate(cols):
        w = int(clamp((lt - .2 - .15 * i) / .6) * 800); d.rounded_rectangle((120, 740 + i * 70, 120 + w, 790 + i * 70), 25, fill=c + (255,))
    put_emoji(im, '🖌️', 120 + clamp((lt - .2) / 1.2) * 800, 850, 140)
def campus(im, lt):
    for i, e in enumerate(['🎓', '🎤', '🎪', '📸']): put_emoji(im, e, 190 + i * 235, 860 + math.sin(lt * 4 + i) * 20, 160 * ease_out_back((lt - .2 - .15 * i) / .3))

SCENES6 = [
 (8.5, '🎥', 'FOR CREATORS', 'CREATOR?', MILAN_P, ['Tumhari niche + jagah', 'Barter, hybrid ya paid', 'Verified stays'], 'Free stay + content, seedha! 🙌', '😎', None),
 (12.2, '🏡', 'FOR PROPERTY PARTNERS', 'HOTEL / HOMESTAY?', BIGBRO, ['Tumhara kasba + rooms', 'Kaisa content chahiye', 'Fit hone wale creators'], 'Khaali room, bhare reels 😍', '🧑‍💼', None),
 (15.9, '🎨', 'FOR PAINTING ARTISTS', 'ARTIST?', None, ['Tumhari theme aur style', 'Hotels aur cafes ko wall art', 'Buyer seedha tumse baat kare'], 'Wall milegi, naam milega 🖼️', '🧑‍🎨', paint),
 (19.6, '🎶', 'FOR MUSIC ARTISTS', 'MUSIC ARTIST?', None, ['Tumhari genre aur mood', 'Stays, cafes aur events', 'Creators ko original track'], 'Reel pe apna gaana! 🔊', '🎤', eq_bars),
 (23.3, '🚕', 'FOR TRANSPORT PROVIDERS', 'DRIVER / FLEET?', None, ['Tumhare route aur gaadi', 'Seats aur pickup point', 'Stays ke paas guests'], 'Pahaad ka route, pakka guest 🛣️', '🧑‍✈️', road),
 (27.0, '🎓', 'FOR COLLEGES', 'COLLEGE / CLUB?', None, ['Event aur student reach', 'Travel + creator programmes', 'Terms likhit me dono ki'], 'Fest me real partner 🎉', '🧑‍🎓', campus),
]
def s_roles(t):
    for a, em, k, ti, ph, m, b, who, ex in SCENES6:
        if a <= t < a + 3.7: return role_scene(t, a, em, k, ti, ph, m, b, who, ex)
    return role_scene(t, SCENES6[-1][0], *SCENES6[-1][1:])

def s_engine(t):
    lt = t - 30.7; im = vgrad((8, 14, 40), (20, 8, 50)); im = Image.blend(im, sunburst(t, (20, 40, 110), (90, 50, 160), 14, .3), .35)
    text(im, (W / 2, 190), 'AUTO AI', int(110 * ease_out_back(lt / .35)) + 1, GOLD, stroke=10, sfill=INK)
    text(im, (W / 2, 330), 'MATCHING ENGINE', int(86 * ease_out_back((lt - .1) / .35)) + 1, (255, 255, 255), stroke=9, sfill=INK)
    text(im, (W / 2, 430), 'Har role ko sahi PROPERTY se', 46, CREAM, stroke=6, sfill=INK)
    roles = [('🎥', 'Creator'), ('🎨', 'Painter'), ('🎶', 'Music'), ('🚕', 'Transport'), ('🎓', 'College')]
    L = [(170, 590 + i * 200) for i in range(5)]
    R = [(900, 690), (900, 990), (900, 1290)]
    links = [(0, 0), (1, 1), (2, 2), (3, 0), (4, 1)]
    d = ImageDraw.Draw(im)
    for n, (a, b) in enumerate(links):
        k = clamp((lt - .8 - .4 * n) / .5)
        if k > 0:
            x1, y1 = L[a]; x2, y2 = R[b]; d.line((x1 + 80, y1, x1 + 80 + (x2 - 70 - x1 - 80) * k, y1 + (y2 - y1) * k), fill=GOLD + (255,), width=7)
    for i, (x, y) in enumerate(L):
        put_emoji(im, roles[i][0], x, y - 12, 110); text(im, (x, y + 62), roles[i][1], 28, CREAM, stroke=4, sfill=INK)
    for i, (x, y) in enumerate(R):
        put_emoji(im, '🏡', x, y - 12, 130); text(im, (x, y + 70), 'Property', 28, CREAM, stroke=4, sfill=INK)
    k = clamp((lt - 2.9) / .4)
    if k > 0: put_emoji(im, '🤖', 540, 940, 150 * ease_out_back((lt - 2.9) / .4))
    if lt > 3.2: badge(im, W / 2, 1640, 'AI shortlists  ·  Dono taraf approve ✅', 38, (20, 150, 110), (255, 255, 255), a=clamp((lt - 3.2) / .3))
    if lt > 3.9: text(im, (W / 2, 1745), 'Paisa apne aap kabhi nahi hilta. Suggestion hai, promise nahi.', 28, (210, 200, 230), bold=False, stroke=3)
    return im

def s_cta(t):
    lt = t - 35.8; im = sunburst(t, (150, 20, 30), (255, 110, 40), 18, .7); k = ease_out_back(lt / .5)
    for i, e in enumerate(ROLES6): put_emoji(im, e, 150 + i * 156, 330, 110 * k, rot=math.sin(lt * 6 + i) * 8)
    im.alpha_composite(LOGO.resize((220, 220)), (W // 2 - 110, 480)) if lt > .2 else None
    text(im, (W / 2, 830), 'APNA PARTNER', int(130 * clamp(k)) + 1, (255, 255, 255), stroke=12, sfill=RED)
    text(im, (W / 2, 970), 'DHOONDHO', int(130 * clamp(k)) + 1, GOLD, stroke=12, sfill=RED)
    if lt > .6: text(im, (W / 2, 1180), 'roamwise.co.in', int(96 * ease_out_back((lt - .6) / .3)) + 1, GOLD, stroke=8, sfill=RED)
    if lt > 1.0: text(im, (W / 2, 1320), 'Homepage pe: "Partner with RoamWise"', 46, CREAM, stroke=6, sfill=RED)
    if lt > 1.5: text(im, (W / 2, 1450), 'Creators: free register 🎥', 54, (255, 255, 255), stroke=7, sfill=RED)
    if lt > 1.8: text(im, (W / 2, 1530), 'Top pe Featured: ₹500 se ₹2,000', 44, GOLD, stroke=6, sfill=RED)
    if lt > 2.0: text(im, (W / 2, 1620), 'Matches are suggestions, not promises.', 28, (255, 235, 220), bold=False, stroke=3)
    rng = np.random.default_rng(3)
    for i in range(40):
        x = rng.uniform(0, W); sp = rng.uniform(300, 700); ph0 = rng.uniform(0, 3); y = ((lt * sp + ph0 * 500) % (H + 200)) - 100
        ImageDraw.Draw(im).rectangle((x, y, x + 18, y + 30), fill=[(255, 210, 90), (255, 255, 255), (255, 120, 90), (120, 230, 200)][i % 4] + (255,))
    return im
CAPS = [(0.4, 2.9, "Sabko ek partner chahiye..."), (3.4, 7.2, "Result: DM ka jungle 💀"), (9.0, 12.0, "Creators ke liye"), (12.6, 15.6, "Property partners ke liye"),
        (16.3, 19.3, "Painting artists ke liye"), (20.0, 23.0, "Music artists ke liye"), (23.7, 26.7, "Transport providers ke liye"), (27.4, 30.4, "Colleges ke liye")]
SCENES = dict(hook=(0, 3.0), chaos=(3.0, 7.5), freeze=(7.5, 8.5), roles=(8.5, 30.7), engine=(30.7, 35.8), cta=(35.8, 40.0))
EDGES = [3.0, 7.5, 8.5] + [s[0] for s in SCENES6[1:]] + [30.7, 35.8]
def frame(i):
    t = i / FPS
    for k, (a, b) in SCENES.items():
        if a <= t < b: im = globals()['s_' + k](t); break
    else: im = s_cta(39.99)
    im = im.convert('RGBA')
    if t > 3.0 and not (30.7 <= t < 35.8): brand(im)
    if not (30.7 <= t): caption(im, t, CAPS)
    for edge in EDGES:
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
