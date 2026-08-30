from pathlib import Path

root=Path(__file__).parent
catalog=root/'catalog.zlib.b64'
if not catalog.exists():
    chunks=sorted(root.glob('catalog.part*.txt'))
    if not chunks: raise SystemExit('Missing catalog source fragments')
    catalog.write_text(''.join(p.read_text(encoding='utf-8') for p in chunks),encoding='utf-8')
li=root/'overrides'/'data'/'local-intelligence.json'
if not li.exists():
    chunks=sorted((root/'overrides'/'data').glob('local-intelligence.part*.jsonfrag'))
    if not chunks: raise SystemExit('Missing local intelligence fragments')
    li.write_text(''.join(p.read_text(encoding='utf-8') for p in chunks),encoding='utf-8')
parts=sorted(root.glob('build_presets.part*.pyfrag'))
if not parts: raise SystemExit('Missing build preset source fragments')
source=''.join(x.read_text(encoding='utf-8') for x in parts)
exec(compile(source,'build_presets.generated.py','exec'),globals())
