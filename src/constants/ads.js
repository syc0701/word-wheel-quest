import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/** AdMob Android app ID (manifest / Expo plugin). */
export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-1539854949018984~3656372616';

/** Production banner unit from AdMob console. */
export const ADMOB_BANNER_UNIT_ID = 'ca-app-pub-1539854949018984/2941342735';

/** Rewarded_Show_Hidden_Letters. Server grants 1 credit after the SSV callback. */
export const ADMOB_REWARDED_UNIT_ID = 'ca-app-pub-1539854949018984/1893448351';

/** Rewarded_One_Hidden_Letter. Reveals one cell. No credit grant. */
export const ADMOB_CELL_REWARDED_UNIT_ID = 'ca-app-pub-1539854949018984/6505707281';

/** Credits granted by AdMob SSV for one rewarded watch. */
export const AD_REWARD_CREDITS = 1;

/** Letters revealed after one rewarded watch. One ad grants 1 credit, which shows 1 letter. */
export const AD_REWARD_LETTERS = 1;

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

/**
 * Live unit even in dev so AdMob's callback can grant credits on a device test.
 * Google's test rewarded id never hits our SSV URL.
 */
export function getRewardedAdUnitId() {
  if (Platform.OS !== 'android') return TestIds.REWARDED;
  return ADMOB_REWARDED_UNIT_ID;
}

/** Live cell unit even in dev. This placement does not send SSV custom data. */
export function getCellRewardedAdUnitId() {
  if (Platform.OS !== 'android') return TestIds.REWARDED;
  return ADMOB_CELL_REWARDED_UNIT_ID;
}
