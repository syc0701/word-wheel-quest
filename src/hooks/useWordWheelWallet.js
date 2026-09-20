import { useCallback, useEffect, useMemo, useState } from 'react';
import CreditApi from '../lib/creditApi';
import { getAuthTokenClaims, isLoggedIn } from '../lib/auth';
import { t } from '../lib/i18n';
import {
  fetchUserInfo,
  normalizeCloudUserPayload,
  resolveAccountLabel,
  resolveWordWheelQuestCoins,
  ensureUserAfterSignup,
  summarizeUserIdentity,
} from '../lib/userApi';

export const WORD_WHEEL_LOW_CREDITS_BALANCE = 10;
export const WORD_WHEEL_LOW_HINT_POINTS_BALANCE = 10;

export default function useWordWheelWallet() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [accountLabel, setAccountLabel] = useState('');
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const authed = await isLoggedIn();
      setLoggedIn(authed);

      if (!authed) {
        const balanceResult = await CreditApi.fetchBalance().catch(() => ({ creditBalance: 0 }));
        setCreditBalance(balanceResult.creditBalance);
        setLifetimePoints(0);
        setAccountLabel('');
        setIsDeveloper(false);
        return;
      }

      await CreditApi.mergeGuestCredits().catch(() => null);

      const claims = await getAuthTokenClaims().catch(() => null);
      let userInfo = await fetchUserInfo().catch(() => null);
      let cloudUser = normalizeCloudUserPayload(userInfo);

      if (!cloudUser) {
        await ensureUserAfterSignup(claims);
        userInfo = await fetchUserInfo().catch(() => null);
        cloudUser = normalizeCloudUserPayload(userInfo);
      } else {
        await ensureUserAfterSignup(claims);
      }

      const label = resolveAccountLabel(cloudUser, claims);
      const coins = resolveWordWheelQuestCoins(cloudUser);
      const balanceResult = await CreditApi.fetchBalance().catch(() => ({ creditBalance: 0 }));
      const developerFlag = Boolean(
        cloudUser?.isDeveloper ?? cloudUser?.developer ?? false
      );

      if (__DEV__) {
        console.log('[Wallet] user identity', summarizeUserIdentity(cloudUser, claims));
        console.log('[Wallet] raw JWT claims', claims);
        console.log('[Wallet] /home/user payload', userInfo);
        console.log('[Wallet] puzzle coins', coins, cloudUser?.puzzleCoins);
        console.log('[Wallet] isDeveloper', developerFlag);
      }

      setCreditBalance(balanceResult.creditBalance);
      setLifetimePoints(coins);
      setAccountLabel(label);
      setIsDeveloper(developerFlag);
    } catch (err) {
      setError(err?.message || t('wallet.error.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const consumeHintCredits = useCallback(async ({ playId, creditsConsumed }) => {
    const featureUsed = playId
      ? `word_wheel_hint:${playId}:${Date.now()}`
      : `word_wheel_hint:${Date.now()}`;
    const result = await CreditApi.consumeCredits({ featureUsed, creditsConsumed });
    setCreditBalance(result.creditBalance);
    return result;
  }, []);

  /** Spend puzzle coins locally (server balance refreshes on next profile fetch). */
  const spendLifetimePoints = useCallback((amount) => {
    const n = Math.max(0, Number(amount) || 0);
    setLifetimePoints((prev) => Math.max(0, prev - n));
  }, []);

  /** Show a known credit balance immediately, before the next wallet refresh. */
  const noteCreditBalance = useCallback((amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) return;
    setCreditBalance(n);
  }, []);

  /** Add puzzle coins locally (e.g. bonus-word gift). */
  const addLifetimePoints = useCallback((amount) => {
    const n = Math.max(0, Number(amount) || 0);
    if (!n) return;
    setLifetimePoints((prev) => prev + n);
  }, []);

  const showCreditPurchase = loggedIn && creditBalance < WORD_WHEEL_LOW_CREDITS_BALANCE;
  const showPointPurchase = loggedIn && lifetimePoints < WORD_WHEEL_LOW_HINT_POINTS_BALANCE;

  return useMemo(
    () => ({
      loggedIn,
      creditBalance,
      lifetimePoints,
      accountLabel,
      isDeveloper,
      loading,
      refreshing,
      error,
      showCreditPurchase,
      showPointPurchase,
      refresh,
      consumeHintCredits,
      spendLifetimePoints,
      addLifetimePoints,
      noteCreditBalance,
    }),
    [
      loggedIn,
      creditBalance,
      lifetimePoints,
      accountLabel,
      isDeveloper,
      loading,
      refreshing,
      error,
      showCreditPurchase,
      showPointPurchase,
      refresh,
      consumeHintCredits,
      spendLifetimePoints,
      addLifetimePoints,
      noteCreditBalance,
    ]
  );
}
