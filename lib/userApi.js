import { APP_STORE } from '../constants/store';
import { apiGet, apiPost } from './http';

export function resolveWordWheelQuestCoins(cloudUser) {
  const map = cloudUser?.puzzleCoins;
  if (!map || typeof map !== 'object') return 0;
  const n = Number(map[APP_STORE.appSiteId] ?? map.word_wheel_quest);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function fetchUserInfo() {
  const data = await apiGet('/home/user');
  if (data?.code === 'FAILURE') {
    throw new Error(data.message || 'Failed to load user profile');
  }
  return data;
}

export async function ensureUserAfterSignup() {
  try {
    await apiPost('/home/user/after-signup', {});
  } catch {
    /* optional bootstrap */
  }
}
