import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isLoggedIn } from '../lib/auth';
import { getDeviceId } from '../lib/deviceId';
import { apiDelete, apiDeletePublic, apiGet, apiPost, apiPostPublic, apiPut } from '../lib/http';
import { APP_STORE } from '../constants/store';
import { SCREENS } from '../constants/theme';

const APP_CODE = APP_STORE.appSiteId || 'word_wheel_quest';
const STORED_TOKEN_KEY = 'word-wheel-push-device-token-v1';
/** Guest and signed-in toggle. Guests do not need an account. */
const LOCAL_PREF_KEY = 'ww.push.enabled.v1';
/** Must match backend FCM `android_channel_id` (MobilePushDeliveryService). */
export const ANDROID_PUSH_CHANNEL_ID = 'word_wheel_default';

let listenersAttached = false;
let navigateHandler = null;
let notificationHandlerReady = false;
let androidChannelReady = false;

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

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || androidChannelReady) {
    return;
  }
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_PUSH_CHANNEL_ID, {
      name: 'Word Wheel Quest',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0A2A4A',
      sound: 'default',
    });
    androidChannelReady = true;
  } catch (e) {
    if (__DEV__) {
      console.warn('[Push] setNotificationChannelAsync failed', e?.message || e);
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

async function readLocalPreference() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_PREF_KEY);
    if (raw == null) return null;
    return raw === '1';
  } catch {
    return null;
  }
}

async function writeLocalPreference(enabled) {
  try {
    await AsyncStorage.setItem(LOCAL_PREF_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

async function registerTokenWithBackend(deviceToken) {
  const deviceId = await getDeviceId();
  const body = {
    appCode: APP_CODE,
    platform: pushPlatform(),
    deviceToken,
    deviceId,
  };
  const authed = await isLoggedIn();
  const response = authed
    ? await apiPost('/home/push/device-token', body)
    : await apiPostPublic('/home/push/device-token', body);
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
    const deviceId = await getDeviceId();
    const body = {
      appCode: APP_CODE,
      deviceToken,
      deviceId,
    };
    const authed = await isLoggedIn();
    if (authed) {
      await apiDelete('/home/push/device-token', body);
    } else {
      await apiDeletePublic('/home/push/device-token', body);
    }
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

/** Handle a tap that launched the app from a killed state. */
async function consumeLastNotificationResponse() {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      handleNotificationData(response?.notification?.request?.content?.data);
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[Push] getLastNotificationResponseAsync failed', e?.message || e);
    }
  }
}

async function getAppNotificationPreference() {
  const authed = await isLoggedIn();
  if (!authed) {
    return (await readLocalPreference()) === true;
  }
  const response = await apiGet('/home/push/preference', { appCode: APP_CODE });
  if (response?.code === 'FAILURE') {
    throw new Error(response?.message || 'Failed to load notification preference');
  }
  const enabled = typeof response?.enabled === 'boolean' ? response.enabled : true;
  await writeLocalPreference(enabled);
  return enabled;
}

async function setAppNotificationPreference(enabled) {
  const on = Boolean(enabled);
  await writeLocalPreference(on);
  if (!(await isLoggedIn())) {
    return on;
  }
  const response = await apiPut('/home/push/preference', {
    appCode: APP_CODE,
    enabled: on,
  });
  if (response?.code === 'FAILURE') {
    throw new Error(response?.message || 'Failed to save notification preference');
  }
  return typeof response?.enabled === 'boolean' ? response.enabled : on;
}

async function userWantsNotifications() {
  if (!(await isLoggedIn())) {
    return (await readLocalPreference()) === true;
  }
  try {
    return await getAppNotificationPreference();
  } catch (e) {
    if (__DEV__) {
      console.warn('[Push] preference read failed', e?.message || e);
    }
    return (await readLocalPreference()) === true;
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
    await ensureAndroidChannel();
    attachListeners();
    await consumeLastNotificationResponse();

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
    await ensureAndroidChannel();
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
