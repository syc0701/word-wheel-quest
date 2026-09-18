import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AD_REWARD_CREDITS, getRewardedAdUnitId } from '../constants/ads';
import CreditApi from '../lib/creditApi';
import { getDeviceId } from '../lib/deviceId';
import { soundManager } from '../lib/soundManager';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Google SSV needs the install device id in customData so Lambda can credit the wallet. */
export function showRewardedLetterAd(deviceId) {
  return new Promise((resolve, reject) => {
    const ad = RewardedAd.createForAdRequest(getRewardedAdUnitId(), {
      serverSideVerificationOptions: { customData: String(deviceId) },
    });
    let earned = false;
    let settled = false;
    const unsubs = [];
    const finish = (ok, error) => {
      if (settled) return;
      settled = true;
      unsubs.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
      if (error) reject(error);
      else resolve(ok);
    };
    unsubs.push(ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (__DEV__) console.log('[Ad] rewarded loaded, showing');
      ad.show();
    }));
    unsubs.push(
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
        if (__DEV__) console.log('[Ad] earned reward event');
      })
    );
    unsubs.push(
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (__DEV__) console.log('[Ad] closed earned=', earned);
        finish(earned);
      })
    );
    unsubs.push(
      ad.addAdEventListener(AdEventType.ERROR, (event) => {
        finish(false, new Error(event?.message || 'Ad failed to load'));
      })
    );
    ad.load();
  });
}

/**
 * Poll the device wallet until AdMob SSV has added the expected credits.
 * Uses the public guest balance path so a signed-in JWT cannot hide the grant.
 */
export async function waitForAdCredits(previousBalance, credits = AD_REWARD_CREDITS, timeoutMs = 45000) {
  const started = Date.now();
  let last = previousBalance;
  while (Date.now() - started < timeoutMs) {
    const { creditBalance } = await CreditApi.fetchDeviceBalance();
    last = creditBalance;
    if (__DEV__) {
      console.log('[Ad] device balance', creditBalance, 'need', previousBalance + credits);
    }
    if (creditBalance >= previousBalance + credits) return creditBalance;
    await sleep(2000);
  }
  throw new Error(`timeout waiting for +${credits} (was ${previousBalance}, last ${last})`);
}

export async function consumeOneLetter(playId, cellKey) {
  // Guest table has UNIQUE(device_id, app_id, feature_used). A stable
  // wwl:{play}:{row},{col} key collides on retry / across plays when playId
  // is missing, and Spring returns HTTP 500 instead of a clean failure.
  const stamp = Date.now().toString(36);
  const play = playId ? String(playId).replace(/-/g, '').slice(0, 10) : 'x';
  const cell = String(cellKey || 'cell').replace(/[^0-9,]/g, '').slice(0, 8) || 'cell';
  const featureUsed = `wwl:${play}:${cell}:${stamp}`.slice(0, 64);
  return CreditApi.consumeCredits({ featureUsed, creditsConsumed: 1 });
}

export async function prepareRewardedAd() {
  return getDeviceId();
}

/** Mute BGM/SFX for the video, then restore. Prefer wrapping the whole ad + poll. */
export async function withAdAudioMuted(work) {
  soundManager.muteForAd();
  try {
    return await work();
  } finally {
    soundManager.unmuteAfterAd();
  }
}
