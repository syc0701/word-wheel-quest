#!/usr/bin/env bash
# Sync Play Store listing text from .github → fastlane (images stay in fastlane).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.github/play-store/android"
DST="$ROOT/fastlane/metadata/android"

if [[ ! -d "$SRC" ]]; then
  echo "Missing source: $SRC" >&2
  exit 1
fi

mkdir -p "$DST"
# Drop previous synced text only (never touch images/).
find "$DST" -type f -name '*.txt' -delete
find "$DST" -type d -name changelogs -empty -delete 2>/dev/null || true

rsync -a \
  --include='*/' \
  --include='*.txt' \
  --exclude='*' \
  "$SRC/" "$DST/"

echo "Synced Play Store text: .github/play-store/android → fastlane/metadata/android"
