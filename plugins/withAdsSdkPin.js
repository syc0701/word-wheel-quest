const { withProjectBuildGradle, withGradleProperties } = require('@expo/config-plugins');

/**
 * play-services-ads 25.x (from react-native-google-mobile-ads 16.4)
 * ships Kotlin 2.3 metadata. Expo 53 defaults to Kotlin 2.0.21, which cannot
 * compile against it. Bump Kotlin + KSP for the Android build.
 */
function withAdsKotlinCompat(config) {
  config = withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const setProp = (key, value) => {
      const existing = props.find((item) => item.type === 'property' && item.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };
    setProp('android.kotlinVersion', '2.3.0');
    setProp('android.kspVersion', '2.3.0');
    return cfg;
  });

  config = withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let contents = cfg.modResults.contents;

    contents = contents.replace(
      /\n\s*\/\/ play-services-ads 25\.x[\s\S]*?configurations\.configureEach \{[\s\S]*?\n\s*\}\n/g,
      '\n'
    );

    if (!contents.includes("findProperty('android.kotlinVersion')")) {
      contents = contents.replace(
        /buildscript\s*\{/,
        `buildscript {
  def kotlinVersion = findProperty('android.kotlinVersion') ?: '2.3.0'`
      );
    }

    if (contents.includes("classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')")) {
      contents = contents.replace(
        "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
        'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")'
      );
    }

    if (!contents.includes('kspVersion = findProperty')) {
      contents = contents.replace(
        /^(apply plugin: "expo-root-project")/m,
        `ext {
  kotlinVersion = findProperty('android.kotlinVersion') ?: '2.3.0'
  kspVersion = findProperty('android.kspVersion') ?: '2.3.0'
}

$1`
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
}

module.exports = withAdsKotlinCompat;
