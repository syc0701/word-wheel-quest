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

/** Credits granted by AdMob SSV for one rewarded watch. */
export const AD_REWARD_CREDITS = 1;

/** One ad grants 1 credit, which shows 1 letter. */
export const AD_REWARD_LETTERS = 1;

/** Rewarded_Show_Hidden_Letters. */
export const ADMOB_ANDROID_REWARDED_UNIT_ID = 'ca-app-pub-1539854949018984/1893448351';
/** Rewarded_One_Hidden_Letter. Does not grant a credit. */
export const ADMOB_ANDROID_CELL_REWARDED_UNIT_ID = 'ca-app-pub-1539854949018984/6505707281';

/** Play-screen top-menu rewarded ad. AdMob SSV grants 1 credit after the callback. */
export const ADMOB_IOS_REWARDED_UNIT_ID = 'ca-app-pub-1539854949018984/8422559658';
/** Rewarded_GetOne_ShowEmptyCell. Reveals one empty grid cell. Does not grant a credit. */
export const ADMOB_IOS_CELL_REWARDED_UNIT_ID = 'ca-app-pub-1539854949018984/7053637665';

/** Live unit even in dev so AdMob's callback can grant credits on a device test. */
export function getRewardedAdUnitId() {
  if (!isAdsEnabled()) return TestIds.REWARDED;
  if (Platform.OS === 'ios') return ADMOB_IOS_REWARDED_UNIT_ID;
  if (Platform.OS === 'android') return ADMOB_ANDROID_REWARDED_UNIT_ID;
  return TestIds.REWARDED;
}

/** Live cell unit even in dev. This placement does not send SSV custom data. */
export function getCellRewardedAdUnitId() {
  if (!isAdsEnabled()) return TestIds.REWARDED;
  if (Platform.OS === 'ios') return ADMOB_IOS_CELL_REWARDED_UNIT_ID;
  if (Platform.OS === 'android') return ADMOB_ANDROID_CELL_REWARDED_UNIT_ID;
  return TestIds.REWARDED;
}
