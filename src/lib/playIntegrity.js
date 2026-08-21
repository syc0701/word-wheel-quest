/**
 * Google Play Integrity — request a device token and verify with puzzle-be.
 * POST /home/android/security/verify-integrity
 *
 * @see Puzzle-iOS/puzzle-be/docs/android-play-integrity.md
 */
import { Platform } from 'react-native';
import { PLAY_STORE } from '../constants/store';
import { apiPost } from './http';

const VERIFY_PATH = '/home/android/security/verify-integrity';
const PASS_CACHE_TTL_MS = 5 * 60 * 1000;

let passCacheAt = 0;

/**
 * Request a Play Integrity token (Android) and verify with the backend.
 * Soft-skips on non-Android / __DEV__ so local debugging still works.
 *
 * @returns {Promise<{ ok: boolean, skipped?: boolean, reason?: string }>}
 */
export async function ensurePlayIntegrityPassed() {
  if (Platform.OS !== 'android') {
    return { ok: true, skipped: true, reason: 'not_android' };
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return { ok: true, skipped: true, reason: 'dev_build' };
  }

  if (passCacheAt && Date.now() - passCacheAt < PASS_CACHE_TTL_MS) {
    return { ok: true, skipped: true, reason: 'cached' };
  }

  try {
    // Lazy require so Metro does not load native module on iOS / web.
    const PlayIntegrity = require('play-integrity');
    const { token, nonce } = await PlayIntegrity.requestToken({});
    const integrityToken = String(token || '').trim();
    if (!integrityToken) {
      throw new Error('Play Integrity returned an empty token');
    }

    const data = await apiPost(VERIFY_PATH, {
      appCode: PLAY_STORE.appSiteId,
      integrityToken,
      nonce: String(nonce || '').trim() || undefined,
      packageName: PLAY_STORE.packageName,
    });

    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Integrity verification failed.');
    }
    if (data?.passed !== true) {
      if (__DEV__) {
        console.warn('[PlayIntegrity] passed=false', data);
      }
      passCacheAt = 0;
      return { ok: false, reason: 'not_passed' };
    }

    passCacheAt = Date.now();
    return { ok: true };
  } catch (err) {
    if (__DEV__) {
      console.warn('[PlayIntegrity] ensure failed', err?.message || err);
    }
    passCacheAt = 0;
    return { ok: false, reason: err?.message || 'integrity_error' };
  }
}

/** Clear the short-lived pass cache (e.g. after sign-out). */
export function clearPlayIntegrityCache() {
  passCacheAt = 0;
}
