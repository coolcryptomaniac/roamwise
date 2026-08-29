from pathlib import Path
import os, shutil

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(os.environ.get('ROAMWISE_ITINERARY_OUT', str(ROOT / 'itinerary-library')))
SRC = Path(__file__).resolve().parent / 'overrides' / 'assets' / 'preset-carousel-v2.js'
DST = OUT / 'assets' / 'preset-carousel-v2.js'

DST.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(SRC, DST)

runtime_tag = '<script src="../../assets/preset-runtime.js"></script>'
v2_tag = '<script src="../../assets/preset-carousel-v2.js"></script>'
count = 0
for hp in sorted((OUT / 'presets').glob('*/*.html')):
    text = hp.read_text(encoding='utf-8')
    if v2_tag not in text:
        if runtime_tag not in text:
            raise RuntimeError(f'missing preset runtime tag: {hp}')
        text = text.replace(runtime_tag, runtime_tag + v2_tag, 1)
        hp.write_text(text, encoding='utf-8')
    count += 1

if count != 192:
    raise RuntimeError(f'expected 192 preset HTML files, found {count}')
if not DST.exists() or DST.stat().st_size < 1000:
    raise RuntimeError('preset-carousel-v2.js was not generated correctly')
print(f'Applied Cinematic preset carousel v2 to {count} HTML files')
