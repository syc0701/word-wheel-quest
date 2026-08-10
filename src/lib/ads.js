import mobileAds from 'react-native-google-mobile-ads';

let initPromise = null;

/**
 * Initialize the Google Mobile Ads SDK once at launch.
 * Safe to call multiple times; subsequent calls reuse the same promise.
 */
export function initializeMobileAds() {
  if (initPromise) return initPromise;
  initPromise = mobileAds()
    .setRequestConfiguration({
      testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
    })
    .then(() => mobileAds().initialize())
    .catch((error) => {
      if (__DEV__) {
        console.warn('[Ads] initialize failed', error?.message || error);
      }
      return null;
    });
  return initPromise;
}
