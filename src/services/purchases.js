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
    if (typeof Purchases.configure === 'function') {
      const maybe = Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      if (maybe && typeof maybe.then === 'function') {
        await maybe;
      }
    } else if (typeof Purchases.setup === 'function') {
      // react-native-purchases v3–v5
      Purchases.setup(REVENUECAT_API_KEY);
    } else {
      return;
    }
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

const EMPTY_IDENTITY = { revenueCatAppUserId: '', revenueCatOriginalAppUserId: '' };

let cachedIdentity = EMPTY_IDENTITY;

function pickId(...values) {
  for (const value of values) {
    const text = value == null ? '' : String(value).trim();
    if (text && text !== 'undefined' && text !== 'null') {
      return text;
    }
  }
  return '';
}

/** Works with current CustomerInfo and older PurchaserInfo field names. */
export function identityFromCustomerInfo(info) {
  if (!info || typeof info !== 'object') {
    return { ...EMPTY_IDENTITY };
  }
  const original = pickId(
    info.originalAppUserId,
    info.originalAppUserID,
    info.originalAppUserIdentifier
  );
  const current = pickId(info.appUserId, info.appUserID, original);
  return {
    revenueCatAppUserId: current,
    revenueCatOriginalAppUserId: original || current,
  };
}

export function rememberRevenueCatIdentityFromPurchase(purchaseResult) {
  const info =
    purchaseResult?.customerInfo
    || purchaseResult?.purchaserInfo
    || purchaseResult?.customer_info
    || null;
  const next = identityFromCustomerInfo(info);
  if (next.revenueCatAppUserId) {
    cachedIdentity = next;
  }
  return next.revenueCatAppUserId ? next : cachedIdentity;
}

export function clearRevenueCatIdentityCache() {
  cachedIdentity = { ...EMPTY_IDENTITY };
}

/**
 * Current and original RevenueCat App User IDs.
 * Guests are typically {@code $RCAnonymousID:…}; after Google sign-in this becomes the Cognito sub.
 * Safe on older Android / older Purchases SDK / devices without Play Billing — never throws.
 */
export async function getRevenueCatIdentity() {
  if (cachedIdentity.revenueCatAppUserId) {
    return cachedIdentity;
  }
  try {
    if (!configured) {
      await Promise.race([
        configurePurchases(),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
    }
    if (!configured) {
      return cachedIdentity;
    }

    let current = '';
    if (typeof Purchases.getAppUserID === 'function') {
      try {
        current = pickId(await Purchases.getAppUserID());
      } catch {
        /* missing on some older native binaries */
      }
    }
    if (!current) {
      current = pickId(Purchases.appUserID, Purchases.appUserId);
    }

    let original = '';
    const readInfo =
      typeof Purchases.getCustomerInfo === 'function'
        ? () => Purchases.getCustomerInfo()
        : typeof Purchases.getPurchaserInfo === 'function'
          ? () => Purchases.getPurchaserInfo()
          : null;
    if (readInfo) {
      try {
        const info = await Promise.race([
          readInfo(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800)),
        ]);
        const fromInfo = identityFromCustomerInfo(info);
        current = current || fromInfo.revenueCatAppUserId;
        original = fromInfo.revenueCatOriginalAppUserId;
      } catch {
        /* Play billing missing on older devices / emulators */
      }
    }

    const next = {
      revenueCatAppUserId: current,
      revenueCatOriginalAppUserId: original || current,
    };
    if (next.revenueCatAppUserId) {
      cachedIdentity = next;
    }
    return next.revenueCatAppUserId ? next : cachedIdentity;
  } catch {
    return cachedIdentity;
  }
}
