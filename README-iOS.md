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

## 3. Complete listing in App Store Connect

After build shows **Ready to Submit** (~10–30 min):

1. **App Store** tab → version **1.0**
2. **Build** → select build **1**
3. Fill required fields:

| Field | Value |
| --- | --- |
| Support URL | https://www.puzzleinteract.com/support/word_wheel_quest |
| Marketing URL | https://www.puzzleinteract.com/marketing/word_wheel_quest |
| Privacy Policy | https://www.puzzleinteract.com/legal/word_wheel_quest#privacy |
| Screenshots | iPhone 6.7" required (min 3) |
| Description | App description |
| Keywords | e.g. word, puzzle, wheel |
| Copyright | © 2026 Puzzle Interact |

4. **Add for Review**

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
