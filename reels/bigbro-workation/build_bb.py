"""Big Bro Hotel workation/nomad promo reel, 1080x1920, 30 fps, 36 s. Reuses helpers from ../partners-promo.
Facts come from partners-data.js (MOU Annexure A1 / Schedule B): 4 rooms, min 15 nights, Rs 30,000 / 15 nights, Rs 50,000 / month,
Rs 1,50,000 / 3 months, Wi-Fi 100 Mbps as told by the owner (not speed-tested), inverter backup, desk + chair, quiet spot for calls,
meals extra via the hotel restaurant. Usage: python3 build_bb.py <outdir> [start end]"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'partners-promo'))
from build_frames import *   # helpers + constants (W, H, FPS, text, badge, stamp, speech, prop_card, ...)

DUR = 36.0
def ld(n):
    im = Image.open(os.path.join(ROOT, 'assets/property-photos', n)); im.load(); return im.convert('RGB')
LOUNGE_SUN = ld('big-bro-sunset-lounge.webp'); LOUNGE = ld('big-bro-lounge.webp'); ROOM = ld('big-bro-room.webp'); ROOM2 = ld('big-bro-room-2.webp'); MEAL = ld('big-bro-meal.webp')
RED = (60, 0, 10)

def s_hook(t):
    im = sunburst(t, (150, 20, 30), (255, 110, 40), 16, .8)
    k = ease_out_back(t / .5); put_emoji(im, '😤', W / 2, 560, 520 * k, rot=math.sin(t * 20) * 4)
    for i, (s, st) in enumerate([("BOSS: \"WFH MEIN", .5), ("KAAM NAHI", 1.1), ("HOTA KYA?!\"", 1.7)]):
        kk = ease_out_back((t - st) / .3)
        if kk > 0: text(im, (W / 2, 1000 + i * 150), s, int((130 if i == 1 else 110) * kk), GOLD if i == 1 else (255, 255, 255), stroke=12, sfill=RED)
    if t > 2.4: text(im, (W / 2, 1560), 'Har remote worker ki kahani 😭', 56, CREAM, stroke=8, sfill=RED)
    return shake(im, 14 if t < 1.6 else 6, t)

NOTES = [(3.3, 'Wi-Fi', 'Call ke beech me gaya 📶', 0), (4.1, 'Light', 'Gayi. Phir se. ⚡', 1), (4.9, 'Mummy', 'Beta khana kha le!', 0), (5.6, 'Padosi', 'Drill machine ON 🔨', 1),
         (6.3, 'Client', 'Aap mute pe hain 🔇', 0), (7.0, 'Boss', 'Report kahan hai?!', 1)]
def s_chaos(t):
    lt = t - 3.0; im = vgrad((12, 20, 40), (30, 10, 50))
    rrect(im, (30, 160, W - 30, 1560), 50, (22, 30, 45), outline=(70, 90, 120), width=3)
    rrect(im, (30, 160, W - 30, 300), 50, (160, 40, 50)); text(im, (90, 230), 'Client Call 🔴 LIVE', 54, (255, 255, 255), anchor='lm')
    text(im, (W - 90, 230), f'{min(99, 3 + int(lt * 16))}+ 🔔', 46, (255, 255, 255), anchor='rm')
    y = 1470
    for st, who, msg, right in reversed([n for n in NOTES if t >= n[0]]):
        a = ease_out_back((t - st) / .3, 1.2); y -= 160
        if y > 330: chat_bubble(im, y, who, msg, right, clamp(a))
    return shake(im, 2 + lt * 2.2, t)
def s_freeze(t):
    lt = t - 8.0; prev = s_chaos(7.999).convert('L').convert('RGBA')
    im = Image.blend(prev.filter(ImageFilter.GaussianBlur(6)), Image.new('RGBA', (W, H), (0, 0, 0, 255)), .55)
    if lt < .12: im = Image.blend(im, Image.new('RGBA', (W, H), (255, 255, 255, 255)), 1 - lt / .12)
    put_emoji(im, '✋', W / 2, 640, 420 * ease_out_back((lt - .1) / .3))
    if lt > .4: text(im, (W / 2, 1010), 'BAS BAHUT HUA!', int(110 * ease_out_back((lt - .4) / .25)), (255, 255, 255), stroke=12)
    if lt > .85: text(im, (W / 2, 1170), 'PAHAAD CHALO 🏔️', int(115 * ease_out_back((lt - .85) / .25)), GOLD, stroke=12)
    return im
def s_big(t):
    lt = t - 9.5; im = vgrad((40, 18, 12), (16, 8, 30)); im = Image.blend(im, sunburst(t, (80, 30, 20), (170, 80, 40), 14, .25), .35)
    prop_card(im, LOUNGE_SUN, t, lt, 'BIG BRO HOTEL', 'Ghurson, Almora  ·  only 4 rooms', .5, .5, 1.0)
    badge(im, W / 2, 232, '⭐ WORKATION & NOMAD STAY', 40, GOLD, INK, a=clamp((lt - .4) / .3))
    speech(im, 420, 1500, '🧑', 'Lounge se sunset dekhte hue kaam?! 🌇', 3.2, lt, 40)
    if lt > 4.6: badge(im, W / 2, 1640, 'Partner hotel on RoamWise ✅', int(42 * (1 + .03 * math.sin(lt * 8))), (20, 150, 110), (255, 255, 255))
    return im
SETUP = [(0.5, '📶', '100 Mbps Wi-Fi*'), (1.3, '🔋', 'Inverter backup'), (2.1, '🪑', 'Desk + chair'), (2.9, '📞', 'Quiet spot for calls'), (3.7, '🍽️', 'Hotel restaurant (meals extra)')]
def s_setup(t):
    lt = t - 16.0; im = vgrad((14, 24, 44), (30, 12, 52))
    text(im, (W / 2, 150), 'WORK SETUP ✅', int(110 * ease_out_back(lt / .35)) + 1, GOLD, stroke=10, sfill=INK)
    ph = cover(ROOM2, 940, 360, 1.0 + .05 * lt / 7, .5, .5); sl = (1 - ease_out(lt / .6)) * 700
    shadow(im, (70, int(260 + sl), 1010, int(620 + sl)), 40, 30, 16, 180); rounded_paste(im, ph, (70, int(260 + sl)), 40)
    for i, (st, ic, lab) in enumerate(SETUP):
        k = ease_out_back((lt - st) / .35, 1.5)
        if k <= 0: continue
        y0 = 690 + i * 150; x0 = 70 + (1 - clamp(k)) * 1100
        rrect(im, (int(x0), y0, int(x0) + 940, y0 + 126), 40, (28, 20, 52), outline=GOLD, width=4)
        put_emoji(im, ic, int(x0) + 80, y0 + 63, 78); text(im, (int(x0) + 150, y0 + 63), lab, 46, CREAM, anchor='lm')
        put_emoji(im, '✅', int(x0) + 880, y0 + 63, 64)
    if lt > 4.6: text(im, (W / 2, 1480), '*Wi-Fi speed as told by the owner', 34, (210, 200, 230), bold=False, stroke=3)
    speech(im, 460, 1610, '😳', 'Bhai tera background kahan ka hai?!', 5.0, lt, 38)
    return im
PRICE = [(0.6, '15 NIGHTS', '₹30,000', (232, 186, 108)), (1.6, '1 MONTH', '₹50,000', (255, 205, 120)), (2.6, '3 MONTHS', '₹1,50,000', (255, 226, 150))]
def s_price(t):
    lt = t - 23.0; im = sunburst(t, (30, 20, 70), (90, 40, 140), 16, .4)
    text(im, (W / 2, 170), 'LONG STAY RATES', int(104 * ease_out_back(lt / .35)) + 1, GOLD, stroke=10, sfill=INK)
    for i, (st, a, b, col) in enumerate(PRICE):
        stamp(im, W / 2 + (-40 if i % 2 == 0 else 40), 480 + i * 330, [(a, 54), (b, 112)], st, lt, col, INK, rot=-4 if i % 2 == 0 else 4)
    if lt > 3.4: text(im, (W / 2, 1480), '= ₹50,000 / month. Pahaad ka view free 🏔️', 44, CREAM, stroke=6, sfill=INK)
    if lt > 4.2: badge(im, W / 2, 1600, 'Only 4 rooms · minimum 15 nights', int(40 * ease_out_back((lt - 4.2) / .3)) + 1, (20, 150, 110), (255, 255, 255))
    if lt > 5.0: text(im, (W / 2, 1700), 'Meals extra · rates as agreed with the hotel', 32, (210, 200, 230), bold=False, stroke=3)
    return im
def s_meal(t):
    lt = t - 30.0; im = vgrad((10, 30, 24), (14, 10, 34))
    prop_card(im, MEAL, t, lt, 'PARATHA BREAK', 'Lunch break, but make it Himalayan', .5, .5, 1.0, h=1100)
    badge(im, W / 2, 232, '🫓 BIG BRO HOTEL RESTAURANT', 38, GOLD, INK, a=clamp((lt - .4) / .3))
    speech(im, 440, 1500, '👨', 'Standup call, paratha ke saath 🔥', 1.6, lt, 40)
    return im
def s_cta(t):
    lt = t - 33.0; im = sunburst(t, (150, 20, 30), (255, 110, 40), 18, .7); k = ease_out_back(lt / .5)
    put_emoji(im, '💻', W / 2, 440, 240 * k); put_emoji(im, '🏔️', W / 2 + 190, 480, 200 * k)
    im.alpha_composite(LOGO.resize((200, 200)), (W // 2 - 100, 620)) if lt > .2 else None
    text(im, (W / 2, 930), 'WORKATION', int(150 * clamp(k)) + 1, (255, 255, 255), stroke=12, sfill=RED)
    text(im, (W / 2, 1070), 'AT BIG BRO HOTEL', int(86 * clamp(k)) + 1, GOLD, stroke=9, sfill=RED)
    if lt > .6: text(im, (W / 2, 1230), 'roamwise.co.in', int(90 * ease_out_back((lt - .6) / .3)) + 1, GOLD, stroke=8, sfill=RED)
    if lt > 1.0: text(im, (W / 2, 1370), 'Book direct. Work from the hills.', 54, CREAM, stroke=6, sfill=RED)
    if lt > 1.5: text(im, (W / 2, 1520), 'Boss ko mat batana 🤫', 60, (255, 255, 255), stroke=7, sfill=RED)
    if lt > 1.8: text(im, (W / 2, 1640), 'Min 15 nights · meals extra · Wi-Fi 100 Mbps as told by owner', 28, (255, 235, 220), bold=False, stroke=3)
    rng = np.random.default_rng(3)
    for i in range(40):
        x = rng.uniform(0, W); sp = rng.uniform(300, 700); ph0 = rng.uniform(0, 3); y = ((lt * sp + ph0 * 500) % (H + 200)) - 100
        ImageDraw.Draw(im).rectangle((x, y, x + 18, y + 30), fill=[(255, 210, 90), (255, 255, 255), (255, 120, 90), (120, 230, 200)][i % 4] + (255,))
    return im
CAPS = [(0.4, 2.9, "Remote work ka sapna..."), (3.4, 7.8, "Reality: ek call, paanch problems 💀"), (10.2, 15.5, "Big Bro Hotel, Almora: long stay ke liye"),
        (22.0, 22.9, ""), (30.8, 32.8, "Chai-paratha, pahaad ke saath")]
SCENES = dict(hook=(0, 3.0), chaos=(3.0, 8.0), freeze=(8.0, 9.5), big=(9.5, 16.0), setup=(16.0, 23.0), price=(23.0, 30.0), meal=(30.0, 33.0), cta=(33.0, 36.0))
def frame(i):
    t = i / FPS
    for k, (a, b) in SCENES.items():
        if a <= t < b: im = globals()['s_' + k](t); break
    else: im = s_cta(35.99)
    im = im.convert('RGBA')
    if t > 3.0: brand(im)
    caption(im, t, CAPS)
    for edge in (3.0, 9.5, 16.0, 23.0, 30.0, 33.0):
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
