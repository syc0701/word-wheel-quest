import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  APPEARANCE_DARK,
  APPEARANCE_LIGHT,
  getColors,
  getWW,
  loadAppearance,
  saveAppearance,
} from '../lib/appearance';

const AppearanceContext = createContext(null);

export function AppearanceProvider({ children }) {
  const [mode, setModeState] = useState(APPEARANCE_LIGHT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadAppearance();
      if (!cancelled) {
        setModeState(loaded);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(async (nextMode) => {
    const normalized = await saveAppearance(nextMode);
    setModeState(normalized);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      ready,
      isDark: mode === APPEARANCE_DARK,
      ww: getWW(mode),
      colors: getColors(mode),
    }),
    [mode, ready, setMode]
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
      mode: APPEARANCE_LIGHT,
      setMode: async () => {},
      ready: true,
      isDark: false,
      ww: getWW(APPEARANCE_LIGHT),
      colors: getColors(APPEARANCE_LIGHT),
    };
  }
  return ctx;
}

export { APPEARANCE_LIGHT, APPEARANCE_DARK };
