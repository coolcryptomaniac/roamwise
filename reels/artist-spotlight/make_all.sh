#!/bin/bash
# Usage: make_all.sh <outdir>   -> one mp4 per artist in creators/artists-data.json
set -e; OUT=${1:-out}; mkdir -p "$OUT"; cd "$(dirname "$0")"
for id in $(python3 -c "import json;print(' '.join(a['id'] for a in json.load(open('../../creators/artists-data.json'))['artists']))"); do
  F="$OUT/frames-$id"; rm -rf "$F"
  python3 build_artist.py "$id" "$F" >/dev/null
  python3 audio_artist.py "$OUT/$id.wav" "$F/timeline.json" >/dev/null
  ffmpeg -y -loglevel error -framerate 30 -i "$F/f%05d.jpg" -i "$OUT/$id.wav" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart "$OUT/roamwise-artist-$id.mp4"
  rm -rf "$F" "$OUT/$id.wav"; echo "done $id"
done
