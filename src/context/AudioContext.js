import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadAudioPrefs,
  saveMusicEnabled,
  saveSfxEnabled,
} from '../lib/audioSettings';
import { BGM_SCENES, soundManager } from '../lib/soundManager';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [musicEnabled, setMusicState] = useState(true);
  const [sfxEnabled, setSfxState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadAudioPrefs();
      if (cancelled) return;
      setMusicState(prefs.musicEnabled);
      setSfxState(prefs.sfxEnabled);
      await soundManager.configure({
        music: prefs.musicEnabled,
        sfx: prefs.sfxEnabled,
      });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMusicEnabled = useCallback(async (enabled) => {
    const next = await saveMusicEnabled(enabled);
    setMusicState(next);
    await soundManager.setMusicEnabled(next);
  }, []);

  const setSfxEnabled = useCallback(async (enabled) => {
    const next = await saveSfxEnabled(enabled);
    setSfxState(next);
    await soundManager.setSfxEnabled(next);
  }, []);

  /** Master mute — background music and game SFX together (Play screen volume control). */
  const setSoundEnabled = useCallback(async (enabled) => {
    const on = Boolean(enabled);
    const [music, sfx] = await Promise.all([
      saveMusicEnabled(on),
      saveSfxEnabled(on),
    ]);
    setMusicState(music);
    setSfxState(sfx);
    await soundManager.configure({ music, sfx });
  }, []);

  const setBgmScene = useCallback(async (scene) => {
    await soundManager.setScene(scene);
  }, []);

  const playSfx = useCallback(async (key) => {
    await soundManager.playSfx(key);
  }, []);

  const soundEnabled = musicEnabled && sfxEnabled;

  const value = useMemo(
    () => ({
      ready,
      musicEnabled,
      sfxEnabled,
      soundEnabled,
      setMusicEnabled,
      setSfxEnabled,
      setSoundEnabled,
      setBgmScene,
      playSfx,
    }),
    [
      ready,
      musicEnabled,
      sfxEnabled,
      soundEnabled,
      setMusicEnabled,
      setSfxEnabled,
      setSoundEnabled,
      setBgmScene,
      playSfx,
    ]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    return {
      ready: true,
      musicEnabled: true,
      sfxEnabled: true,
      soundEnabled: true,
      setMusicEnabled: async () => {},
      setSfxEnabled: async () => {},
      setSoundEnabled: async () => {},
      setBgmScene: async () => {},
      playSfx: async () => {},
    };
  }
  return ctx;
}

export { BGM_SCENES };
