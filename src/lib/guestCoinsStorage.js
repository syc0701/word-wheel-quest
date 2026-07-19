import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrCreateWordWheelSession } from './session';

const STORAGE_KEY = 'ww.guest_puzzle_coins';

/**
 * Guest puzzle-coin balance (bonus gifts, hints). Survives level changes on this device.
 * Cleared when the anonymous session is cleared after sign-in migration.
 */
export async function loadGuestPuzzleCoins() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return null;
  }
}

export async function saveGuestPuzzleCoins(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(n));
  } catch {
    /* ignore */
  }
  return n;
}

export async function addGuestPuzzleCoins(delta) {
  const current = (await loadGuestPuzzleCoins()) ?? 0;
  return saveGuestPuzzleCoins(current + Math.max(0, Math.floor(Number(delta) || 0)));
}

export async function spendGuestPuzzleCoins(amount) {
  const spend = Math.max(0, Math.floor(Number(amount) || 0));
  const current = (await loadGuestPuzzleCoins()) ?? 0;
  return saveGuestPuzzleCoins(Math.max(0, current - spend));
}

export async function clearGuestPuzzleCoins() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Ensure a session exists so guest coins stay tied to this install. */
export async function ensureGuestSessionForCoins() {
  return getOrCreateWordWheelSession();
}
