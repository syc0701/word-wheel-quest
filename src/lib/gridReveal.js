import { GRID_SIZE, resolveWordWheelGridSize } from './constants';

export { GRID_SIZE, resolveWordWheelGridSize };

export function normalizeWord(w) {
  return (w || '').trim().toUpperCase();
}

export function parseFilledCoordinates(filledCoordinates) {
  if (!filledCoordinates) return [];
  try {
    const coords =
      typeof filledCoordinates === 'string' ? JSON.parse(filledCoordinates) : filledCoordinates;
    return Array.isArray(coords) ? coords : [];
  } catch {
    return [];
  }
}

function getFirstPosition(coord) {
  if (!coord?.positions?.length) return null;
  if (coord.direction === 'scattered') return null;

  if (coord.reversed) {
    return coord.positions[coord.positions.length - 1];
  }
  if (coord.direction === 'vertical') {
    return coord.positions.reduce((min, pos) => (pos.row < min.row ? pos : min));
  }
  if (coord.direction === 'horizontal') {
    return coord.positions.reduce((min, pos) => (pos.col < min.col ? pos : min));
  }
  return coord.positions[0];
}

function directionSortKey(direction) {
  if (direction === 'horizontal') return 0;
  if (direction === 'vertical') return 1;
  return 2;
}

/**
 * One entry per grid word, numbered in reading order.
 * Multiple words that share a start cell get consecutive numbers (e.g. 1 then 2).
 */
export function listNumberedWordEntries(filledCoordinates) {
  const entries = [];
  const seenWords = new Set();

  parseFilledCoordinates(filledCoordinates).forEach((coord, orderIndex) => {
    if (coord.direction === 'scattered') return;
    const word = normalizeWord(coord.word || coord.text);
    const firstPos = getFirstPosition(coord);
    if (!word || !firstPos || seenWords.has(word)) return;
    seenWords.add(word);
    entries.push({
      word,
      direction: coord.direction,
      row: firstPos.row,
      col: firstPos.col,
      orderIndex,
    });
  });

  entries.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    if (a.col !== b.col) return a.col - b.col;
    const dirDiff = directionSortKey(a.direction) - directionSortKey(b.direction);
    if (dirDiff !== 0) return dirDiff;
    return a.orderIndex - b.orderIndex;
  });

  return entries.map((entry, index) => ({
    ...entry,
    number: index + 1,
  }));
}

/** Map of start cell → word number(s). Shared starts keep every word number, e.g. [1, 2]. */
export function buildCellWordNumbers(filledCoordinates) {
  const cellToNumbers = new Map();
  listNumberedWordEntries(filledCoordinates).forEach((entry) => {
    const cellKey = `${entry.row},${entry.col}`;
    const existing = cellToNumbers.get(cellKey);
    if (existing) {
      if (!existing.includes(entry.number)) existing.push(entry.number);
    } else {
      cellToNumbers.set(cellKey, [entry.number]);
    }
  });
  return cellToNumbers;
}

export function formatCellWordNumberLabel(wordNumber) {
  if (wordNumber == null) return null;
  if (Array.isArray(wordNumber)) {
    return wordNumber.length ? wordNumber.join(',') : null;
  }
  return String(wordNumber);
}

export function buildWordToNumberMap(filledCoordinates, cellWordNumbers) {
  const map = new Map();
  listNumberedWordEntries(filledCoordinates).forEach((entry) => {
    map.set(entry.word, entry.number);
  });
  // cellWordNumbers kept for call-site compatibility; numbering is word-based.
  void cellWordNumbers;
  return map;
}

export function buildClueMapFromDisplayClue(displayClue) {
  const map = new Map();
  if (!Array.isArray(displayClue)) return map;
  displayClue.forEach((item) => {
    const word = normalizeWord(item?.word);
    const definition = (item?.definition || '').trim();
    if (word && definition) {
      map.set(word, definition);
    }
  });
  return map;
}

