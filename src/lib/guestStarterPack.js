import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STARTER_PACK_PACKAGE_ID,
  STARTER_PACK_PRODUCT_ID,
} from '../constants/guestAccess';
import { loadPendingIap } from './pendingIap';

const STARTER_PACK_KEY = 'ww.starter_pack';

function isStarterPurchase(record) {
  if (!record) return false;
  return (
    record.packageKey === STARTER_PACK_PACKAGE_ID
    || record.productId === STARTER_PACK_PRODUCT_ID
  );
}

export async function hasStarterPackLocal() {
  try {
    const raw = await AsyncStorage.getItem(STARTER_PACK_KEY);
    if (raw === '1') return true;
  } catch {
    /* ignore */
  }
  const pending = await loadPendingIap();
  return isStarterPurchase(pending);
}

/** @deprecated alias */
export const hasGuestStarterPackLocal = hasStarterPackLocal;

export async function hasStarterPackAccess() {
  return hasStarterPackLocal();
}

/** Record a starter-pack IAP locally so a later sign-in can merge it. */
export async function markStarterPackPurchased() {
  try {
    await AsyncStorage.setItem(STARTER_PACK_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** @deprecated */
export const markGuestStarterPackPurchased = markStarterPackPurchased;
