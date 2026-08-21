const { withMainActivity, withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Edge-to-edge + no native title bar.
 * Avoids androidx.activity.enableEdgeToEdge and Window.setStatusBarColor /
 * setNavigationBarColor (deprecated on Android 15 / flagged by Play Console).
 */
function withEnableEdgeToEdge(config) {
  config = withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;

    if (!src.includes('WindowInsetsControllerCompat')) {
      src = src.replace(
        /^package [^\n]+\n/,
        (line) =>
          `${line}\nimport androidx.core.view.WindowCompat\nimport androidx.core.view.WindowInsetsControllerCompat\n`
      );
    }

    // Strip deprecated edge-to-edge helpers if a prebuild reintroduced them.
    src = src
      .replace(/\nimport android\.graphics\.Color\n/g, '\n')
      .replace(/\nimport androidx\.activity\.SystemBarStyle\n/g, '\n')
      .replace(/\nimport androidx\.activity\.enableEdgeToEdge\n/g, '\n');

    if (!src.includes('isAppearanceLightStatusBars = false')) {
      src = src.replace(
        /override fun onCreate\([^\)]*\)\s*\{[\s\S]*?\n  \}/,
        `override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme)
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)

    WindowCompat.setDecorFitsSystemWindows(window, false)
    WindowInsetsControllerCompat(window, window.decorView).apply {
      isAppearanceLightStatusBars = false
      isAppearanceLightNavigationBars = false
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.isStatusBarContrastEnforced = false
      window.isNavigationBarContrastEnforced = false
    }

    title = ""
    supportActionBar?.hide()
  }`
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });

  config = withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    const activity = app.activity?.find(
      (item) => item.$?.['android:name'] === '.MainActivity'
    );
    if (activity?.$) {
      activity.$['android:label'] = '';
    }
    return cfg;
  });

  return config;
}

module.exports = withEnableEdgeToEdge;
