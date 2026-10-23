"""Ad creatives for the paid Featured slot: 1080x1920 story and 1080x1080 post. Usage: python3 featured_ad.py <outdir>"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'partners-promo'))
from build_frames import *
RED = (60, 0, 10)
def ad(w, h):
    im = sunburst(0.5, (30, 20, 70), (110, 50, 150), 18, .4).convert('RGBA')
    if (w, h) != (W, H): im = im.resize((w, h)) if False else im.crop((0, 0, w, h)) if h < H else im
    k = h / 1920
    def y(v): return int(v * k)
    text(im, (w / 2, y(170)), 'GET FEATURED', int(120 * (w / 1080)), GOLD, stroke=11, sfill=INK)
    text(im, (w / 2, y(300)), 'ON TOP OF ROAMWISE', int(66 * (w / 1080)), (255, 255, 255), stroke=8, sfill=INK)
    for i, (price, days, lab, col) in enumerate([('₹500', '7 days', 'SPOTLIGHT', (232, 186, 108)), ('₹1,000', '15 days', 'PRIME', (255, 205, 120)), ('₹2,000', '30 days · 1st position', 'TOP', (255, 226, 150))]):
        yy = y(520 + i * (330 if h > 1100 else 250))
        stamp(im, w / 2 + (-30 if i % 2 == 0 else 30), yy, [(lab, int(40 * (w / 1080))), (price, int(104 * (w / 1080))), (days, int(40 * (w / 1080)))], 0, 9, col, INK, rot=-3 if i % 2 == 0 else 3)
    text(im, (w / 2, y(1560)), 'Stays · Artists · Creators · Music · Transport · Colleges', int(34 * (w / 1080)), CREAM, stroke=5, sfill=INK)
    text(im, (w / 2, y(1650)), 'roamwise.co.in/feature', int(62 * (w / 1080)), GOLD, stroke=7, sfill=INK)
    text(im, (w / 2, y(1760)), 'Paid promotion. No guarantee of enquiries or bookings.', int(26 * (w / 1080)), (210, 200, 230), bold=False, stroke=3)
    return im.convert('RGB')
def square():
    im = sunburst(0.5, (30, 20, 70), (110, 50, 150), 18, .4).convert('RGBA').crop((0, 400, 1080, 1480))
    text(im, (540, 110), 'GET FEATURED', 112, GOLD, stroke=11, sfill=INK)
    text(im, (540, 215), 'ON TOP OF ROAMWISE', 60, (255, 255, 255), stroke=8, sfill=INK)
    for i, (price, days, lab, col) in enumerate([('₹500', '7 days', 'SPOTLIGHT', (232, 186, 108)), ('₹1,000', '15 days', 'PRIME', (255, 205, 120)), ('₹2,000', '30 days', 'TOP', (255, 226, 150))]):
        stamp(im, 190 + i * 350, 540, [(lab, 30), (price, 66), (days, 32)], 0, 9, col, INK, rot=-3 if i % 2 == 0 else 3)
    text(im, (540, 800), 'Stays · Artists · Creators · Music · Transport · Colleges', 30, CREAM, stroke=5, sfill=INK)
    text(im, (540, 900), 'roamwise.co.in/feature', 60, GOLD, stroke=7, sfill=INK)
    text(im, (540, 1000), 'Paid promotion. No guarantee of enquiries or bookings.', 26, (210, 200, 230), bold=False, stroke=3)
    return im.convert('RGB')
if __name__ == '__main__':
    o = sys.argv[1]; os.makedirs(o, exist_ok=True)
    ad(1080, 1920).save(f'{o}/featured-ad-story.jpg', quality=92)
    square().save(f'{o}/featured-ad-square.jpg', quality=92)
