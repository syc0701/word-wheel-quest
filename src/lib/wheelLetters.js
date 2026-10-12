export function wheelLettersFromWords(targetWords) {
  const maxFreq = new Map();
  (targetWords || []).forEach((word) => {
    const freq = new Map();
    String(word || '')
      .toUpperCase()
      .split('')
      .forEach((ch) => {
        if (/[A-Z]/.test(ch)) {
          freq.set(ch, (freq.get(ch) || 0) + 1);
        }
      });
    freq.forEach((count, ch) => {
      maxFreq.set(ch, Math.max(maxFreq.get(ch) || 0, count));
    });
  });
  const tiles = [];
  [...maxFreq.keys()].sort().forEach((ch) => {
    for (let i = 0; i < maxFreq.get(ch); i += 1) {
      tiles.push(ch);
    }
  });
  return tiles;
}

function sameLetterMultiset(left, right) {
  if (left.length !== right.length) return false;
  const a = [...left].map((ch) => ch.toUpperCase()).sort().join('');
  const b = [...right].map((ch) => ch.toUpperCase()).sort().join('');
  return a === b;
}

export function lettersForWheel(targetWords, lettersGrid, details) {
  const fromWords = targetWords?.length > 0 ? wheelLettersFromWords(targetWords) : [];
  const fromDetails = Array.isArray(details?.characters)
    ? details.characters.map((cell) => (cell || '').trim().toUpperCase()).filter(Boolean)
    : [];
  // Saved wheel letters can belong to an earlier level after a progress reset.
  // Use them only when they still spell the words on this grid.
  if (fromDetails.length > 0 && (fromWords.length === 0 || sameLetterMultiset(fromDetails, fromWords))) {
    return fromDetails;
  }
  if (fromWords.length > 0) {
    return fromWords;
  }
  const fromGrid = new Set();
  if (Array.isArray(lettersGrid)) {
    lettersGrid.forEach((row) => {
      if (!Array.isArray(row)) return;
      row.forEach((cell) => {
        const ch = (cell || '').trim().toUpperCase();
        if (ch) fromGrid.add(ch);
      });
    });
  }
  if (fromGrid.size > 0) {
    return [...fromGrid].sort();
  }
  return [];
}

export function buildWheelTiles(letters, seed = 'wheel') {
  return letters.map((letter, index) => ({
    id: `${seed}-tile-${index}`,
    letter,
  }));
}

export function shuffleWheelTiles(tiles) {
  const next = [...tiles];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  if (next.length > 1 && next.every((tile, index) => tile.id === tiles[index].id)) {
    [next[0], next[1]] = [next[1], next[0]];
  }
  return next;
}
