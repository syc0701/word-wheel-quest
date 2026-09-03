import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_STORE } from '../constants/store';
import CreditApi from './creditApi';

const PENDING_IAP_KEY = 'ww.pending_iap';

export async function savePendingIap(payload) {
  if (!payload?.productId) return;
  try {
    await AsyncStorage.setItem(PENDING_IAP_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export async function loadPendingIap() {
  try {
    const raw = await AsyncStorage.getItem(PENDING_IAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearPendingIap() {
  try {
    await AsyncStorage.removeItem(PENDING_IAP_KEY);
  } catch {
    /* ignore */
  }
}

/** After sign-in, attach a guest purchase to the account. */
export async function verifyPendingIapIfNeeded() {
  const pending = await loadPendingIap();
  if (!pending?.productId) return { synced: false };
  try {
    await CreditApi.verifyIapPurchase({
      appCode: APP_STORE.appSiteId,
      productId: pending.productId,
      transactionId: pending.transactionId,
      rawPayload: {
        platform: Platform.OS === 'ios' ? 'apple' : 'google',
        storeProductId: pending.productId,
        packageKey: pending.packageKey,
        revenueCatAppUserId: pending.revenueCatAppUserId,
        revenueCatOriginalAppUserId: pending.revenueCatOriginalAppUserId,
      },
    });
    await clearPendingIap();
    return { synced: true };
  } catch (error) {
    return { synced: false, error };
  }
}
