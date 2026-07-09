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

export function buildCellWordNumbers(filledCoordinates) {
  const coords = parseFilledCoordinates(filledCoordinates);
  const startingPositions = new Map();

  coords.forEach((coord) => {
    if (coord.direction === 'scattered') return;
    const firstPos = getFirstPosition(coord);
    if (!firstPos) return;
    const cellKey = `${firstPos.row},${firstPos.col}`;
    if (!startingPositions.has(cellKey)) {
      startingPositions.set(cellKey, { row: firstPos.row, col: firstPos.col });
    }
  });

  const sorted = Array.from(startingPositions.values()).sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  const cellToNumber = new Map();
  sorted.forEach((pos, index) => {
    cellToNumber.set(`${pos.row},${pos.col}`, index + 1);
  });
  return cellToNumber;
}

export function buildWordToNumberMap(filledCoordinates, cellWordNumbers) {
  const map = new Map();
  parseFilledCoordinates(filledCoordinates).forEach((coord) => {
    if (coord.direction === 'scattered') return;
    const word = normalizeWord(coord.word || coord.text);
    const firstPos = getFirstPosition(coord);
    if (!word || !firstPos) return;
    const number = cellWordNumbers.get(`${firstPos.row},${firstPos.col}`);
    if (number != null) {
      map.set(word, number);
    }
  });
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
  const coords = parseFilledCoordinates(filledCoordinates);
  const words = coords
    .filter((coord) => {
      if (coord.direction === 'scattered') return false;
      return (coord.positions || []).some((p) => p.row === row && p.col === col);
    })
    .map((coord) => {
      const word = normalizeWord(coord.word || coord.text);
      const firstPos = getFirstPosition(coord);
      const number = firstPos
        ? cellWordNumbers.get(`${firstPos.row},${firstPos.col}`) ?? 999
        : 999;
      return { word, number, direction: coord.direction };
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

export function findHintStartCandidates(filledCoordinates, foundWords, hintedCellKeys) {
  const foundSet = new Set((foundWords || []).map(normalizeWord));
  const hinted = hintedCellKeys instanceof Set ? hintedCellKeys : new Set(hintedCellKeys || []);
  const candidates = [];

  parseFilledCoordinates(filledCoordinates).forEach((coord) => {
    if (coord.direction === 'scattered') return;
    const word = normalizeWord(coord.word || coord.text);
    if (!word || foundSet.has(word)) return;

    const firstPos = getFirstPosition(coord);
    if (!firstPos) return;

    const key = `${firstPos.row},${firstPos.col}`;
    if (hinted.has(key)) return;

    const positions = coord.positions || [];
    const startCell =
      positions.find((p) => p.row === firstPos.row && p.col === firstPos.col) || positions[0];
    const letter = (startCell?.value || startCell?.letter || '').trim().toUpperCase();
    if (!letter) return;

    candidates.push({ row: firstPos.row, col: firstPos.col, letter, word, key });
  });

  return candidates;
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
  return wordsInUse
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean);
}
