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

  const setBgmScene = useCallback(async (scene) => {
    await soundManager.setScene(scene);
  }, []);

  const playSfx = useCallback(async (key) => {
    await soundManager.playSfx(key);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      musicEnabled,
      sfxEnabled,
      setMusicEnabled,
      setSfxEnabled,
      setBgmScene,
      playSfx,
    }),
    [ready, musicEnabled, sfxEnabled, setMusicEnabled, setSfxEnabled, setBgmScene, playSfx]
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
      setMusicEnabled: async () => {},
      setSfxEnabled: async () => {},
      setBgmScene: async () => {},
      playSfx: async () => {},
    };
  }
  return ctx;
}

export { BGM_SCENES };
