import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUDIO_MUSIC_KEY = 'ww.audio.music';
export const AUDIO_SFX_KEY = 'ww.audio.sfx';

export async function loadAudioPrefs() {
  try {
    const [musicRaw, sfxRaw] = await Promise.all([
      AsyncStorage.getItem(AUDIO_MUSIC_KEY),
      AsyncStorage.getItem(AUDIO_SFX_KEY),
    ]);
    return {
      musicEnabled: musicRaw == null ? true : musicRaw === '1',
      sfxEnabled: sfxRaw == null ? true : sfxRaw === '1',
    };
  } catch {
    return { musicEnabled: true, sfxEnabled: true };
  }
}

export async function saveMusicEnabled(enabled) {
  try {
    await AsyncStorage.setItem(AUDIO_MUSIC_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
  return Boolean(enabled);
}

export async function saveSfxEnabled(enabled) {
  try {
    await AsyncStorage.setItem(AUDIO_SFX_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
  return Boolean(enabled);
}
