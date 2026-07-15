# Word Wheel Quest — first App Store upload

| Field | Value |
| --- | --- |
| Bundle ID | `com.puzint.wordwheel.app` |
| SKU | `wordwheel_quest_2026` |
| Apple ID | `6787691583` |
| App Store URL | https://apps.apple.com/app/id6787691583 |

## Architecture (not SwiftUI)

This app does **not** use SwiftUI for its UI.

| Layer | Technology |
| --- | --- |
| **App UI** | **React Native** (JavaScript) — `src/App.js`, `src/components/`, `src/screens/` |
| **Framework** | **Expo SDK 53** |
| **Native iOS shell** | **UIKit** — `ios/WordWheelQuest/AppDelegate.swift` hosts the React Native bridge |

Swift appears only in the thin Expo bootstrap (`AppDelegate.swift`, `UIWindow`, `ExpoAppDelegate`). Gameplay, navigation, shop, and styling are React components. Edit UI in the repo root `.js` files, then run `npm run ios:run` — no SwiftUI views to change in Xcode for normal feature work.

## In-app purchases (RevenueCat)

RevenueCat **default** offering — configured in `constants/store.js` with iOS API key. Purchases use `react-native-purchases` (no entitlement IDs).

| RevenueCat package | App Store product ID | Display name |
| --- | --- | --- |
| `coins_large` | `word_wheel_coins_large` | 1,000 Coins |
| `coins_small` | `word_wheel_coins_small` | 300 Coins |
| `bundle_master` | `word_wheel_pack_hard` | Master Quest |
| `bundle_classic` | `word_wheel_pack_medium` | Classic Challenge |
| `bundle_starter` | `word_wheel_pack_starter` | Starter Fun Bundle |

**In-app:** Play screen → ⚙ Settings → Shop (RevenueCat) or Help & legal (WebView with `?platform=app`).

After adding native modules (`react-native-purchases`, `react-native-webview`), rebuild native project:

```bash
npm run ios:run:sync
```

Legal WebView URLs (also in `constants/store.js`):

- Marketing: https://www.puzzleinteract.com/marketing/word_wheel_quest?platform=app
- Privacy: https://www.puzzleinteract.com/legal/word_wheel_quest#privacy?platform=app
- Terms: https://www.puzzleinteract.com/legal/word_wheel_quest#terms?platform=app
- Support: https://www.puzzleinteract.com/support/word_wheel_quest?platform=app

## 1. Generate native iOS project

```bash
cd /Users/syc/Puzzle-iOS/word-wheel-quest
npm install
npm run ios:build      # full clean prebuild (App Store / Xcode archive)
```

Simulator / device (first time or after `app.json` changes):

```bash
npm run ios:run:sync   # prebuild + pods + build + simulator
```

Daily dev (after native project exists):

```bash
open -a Simulator    # open simulator first
npm run ios:run        # build + install + launch (~5–15 min first time)
```

If `ios:run` looks stuck after pod install: it is compiling — wait for `› Compiling` lines, then the simulator opens.

Opens Xcode:

```bash
npm run ios:xcode
```

## 2. Archive in Xcode

1. Open **`ios/WordWheelQuest.xcworkspace`**
2. Select **Any iOS Device (arm64)** (not a simulator)
3. **Signing & Capabilities** → Team → enable **Automatically manage signing**
4. **Product → Archive**
5. **Distribute App → App Store Connect → Upload**

**Hermes dSYM warning (Xcode 16+):** If upload shows “Upload Symbols Failed” for `hermes.framework`, clean and re-archive. The project includes a **Generate Hermes dSYM** build phase (after Embed Pods Frameworks) that creates the missing symbols file automatically.

First upload: build number **1**, version **1.0.0**.

## 3. Upload App Store metadata (Fastlane)

Metadata lives in `ios/fastlane/metadata/` (description, keywords, promotional text, URLs).

**Promotional text not showing?**
- In **App Store Connect**: App → **Distribution** → **iOS App** → version **1.0** → click **English (Canada)** under **App Store Version Information** (primary locale — not App Information).
- On **apps.apple.com**: promotional text only appears after the app is **live** — not on a pre-release preview.
- Debug: `cd ios && set -a && . ./fastlane/asc_api_key.env && set +a && fastlane verify_metadata` — prints what ASC actually stored.
- Re-run `npm run metadata:ios` — upload now verifies promotional text saved and fails loudly if not.

### Troubleshooting metadata upload

**`No data` on first upload** — fastlane deliver crashes when App Review contact does not exist yet in App Store Connect. This project pre-creates it automatically; you still need `asc_review_contact.env` with real contact info. If it persists, upload one build from Xcode first so version `1.0.0` exists in ASC.

**Phone number in env file** — quote values with spaces: `ASC_REVIEW_PHONE="+1 514 661 0394"`

### One-time setup

```bash
# API key (Issuer ID already set in asc_api_key.env)
# Edit ios/fastlane/asc_api_key.env if needed

# App Review contact — REQUIRED (fixes fastlane "No data" on first upload)
cp ios/fastlane/asc_review_contact.env.example ios/fastlane/asc_review_contact.env
# Edit: first name, last name, email, phone with country code (+1 ...)

npm run fastlane:install   # Homebrew fastlane (no Bundler / no sudo)
```

### Upload text only

```bash
npm run metadata:ios
```

### Upload text + screenshots

Add PNGs under `ios/fastlane/screenshots/en-CA/` (primary locale; see `screenshots/README.txt`), then:

```bash
npm run ios:upload:metadata
```

### Metadata summary (en-CA — primary locale)

| Field | Content |
| --- | --- |
| **Name** | Word Wheel Quest |
| **Subtitle** | Simple, Relaxing Word Connect |
| **Promotional text** | Spin the wheel, connect the letters… |
| **Keywords** | word,crossword,wheel,puzzle,vocabulary,brain,clues,grid,spelling,wordgame,teatime,relax |
| **Category** | Games / Word |
| **Privacy URL** | https://www.puzzleinteract.com/legal/word_wheel_quest#privacy |

Edit files in `ios/fastlane/metadata/en-CA/` and re-run `npm run metadata:ios`.

## 4. Complete listing in App Store Connect

After build shows **Ready to Submit** (~10–30 min):

1. **App Store** tab → version **1.0**
2. **Build** → select your uploaded build
3. Confirm metadata uploaded (or fill any remaining fields)
4. **Privacy Policy URL**: https://www.puzzleinteract.com/legal/word_wheel_quest#privacy
5. **Add for Review**

## Re-upload (new binary)

Bump in `app.json` → `ios.buildNumber` (2, 3, …), then:

```bash
npm run ios:build
```

Clean → Archive → Upload in Xcode.

## Clean build files

```bash
npm run clean            # ios/build, metro cache, .expo
npm run ios:clean-cache  # + Pods, Podfile.lock, simulator reset
npm run clean:all      # both
```

Then rebuild: `npm run ios:run` or `npm run ios:build`

## Hermes dSYM warning

If upload completes with a Hermes dSYM **warning**, the upload still succeeded — safe to continue.
