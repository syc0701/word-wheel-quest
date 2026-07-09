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
  return normalizeDefinition(result);
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
