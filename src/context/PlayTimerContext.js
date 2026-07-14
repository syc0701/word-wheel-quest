import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadPlayTimerEnabled, savePlayTimerEnabled } from '../lib/playTimerSettings';

const PlayTimerContext = createContext(null);

export function PlayTimerProvider({ children }) {
  const [timerEnabled, setTimerState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const enabled = await loadPlayTimerEnabled();
      if (cancelled) return;
      setTimerState(enabled);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTimerEnabled = useCallback(async (enabled) => {
    const next = await savePlayTimerEnabled(enabled);
    setTimerState(next);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      timerEnabled,
      setTimerEnabled,
    }),
    [ready, timerEnabled, setTimerEnabled]
  );

  return <PlayTimerContext.Provider value={value}>{children}</PlayTimerContext.Provider>;
}

export function usePlayTimer() {
  const ctx = useContext(PlayTimerContext);
  if (!ctx) {
    return {
      ready: true,
      timerEnabled: false,
      setTimerEnabled: async () => {},
    };
  }
  return ctx;
}
