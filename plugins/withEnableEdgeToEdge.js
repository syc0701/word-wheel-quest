const { withMainActivity, withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Edge-to-edge + no native title bar.
 * Uses transparent system bars with dark style (light icons) so the status
 * bar region never shows the default light window background.
 */
function withEnableEdgeToEdge(config) {
  config = withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;

    if (!src.includes('androidx.activity.enableEdgeToEdge')) {
      src = src.replace(
        /^package [^\n]+\n/,
        (line) =>
          `${line}\nimport android.graphics.Color\nimport androidx.activity.SystemBarStyle\nimport androidx.activity.enableEdgeToEdge\nimport androidx.core.view.WindowCompat\n`
      );
    }

    // Prefer a known-good onCreate body if our markers are missing.
    if (!src.includes('SystemBarStyle.dark(Color.TRANSPARENT)')) {
      src = src.replace(
        /override fun onCreate\([^\)]*\)\s*\{[\s\S]*?\n  \}/,
        `override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme)
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)

    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
      navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
    )
    WindowCompat.setDecorFitsSystemWindows(window, false)
    @Suppress("DEPRECATION")
    run {
      window.statusBarColor = Color.TRANSPARENT
      window.navigationBarColor = Color.TRANSPARENT
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
