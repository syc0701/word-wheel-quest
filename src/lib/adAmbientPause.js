import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Pause decorative Reanimated loops while a rewarded ad owns the window.
 * Prevents Android ANRs (NodesManager.onAnimationFrame / no focused window).
 */

let adPaused = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(adPaused);
    } catch {
      /* ignore */
    }
  });
}

export function isAdAmbientPaused() {
  return adPaused;
}

export function pauseAmbientForAd() {
  if (adPaused) return;
  adPaused = true;
  notify();
}

export function resumeAmbientAfterAd() {
  if (!adPaused) return;
  adPaused = false;
  notify();
}

export function subscribeAdAmbientPause(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when the app is foreground and no rewarded ad is open. */
export function useAmbientActive() {
  const [active, setActive] = useState(
    AppState.currentState === 'active' && !adPaused
  );

  useEffect(() => {
    const sync = () => {
      setActive(AppState.currentState === 'active' && !adPaused);
    };
    const appSub = AppState.addEventListener('change', sync);
    const unsub = subscribeAdAmbientPause(sync);
    sync();
    return () => {
      appSub.remove();
      unsub();
    };
  }, []);

  return active;
}
