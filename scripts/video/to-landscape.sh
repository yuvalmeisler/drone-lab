#!/usr/bin/env bash
# Reframe a clip as 1280x720 landscape: the clip is centred at full height over a
# blurred, darkened fill of itself. Optionally burns in an .ass/.srt subtitle file
# laid out for the landscape frame (bottom centre, full width).
#
# usage: scripts/video/to-landscape.sh SRC OUT [SUBS.ass|SUBS.srt]
set -euo pipefail

SRC=${1:?source clip}
OUT=${2:?output file}
SUBS=${3:-}

SUBF=""
if [ -n "$SUBS" ]; then
  SUBF=",subtitles='$SUBS':force_style='FontName=Liberation Sans,Bold=1,Fontsize=18,Outline=1.3,Shadow=0.6,MarginV=17'"
fi

ffmpeg -v error -y -i "$SRC" -filter_complex "
  [0:v]split[a][b];
  [a]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,gblur=sigma=36,eq=brightness=-0.10:saturation=1.1[bg];
  [b]scale=-2:720:flags=lanczos,setsar=1[fg];
  [bg][fg]overlay=(W-w)/2:(H-h)/2$SUBF,format=yuv420p[v]" \
  -map "[v]" -map 0:a? -c:v libx264 -preset veryfast -crf 22 -profile:v high \
  -c:a aac -b:a 128k -movflags +faststart "$OUT"

echo "wrote $OUT"
