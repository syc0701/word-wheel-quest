# Word Wheel Quest — Android / Google Play

| Field | Value |
| --- | --- |
| Package name | `com.puzint.wordwheel.app` |
| versionName | `1.0.0` |
| versionCode | `3` |
| Play Store URL | https://play.google.com/store/apps/details?id=com.puzint.wordwheel.app |

## Architecture

| Layer | Technology |
| --- | --- |
| **App UI** | **React Native** (JavaScript) — `src/App.js`, `src/components/`, `src/screens/` |
| **Framework** | **Expo SDK 53** |
| **Native Android shell** | Generated under `android/` via `expo prebuild` |

Gameplay, navigation, shop, and styling are React components. Edit UI in the repo root `.js` files, then run `npm run android:run`.

## Sign-in

Email + password via AWS Cognito (same mobile app client as iOS). **Sign in with Google** uses the native Android account picker (`@react-native-google-signin/google-signin`), then exchanges the Google ID token at `POST /google-native-cognito`. Sign in with Apple is **not** included on Android.

Native Google Sign-In needs an **Android OAuth client** in the same Google Cloud project as the web client (`845957927924-3335s7vnvg2s92s620sor0e6t957kbvf`) for package `com.puzint.wordwheel.app`, with:

- Local debug/release signing (`android/app/debug.keystore`): `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- Play App Signing SHA-1 (from Play Console → App integrity) for store builds

After adding `@react-native-google-signin/google-signin`, rebuild native code (`npm run android:build`). Metro reload is not enough.

## In-app purchases (RevenueCat)

1. Create matching in-app products in Google Play Console (same product IDs as below), or run:
   `python3 scripts/create-play-iap-products.py` (uses `fastlane/play-store-service-account.json`).
2. In RevenueCat → **Products**, import / attach the Google Play store products to the existing packages (same IDs as iOS).
3. Attach the Google Play app in RevenueCat and copy the **Google** public SDK key (`goog_…`).
4. Set it in `src/constants/store.js` → `REVENUECAT_API_KEY`.

| RevenueCat package | Play product ID | Display name | USD |
| --- | --- | --- | --- |
| `coins_large` | `word_wheel_coins_large` | 1,000 Coins | $2.49 |
| `coins_small` | `word_wheel_coins_small` | 300 Coins | $0.99 |
| `bundle_master` | `word_wheel_pack_hard` | Master Quest | $2.99 |
| `bundle_classic` | `word_wheel_pack_medium` | Classic Challenge | $1.99 |
| `bundle_starter` | `word_wheel_pack_starter` | Starter Fun Bundle | $3.99 |

Purchases use `react-native-purchases`. Restore lives under Settings → Account.

## Run

```bash
npm install
npm run android:prebuild   # generates android/ (first time / after native dep changes)
npm run android:studio     # sync native project + open Android Studio
npm run android:studio:open # open Studio only (skip prebuild)
npm run android:build      # native rebuild + install (when native deps change)
npm run android:run        # starts Metro and opens the app (day-to-day)
```

Debug builds need Metro (`npm run android:run` or `npm start`). Opening the app from Android Studio alone without Metro causes the red “Unable to load script” screen.

`android:studio` only syncs the native project and opens Studio — it does **not** build, install, or launch the app. To actually start the app use `android:run` (app already installed) or `android:build` (first run / native deps changed).

If the app seems not to launch, check the emulator is awake — a sleeping emulator swallows the launch intent silently. `android:run` now sends `KEYCODE_WAKEUP` and dismisses the keyguard first.

Release build:

```bash
npm run android:run:release
```

Open in Android Studio:

```bash
npm run android:studio
```

Studio opens the `android/` folder, but Git lives at the **repo root**. If the Git menu says the folder has no repository: **Settings → Version Control → Directory Mappings** → map `/Users/syc/Puzzle-Andriod/word-wheel-quest` to Git (already set in `android/.idea/vcs.xml`), then restart Studio.

### Shared Maven / Gradle (all Android projects on this Mac)

Repos use official Google + Maven Central (+ JitPack). Machine-wide config:

- `~/.gradle/init.d/shared-repos.gradle` — shared Maven repos
- `~/.gradle/gradle.properties` — shared JVM / cache settings

Project `android/build.gradle` already lists the same repos (`google()`, `mavenCentral()`, JitPack, plus the local React Native Maven dir). If Studio says “No space left on device” while downloading libraries, free disk first — Maven settings are fine; the failure is ENOSPC.

## Signing

Configure a release keystore for Play uploads (do not commit keystores). Typical locations:

- `android/keystore.properties` (gitignored locally)
- Play App Signing in Play Console

> ⚠️ `android/app/build.gradle` currently signs the `release` build with the **debug** keystore. Google Play will reject a debug-signed upload — create a real upload keystore and point the `release` `signingConfig` at it before running the upload lanes below.

## Play Integrity

Release builds gate credit IAP verify and credit consume behind Google Play Integrity, verified by puzzle-be (`POST /home/android/security/verify-integrity`). See `Puzzle-iOS/puzzle-be/docs/android-play-integrity.md`.

| Client | Value |
| --- | --- |
| `appCode` | `word_wheel_quest` |
| `packageName` | `com.puzint.wordwheel.app` |
| Native module | `modules/play-integrity` (Expo local module) |

Debug (`__DEV__`) builds skip the check. Production requires a Play Store install with Play Integrity enabled in Play Console → App integrity.

After adding the module:

```bash
npm install
npm run android:prebuild   # or android:run — autolinks play-integrity
```

## Fastlane (Play Store metadata)

Fastlane lives at the **repo root** (not under `android/`) so `expo prebuild --clean` / `npm run android:studio` does not delete it.

- **Service account key**: `fastlane/play-store-service-account.json` (gitignored)
- **Listing text (source of truth)**: `.github/play-store/android/<locale>/`
- **Images / screenshots**: `fastlane/metadata/android/<locale>/images/`
- Text is synced into `fastlane/metadata` before upload via `npm run metadata:sync`

```bash
bundle install                # first time / after Gemfile changes
npm run screenshots           # phone + 7" + 10" tablet /01–/08 for all 10 langs
npm run screenshots:upload    # capture + upload listing / screenshots to Play
# Optional: SCREENSHOT_DEVICES=tenInch  or  SNAPSHOT_LANGUAGES=en-US,ko-KR
npm run metadata:upload       # sync text from .github, then upload listing / images
```

## Backend notes

Shop verify payloads send `platform: 'google'`. Ensure `/home/credit/iap/verify` accepts Google Play purchase tokens. Integrity must pass before verify/consume on release builds.
