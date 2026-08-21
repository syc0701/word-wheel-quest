import { requireNativeModule, Platform } from 'expo-modules-core';

/**
 * @typedef {{ token: string, nonce: string }} PlayIntegrityTokenResult
 */

const NativePlayIntegrity =
  Platform.OS === 'android' ? requireNativeModule('PlayIntegrity') : null;

/**
 * Request a classic Play Integrity token (Android only).
 * @param {{ nonce?: string }} [options]
 * @returns {Promise<PlayIntegrityTokenResult>}
 */
export async function requestToken(options = {}) {
  if (!NativePlayIntegrity) {
    throw new Error('Play Integrity is only available on Android');
  }
  return NativePlayIntegrity.requestToken(options);
}

export default { requestToken };
