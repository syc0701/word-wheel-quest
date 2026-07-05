# Word Wheel Quest — first App Store upload

| Field | Value |
| --- | --- |
| Bundle ID | `com.puzint.wordwheel.app` |
| SKU | `wordwheel_quest_2026` |
| Apple ID | `6787691583` |
| App Store URL | https://apps.apple.com/app/id6787691583 |

## 1. Generate native iOS project

```bash
cd /Users/syc/Puzzle-iOS/word-wheel-quest
npm install
npm run build:ios      # full clean prebuild (App Store / Xcode archive)
```

Simulator / device (first time or after `app.json` changes):

```bash
npm run run:ios:sync   # prebuild + pods + build + simulator
```

Daily dev (after native project exists):

```bash
open -a Simulator    # open simulator first
npm run run:ios        # build + install + launch (~5–15 min first time)
```

If `run:ios` looks stuck after pod install: it is compiling — wait for `› Compiling` lines, then the simulator opens.

Opens Xcode:

```bash
npm run xcode:ios
```

## 2. Archive in Xcode

1. Open **`ios/WordWheelQuest.xcworkspace`**
2. Select **Any iOS Device (arm64)** (not a simulator)
3. **Signing & Capabilities** → Team → enable **Automatically manage signing**
4. **Product → Archive**
5. **Distribute App → App Store Connect → Upload**

First upload: build number **1**, version **1.0.0**.

## 3. Upload App Store metadata (Fastlane)

Metadata lives in `ios/fastlane/metadata/` (description, keywords, promotional text, URLs).

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

npm run fastlane:install
```

### Upload text only

```bash
npm run metadata:ios
```

### Upload text + screenshots

Add PNGs under `ios/fastlane/screenshots/en-US/` (see `screenshots/README.txt`), then:

```bash
npm run upload:ios:metadata
```

### Metadata summary (en-US)

| Field | Content |
| --- | --- |
| **Name** | Word Wheel Quest |
| **Subtitle** | Crossword Meets Word Wheel |
| **Promotional text** | Swipe the letter wheel to spell answers into themed crossword grids… |
| **Keywords** | word,crossword,wheel,puzzle,vocabulary,brain,clues,grid,spelling,wordgame,teatime,relax |
| **Category** | Games / Word |
| **Privacy URL** | Set in App Store Connect → App Information |

Edit files in `ios/fastlane/metadata/en-US/` and re-run `npm run metadata:ios`.

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
npm run build:ios
```

Clean → Archive → Upload in Xcode.

## Clean build files

```bash
npm run clean            # ios/build, metro cache, .expo
npm run clean:ios-cache  # + Pods, Podfile.lock, simulator reset
npm run clean:all      # both
```

Then rebuild: `npm run run:ios` or `npm run build:ios`

## Hermes dSYM warning

If upload completes with a Hermes dSYM **warning**, the upload still succeeded — safe to continue.
