import AsyncStorage from '@react-native-async-storage/async-storage';

export const PLAY_TIMER_KEY = 'ww.play.timer';

/** Default: timer hidden on play + completion. */
export async function loadPlayTimerEnabled() {
  try {
    const raw = await AsyncStorage.getItem(PLAY_TIMER_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

export async function savePlayTimerEnabled(enabled) {
  try {
    await AsyncStorage.setItem(PLAY_TIMER_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
  return Boolean(enabled);
}
