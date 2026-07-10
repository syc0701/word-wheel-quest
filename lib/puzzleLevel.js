import { normalizeWord, parseFilledCoordinates } from './gridReveal';

/** Resolve journey level from puzzle API payload. */
export function resolveJourneyLevel(puzzle) {
  if (puzzle?.mainJourneyLevel != null && Number.isFinite(Number(puzzle.mainJourneyLevel))) {
    return Number(puzzle.mainJourneyLevel);
  }
  if (puzzle?.puzzleLevel != null && Number.isFinite(Number(puzzle.puzzleLevel))) {
    return Number(puzzle.puzzleLevel);
  }
  return null;
}

/** Word count for home/play meta — fall back when wordsInUse is empty. */
export function resolvePuzzleWordCount(puzzle) {
  const fromWordsInUse = parsePuzzleWords(puzzle?.wordsInUse).length;
  if (fromWordsInUse > 0) return fromWordsInUse;

  const wordsTotal = Number(puzzle?.wordsTotal);
  if (Number.isFinite(wordsTotal) && wordsTotal > 0) return wordsTotal;

  const detailsCount = Number(puzzle?.details?.wordCount);
  if (Number.isFinite(detailsCount) && detailsCount > 0) return detailsCount;

  const words = new Set();
  parseFilledCoordinates(puzzle?.filledCoordinates).forEach((coord) => {
    const word = normalizeWord(coord.word || coord.text);
    if (word) words.add(word);
  });
  return words.size;
}

/** Parse wordsInUse whether API sends newline string or string array. */
export function parsePuzzleWords(wordsInUse) {
  if (!wordsInUse) return [];
  if (Array.isArray(wordsInUse)) {
    return wordsInUse.map((w) => String(w).trim()).filter(Boolean);
  }
  return String(wordsInUse)
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean);
}
