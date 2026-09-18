import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(tplId) {
  return `ww.hintLetters.v1.${String(tplId || '').trim()}`;
}

function normalizeEntries(entries) {
  const out = {};
  if (!entries || typeof entries !== 'object') return out;
  const list = entries instanceof Map ? entries.entries() : Object.entries(entries);
  for (const [rawKey, rawLetter] of list) {
    const key = String(rawKey || '').trim();
    const letter = String(rawLetter || '').trim().toUpperCase();
    if (!key || !letter) continue;
    out[key] = letter;
  }
  return out;
}

export async function loadStoredHintLetters(tplId) {
  if (!tplId) return new Map();
  try {
    const raw = await AsyncStorage.getItem(storageKey(tplId));
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    const entries = normalizeEntries(parsed?.letters ?? parsed);
    return new Map(Object.entries(entries));
  } catch {
    return new Map();
  }
}

export async function saveStoredHintLetters(tplId, hintLetters) {
  if (!tplId) return;
  try {
    const letters = normalizeEntries(hintLetters);
    if (!Object.keys(letters).length) {
      await AsyncStorage.removeItem(storageKey(tplId));
      return;
    }
    await AsyncStorage.setItem(storageKey(tplId), JSON.stringify({ letters }));
  } catch {
    // Best-effort local cache.
  }
}

export async function clearStoredHintLetters(tplId) {
  if (!tplId) return;
  try {
    await AsyncStorage.removeItem(storageKey(tplId));
  } catch {
    // Best-effort.
  }
}
