import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { REVENUECAT_API_KEY, REVENUECAT_OFFERING } from '../constants/store';

let configured = false;
/**
 * Emulators and devices without Play billing reject every store call. Latch it
 * so we stop retrying, and so the Shop can present its unavailable state
 * instead of spinning.
 */
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

/**
 * Purchases.configure() installs a log handler that sends every ERROR to
 * console.error, and a device without Play billing reports one for each call,
 * so LogBox buries the app in dev. Registering first wins: configure() only
 * installs its default when no custom handler exists. A device that simply
 * cannot buy anything is expected, not an error worth reporting.
 */
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
  if (configured || Platform.OS !== 'android') return;
  if (!hasValidApiKey()) {
    if (__DEV__) {
      console.warn(
        '[Purchases] Set REVENUECAT_API_KEY to your RevenueCat Google Play public SDK key (goog_…).'
      );
    }
    return;
  }

  installLogHandler();
  try {
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
  } catch {
    // Log level is a nicety; never block configuration on it.
  }

  // App.js calls this without awaiting, so nothing here may reject.
  try {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
  } catch (error) {
    if (__DEV__) console.warn(`[Purchases] configure failed: ${error?.message}`);
    return;
  }

  // Probe once so the rest of the app can skip store calls entirely on devices
  // that cannot purchase (emulators, missing Play Services).
  try {
    storeUnavailable = !(await Purchases.canMakePayments());
  } catch (error) {
    storeUnavailable = isBillingUnavailable(error);
  }

  if (__DEV__ && storeUnavailable) {
    console.log('[Purchases] Store unavailable on this device; IAP disabled.');
  }
}

export async function getDefaultOffering() {
  if (!isPurchasesConfigured()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all[REVENUECAT_OFFERING.identifier] ?? offerings.current ?? null;
  } catch (error) {
    if (isBillingUnavailable(error)) {
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
  assertStoreReady();
  try {
    return await Purchases.purchasePackage(rcPackage);
  } catch (error) {
    if (isBillingUnavailable(error)) {
      storeUnavailable = true;
      throw new Error('In-app purchases are not available on this device.');
    }
    throw error;
  }
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
  assertStoreReady();
  return Purchases.restorePurchases();
}
