import { apiGet } from './http';

const PART_OF_SPEECH_ORDER = [
  'nom', 'noun', 'verbe', 'verb', 'adjectif', 'adjective', 'adverbe', 'adverb', 'title',
];

function normalizeDefinition(result) {
  const normalized = { word: result.word, meanings: [] };
  if (result.meaning && typeof result.meaning === 'object') {
    Object.entries(result.meaning).forEach(([partOfSpeech, definition]) => {
      if (partOfSpeech !== 'title') {
        normalized.meanings.push({
          partOfSpeech,
          definitions: [{ definition, example: null }],
        });
      }
    });
  } else if (Array.isArray(result.meanings)) {
    normalized.meanings = result.meanings;
  }
  return normalized;
}

export async function fetchWordDefinition(word, language = 'english') {
  const trimmed = String(word || '').trim();
  if (!trimmed) {
    throw new Error('Word is required');
  }
  const lang = String(language || 'english').trim() || 'english';
  const result = await apiGet(`/home/dic/${lang}/${encodeURIComponent(trimmed)}/single`);
  if (!result || typeof result !== 'object') {
    return null;
  }
  if (result.code === 'NO_DATA' || result.code === 'FAILURE') {
    return null;
  }
  return normalizeDefinition(result);
}

/** True when the dictionary has a usable entry for this word. */
export async function isDictionaryWord(word, language = 'english') {
  try {
    const def = await fetchWordDefinition(word, language);
    if (!def) return false;
    if (Array.isArray(def.meanings) && def.meanings.length > 0) return true;
    return Boolean(def.word);
  } catch {
    return false;
  }
}

/** True when the word is on the banned list for this language. */
export async function isBannedWord(word, language = 'english', isKids = false) {
  const trimmed = String(word || '').trim();
  if (!trimmed) return false;
  const lang = String(language || 'english').trim() || 'english';
  try {
    const result = await apiGet(`/home/dic/${lang}/check-banned`, {
      words: trimmed,
      isKids: isKids ? 'true' : 'false',
    });
    const banned = result?.bannedWords;
    if (!Array.isArray(banned)) return false;
    const needle = trimmed.toLowerCase();
    return banned.some((w) => String(w || '').toLowerCase() === needle);
  } catch {
    return false;
  }
}

/**
 * Valid bonus word: in dictionary, not banned, length ≥ 3.
 * Returns { ok, reason } for logging.
 */
export async function validateBonusWord(word, language = 'english') {
  const trimmed = String(word || '').trim();
  if (trimmed.length < 3) return { ok: false, reason: 'short' };
  const [inDict, banned] = await Promise.all([
    isDictionaryWord(trimmed, language),
    isBannedWord(trimmed, language, false),
  ]);
  if (banned) return { ok: false, reason: 'banned' };
  if (!inDict) return { ok: false, reason: 'unknown' };
  return { ok: true, reason: 'ok' };
}

export function sortMeanings(meanings) {
  return [...(meanings || [])].sort((a, b) => {
    const ai = PART_OF_SPEECH_ORDER.indexOf((a.partOfSpeech || '').toLowerCase());
    const bi = PART_OF_SPEECH_ORDER.indexOf((b.partOfSpeech || '').toLowerCase());
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export function formatDefinition(definition) {
  if (typeof definition !== 'string') return String(definition ?? '');
  return definition.replace(/(\d+\.\s)/g, '\n$1').trim();
}

export function titleCasePartOfSpeech(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + (value.slice(1) || '').toLowerCase();
}
