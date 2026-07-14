import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(tplId) {
  return `ww.bonusWords.v1.${String(tplId || '').trim()}`;
}

function normalizeList(words) {
  const out = [];
  const seen = new Set();
  (Array.isArray(words) ? words : []).forEach((raw) => {
    const word = String(raw || '').trim().toUpperCase();
    if (!word || seen.has(word)) return;
    seen.add(word);
    out.push(word);
  });
  return out;
}

/** Bonus (off-grid) words from play.details.bonusWords. */
export function parseBonusWordsFromPlay(play) {
  const details = play?.details;
  if (!details || typeof details !== 'object') return [];
  return normalizeList(details.bonusWords);
}

export async function loadStoredBonusWords(tplId) {
  if (!tplId) return [];
  try {
    const raw = await AsyncStorage.getItem(storageKey(tplId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeList(parsed);
    return normalizeList(parsed?.words);
  } catch {
    return [];
  }
}

export async function saveStoredBonusWords(tplId, words) {
  if (!tplId) return;
  try {
    await AsyncStorage.setItem(
      storageKey(tplId),
      JSON.stringify({ words: normalizeList(words) })
    );
  } catch {
    // Best-effort local cache.
  }
}

export function mergeBonusWordLists(...lists) {
  return normalizeList(lists.flatMap((list) => (Array.isArray(list) ? list : [])));
}
