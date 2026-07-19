# App Launch Sequence (Android)

## 1. Native splash

Android shows the Expo splash theme immediately:

- Cream background (`#E8D4B8`)
- Splash image (`splash-launch.png`) centered with contain sizing

## 2. JavaScript launch overlay

When React Native starts, `LaunchSplashOverlay` covers the app with a matching cream→gold gradient, title, logo, and copyright so the handoff stays seamless.

## 3. Overlay dismissal

The overlay waits until the splash image has loaded, initial interactions have finished, and a short hold (~180 ms) has elapsed, then reveals Home.

## Flow

```text
Android native splash
(cream + logo)
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

- No black frame between splash and app
- No full-screen crop/zoom of the logo
- Smooth transition from native splash → JS overlay → home
