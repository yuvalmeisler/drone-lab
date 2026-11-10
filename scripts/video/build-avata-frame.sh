#!/usr/bin/env bash
# Merge the three AVATA frame-disassembly clips into one video with
# premium xfade transitions + a violet flower-bloom overlay at each cut.
#
# usage: scripts/video/build-avata-frame.sh SRC_DIR OUT_FILE
#   SRC_DIR must contain frame-1.mp4, frame-2.mp4, frame-3.mp4
set -euo pipefail

SRC=${1:?source dir}
OUT=${2:?output file}
HERE=$(cd "$(dirname "$0")" && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

W=1280; H=720; FPS=30
DA=0.7                     # cut 1 transition (clip 1 is a short establishing shot)
DB=1.2                     # cut 2 transition
HOLD=0.8                   # freeze the end of clip 1 so it reads before the cut
NFA=$(python3 -c "print(round($DA*$FPS))")
NFB=$(python3 -c "print(round($DB*$FPS))")

# 1) normalise every clip to 1280x720 (landscape) @30fps; portrait clips get a blurred fill
for i in 1 2 3; do
  PAD=""; APAD=""
  if [ "$i" = 1 ]; then PAD=",tpad=stop_mode=clone:stop_duration=$HOLD"; APAD=",apad=pad_dur=$HOLD"; fi
  ffmpeg -v error -y -i "$SRC/frame-$i.mp4" -filter_complex "
    [0:v]fps=$FPS$PAD,split[a][b];
    [a]scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,gblur=sigma=40,eq=brightness=-0.08:saturation=1.15[bg];
    [b]scale=$W:$H:force_original_aspect_ratio=decrease,setsar=1[fg];
    [bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v];
    [0:a]aresample=48000,aformat=channel_layouts=stereo$APAD[a0]" \
    -map "[v]" -map "[a0]" -shortest -c:v libx264 -crf 16 -preset veryfast -c:a aac -b:a 160k "$WORK/n$i.mp4"
done

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
D1=$(dur "$WORK/n1.mp4"); D2=$(dur "$WORK/n2.mp4"); D3=$(dur "$WORK/n3.mp4")
O1=$(python3 -c "print(round($D1-$DA,3))")
O2=$(python3 -c "print(round($O1+$D2-$DB,3))")
TOTAL=$(python3 -c "print(round($O2+$D3,3))")

# 2) flower bloom overlays in the AVATA violet palette
python3 -I "$HERE/flower_overlay.py" "$WORK/fl1" --w $W --h $H --frames "$NFA" --seed 5 --palette avata
python3 -I "$HERE/flower_overlay.py" "$WORK/fl2" --w $W --h $H --frames "$NFB" --seed 17 --palette avata

# 3) composite: xfade (circleopen, then radial) + flower on top + audio crossfades
ffmpeg -v error -y \
  -i "$WORK/n1.mp4" -i "$WORK/n2.mp4" -i "$WORK/n3.mp4" \
  -framerate $FPS -i "$WORK/fl1/f%03d.png" \
  -framerate $FPS -i "$WORK/fl2/f%03d.png" \
  -filter_complex "
    [0:v][1:v]xfade=transition=circleopen:duration=$DA:offset=$O1[x1];
    [x1][2:v]xfade=transition=radial:duration=$DB:offset=$O2[x2];
    [3:v]format=rgba,setpts=PTS-STARTPTS+$O1/TB[f1];
    [4:v]format=rgba,setpts=PTS-STARTPTS+$O2/TB[f2];
    [x2][f1]overlay=eof_action=pass[o1];
    [o1][f2]overlay=eof_action=pass,
      fade=t=in:st=0:d=0.4,fade=t=out:st=$(python3 -c "print($TOTAL-0.6)"):d=0.6,format=yuv420p[v];
    [0:a][1:a]acrossfade=d=$DA:c1=tri:c2=tri[a1];
    [a1][2:a]acrossfade=d=$DB:c1=tri:c2=tri,
      afade=t=in:st=0:d=0.4,afade=t=out:st=$(python3 -c "print($TOTAL-0.6)"):d=0.6[a]" \
  -map "[v]" -map "[a]" -r $FPS -c:v libx264 -crf 22 -preset slow -profile:v high \
  -c:a aac -b:a 128k -movflags +faststart "$OUT"

echo "wrote $OUT (${TOTAL}s; cuts at ${O1}s and ${O2}s)"
