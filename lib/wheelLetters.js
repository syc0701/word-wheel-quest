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

export function lettersForWheel(targetWords, lettersGrid, details) {
  const fromDetails = details?.characters;
  if (Array.isArray(fromDetails) && fromDetails.length > 0) {
    return fromDetails.map((cell) => (cell || '').trim().toUpperCase()).filter(Boolean);
  }
  if (targetWords?.length > 0) {
    return wheelLettersFromWords(targetWords);
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
