#!/usr/bin/env bash
#
# Day-to-day dev launcher: starts Metro and opens the already-installed debug
# build against it. Run `npm run android:build` first if the app isn't installed
# yet, or after native dependencies change.
#
set -euo pipefail

PACKAGE="com.puzint.wordwheel.app"
PORT="${RCT_METRO_PORT:-8081}"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"

if ! adb get-state >/dev/null 2>&1; then
  echo "No device/emulator detected. Start one with: npm run android:emulator"
  exit 1
fi

adb wait-for-device

# A dozing emulator accepts the launch intent and silently drops it, which looks
# exactly like the app failing to start.
adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
adb shell wm dismiss-keyguard >/dev/null 2>&1 || true

if ! adb shell pm list packages 2>/dev/null | grep -q "$PACKAGE"; then
  echo "$PACKAGE is not installed. Run: npm run android:build"
  exit 1
fi

# The debug build fetches index.android.bundle over this reverse tunnel.
adb reverse "tcp:$PORT" "tcp:$PORT" >/dev/null 2>&1 || true

# Launching before Metro listens yields the red "Unable to load script" screen,
# so hold the intent until the port is accepting connections. Runs in the
# background to keep Metro's interactive terminal on the foreground stdin.
(
  for _ in $(seq 1 90); do
    if nc -z localhost "$PORT" >/dev/null 2>&1; then
      adb shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
      exit 0
    fi
    sleep 1
  done
  echo "Metro did not come up on port $PORT; launch the app manually."
) &

exec npx expo start
