#!/usr/bin/env bash
# Encode the rendered intro frames (tools/blender/intro.py) for the web.
#   tools/blender/encode-intro.sh /tmp/gavana-intro
# → public/intro/gavana-intro.webm (VP9), .mp4 (H.264 for Safari), -poster.jpg (last frame)
set -euo pipefail
IN="${1:-/tmp/gavana-intro}"
OUT="$(cd "$(dirname "$0")/../.." && pwd)/public/intro"
mkdir -p "$OUT"
# A soft vignette like the canvas version; frames are 30 fps.
VF="vignette=angle=PI/4.6"
ffmpeg -loglevel error -y -framerate 30 -i "$IN/f_%04d.png" -vf "$VF,format=yuv420p" \
  -c:v libx264 -preset slow -crf 24 -movflags +faststart -an "$OUT/gavana-intro.mp4"
ffmpeg -loglevel error -y -framerate 30 -i "$IN/f_%04d.png" -vf "$VF,format=yuv420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -deadline good -an "$OUT/gavana-intro.webm"
LAST="$(ls "$IN"/f_*.png | sort | tail -1)"
ffmpeg -loglevel error -y -i "$LAST" -vf "$VF" -q:v 4 "$OUT/gavana-intro-poster.jpg"
ls -la "$OUT"
