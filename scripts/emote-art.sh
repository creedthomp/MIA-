#!/usr/bin/env bash
# Emote art ingest — for externally produced art (AI-generated or illustrated).
# Raw image → 512x512 transparent PNG in assets/emotes/<voice>/.
#
# The shipping art is generated instead: scripts/emote-art/generate.mjs. Use this
# only when replacing it with painted art per docs/emote-art-brief.md.
#
#   VOICE=male scripts/emote-art.sh <file> <emote-id>   # one image
#   VOICE=male scripts/emote-art.sh --batch <dir>       # every <emote-id>*.png|jpg
#   VOICE=male scripts/emote-art.sh --sheet             # 64px squint-test sheet
#
# VOICE is female or male (which character the art is for); defaults to male.
#
# Keys out a flat background (green by default), trims the transparent border,
# centers on a square canvas with 8% padding, and resizes to 512x512. Images that
# already have real alpha skip the key step. Needs ffmpeg only.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOICE="${VOICE:-male}"
[[ "$VOICE" == "female" || "$VOICE" == "male" ]] || { echo "error: VOICE must be female or male" >&2; exit 1; }
OUT_DIR="$ROOT/assets/emotes/$VOICE"
SHEET="$ROOT/docs/art-ref/emote-contact-sheet-$VOICE.png"

SIZE=512
KEY_COLOR="${KEY_COLOR:-0x00FF00}"
SIMILARITY="${SIMILARITY:-0.30}"
BLEND="${BLEND:-0.08}"

IDS=(objection boo cheer cry think trust erm noway pain laugh sweat idle scream
     attack watching clown mia gg salty slow crown)

die() { echo "error: $*" >&2; exit 1; }

command -v ffmpeg >/dev/null || die "ffmpeg not found"

# True if the image carries a non-opaque alpha channel already.
has_alpha() {
  local fmt
  fmt="$(ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 "$1" | head -1)"
  [[ "$fmt" == *a* ]] || [[ "$fmt" == *rgba* ]] || [[ "$fmt" == *ya* ]]
}

process() {
  local src="$1" id="$2"
  [[ -f "$src" ]] || die "no such file: $src"
  mkdir -p "$OUT_DIR"

  local key_step=""
  if has_alpha "$src"; then
    echo "  (already has alpha — skipping colorkey)"
  else
    key_step="colorkey=${KEY_COLOR}:${SIMILARITY}:${BLEND},"
  fi

  # Pass 1 — find the character's bounding box. alphaextract turns the keyed
  # alpha into luma (transparent = black) so cropdetect can find the content.
  # cropdetect skips its first frames, so the still is looped a few times.
  local crop
  crop="$(ffmpeg -v info -loop 1 -i "$src" -vf \
    "format=rgba,${key_step}alphaextract,cropdetect=limit=0.05:round=2:skip=0" \
    -frames:v 3 -f null - 2>&1 | grep -o 'crop=[0-9:]*' | tail -1 || true)"

  local crop_step=""
  if [[ -n "$crop" ]]; then
    crop_step="${crop},"
  else
    echo "  (no bounding box detected — keeping full frame)"
  fi

  # Pass 2 — key → trim to the character → fit into 84% of the canvas → pad square.
  ffmpeg -y -v error -i "$src" -vf \
"format=rgba,${key_step}${crop_step}\
scale=w=${SIZE}*0.84:h=${SIZE}*0.84:force_original_aspect_ratio=decrease,\
pad=${SIZE}:${SIZE}:(ow-iw)/2:(oh-ih)/2:color=#00000000" \
    -frames:v 1 "$OUT_DIR/$id.png"

  echo "  → assets/emotes/$VOICE/$id.png"
}

case "${1:-}" in
  --batch)
    dir="${2:-}"
    [[ -d "$dir" ]] || die "usage: $0 --batch <dir>"
    found=0
    for id in "${IDS[@]}"; do
      # First match wins: <id>.png, <id>-v2.png, <id>_final.jpg, …
      src="$(find "$dir" -maxdepth 1 -type f \
        \( -iname "$id.png" -o -iname "$id.jpg" -o -iname "$id.jpeg" -o -iname "$id.webp" \
           -o -iname "$id-*" -o -iname "${id}_*" \) 2>/dev/null | sort | head -1)"
      if [[ -n "$src" ]]; then
        echo "$id: $(basename "$src")"
        process "$src" "$id"
        found=$((found + 1))
      fi
    done
    echo
    echo "processed $found/${#IDS[@]} emotes"
    missing=()
    for id in "${IDS[@]}"; do [[ -f "$OUT_DIR/$id.png" ]] || missing+=("$id"); done
    [[ ${#missing[@]} -gt 0 ]] && echo "still missing: ${missing[*]}"
    ;;

  --sheet)
    mkdir -p "$(dirname "$SHEET")"
    files=()
    for id in "${IDS[@]}"; do [[ -f "$OUT_DIR/$id.png" ]] && files+=("$OUT_DIR/$id.png"); done
    [[ ${#files[@]} -gt 0 ]] || die "no art in assets/emotes/$VOICE/ yet"

    # Each emote at its real in-game size (64px) on the app's dark surface —
    # if it doesn't read here, it won't read in game.
    args=(); filter=""
    for i in "${!files[@]}"; do
      args+=(-i "${files[$i]}")
      filter+="[$i:v]scale=64:64[e$i];"
    done
    cols=7
    rows=$(( (${#files[@]} + cols - 1) / cols ))
    filter+="color=c=#1b1a1a:s=$((cols * 80))x$((rows * 80))[bg];"
    prev="bg"
    for i in "${!files[@]}"; do
      x=$(( (i % cols) * 80 + 8 )); y=$(( (i / cols) * 80 + 8 ))
      filter+="[$prev][e$i]overlay=$x:$y[o$i];"
      prev="o$i"
    done
    filter="${filter%;}"
    ffmpeg -y -v error "${args[@]}" -filter_complex "$filter" -map "[$prev]" -frames:v 1 "$SHEET"
    echo "contact sheet (${#files[@]} emotes at 64px): docs/art-ref/$(basename "$SHEET")"
    ;;

  "" | -h | --help)
    sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
    ;;

  *)
    id="${2:-}"
    [[ -n "$id" ]] || die "usage: $0 <file> <emote-id>"
    printf '%s\n' "${IDS[@]}" | grep -qx "$id" || die "unknown emote id: $id"
    echo "$id: $(basename "$1")"
    process "$1" "$id"
    ;;
esac
