import { APP_STORE } from '../constants/store';
import { getDeviceId } from './deviceId';
import { isLoggedIn } from './auth';
import { apiGet, apiGetPublic, apiPost, apiPostPublic } from './http';

function readBalance(payload) {
  const n = Number(payload?.creditBalance);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const CreditApi = {
  fetchBalance: async (appCode = APP_STORE.appSiteId) => {
    const authed = await isLoggedIn();
    const params = { appCode };
    if (!authed) {
      params.deviceId = await getDeviceId();
    }
    const data = await apiGet('/home/credit/balance', params);
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to load credit balance');
    }
    return { appCode: data?.appCode || appCode, creditBalance: readBalance(data) };
  },

  /** Device wallet only. AdMob SSV grants here; poll this after a rewarded ad. */
  fetchDeviceBalance: async (appCode = APP_STORE.appSiteId) => {
    const deviceId = await getDeviceId();
    const data = await apiGetPublic('/home/credit/balance', { appCode, deviceId });
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to load device credit balance');
    }
    return { appCode: data?.appCode || appCode, creditBalance: readBalance(data), deviceId };
  },

  fetchProducts: async () => {
    const data = await apiGet('/home/credit/products');
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to load products');
    }
    return Array.isArray(data) ? data : [];
  },

  verifyIapPurchase: async ({ appCode = APP_STORE.appSiteId, productId, transactionId, rawPayload }) => {
    const deviceId = await getDeviceId();
    const data = await apiPost('/home/credit/iap/verify', {
      appCode,
      productId,
      transactionId,
      deviceId,
      rawPayload: {
        ...rawPayload,
        platform: 'google',
        deviceId,
      },
    });
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Purchase verification failed');
    }
    return { ...data, creditBalance: readBalance(data) };
  },

  consumeCredits: async ({ appCode = APP_STORE.appSiteId, featureUsed, creditsConsumed }) => {
    const authed = await isLoggedIn();
    const body = { appCode, featureUsed, creditsConsumed };
    if (!authed) {
      body.deviceId = await getDeviceId();
    }
    const data = await apiPost('/home/credit/consume', body);
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to spend credits');
    }
    return { ...data, creditBalance: readBalance(data) };
  },

  /** Spend credits on the device wallet, even when a sign-in token is stored. */
  consumeDeviceCredits: async ({ appCode = APP_STORE.appSiteId, featureUsed, creditsConsumed }) => {
    const data = await apiPostPublic('/home/credit/consume', {
      appCode,
      featureUsed,
      creditsConsumed,
      deviceId: await getDeviceId(),
    });
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to spend credits');
    }
    return { ...data, creditBalance: readBalance(data) };
  },

  mergeGuestCredits: async (appCode = APP_STORE.appSiteId) => {
    const authed = await isLoggedIn();
    if (!authed) return null;
    const data = await apiPost('/home/credit/guest/merge', {
      appCode,
      deviceId: await getDeviceId(),
    });
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to merge guest credits');
    }
    return { ...data, creditBalance: readBalance(data) };
  },
};

export default CreditApi;
