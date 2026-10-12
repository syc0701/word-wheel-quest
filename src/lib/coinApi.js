import { APP_STORE } from '../constants/store';
import { apiGet, apiPost } from './http';
import { resolveWordWheelQuestCoins } from './userApi';

/**
 * Signed-in daily coin gift.
 * POST /home/coin/daily-gift
 *
 * Auth: the usual home JWT. Guests do not call this.
 * Idempotent on user + appCode + claimDate. A repeat of the same local
 * date returns alreadyClaimed and does not add coins again.
 *
 * Body:
 *   appCode    word_wheel_quest
 *   coins      2 or 3
 *   claimDate  local YYYY-MM-DD
 *   streak     day count after this claim
 *
 * Writes puzzleCoins[word_wheel_quest] on the account coin table.
 * Returns the new balance for this app, plus alreadyClaimed.
 */
/**
 * Whether today's Montreal gift is still unclaimed. Does not award coins.
 * GET /home/wordwheel/daily-gift
 */
export async function peekDailyGift() {
  const data = await apiGet('/home/wordwheel/daily-gift');
  if (data?.code === 'FAILURE') {
    throw new Error(data.message || 'Failed to check daily gift');
  }
  return {
    today: typeof data?.today === 'string' ? data.today : '',
    available: Boolean(data?.available),
    alreadyClaimed: Boolean(data?.alreadyClaimed),
    grant: Math.max(0, Math.floor(Number(data?.grant) || 0)),
    wordWheelCoins: Math.max(0, Math.floor(Number(data?.wordWheelCoins) || 0)),
  };
}

export async function grantDailyGift({
  appCode = APP_STORE.appSiteId,
  coins,
  claimDate,
  streak,
}) {
  const data = await apiPost('/home/coin/daily-gift', {
    appCode,
    coins,
    claimDate,
    streak,
  });
  if (data?.code === 'FAILURE') {
    throw new Error(data.message || 'Failed to grant daily gift');
  }
  const puzzleCoins = data?.puzzleCoins;
  const balance = Number(data?.coinBalance);
  return {
    alreadyClaimed: Boolean(data?.alreadyClaimed),
    coinBalance: Number.isFinite(balance) && balance >= 0
      ? balance
      : resolveWordWheelQuestCoins({ puzzleCoins }),
    puzzleCoins,
  };
}
