import { APP_STORE } from '../constants/store';
import { apiGet, apiPost } from './http';
import { ensurePlayIntegrityPassed } from './playIntegrity';

function readBalance(payload) {
  const n = Number(payload?.creditBalance);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function requirePlayIntegrity(actionLabel) {
  const gate = await ensurePlayIntegrityPassed();
  if (gate.ok) return;
  const detail = gate.reason ? ` (${gate.reason})` : '';
  throw new Error(
    `Device integrity check failed for ${actionLabel}${detail}. Try again from an official Play Store install.`
  );
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
    await requirePlayIntegrity('verifyIapPurchase');
    const data = await apiPost('/home/credit/iap/verify', {
      appCode,
      productId,
      transactionId,
      rawPayload: {
        ...rawPayload,
        platform: 'google',
      },
    });
    if (data?.code === 'FAILURE') {
      throw new Error(data.message || 'Purchase verification failed');
    }
    return { ...data, creditBalance: readBalance(data) };
  },

  consumeCredits: async ({ appCode = APP_STORE.appSiteId, featureUsed, creditsConsumed }) => {
    await requirePlayIntegrity('consumeCredits');
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
