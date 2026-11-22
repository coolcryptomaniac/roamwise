#!/usr/bin/env python3
"""Create Qikink-upload candidate PNGs from original RoamWise SVG sources.

This does not validate the actual Qikink garment printing safe-area or
publish products. It generates review-only prepress candidates.
"""
import argparse
import io
import json
import pathlib
import re

TARGETS = {
    "back": (4500, 5400),    # 15 x 18 inches at 300 DPI (review template)
    "front": (1500, 1500),   # 5 x 5 inches (review template)
    "sleeve": (900, 4200),   # 3 x 14 inches (review template)
}


def convert(art_dir, out_dir, design_id, placements=("back", "front", "sleeve")):
    import cairosvg
    from PIL import Image

    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,45}", design_id):
        raise ValueError("Invalid design ID")
    art_dir, out_dir = pathlib.Path(art_dir), pathlib.Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    report = {
        "design_id": design_id,
        "dpi": 300,
        "files": [],
        "status": "candidate_not_supplier_approved",
    }
    for placement in placements:
        if placement not in TARGETS:
            raise ValueError("Unknown placement: " + str(placement))
        src = art_dir / (
            f"{design_id}.svg"
            if design_id.startswith("daily-") and placement == "back"
            else f"{design_id}-{placement}.svg"
        )
        if not src.is_file():
            raise FileNotFoundError(f"Missing {src}")
        source = src.read_bytes()
        if len(source) > 1_000_000 or b"<svg" not in source:
            raise ValueError("Invalid SVG source")
        if any(token in source.lower() for token in (
            b"<script", b"<foreignobject", b"onload=", b'href="http'
        )):
            raise ValueError("Disallowed SVG content")
        width, height = TARGETS[placement]
        png = cairosvg.svg2png(bytestring=source,
                               output_width=width,
                               output_height=height)
        image = Image.open(io.BytesIO(png)).convert("RGBA")
        if image.size != (width, height):
            raise AssertionError("Unexpected raster dimensions")
        if design_id.startswith("daily-"):
            nickname = "d" + design_id[-10:].replace("-", "")
        else:
            nickname = "rtr" if design_id == "rave-rise-buransh" else "rw"
        filename = f"{nickname}-{placement}.png"
        dest = out_dir / filename
        image.save(dest, format="PNG", dpi=(300, 300), optimize=True)
        with Image.open(dest) as exported:
            dpi = exported.info.get("dpi", (0, 0))
            if exported.mode != "RGBA" or min(dpi) < 298 or exported.size != (width, height):
                raise AssertionError("PNG not a 300 DPI RGBA source")
        if dest.stat().st_size > 25_000_000:
            raise ValueError("PNG exceeds 25 MB file limit: " + filename)
        report["files"].append({
            "source": src.name, "file": filename,
            "width_px": width, "height_px": height,
            "dpi": 300, "bytes": dest.stat().st_size,
            "physical_size_in": [width / 300, height / 300],
        })
    (out_dir / "manifest.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--art-dir", default="shop/img")
    parser.add_argument("--out-dir", default="build/merch-qikink-candidates")
    parser.add_argument("--design-id", default="rave-rise-buransh")
    parser.add_argument("--placements", nargs="+",
                        choices=list(TARGETS), default=None)
    args = parser.parse_args()
    placements = args.placements or (
        ("back",) if args.design_id.startswith("daily-")
        else tuple(TARGETS)
    )
    print(json.dumps(convert(args.art_dir, args.out_dir,
                             args.design_id, placements), indent=2))
