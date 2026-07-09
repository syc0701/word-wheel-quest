# Screenshots for Deliver

# Regenerate from puzzleinteract.com prototype pages (see puzzle-app Snapfile parity):

| Script | Scenes | Locales | Devices |
|--------|--------|---------|---------|
| `npm run screenshots:ios:faster` | 01–10 | English only (`en-US` → mirrored to `en-CA`) | iPhone 15 Plus + iPad Pro 13-inch (M4) |
| `npm run screenshots:ios` | 01–10 | All 10 (en-US, fr-FR, zh-Hans, hi, es-ES, ar-SA, pt-BR, de-DE, ja, ko) | Same two devices |

```bash
npm run screenshots:ios:install   # first time only (Playwright + Chromium)
npm run screenshots:ios:faster    # English: 20 PNGs (10 scenes × 2 devices)
npm run screenshots:ios           # All languages: 200 PNGs
```

Phone only, all languages:

```bash
SNAPSHOT_IPHONE_ONLY=1 npm run screenshots:ios
```

Source URLs: https://www.puzzleinteract.com/prototype/mobile/word-wheel/screenshot/01?lang=en … /10

Output naming (Deliver-compatible):

```
ios/fastlane/screenshots/en-US/
  iPhone 15 Plus-01WordWheel-Screenshot-01.png
  iPad Pro 13-inch (M4)-01WordWheel-Screenshot-01.png
  ...
ios/fastlane/screenshots/en-CA/   # auto-mirrored from en-US
```

Place PNG files here before uploading:

```bash
npm run upload:ios:screenshots    # screenshots only
npm run upload:ios:metadata       # listing text + screenshots
```

```
ios/fastlane/screenshots/en-CA/
  iPhone 15 Pro Max-01.png   (6.7" — required)
  iPhone 15 Pro Max-02.png
  iPhone 15 Pro Max-03.png
  iPad Pro (13-inch)-01.png    (optional, if supporting iPad)
```

Minimum three iPhone 6.7" screenshots for App Store review.

Use your in-app screenshot (crossword grid + letter wheel) as the hero image.
