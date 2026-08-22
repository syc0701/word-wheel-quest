import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/** AdMob Android app ID (manifest / Expo plugin). */
export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-1539854949018984~3656372616';

/** Production banner unit from AdMob console (Android). */
export const ADMOB_BANNER_UNIT_ID = 'ca-app-pub-1539854949018984/2941342735';

/** Set true after creating the iOS app + banner unit in AdMob post-launch. */
export const IOS_ADS_ENABLED = false;

/** Banner ads ship on Android only until iOS AdMob is configured. */
export function isAdsEnabled() {
  return Platform.OS === 'android' || (Platform.OS === 'ios' && IOS_ADS_ENABLED);
}

/**
 * Use Google's test banner while developing so the AdMob account is not flagged.
 * Production builds use the real unit ID on Android.
 */
export function getBannerAdUnitId() {
  if (!isAdsEnabled()) return null;
  if (__DEV__) {
    return TestIds.ADAPTIVE_BANNER;
  }
  if (Platform.OS === 'android') {
    return ADMOB_BANNER_UNIT_ID;
  }
  return TestIds.ADAPTIVE_BANNER;
}
