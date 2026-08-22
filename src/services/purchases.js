import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { REVENUECAT_API_KEY, REVENUECAT_OFFERING } from '../constants/store';

let configured = false;
/** Android emulators / devices without Play billing — skip further store calls. */
let storeUnavailable = false;

const BILLING_UNAVAILABLE_RE =
  /BILLING_UNAVAILABLE|billing is not available|billing service unavailable/i;

function hasValidApiKey() {
  return Boolean(REVENUECAT_API_KEY && !REVENUECAT_API_KEY.includes('REPLACE'));
}

function isBillingUnavailable(error) {
  const text = [
    error?.message,
    error?.underlyingErrorMessage,
    error?.readableErrorCode,
    error?.userInfo?.readableErrorCode,
  ]
    .filter(Boolean)
    .join(' ');
  return BILLING_UNAVAILABLE_RE.test(text) || /PurchaseNotAllowed/i.test(text);
}

function installLogHandler() {
  if (typeof Purchases.setLogHandler !== 'function') return;
  Purchases.setLogHandler((logLevel, message) => {
    if (!__DEV__ || BILLING_UNAVAILABLE_RE.test(message)) return;
    if (logLevel === LOG_LEVEL.ERROR || logLevel === LOG_LEVEL.WARN) {
      console.warn(`[Purchases] ${message}`);
    }
  });
}

export function isStoreUnavailable() {
  return storeUnavailable;
}

export function isPurchasesConfigured() {
  return configured && hasValidApiKey() && !storeUnavailable;
}

export async function configurePurchases() {
  if (configured) return;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  if (!hasValidApiKey()) {
    if (__DEV__) {
      console.warn(
        `[Purchases] Set REVENUECAT_API_KEY to your RevenueCat public SDK key for ${Platform.OS}.`
      );
    }
    return;
  }

  if (Platform.OS === 'android') {
    installLogHandler();
    try {
      await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
    } catch {
      /* ignore */
    }
  }

  try {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
  } catch (error) {
    if (__DEV__) console.warn(`[Purchases] configure failed: ${error?.message}`);
    return;
  }

  if (Platform.OS === 'android') {
    try {
      storeUnavailable = !(await Purchases.canMakePayments());
    } catch (error) {
      storeUnavailable = isBillingUnavailable(error);
    }
    if (__DEV__ && storeUnavailable) {
      console.log('[Purchases] Store unavailable on this device; IAP disabled.');
    }
  }
}

export async function getDefaultOffering() {
  if (!isPurchasesConfigured()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all[REVENUECAT_OFFERING.identifier] ?? offerings.current ?? null;
  } catch (error) {
    if (Platform.OS === 'android' && isBillingUnavailable(error)) {
      storeUnavailable = true;
      return null;
    }
    throw error;
  }
}

function assertStoreReady() {
  if (storeUnavailable) {
    throw new Error('In-app purchases are not available on this device.');
  }
  if (!isPurchasesConfigured()) {
    throw new Error('Purchases are not configured yet.');
  }
}

export async function purchasePackage(rcPackage) {
  if (Platform.OS === 'android') {
    assertStoreReady();
  } else if (!isPurchasesConfigured()) {
    throw new Error('Purchases are not configured yet.');
  }

  try {
    return await Purchases.purchasePackage(rcPackage);
  } catch (error) {
    if (Platform.OS === 'android' && isBillingUnavailable(error)) {
      storeUnavailable = true;
      throw new Error('In-app purchases are not available on this device.');
    }
    throw error;
  }
}

/** Best-effort purchase id for backend IAP verify. */
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
  if (Platform.OS === 'android') {
    assertStoreReady();
  } else if (!isPurchasesConfigured()) {
    throw new Error('Purchases are not configured yet.');
  }
  return Purchases.restorePurchases();
}
