import AsyncStorage from '@react-native-async-storage/async-storage';

export const PLAY_TIMER_KEY = 'ww.play.timer';

/** Default is off: timer hidden on play + completion. */
export const PLAY_TIMER_DEFAULT = false;

/**
 * Play/completion timer is retired — always off.
 * Kept so older installs that had it enabled stop showing the clock.
 */
export async function loadPlayTimerEnabled() {
  try {
    await AsyncStorage.setItem(PLAY_TIMER_KEY, '0');
  } catch {
    /* ignore */
  }
  return PLAY_TIMER_DEFAULT;
}

export async function savePlayTimerEnabled() {
  try {
    await AsyncStorage.setItem(PLAY_TIMER_KEY, '0');
  } catch {
    /* ignore */
  }
  return false;
}
