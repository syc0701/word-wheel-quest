import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrCreateWordWheelSession } from './session';

const STORAGE_KEY = 'ww.guest_puzzle_coins';

/**
 * Guest puzzle-coin balance (bonus gifts, hints). Survives level changes on this device.
 * Migrated into the account on sign-in, then cleared.
 */

// Mutations are read-modify-write, so they must not interleave: two bonus words
// awarded close together would otherwise both read the same total and one gift
// would be lost. Every write goes through this chain.
let writeQueue = Promise.resolve();

// Mirrors the last known persisted value so a failed read can't silently
// present the balance as 0 (which looked like coins resetting between levels).
let cachedTotal = null;

function enqueue(task) {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function readRaw() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

async function writeRaw(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  await AsyncStorage.setItem(STORAGE_KEY, String(n));
  cachedTotal = n;
  return n;
}

/**
 * Persisted balance, or `null` when this device has no guest balance yet.
 * Falls back to the cached total when storage is unreadable so a transient
 * failure never reports a lower balance than the player already earned.
 */
export async function loadGuestPuzzleCoins() {
  try {
    const stored = await readRaw();
    if (stored == null) return cachedTotal;
    cachedTotal = stored;
    return stored;
  } catch {
    return cachedTotal;
  }
}

/** Throws if the balance could not be persisted, so callers can retry. */
export async function saveGuestPuzzleCoins(amount) {
  return enqueue(() => writeRaw(amount));
}

/** Resolves to the new authoritative total. Throws if it could not be persisted. */
export async function addGuestPuzzleCoins(delta) {
  const gift = Math.max(0, Math.floor(Number(delta) || 0));
  return enqueue(async () => {
    const current = (await readRaw()) ?? cachedTotal ?? 0;
    return writeRaw(current + gift);
  });
}

/** Resolves to the new authoritative total. Throws if it could not be persisted. */
export async function spendGuestPuzzleCoins(amount) {
  const spend = Math.max(0, Math.floor(Number(amount) || 0));
  return enqueue(async () => {
    const current = (await readRaw()) ?? cachedTotal ?? 0;
    return writeRaw(Math.max(0, current - spend));
  });
}

export async function clearGuestPuzzleCoins() {
  return enqueue(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    cachedTotal = null;
  });
}

/** Ensure a session exists so guest coins stay tied to this install. */
export async function ensureGuestSessionForCoins() {
  return getOrCreateWordWheelSession();
}
