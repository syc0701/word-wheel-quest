import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'ww.device_id';

function randomId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `ww-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

/** Stable install id sent as AdMob custom_data and credit deviceId. */
export async function getDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing && existing.length >= 8) return existing;
  const next = randomId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}
