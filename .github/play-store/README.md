# Play Store listing text (source of truth)

Edit locale copy here — not under `fastlane/metadata`.

```
.github/play-store/android/<locale>/
  title.txt
  short_description.txt
  full_description.txt
  video.txt
  keywords.txt          # optional ASO notes (not uploaded by Play)
  changelogs/<versionCode>.txt   # “What’s new”
```

Images and screenshots stay in `fastlane/metadata/android/<locale>/images/`.

Before upload, Fastlane runs `scripts/sync-play-store-text.sh` to copy these `.txt` files into `fastlane/metadata/android/`.
