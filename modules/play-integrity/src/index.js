import { requireNativeModule, Platform } from 'expo-modules-core';

/**
 * @typedef {{ token: string, nonce: string }} PlayIntegrityTokenResult
 * @typedef {{ packageName: string, sha1: string, sha256: string }} AppSigningInfo
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

/**
 * Read this install's package name + signing certificate fingerprints (Android only).
 * @returns {Promise<AppSigningInfo>}
 */
export async function getSigningInfo() {
  if (!NativePlayIntegrity?.getSigningInfo) {
    throw new Error('App signing info is only available on Android');
  }
  return NativePlayIntegrity.getSigningInfo();
}

export default { requestToken, getSigningInfo };
