const { withAppDelegate } = require('@expo/config-plugins');

/**
 * Request ATT when the app becomes active so the system prompt appears on
 * iOS / iPadOS 17+ (and 27). Survives `expo prebuild --clean`.
 */
function withIosAppTracking(config) {
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') return cfg;
    let src = cfg.modResults.contents;
    if (src.includes('requestAppTrackingIfNeeded')) {
      cfg.modResults.contents = src;
      return cfg;
    }

    if (!src.includes('import AppTrackingTransparency')) {
      src = src.replace(/^import Expo/m, 'import AppTrackingTransparency\nimport Expo');
    }

    if (!src.includes('didRequestAppTracking')) {
      src = src.replace(
        'var reactNativeFactory: RCTReactNativeFactory?',
        'var reactNativeFactory: RCTReactNativeFactory?\n  private var didRequestAppTracking = false'
      );
    }

    const observer = `#if os(iOS)
    NotificationCenter.default.addObserver(
      forName: UIApplication.didBecomeActiveNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.requestAppTrackingIfNeeded()
    }
#endif

    `;

    src = src.replace(
      'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
      `${observer}return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
    );

    if (!src.includes('func requestAppTrackingIfNeeded')) {
      src = src.replace(
        '  // Linking API',
        `  private func requestAppTrackingIfNeeded() {
    guard !didRequestAppTracking else { return }
    guard #available(iOS 14, *) else { return }
    didRequestAppTracking = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
      ATTrackingManager.requestTrackingAuthorization { _ in }
    }
  }

  // Linking API`
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = withIosAppTracking;
