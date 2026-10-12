import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AD_REWARD_CREDITS, getCellRewardedAdUnitId, getDailyPlayAdUnitId, getRewardedAdUnitId } from '../constants/ads';
import { initializeMobileAds } from '../lib/ads';
import CreditApi from '../lib/creditApi';
import { pauseAmbientForAd, resumeAmbientAfterAd } from '../lib/adAmbientPause';
import { getDeviceId } from '../lib/deviceId';
import { soundManager } from '../lib/soundManager';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let rewardedInFlight = null;
let rewardedCooldownUntil = 0;
const rewardedOpenedListeners = new Set();

/** Fires when the rewarded video becomes visible, so a "not ready" notice can close. */
export function subscribeRewardedAdOpened(listener) {
  rewardedOpenedListeners.add(listener);
  return () => rewardedOpenedListeners.delete(listener);
}

function notifyRewardedAdOpened() {
  rewardedOpenedListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
}

/** Google SSV needs the install device id in customData so Lambda can credit the wallet. */
export function showRewardedLetterAd(deviceId, { verify = true } = {}) {
  return showRewardedAd(getRewardedAdUnitId(), verify ? deviceId : null);
}

/** Rewarded_One_Hidden_Letter. No customData, so this watch does not grant a credit. */
export function showRewardedCellAd() {
  return showRewardedAd(getCellRewardedAdUnitId(), null);
}

/** Video required before a daily puzzle. No credit grant. */
export async function showDailyPlayAd() {
  await initializeMobileAds();
  return showRewardedAd(getDailyPlayAdUnitId(), null);
}

function showRewardedAd(unitId, deviceId) {
  if (rewardedInFlight) return rewardedInFlight;
  if (Date.now() < rewardedCooldownUntil) {
    if (__DEV__) console.log('[Ad] ignored, a rewarded ad just closed');
    return Promise.resolve(false);
  }
  pauseAmbientForAd();
  rewardedInFlight = new Promise((resolve) => {
    const requestOptions = deviceId
      ? { serverSideVerificationOptions: { customData: String(deviceId) } }
      : undefined;
    const ad = RewardedAd.createForAdRequest(unitId, requestOptions);
    let earned = false;
    let settled = false;
    let shown = false;
    let opened = false;
    let failTimer = null;
    const unsubs = [];
    const clearFail = () => {
      if (failTimer) clearTimeout(failTimer);
      failTimer = null;
    };
    // A load error or an early close often arrives before the video is on screen.
    // Wait briefly so a following load/open can still show the ad.
    const scheduleFail = (ms) => {
      if (settled || opened) return;
      clearFail();
      failTimer = setTimeout(() => {
        failTimer = null;
        if (!settled && !opened) finish(false);
      }, ms);
    };
    const dropListeners = () => {
      unsubs.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
    };
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearFail();
      rewardedInFlight = null;
      resumeAmbientAfterAd();
      // The tap that closes the video must not start another one.
      rewardedCooldownUntil = Date.now() + 1500;
      if (!ok && !opened) {
        // The video can still open after a premature failure. Close the notice then.
        const stopLate = ad.addAdEventListener(AdEventType.OPENED, () => {
          opened = true;
          notifyRewardedAdOpened();
          try {
            stopLate();
          } catch {
            /* ignore */
          }
          dropListeners();
        });
        setTimeout(() => {
          try {
            stopLate();
          } catch {
            /* ignore */
          }
          dropListeners();
        }, 20000);
      } else {
        dropListeners();
      }
      resolve(Boolean(ok));
    };
    unsubs.push(ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (shown || settled) return;
      shown = true;
      clearFail();
      if (__DEV__) console.log('[Ad] rewarded loaded, showing');
      ad.show().catch(() => scheduleFail(2500));
    }));
    unsubs.push(
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
        if (__DEV__) console.log('[Ad] earned reward event');
      })
    );
    unsubs.push(
      ad.addAdEventListener(AdEventType.OPENED, () => {
        opened = true;
        clearFail();
        if (__DEV__) console.log('[Ad] rewarded opened');
        notifyRewardedAdOpened();
      })
    );
    unsubs.push(
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (__DEV__) console.log('[Ad] closed earned=', earned, 'opened=', opened);
        if (!opened) {
          scheduleFail(2000);
          return;
        }
        // The reward event can arrive just after close on the JS bridge.
        setTimeout(() => finish(earned), 400);
      })
    );
    unsubs.push(
      ad.addAdEventListener(AdEventType.ERROR, () => {
        if (opened || shown) return;
        scheduleFail(1500);
      })
    );
    ad.load();
  });
  return rewardedInFlight;
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

/** One video is one credit. Drop any extra the callback added on the device wallet. */
export async function trimExtraAdCredits(before, after, credits = AD_REWARD_CREDITS) {
  const surplus = Math.max(0, Number(after) - (Number(before) + credits));
  let balance = after;
  for (let i = 0; i < surplus; i += 1) {
    const stamp = `${Date.now().toString(36)}${i}`;
    const result = await CreditApi.consumeDeviceCredits({
      featureUsed: `wwad-extra:${stamp}`.slice(0, 64),
      creditsConsumed: 1,
    });
    balance = result.creditBalance;
  }
  return balance;
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
  pauseAmbientForAd();
  try {
    return await work();
  } finally {
    resumeAmbientAfterAd();
    soundManager.unmuteAfterAd();
  }
}
