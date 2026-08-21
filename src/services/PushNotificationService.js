import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isLoggedIn } from '../lib/auth';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/http';
import { APP_STORE } from '../constants/store';
import { SCREENS } from '../constants/theme';

const APP_CODE = APP_STORE.appSiteId || 'word_wheel_quest';
const STORED_TOKEN_KEY = 'word-wheel-push-device-token-v1';

let listenersAttached = false;
let navigateHandler = null;
let notificationHandlerReady = false;

function ensureNotificationHandler() {
  if (notificationHandlerReady) return;
  notificationHandlerReady = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    if (__DEV__) {
      console.warn('[Push] setNotificationHandler failed', e?.message || e);
    }
  }
}

export function setPushNavigateHandler(handler) {
  navigateHandler = typeof handler === 'function' ? handler : null;
}

export function isPushSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function pushPlatform() {
  return Platform.OS === 'android' ? 'android' : 'ios';
}

async function getStoredToken() {
  try {
    return (await AsyncStorage.getItem(STORED_TOKEN_KEY)) || '';
  } catch {
    return '';
  }
}

async function registerTokenWithBackend(deviceToken) {
  const response = await apiPost('/home/push/device-token', {
    appCode: APP_CODE,
    platform: pushPlatform(),
    deviceToken,
  });
  if (response?.code === 'FAILURE') {
    throw new Error(response?.message || 'Failed to register push token');
  }
  try {
    await AsyncStorage.setItem(STORED_TOKEN_KEY, deviceToken);
  } catch {
    /* ignore */
  }
}

async function unregisterTokenFromBackend(deviceToken) {
  if (!deviceToken) {
    return;
  }
  try {
    await apiDelete('/home/push/device-token', {
      appCode: APP_CODE,
      deviceToken,
    });
  } catch (e) {
    if (__DEV__) {
      console.warn('[Push] unregister failed', e?.message || e);
    }
  }
  try {
    await AsyncStorage.removeItem(STORED_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function handleNotificationData(data) {
  if (!data || typeof data !== 'object' || !navigateHandler) {
    return;
  }
  const tplId =
    (typeof data.tplId === 'string' && data.tplId.trim()) ||
    (typeof data.wordWheelTplId === 'string' && data.wordWheelTplId.trim()) ||
    '';
  // Open Play so the user lands in the app after tapping a new-puzzle alert.
  navigateHandler(SCREENS.PLAY, {
    mode: 'journey',
    t: Date.now(),
    ...(tplId ? { tplId } : null),
  });
}

function attachListeners() {
  if (listenersAttached) {
    return;
  }
  listenersAttached = true;
  ensureNotificationHandler();

  Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationData(response?.notification?.request?.content?.data);
  });
}

async function getAppNotificationPreference() {
  const response = await apiGet('/home/push/preference', { appCode: APP_CODE });
  if (response?.code === 'FAILURE') {
    throw new Error(response?.message || 'Failed to load notification preference');
  }
  if (typeof response?.enabled === 'boolean') {
    return response.enabled;
  }
  return true;
}

async function setAppNotificationPreference(enabled) {
  const response = await apiPut('/home/push/preference', {
    appCode: APP_CODE,
    enabled: Boolean(enabled),
  });
  if (response?.code === 'FAILURE') {
    throw new Error(response?.message || 'Failed to save notification preference');
  }
  return typeof response?.enabled === 'boolean' ? response.enabled : Boolean(enabled);
}

async function userWantsNotifications() {
  const authed = await isLoggedIn();
  if (!authed) {
    return false;
  }
  try {
    return await getAppNotificationPreference();
  } catch (e) {
    if (__DEV__) {
      console.warn('[Push] preference read failed', e?.message || e);
    }
    return false;
  }
}

async function registerDeviceTokenIfPossible() {
  const tokenResult = await Notifications.getDevicePushTokenAsync();
  const value = tokenResult?.data;
  if (!value || typeof value !== 'string') {
    return;
  }
  await registerTokenWithBackend(value);
}

const PushNotificationService = {
  APP_CODE,
  isPushSupported,
  setPushNavigateHandler,
  getAppNotificationPreference,
  setAppNotificationPreference,

  async syncPushNotificationsIfNeeded() {
    if (!isPushSupported()) {
      return;
    }
    ensureNotificationHandler();
    attachListeners();

    const authed = await isLoggedIn();
    if (!authed) {
      const stored = await getStoredToken();
      if (stored) {
        await unregisterTokenFromBackend(stored);
      }
      return;
    }

    if (!(await userWantsNotifications())) {
      const stored = await getStoredToken();
      if (stored) {
        await unregisterTokenFromBackend(stored);
      }
      return;
    }

    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted') {
      return;
    }

    try {
      await registerDeviceTokenIfPossible();
    } catch (e) {
      if (__DEV__) {
        console.warn('[Push] register token failed', e?.message || e);
      }
    }
  },

  async enablePushNotifications() {
    if (!isPushSupported()) {
      return { ok: false, reason: 'unsupported' };
    }
    ensureNotificationHandler();
    attachListeners();
    const perm = await Notifications.requestPermissionsAsync();
    if (perm.status !== 'granted') {
      return { ok: false, reason: 'denied' };
    }
    try {
      await registerDeviceTokenIfPossible();
      return { ok: true };
    } catch (e) {
      if (__DEV__) {
        console.warn('[Push] enable failed', e?.message || e);
      }
      return { ok: false, reason: 'register_failed' };
    }
  },

  async disablePushNotifications() {
    await unregisterTokenFromBackend(await getStoredToken());
    return { ok: true };
  },
};

export default PushNotificationService;
