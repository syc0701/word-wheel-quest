import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { REVENUECAT_API_KEY, REVENUECAT_OFFERING } from '../constants/store';

let configured = false;

export function configurePurchases() {
  if (configured || Platform.OS !== 'ios') return;
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  configured = true;
}

export async function getDefaultOffering() {
  const offerings = await Purchases.getOfferings();
  return offerings.all[REVENUECAT_OFFERING.identifier] ?? offerings.current ?? null;
}

export async function purchasePackage(rcPackage) {
  const result = await Purchases.purchasePackage(rcPackage);
  return result;
}

export function readPurchaseTransactionId(purchaseResult) {
  const tx =
    purchaseResult?.transaction?.transactionIdentifier
    ?? purchaseResult?.transactionIdentifier
    ?? purchaseResult?.customerInfo?.originalPurchaseDate
    ?? null;
  if (tx) return String(tx);
  return `rc-${Date.now()}`;
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}
