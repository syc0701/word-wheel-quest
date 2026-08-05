import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SystemBars } from 'react-native-edge-to-edge';
import {
  APPEARANCE_DARK,
  APPEARANCE_LIGHT,
  APPEARANCE_RANDOM,
  getColors,
  getWW,
  loadAppearance,
  saveAppearance,
} from '../lib/appearance';
import {
  loadStoredSceneLevel,
  resolveSceneBackground,
  saveStoredSceneLevel,
} from '../lib/bgAssets';

const AppearanceContext = createContext(null);

export function AppearanceProvider({ children }) {
  const [mode, setModeState] = useState(APPEARANCE_RANDOM);
  const [ready, setReady] = useState(false);
  const [weeklyBg, setWeeklyBg] = useState(null);
  const [sceneLevel, setSceneLevelState] = useState(0);
  const sceneLevelRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loaded, storedLevel] = await Promise.all([
        loadAppearance(),
        loadStoredSceneLevel(),
      ]);
      if (cancelled) return;
      setModeState(loaded);
      sceneLevelRef.current = storedLevel;
      setSceneLevelState(storedLevel);
      if (loaded === APPEARANCE_RANDOM) {
        setWeeklyBg(resolveSceneBackground(storedLevel));
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
      setWeeklyBg(resolveSceneBackground(sceneLevelRef.current));
    } else {
      setWeeklyBg(null);
    }
    return normalized;
  }, []);

  /** Keep Image theme scene in sync with season journey level (changes every 50 levels). */
  const setSceneLevel = useCallback((level) => {
    const n = Number(level);
    if (!Number.isFinite(n) || n <= 0) return;
    const next = Math.floor(n);
    if (next === sceneLevelRef.current) return;
    sceneLevelRef.current = next;
    setSceneLevelState(next);
    saveStoredSceneLevel(next);
  }, []);

  useEffect(() => {
    if (mode !== APPEARANCE_RANDOM) return;
    setWeeklyBg(resolveSceneBackground(sceneLevel));
  }, [mode, sceneLevel]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      ready,
      isDark: mode === APPEARANCE_DARK,
      isRandomScene: mode === APPEARANCE_RANDOM,
      weeklyBg,
      sceneLevel,
      setSceneLevel,
      ww: getWW(mode),
      colors: getColors(mode),
    }),
    [mode, setMode, ready, weeklyBg, sceneLevel, setSceneLevel]
  );

  return (
    <AppearanceContext.Provider value={value}>
      <SystemBars style={value.ww.statusBar === 'dark' ? 'dark' : 'light'} />
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
      sceneLevel: 0,
      setSceneLevel: () => {},
      ww: getWW(APPEARANCE_RANDOM),
      colors: getColors(APPEARANCE_RANDOM),
    };
  }
  return ctx;
}

export { APPEARANCE_LIGHT, APPEARANCE_DARK, APPEARANCE_RANDOM };
