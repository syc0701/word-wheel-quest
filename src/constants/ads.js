import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/** AdMob Android app ID (manifest / Expo plugin). */
export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-1539854949018984~3656372616';

/** Production banner unit from AdMob console. */
export const ADMOB_BANNER_UNIT_ID = 'ca-app-pub-1539854949018984/2941342735';

/**
 * Use Google's test banner while developing so the AdMob account is not flagged.
 * Production builds use the real unit ID.
 */
export function getBannerAdUnitId() {
  if (__DEV__ || Platform.OS !== 'android') {
    return TestIds.ADAPTIVE_BANNER;
  }
  return ADMOB_BANNER_UNIT_ID;
}
