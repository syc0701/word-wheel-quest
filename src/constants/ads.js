import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/** AdMob Android app ID (manifest / Expo plugin). */
export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-1539854949018984~3656372616';

/** AdMob iOS app ID (Info.plist / Expo plugin). */
export const ADMOB_IOS_APP_ID = 'ca-app-pub-1539854949018984~6049126882';

/** Production banner units from AdMob console. */
export const ADMOB_ANDROID_BANNER_UNIT_ID = 'ca-app-pub-1539854949018984/2941342735';
export const ADMOB_IOS_BANNER_UNIT_ID = 'ca-app-pub-1539854949018984/1366761360';

export const IOS_ADS_ENABLED = true;

export function isAdsEnabled() {
  return Platform.OS === 'android' || (Platform.OS === 'ios' && IOS_ADS_ENABLED);
}

/**
 * Use Google's test banner while developing so the AdMob account is not flagged.
 * Production builds use the real unit ID per platform.
 */
export function getBannerAdUnitId() {
  if (!isAdsEnabled()) return null;
  if (__DEV__) {
    return TestIds.ADAPTIVE_BANNER;
  }
  if (Platform.OS === 'ios') {
    return ADMOB_IOS_BANNER_UNIT_ID;
  }
  return ADMOB_ANDROID_BANNER_UNIT_ID;
}
