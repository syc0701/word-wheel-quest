/**
 * Screenshot capture config router.
 *
 * Set SCREENSHOT_PLATFORM=ios | android (default: android).
 * iOS npm scripts set ios automatically.
 */

function loadConfig() {
  const platform = (process.env.SCREENSHOT_PLATFORM || 'android').toLowerCase();
  if (platform === 'ios') {
    return require('./screenshot-config.ios');
  }
  if (platform === 'android') {
    return require('./screenshot-config.android');
  }
  throw new Error(`Unknown SCREENSHOT_PLATFORM="${platform}". Use ios or android.`);
}

module.exports = loadConfig();
