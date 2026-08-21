# App Launch Sequence (Android)

## 1. Native splash

Android shows the Expo splash theme immediately (held until the JS overlay is ready via `expo-splash-screen`):

- Deep-sea blue background (`#0A2A4A`)
- Splash image (`splash-launch.png` — WORD logo on deep blue) centered with contain sizing

## 2. JavaScript launch overlay

`LaunchSplashOverlay` paints the reef background (`splash-reef-bg.png`), animates the WORD logo in, fades the title with extra spacing, and fills an animated rope progress bar. Tip text is not shown.

## 3. Overlay dismissal

After native splash hide + short hold (~2.2 s), the overlay reveals Home. Tap dismisses early.

## Flow

```text
Android native splash
(deep-sea blue + WORD logo)
        |
        | JS ready + reef image loaded → SplashScreen.hideAsync()
        v
JavaScript launch overlay
(reef + logo bounce + title + animated progress)
        |
        | ~2.2 s
        v
Home screen
```