export function findWordsAtCell(filledCoordinates, row, col, cellWordNumbers) {
  const wordToNumber = buildWordToNumberMap(filledCoordinates, cellWordNumbers);
  const coords = parseFilledCoordinates(filledCoordinates);
  const words = coords
    .filter((coord) => {
      if (coord.direction === 'scattered') return false;
      return (coord.positions || []).some((p) => p.row === row && p.col === col);
    })
    .map((coord) => {
      const word = normalizeWord(coord.word || coord.text);
      return {
        word,
        number: wordToNumber.get(word) ?? 999,
        direction: coord.direction,
      };
    })
    .filter((entry) => entry.word);

  words.sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return a.word.localeCompare(b.word);
  });

  return words;
}

export function parseWordPositions(filledCoordinates) {
  const coords = parseFilledCoordinates(filledCoordinates);
  const map = {};
  coords.forEach((coord) => {
    const word = normalizeWord(coord.word || coord.text);
    if (!word || !Array.isArray(coord.positions)) return;
    map[word] = coord.positions.map((p) => ({
      row: p.row,
      col: p.col,
      letter: (p.value || '').trim().toUpperCase(),
    }));
  });
  return map;
}

export function puzzleCellKeys(wordPositions) {
  const keys = new Set();
  Object.values(wordPositions).forEach((positions) => {
    positions.forEach((p) => keys.add(`${p.row},${p.col}`));
  });
  return keys;
}

export function buildRevealedGrid(foundWords, wordPositions, size = GRID_SIZE) {
  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const foundSet = new Set(foundWords.map(normalizeWord));

  foundSet.forEach((word) => {
    const positions = wordPositions[word];
    if (!positions) return;
    positions.forEach((p) => {
      if (p.row >= 0 && p.row < size && p.col >= 0 && p.col < size) {
        grid[p.row][p.col] = p.letter;
      }
    });
  });

  return grid;
}

/**
 * Positions in word-reading order (1st letter → last).
 * Layout stores chars in word order; {@code reversed} flips start for numbering.
 */
function getOrderedPositions(coord) {
  if (!coord?.positions?.length || coord.direction === 'scattered') return [];
  const positions = coord.positions.slice();
  return coord.reversed ? positions.reverse() : positions;
}

function buildRevealedCellKeys(foundWords, wordPositions, hintedCellKeys) {
  const revealed = new Set(
    hintedCellKeys instanceof Set ? hintedCellKeys : hintedCellKeys || []
  );
  (foundWords || []).forEach((word) => {
    const positions = wordPositions?.[normalizeWord(word)];
    if (!positions) return;
    positions.forEach((p) => revealed.add(`${p.row},${p.col}`));
  });
  return revealed;
}

/**
 * Unfound words whose every cell is already visible (found words + hint letters).
 * These should count as solved — same as wheel-found words.
 */
export function findWordsCompletedByReveal(foundWords, wordPositions, hintedCellKeys) {
  const foundSet = new Set((foundWords || []).map(normalizeWord));
  const revealed = buildRevealedCellKeys(foundWords, wordPositions, hintedCellKeys);
  const completed = [];

  Object.keys(wordPositions || {}).forEach((rawWord) => {
    const word = normalizeWord(rawWord);
    if (!word || foundSet.has(word)) return;
    const positions = wordPositions[rawWord] || wordPositions[word];
    if (!Array.isArray(positions) || !positions.length) return;
    const allVisible = positions.every((p) => revealed.has(`${p.row},${p.col}`));
    if (allVisible) completed.push(word);
  });

  return completed;
}

/**
 * Remaining hint cells in spend order (10 coins each).
 * Example words ABC, DEF, HIJ → A, D, H, B, E, I, C, F, J
 * (all 1st letters by word number, then all 2nd, then 3rd, …).
 * Shared/crossing cells appear once, at the earliest slot in that sequence.
 */
