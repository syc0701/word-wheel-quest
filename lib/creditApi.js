import { APP_STORE } from '../constants/store';
import { apiGet, apiPost } from './http';

function readBalance(payload) {
  const n = Number(payload?.creditBalance);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const CreditApi = {
  fetchBalance: async (appCode = APP_STORE.appSiteId) => {
    const data = await apiGet('/home/credit/balance', { appCode });
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to load credit balance');
    }
    return { appCode: data?.appCode || appCode, creditBalance: readBalance(data) };
  },

  fetchProducts: async () => {
    const data = await apiGet('/home/credit/products');
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to load products');
    }
    return Array.isArray(data) ? data : [];
  },

  verifyIapPurchase: async ({ appCode = APP_STORE.appSiteId, productId, transactionId, rawPayload }) => {
    const data = await apiPost('/home/credit/iap/verify', {
      appCode,
      productId,
      transactionId,
      rawPayload,
    });
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Purchase verification failed');
    }
    return { ...data, creditBalance: readBalance(data) };
  },

  consumeCredits: async ({ appCode = APP_STORE.appSiteId, featureUsed, creditsConsumed }) => {
    const data = await apiPost('/home/credit/consume', {
      appCode,
      featureUsed,
      creditsConsumed,
    });
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Failed to spend credits');
    }
    return { ...data, creditBalance: readBalance(data) };
  },
};

export default CreditApi;
