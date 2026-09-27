import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { getLevelInterstitialAdUnitId } from '../constants/ads';
import { initializeMobileAds } from '../lib/ads';

const LOAD_MS = 8000;

/** Shows the every-5-levels interstitial. Resolves when it closes or cannot play. */
export function showLevelClearAd() {
  const unitId = getLevelInterstitialAdUnitId();
  if (!unitId) return Promise.resolve(false);

  return initializeMobileAds().then(() => new Promise((resolve) => {
    let settled = false;
    const unsubscribers = [];
    const finish = (shown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribers.forEach((unsub) => {
        try { unsub(); } catch { /* ignore */ }
      });
      resolve(shown);
    };
    const timer = setTimeout(() => finish(false), LOAD_MS);
    const ad = InterstitialAd.createForAdRequest(unitId);
    unsubscribers.push(
      ad.addAdEventListener(AdEventType.LOADED, () => {
        clearTimeout(timer);
        ad.show();
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(true)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(false)),
    );
    ad.load();
  }));
}