export function findHintLetterCandidates(filledCoordinates, foundWords, wordPositions, hintedCellKeys) {
  const foundSet = new Set((foundWords || []).map(normalizeWord));
  const revealed = buildRevealedCellKeys(foundWords, wordPositions, hintedCellKeys);
  const cellWordNumbers = buildCellWordNumbers(filledCoordinates);
  const wordToNumber = buildWordToNumberMap(filledCoordinates, cellWordNumbers);
  const wordEntries = [];
  const seenWords = new Set();

  parseFilledCoordinates(filledCoordinates).forEach((coord, orderIndex) => {
    if (coord.direction === 'scattered') return;
    const word = normalizeWord(coord.word || coord.text);
    if (!word || foundSet.has(word) || seenWords.has(word)) return;
    seenWords.add(word);

    const ordered = getOrderedPositions(coord);
    if (!ordered.length) return;

    const number = wordToNumber.get(word) ?? 999;
    wordEntries.push({ word, ordered, number, orderIndex });
  });

  // Fallback when coordinates are sparse: use parsed wordPositions for unfound words.
  if (wordPositions && typeof wordPositions === 'object') {
    Object.keys(wordPositions).forEach((rawWord, orderIndex) => {
      const word = normalizeWord(rawWord);
      if (!word || foundSet.has(word) || seenWords.has(word)) return;
      const positions = wordPositions[rawWord] || wordPositions[word];
      if (!Array.isArray(positions) || !positions.length) return;
      seenWords.add(word);
      const number = wordToNumber.get(word) ?? 900 + orderIndex;
      wordEntries.push({
        word,
        ordered: positions.map((p) => ({
          row: p.row,
          col: p.col,
          value: p.letter || p.value || '',
          letter: p.letter || p.value || '',
        })),
        number,
        orderIndex: 1000 + orderIndex,
      });
    });
  }

  wordEntries.sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return a.orderIndex - b.orderIndex;
  });

  const maxLen = wordEntries.reduce((max, entry) => Math.max(max, entry.ordered.length), 0);
  const queue = [];
  const queuedKeys = new Set();

  for (let letterIndex = 0; letterIndex < maxLen; letterIndex += 1) {
    wordEntries.forEach((entry) => {
      const pos = entry.ordered[letterIndex];
      if (!pos) return;
      const row = Number(pos.row);
      const col = Number(pos.col);
      if (!Number.isFinite(row) || !Number.isFinite(col)) return;
      const key = `${row},${col}`;
      if (revealed.has(key) || queuedKeys.has(key)) return;

      const fromPositions = wordPositions?.[entry.word]?.[letterIndex]?.letter;
      const letter = String(pos.value || pos.letter || fromPositions || '')
        .trim()
        .toUpperCase();
      if (!letter) return;

      queuedKeys.add(key);
      queue.push({
        row,
        col,
        letter,
        word: entry.word,
        key,
        letterIndex,
      });
    });
  }

  return queue;
}

/** @deprecated Prefer {@link findHintLetterCandidates} — kept for call-site compatibility. */
export function findHintStartCandidates(filledCoordinates, foundWords, hintedCellKeys) {
  return findHintLetterCandidates(filledCoordinates, foundWords, null, hintedCellKeys);
}

export function buildDisplayGrid(foundWords, wordPositions, hintLetters, size = GRID_SIZE) {
  const grid = buildRevealedGrid(foundWords, wordPositions, size);
  if (!hintLetters) return grid;

  const entries = hintLetters instanceof Map ? hintLetters.entries() : Object.entries(hintLetters);
  for (const [key, letter] of entries) {
    const ch = (letter || '').trim().toUpperCase();
    if (!ch) continue;
    const [rowRaw, colRaw] = String(key).split(',');
    const row = Number(rowRaw);
    const col = Number(colRaw);
    if (!Number.isFinite(row) || !Number.isFinite(col)) continue;
    if (row >= 0 && row < size && col >= 0 && col < size && !grid[row][col]) {
      grid[row][col] = ch;
    }
  }
  return grid;
}

export function parseWords(wordsInUse) {
  if (!wordsInUse) return [];
  if (Array.isArray(wordsInUse)) {
    return wordsInUse.map((w) => String(w).trim()).filter(Boolean);
  }
  return String(wordsInUse)
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean);
}
