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
    if (typeof Purchases.configure === 'function') {
      const maybe = Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      if (maybe && typeof maybe.then === 'function') {
        await maybe;
      }
    } else if (typeof Purchases.setup === 'function') {
      Purchases.setup(REVENUECAT_API_KEY);
    } else {
      return;
    }
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
 * Optional RevenueCat App User ID. Never throws; old iOS / missing store still play.
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
        /* older native module */
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
        /* StoreKit / billing unavailable */
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
