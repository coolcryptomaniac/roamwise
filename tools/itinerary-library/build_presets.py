from pathlib import Path

parts = sorted(Path(__file__).with_name(p.name) for p in Path(__file__).parent.glob("build_presets.part*.pyfrag"))
if not parts:
    raise SystemExit("Missing build_presets.part*.pyfrag source chunks")
source = "".join(p.read_text(encoding="utf-8") for p in parts)
exec(compile(source, "build_presets.generated.py", "exec"), globals())
