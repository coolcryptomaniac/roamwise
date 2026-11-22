#!/usr/bin/env python3
"""RoamWise real-source Play marketing asset builder.
Reads only existing repository photographs and *actual* browser screenshots.
No AI-generated person, fake bookings, or invented UI.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
import math, os, textwrap
BASE=Path(__file__).resolve().parents[2]
OUT=BASE/"build"/"play-console-2026"
OUT.mkdir(parents=True,exist_ok=True)
PHOTO=BASE/"assets/img/natasha/natasha-with-painting.jpg"
ART=BASE/"assets/img/natasha/manimanash.jpg"
LOGO=BASE/"assets/img/roamwise-logo-176.webp"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
NAVY=(7,12,27); GOLD=(238,196,112); IVORY=(249,245,238)

def f(size,bold=False):
  return ImageFont.truetype(BOLD if bold else FONT,size)
def gradient(w,h,start=(8,11,26),end=(34,22,49)):
  im=Image.new("RGB",(w,h)); d=ImageDraw.Draw(im)
  for y in range(h):
    t=y/max(1,h-1)
    d.line((0,y,w,y),fill=tuple(round(a*(1-t)+b*t) for a,b in zip(start,end)))
  return im
def text(d,xy,value,size,fill=IVORY,bold=False,spacing=5):
  d.multiline_text(xy,value,fill=fill,font=f(size,bold),spacing=spacing)
def photo(src,size):
  return ImageOps.fit(Image.open(src).convert("RGB"),size,method=Image.Resampling.LANCZOS,centering=(0.5,0.46))
def rounded_photo(canvas,source,rect,radius=30):
  x,y,w,h=rect; pic=photo(source,(w,h)); mask=Image.new("L",(w,h));ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=radius,fill=255);canvas.paste(pic,(x,y),mask)
def draw_logo(canvas,x,y,side):
  pic=Image.open(LOGO).convert("RGBA")
  pic.thumbnail((side,side),Image.Resampling.LANCZOS)
  canvas.paste(pic,(x,y),pic)
def feature():
  W,H=1024,500; im=gradient(W,H,(7,11,25),(24,16,38))
  d=ImageDraw.Draw(im)
  for i in range(5):
    d.arc((80-i*36,110-i*30,770+i*40,700+i*43),220,345,fill=(47+i*5,38+i*3,70+i*3),width=2)
  # Use the actual existing Natasha artist photograph, not a face reconstruction.
  right=ImageOps.fit(Image.open(PHOTO).convert("RGB"),(530,500),centering=(.63,.45))
  mask=Image.new("L",(530,500),0)
  md=ImageDraw.Draw(mask)
  for x in range(530):
    alpha=int(252*min(1,max(0,(x-15)/135)))
    md.line((x,0,x,500),fill=alpha)
  im.paste(right,(494,0),mask)
  # Faint tonal veil improves text legibility and avoids a sticker-like hard edge.
  d=ImageDraw.Draw(im)
  d.rounded_rectangle((42,38,112,108),radius=16,fill=(20,24,42))
  draw_logo(im,45,41,64)
  d=ImageDraw.Draw(im)
  text(d,(126,46),"ROAMWISE",29,GOLD,True)
  text(d,(46,158),"Travel meets",52,IVORY,True)
  text(d,(46,221),"original art.",52,IVORY,True)
  d.line((49,296,238,296),fill=GOLD,width=5)
  text(d,(48,322),"Discover artists and Himalayan journeys",20,(224,215,236))
  text(d,(48,397),"Featuring Natasha Guleria",22,GOLD,True)
  im.save(OUT/"feature-graphic-1024x500.png",optimize=True)
def artist_social():
  W,H=1080,1920; im=gradient(W,H,(8,12,27),(35,21,48))
  d=ImageDraw.Draw(im)
  rounded_photo(im,PHOTO,(60,170,960,650),42)
  rounded_photo(im,ART,(60,1010,430,645),34)
  d=ImageDraw.Draw(im)
  draw_logo(im,70,54,84)
  text(d,(170,75),"ROAMWISE × ART",40,GOLD,True)
  text(d,(66,862),"Art meets travel",64,IVORY,True)
  text(d,(66,944),"Natasha Guleria",38,GOLD,True)
  text(d,(530,1100),"Original",43,IVORY,True)
  text(d,(530,1165),"Himalayan",43,IVORY,True)
  text(d,(530,1230),"artwork",43,IVORY,True)
  text(d,(530,1415),"Explore artist",29,GOLD,True)
  text(d,(530,1465),"profiles and",29,GOLD,True)
  text(d,(530,1515),"enquiries",29,GOLD,True)
  d.rounded_rectangle((60,1730,1020,1830),radius=30,outline=(168,139,89),width=3)
  text(d,(110,1751),"roamwise.co.in/creators/natasha.html",30,IVORY)
  im.save(OUT/"natasha-artist-social-1080x1920.png",optimize=True)
def screenshots():
  screen_dir=OUT/"raw-screens"
  for i,(name,caption) in enumerate([("ailon","AI travel planning"),("artists","Featured artists"),("weddings","Wedding packages"),("shop","Shop products")],1):
    p=screen_dir/(name+".png")
    if not p.is_file():continue
    img=Image.open(p).convert("RGB")
    # Exact pixels of the real browser viewport, resized for Play. No overlayed UI.
    if img.width==390 and img.height==694:
      img=img.resize((1080,1920),Image.Resampling.LANCZOS)
    else:img=ImageOps.fit(img,(1080,1920),method=Image.Resampling.LANCZOS)
    img.save(OUT/(f"phone-{i:02d}-{name}-1080x1920.png"),optimize=True)
def readme():
  (OUT/"README.txt").write_text("""RoamWise Play Console creative pack — 22 Nov 2026

feature-graphic-1024x500.png
  Google Play Feature Graphic (1024x500) made using the existing authorized RoamWise
  logo and repository Natasha Guleria photograph. Review image/model release rights before upload.

phone-01...04.png, where present
  ACTUAL public, unauthenticated live-app browser screenshots resized to 1080x1920.
  These are suitable for Play screenshots only after checking current APK parity
  and validating that every depicted feature is really present in the Android build.

natasha-artist-social-1080x1920.png
  Editorial/social promotional image, NOT a replacement for a Play phone screenshot.

No images in this pack prove a booking, a discount, or live availability.
Keep originals in repository and verify published artist endorsement permission.
""",encoding="utf-8")
if __name__=="__main__":
  if not PHOTO.exists() or not ART.exists() or not LOGO.exists():raise SystemExit("Expected existing repository art assets missing")
  feature();artist_social();screenshots();readme()
  for p in sorted(OUT.glob("*.png")):print(p.name,Image.open(p).size,p.stat().st_size)
