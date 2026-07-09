import { useCallback, useEffect, useMemo, useState } from 'react';
import CreditApi from '../lib/creditApi';
import { isLoggedIn } from '../lib/auth';
import { fetchUserInfo, resolveWordWheelQuestCoins, ensureUserAfterSignup } from '../lib/userApi';

export const WORD_WHEEL_LOW_CREDITS_BALANCE = 10;
export const WORD_WHEEL_LOW_HINT_POINTS_BALANCE = 5;

export default function useWordWheelWallet() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
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
        return;
      }

      const [balanceResult, userInfo] = await Promise.all([
        CreditApi.fetchBalance().catch(() => ({ creditBalance: 0 })),
        fetchUserInfo().catch(() => null),
      ]);

      if (userInfo?.cloudUser) {
        await ensureUserAfterSignup();
      }

      setCreditBalance(balanceResult.creditBalance);
      setLifetimePoints(resolveWordWheelQuestCoins(userInfo?.cloudUser));
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

  const showCreditPurchase = loggedIn && creditBalance < WORD_WHEEL_LOW_CREDITS_BALANCE;
  const showPointPurchase = loggedIn && lifetimePoints < WORD_WHEEL_LOW_HINT_POINTS_BALANCE;

  return useMemo(
    () => ({
      loggedIn,
      creditBalance,
      lifetimePoints,
      loading,
      refreshing,
      error,
      showCreditPurchase,
      showPointPurchase,
      refresh,
      consumeHintCredits,
    }),
    [
      loggedIn,
      creditBalance,
      lifetimePoints,
      loading,
      refreshing,
      error,
      showCreditPurchase,
      showPointPurchase,
      refresh,
      consumeHintCredits,
    ]
  );
}
