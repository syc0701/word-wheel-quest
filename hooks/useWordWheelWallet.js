import { useCallback, useEffect, useMemo, useState } from 'react';
import CreditApi from '../lib/creditApi';
import { getAuthTokenClaims, isLoggedIn } from '../lib/auth';
import {
  fetchUserInfo,
  normalizeCloudUserPayload,
  resolveAccountLabel,
  resolveWordWheelQuestCoins,
  ensureUserAfterSignup,
  summarizeUserIdentity,
} from '../lib/userApi';

export const WORD_WHEEL_LOW_CREDITS_BALANCE = 10;
export const WORD_WHEEL_LOW_HINT_POINTS_BALANCE = 1;

export default function useWordWheelWallet() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [accountLabel, setAccountLabel] = useState('');
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
        setCreditBalance(0);
        setLifetimePoints(0);
        setAccountLabel('');
        return;
      }

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

      if (__DEV__) {
        console.log('[Wallet] user identity', summarizeUserIdentity(cloudUser, claims));
        console.log('[Wallet] raw JWT claims', claims);
        console.log('[Wallet] /home/user payload', userInfo);
        console.log('[Wallet] puzzle coins', coins, cloudUser?.puzzleCoins);
      }

      setCreditBalance(balanceResult.creditBalance);
      setLifetimePoints(coins);
      setAccountLabel(label);
    } catch (err) {
      setError(err?.message || 'Failed to load wallet');
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

  const showCreditPurchase = loggedIn && creditBalance < WORD_WHEEL_LOW_CREDITS_BALANCE;
  const showPointPurchase = loggedIn && lifetimePoints < WORD_WHEEL_LOW_HINT_POINTS_BALANCE;

  return useMemo(
    () => ({
      loggedIn,
      creditBalance,
      lifetimePoints,
      accountLabel,
      loading,
      refreshing,
      error,
      showCreditPurchase,
      showPointPurchase,
      refresh,
      consumeHintCredits,
      spendLifetimePoints,
    }),
    [
      loggedIn,
      creditBalance,
      lifetimePoints,
      accountLabel,
      loading,
      refreshing,
      error,
      showCreditPurchase,
      showPointPurchase,
      refresh,
      consumeHintCredits,
      spendLifetimePoints,
    ]
  );
}
