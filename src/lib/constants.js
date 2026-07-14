export const GRID_SIZE = 8;

/** Prefer API `gridSize`; fall back to default when missing. */
export function resolveWordWheelGridSize(puzzleOrSize) {
  if (puzzleOrSize != null && typeof puzzleOrSize === 'object') {
    const n = Number(puzzleOrSize.gridSize);
    if (Number.isFinite(n) && n > 0) return n;
  } else {
    const n = Number(puzzleOrSize);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return GRID_SIZE;
}
