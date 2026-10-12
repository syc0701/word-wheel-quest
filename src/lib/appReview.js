import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';
import { APP_STORE } from '../constants/store';
import { isLoggedIn } from './auth';
import { apiGet, apiPost } from './http';

const STORAGE_KEY = 'ww.appReview.promptedAt.v1';
const COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000;

/** Victory popup at 5, 10, 15, 20, and every 5 levels after that. */
export function isAppReviewMilestone(levelNumber) {
  const level = Number(levelNumber) || 0;
  return level > 0 && level % 5 === 0;
}

function reviewPlatform() {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

async function readGuestPromptedAt() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const promptedAt = Number(raw);
    return Number.isFinite(promptedAt) && promptedAt > 0 ? promptedAt : 0;
  } catch {
    return 0;
  }
}

async function writeGuestPromptedAt(promptedAt = Date.now()) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(promptedAt));
  } catch {
    /* ignore */
  }
}

/** Signed-in players use the server cooldown. Guests use the device timestamp. */
export async function isAppReviewEligible() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    const promptedAt = await readGuestPromptedAt();
    if (!promptedAt) return true;
    return Date.now() - promptedAt >= COOLDOWN_MS;
  }
  const data = await apiGet('/home/app-review/eligible', { appCode: APP_STORE.appSiteId });
  if (data?.code === 'FAILURE') return false;
  return Boolean(data?.eligible);
}

/** Remember that the native review dialog is about to open. */
export async function recordAppReviewPrompt() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    await writeGuestPromptedAt();
    return;
  }
  const data = await apiPost('/home/app-review', {
    appCode: APP_STORE.appSiteId,
    platform: reviewPlatform(),
  });
  if (data?.code === 'FAILURE') {
    throw new Error(data.message || 'Failed to save app review');
  }
}

/** Opens the Play in-app review dialog. The store page is not used. */
export async function requestNativeReview() {
  await StoreReview.requestReview();
}
