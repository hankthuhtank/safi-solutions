#!/usr/bin/env bash
# Builds seamless video loops for Vibey's moving-water and storm scenes.
#
#   scripts/build-video.sh <work-dir> [key ...]
#
# Each loop is cut from the source, then its last seconds are cross-faded into its first so the
# end flows straight back into the start. Outputs (per variation, in media/scenes/<scene>/<id>/):
#   loop-av1.mp4   AV1, up to 2560 wide   (Chrome, Edge, Firefox; Safari on AV1 hardware)
#   loop-hevc.mp4  HEVC, up to 1920 wide  (Safari on everything else)
#   loop-h264.mp4  H.264 Main, up to 1920 wide (older browsers and TVs)
#   poster.webp / thumb.webp, and <work>/video/<key>-frame.jpg (first frame)
# A browser that plays none gets the poster as a still scene.
set -euo pipefail
cd "$(dirname "$0")/.."
WORK=${1:?work dir}
shift || true
ONLY=("$@")
mkdir -p "$WORK/video"

# key | source url | start s | loop length s | crossfade s | out fps | max width | AV1 crf (HEVC crf = AV1 - 10)
LOOPS=$(cat <<'EOF'
ocean/tropical|https://videos.pexels.com/video-files/36301470/15394038_3840_2160_30fps.mp4|0.5|14|2.5|24|2560
ocean/surf|https://videos.pexels.com/video-files/3009253/3009253-uhd_3840_2160_30fps.mp4|2|16|3|24|2560
ocean/dawn|https://videos.pexels.com/video-files/5288655/5288655-hd_1920_1080_25fps.mp4|1|14|2.5|25|1920
waterfall/pool|https://videos.pexels.com/video-files/37669693/15969766_3840_2160_50fps.mp4|2|10|2|25|1920|44
waterfall/cascade|https://videos.pexels.com/video-files/5527622/5527622-uhd_3840_2160_30fps.mp4|2|12|2|24|1920|41
storm-sea/cell|https://videos.pexels.com/video-files/38083685/16169365_3840_2160_30fps.mp4|3|18|3|24|2560
storm-sea/buoy|https://videos.pexels.com/video-files/32844046/13998920_1920_1080_24fps.mp4|0.5|8.5|1.5|24|1920
EOF
)

want() {
  [ ${#ONLY[@]} -eq 0 ] && return 0
  for k in "${ONLY[@]}"; do [ "$k" = "$1" ] && return 0; done
  return 1
}

while IFS='|' read -r key url start len fade fps maxw crf; do
  crf=${crf:-38}
  [ -z "$key" ] && continue
  want "$key" || continue
  out="media/scenes/$key"
  mkdir -p "$out"
  seg="$WORK/video/${key//\//__}-seg.mp4"
  total=$(python3 -c "print($len + $fade)")
  if [ ! -f "$seg" ]; then
    ffmpeg -nostdin -loglevel error -y -ss "$start" -t "$total" -i "$url" -an -c:v libx264 -preset veryfast -crf 12 -pix_fmt yuv420p "$seg"
  fi
  offset=$(python3 -c "print($len - $fade)")
  # cut [fade, len+fade) as the body and cross-fade the first `fade` seconds over its tail
  loopgraph() {
    echo "[0:v]fps=$fps,scale='min($1,iw)':-2:flags=lanczos,split[a][b];[a]trim=start=$fade:end=$total,setpts=PTS-STARTPTS[main];[b]trim=start=0:end=$fade,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=$fade:offset=$offset,format=yuv420p[v]"
  }
  gop=$((fps * 4))
  ffmpeg -nostdin -loglevel error -y -i "$seg" -filter_complex "$(loopgraph "$maxw")" -map "[v]" -an \
    -c:v libsvtav1 -preset 5 -crf "$crf" -g "$gop" -svtav1-params tune=0 -movflags +faststart "$out/loop-av1.mp4"
  ffmpeg -nostdin -loglevel error -y -i "$seg" -filter_complex "$(loopgraph 1920)" -map "[v]" -an \
    -c:v libx265 -preset medium -crf "$((crf - 10))" -tag:v hvc1 -x265-params "keyint=$gop:min-keyint=$gop:log-level=error" \
    -movflags +faststart "$out/loop-hevc.mp4"
  ffmpeg -nostdin -loglevel error -y -i "$out/loop-av1.mp4" -an \
    -vf "scale='min(1920,iw)':-2:flags=lanczos,fps=30" \
    -c:v libx264 -preset fast -crf 24 -profile:v main -level:v 4.0 -pix_fmt yuv420p \
    -movflags +faststart "$out/loop-h264.mp4"
  frame="$WORK/video/${key//\//__}-frame.jpg"
  ffmpeg -nostdin -loglevel error -y -ss "$fade" -i "$seg" -frames:v 1 -vf "scale='min(3840,iw)':-2:flags=lanczos" -q:v 2 "$frame"
  node -e "
    const sharp = require('sharp');
    const f = process.argv[1], out = process.argv[2];
    Promise.all([
      sharp(f).resize(1920, 1080, { fit: 'cover' }).webp({ quality: 82 }).toFile(out + '/poster.webp'),
      sharp(f).resize(640, 360, { fit: 'cover' }).webp({ quality: 78 }).toFile(out + '/thumb.webp'),
    ]);
  " "$frame" "$out"
  printf '%s  av1 %s  hevc %s\n' "$key" "$(du -h "$out/loop-av1.mp4" | cut -f1)" "$(du -h "$out/loop-hevc.mp4" | cut -f1)"
done <<< "$LOOPS"

# the hearth fire composited into fireplace openings: flames on black, cropped tight
if want fx/fire; then
  mkdir -p media/fx
  seg="$WORK/video/fire-seg.mp4"
  [ -f "$seg" ] || ffmpeg -nostdin -loglevel error -y -ss 4 -t 12 -i "https://videos.pexels.com/video-files/26583810/11964989_3840_2160_24fps.mp4" -an -c:v libx264 -preset veryfast -crf 12 -pix_fmt yuv420p "$seg"
  fire="fps=24,crop=2120:1560:920:120,scale=640:472:flags=lanczos,eq=brightness=-0.05:contrast=1.35:saturation=1.15"
  graph="[0:v]$fire,split[a][b];[a]trim=start=1.5:end=12,setpts=PTS-STARTPTS[main];[b]trim=start=0:end=1.5,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=1.5:offset=9,format=yuv420p[v]"
  ffmpeg -nostdin -loglevel error -y -i "$seg" -filter_complex "$graph" -map "[v]" -an -c:v libsvtav1 -preset 5 -crf 34 -movflags +faststart media/fx/fire-av1.mp4
  ffmpeg -nostdin -loglevel error -y -i "$seg" -filter_complex "$graph" -map "[v]" -an -c:v libx264 -preset slow -crf 22 -profile:v high -movflags +faststart media/fx/fire-h264.mp4
  printf 'fx/fire  av1 %s  h264 %s\n' "$(du -h media/fx/fire-av1.mp4 | cut -f1)" "$(du -h media/fx/fire-h264.mp4 | cut -f1)"
fi
