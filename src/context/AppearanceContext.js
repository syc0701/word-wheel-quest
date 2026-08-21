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
  resolveHomeBackground,
  resolvePlayBackground,
  resolveSceneBackground,
  saveStoredSceneLevel,
} from '../lib/bgAssets';

const AppearanceContext = createContext(null);

export function AppearanceProvider({ children }) {
  const [mode, setModeState] = useState(APPEARANCE_RANDOM);
  const [ready, setReady] = useState(false);
  const [weeklyBg, setWeeklyBg] = useState(null);
  const [homeBg, setHomeBg] = useState(null);
  const [playBg, setPlayBg] = useState(null);
  const [sceneLevel, setSceneLevelState] = useState(0);
  const sceneLevelRef = useRef(0);

  const applySceneBackgrounds = useCallback((level) => {
    setWeeklyBg(resolveSceneBackground(level));
    setHomeBg(resolveHomeBackground(level));
    setPlayBg(resolvePlayBackground(level));
  }, []);

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
        applySceneBackgrounds(storedLevel);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [applySceneBackgrounds]);

  const setMode = useCallback(async (nextMode) => {
    const normalized = await saveAppearance(nextMode);
    setModeState(normalized);
    if (normalized === APPEARANCE_RANDOM) {
      applySceneBackgrounds(sceneLevelRef.current);
    } else {
      setWeeklyBg(null);
      setHomeBg(null);
      setPlayBg(null);
    }
    return normalized;
  }, [applySceneBackgrounds]);

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
    applySceneBackgrounds(sceneLevel);
  }, [mode, sceneLevel, applySceneBackgrounds]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      ready,
      isDark: mode === APPEARANCE_DARK,
      isRandomScene: mode === APPEARANCE_RANDOM,
      weeklyBg,
      homeBg,
      playBg,
      sceneLevel,
      setSceneLevel,
      ww: getWW(mode),
      colors: getColors(mode),
    }),
    [mode, setMode, ready, weeklyBg, homeBg, playBg, sceneLevel, setSceneLevel]
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
      homeBg: null,
      playBg: null,
      sceneLevel: 0,
      setSceneLevel: () => {},
      ww: getWW(APPEARANCE_RANDOM),
      colors: getColors(APPEARANCE_RANDOM),
    };
  }
  return ctx;
}

export { APPEARANCE_LIGHT, APPEARANCE_DARK, APPEARANCE_RANDOM };
