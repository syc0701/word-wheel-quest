import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { REVENUECAT_API_KEY, REVENUECAT_OFFERING } from '../constants/store';

let configured = false;

function hasValidApiKey() {
  return Boolean(REVENUECAT_API_KEY && !REVENUECAT_API_KEY.includes('REPLACE'));
}

export function isPurchasesConfigured() {
  return configured && hasValidApiKey();
}

export function configurePurchases() {
  if (configured || Platform.OS !== 'android') return;
  if (!hasValidApiKey()) {
    if (__DEV__) {
      console.warn(
        '[Purchases] Set REVENUECAT_API_KEY to your RevenueCat Google Play public SDK key (goog_…).'
      );
    }
    return;
  }
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  configured = true;
}

export async function getDefaultOffering() {
  if (!isPurchasesConfigured()) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.all[REVENUECAT_OFFERING.identifier] ?? offerings.current ?? null;
}

export async function purchasePackage(rcPackage) {
  if (!isPurchasesConfigured()) {
    throw new Error('Purchases are not configured yet.');
  }
  const result = await Purchases.purchasePackage(rcPackage);
  return result;
}

/** Best-effort purchase / order id for backend IAP verify (Google Play). */
export function readPurchaseTransactionId(purchaseResult) {
  const tx =
    purchaseResult?.transaction?.purchaseToken
    ?? purchaseResult?.transaction?.transactionIdentifier
    ?? purchaseResult?.transactionIdentifier
    ?? purchaseResult?.productIdentifier
    ?? null;
  if (tx) return String(tx);
  return `rc-${Date.now()}`;
}

export async function restorePurchases() {
  if (!isPurchasesConfigured()) {
    throw new Error('Purchases are not configured yet.');
  }
  return Purchases.restorePurchases();
}
