#!/bin/sh
# Generate hermes.framework.dSYM for App Store upload (Xcode 16+).
# Runs after [CP] Embed Pods Frameworks so the linked binary UUID matches the archive.

set -euo pipefail

if [ "${CONFIGURATION:-}" != "Release" ]; then
  exit 0
fi

HERMES_BIN="${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/hermes.framework/hermes"
HERMES_DSYM="${DWARF_DSYM_FOLDER_PATH}/hermes.framework.dSYM"

if [ ! -e "$HERMES_BIN" ]; then
  HERMES_BIN="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework/ios-arm64/hermes.framework/hermes"
fi

if [ -e "$HERMES_BIN" ] && [ ! -e "$HERMES_DSYM" ]; then
  echo "Generating dSYM for Hermes at ${HERMES_DSYM}"
  /usr/bin/dsymutil "$HERMES_BIN" -o "$HERMES_DSYM"
fi
