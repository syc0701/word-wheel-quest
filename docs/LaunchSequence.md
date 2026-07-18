# App Launch Sequence

## 1. Native launch screen

iOS immediately displays `SplashScreen.storyboard` before JavaScript loads:

- Cream-to-gold gradient background
- **Word Wheel Quest** title near the top
- App icon centered with aspect-fit sizing, so it is not zoomed or cropped
- **© 2026 Puzzle Interact** near the bottom

## 2. JavaScript launch overlay

When the React Native application starts, `LaunchSplashOverlay` appears over the application with the same visual design:

- Matching cream-to-gold gradient
- Matching title, centered app icon, and copyright
- Cream fallback background (`#E8D4B8`) while the image loads

Matching the native screen and JavaScript overlay creates a smooth transition without a black frame.

## 3. Overlay dismissal

The overlay waits until:

1. The splash image has loaded.
2. Initial application interactions have completed.
3. An additional 180 ms transition delay has elapsed.

It then disappears and reveals the home screen, which has already rendered underneath.

## 4. Home screen

The home screen appears with its configured scene image or theme background.

## Flow

```text
iOS native splash
(cream gradient + logo + copyright)
        |
        | JavaScript bundle loads
        v
JavaScript launch overlay
(matching gradient + logo + copyright)
        |
        | image ready + app ready + 180 ms
        v
Home screen
```

## Expected behavior

- No black screen between the splash screen and the application
- No old splash image
- No icon zoom or crop
- Smooth transition from the native splash to the JavaScript overlay and then to the home screen

> iOS caches native launch screens. After changing launch assets or the storyboard, delete the installed app and rebuild it to ensure the latest launch screen is displayed.
