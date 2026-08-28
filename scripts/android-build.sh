#!/usr/bin/env bash
#
# Native debug build + install via Expo. Clears a known-corrupt Gradle
# kotlin-dsl accessors cache first (common when disk is tight or Android
# Studio's Gradle daemon races with Expo's --configure-on-demand build).
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"

# Drop half-written kotlin-dsl metadata that breaks:
#   Error resolving plugin [id: 'com.facebook.react.settings']
#   Could not read workspace metadata from .../kotlin-dsl/.../metadata.bin
rm -rf "${HOME}/.gradle/caches/"*/kotlin-dsl
rm -rf "$ROOT/android/.gradle"

if [[ -x "$ROOT/android/gradlew" ]]; then
  (cd "$ROOT/android" && ./gradlew --stop >/dev/null 2>&1) || true
fi

exec npx expo run:android "$@"
