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

Email + password via AWS Cognito (same mobile app client as iOS). Sign in with Apple is **not** included on Android.

## In-app purchases (RevenueCat)

1. Create matching in-app products in Google Play Console (same product IDs as below).
2. Attach the Google Play app in RevenueCat and copy the **Google** public SDK key (`goog_…`).
3. Set it in `src/constants/store.js` → `REVENUECAT_API_KEY`.

| RevenueCat package | Play product ID | Display name |
| --- | --- | --- |
| `coins_large` | `word_wheel_coins_large` | 1,000 Coins |
| `coins_small` | `word_wheel_coins_small` | 300 Coins |
| `bundle_master` | `word_wheel_pack_hard` | Master Quest |
| `bundle_classic` | `word_wheel_pack_medium` | Classic Challenge |
| `bundle_starter` | `word_wheel_pack_starter` | Starter Fun Bundle |

Purchases use `react-native-purchases`. Restore lives under Settings → Account.

## Run

```bash
npm install
npm run android:prebuild   # generates android/ (first time / after native dep changes)
npm run android:run        # debug build on emulator or device
```

Release build:

```bash
npm run android:run:release
```

Open in Android Studio:

```bash
npm run android:studio
```

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
- **Listing files**: `fastlane/metadata/android/en-US/`

```bash
bundle install                # first time / after Gemfile changes
npm run screenshots           # capture /01–/08 into phoneScreenshots/
npm run screenshots:upload    # capture + upload listing / screenshots to Play
npm run fastlane:metadata     # upload title / descriptions / images only
```

## Backend notes

Shop verify payloads send `platform: 'google'`. Ensure `/home/credit/iap/verify` accepts Google Play purchase tokens. Integrity must pass before verify/consume on release builds.
