import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  APPEARANCE_DARK,
  APPEARANCE_LIGHT,
  APPEARANCE_RANDOM,
  getColors,
  getWW,
  loadAppearance,
  saveAppearance,
} from '../lib/appearance';
import { resolveSceneBackground } from '../lib/bgAssets';

const AppearanceContext = createContext(null);

export function AppearanceProvider({ children }) {
  const [mode, setModeState] = useState(APPEARANCE_RANDOM);
  const [ready, setReady] = useState(false);
  const [weeklyBg, setWeeklyBg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadAppearance();
      if (cancelled) return;
      setModeState(loaded);
      if (loaded === APPEARANCE_RANDOM) {
        const bg = resolveSceneBackground();
        if (!cancelled) setWeeklyBg(bg);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(async (nextMode) => {
    const normalized = await saveAppearance(nextMode);
    setModeState(normalized);
    if (normalized === APPEARANCE_RANDOM) {
      setWeeklyBg(resolveSceneBackground());
    } else {
      setWeeklyBg(null);
    }
    return normalized;
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      ready,
      isDark: mode === APPEARANCE_DARK,
      isRandomScene: mode === APPEARANCE_RANDOM,
      weeklyBg,
      ww: getWW(mode),
      colors: getColors(mode),
    }),
    [mode, setMode, ready, weeklyBg]
  );

  return (
    <AppearanceContext.Provider value={value}>
      <StatusBar style={value.ww.statusBar === 'dark' ? 'dark' : 'light'} />
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    return {
      mode: APPEARANCE_RANDOM,
      setMode: async () => {},
      ready: true,
      isDark: false,
      isRandomScene: true,
      weeklyBg: null,
      ww: getWW(APPEARANCE_RANDOM),
      colors: getColors(APPEARANCE_RANDOM),
    };
  }
  return ctx;
}

export { APPEARANCE_LIGHT, APPEARANCE_DARK, APPEARANCE_RANDOM };
