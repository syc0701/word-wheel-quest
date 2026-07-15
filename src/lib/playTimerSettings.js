import AsyncStorage from '@react-native-async-storage/async-storage';

export const PLAY_TIMER_KEY = 'ww.play.timer';

/** Default is off: timer hidden on play + completion. */
export const PLAY_TIMER_DEFAULT = false;

/**
 * Returns whether the play/completion timer is enabled.
 * Missing or unknown values → false (never treat as on).
 */
export async function loadPlayTimerEnabled() {
  try {
    const raw = await AsyncStorage.getItem(PLAY_TIMER_KEY);
    if (raw == null) {
      await AsyncStorage.setItem(PLAY_TIMER_KEY, '0');
      return PLAY_TIMER_DEFAULT;
    }
    return raw === '1';
  } catch {
    return PLAY_TIMER_DEFAULT;
  }
}

export async function savePlayTimerEnabled(enabled) {
  const next = Boolean(enabled);
  try {
    await AsyncStorage.setItem(PLAY_TIMER_KEY, next ? '1' : '0');
  } catch {
    /* ignore */
  }
  return next;
}
