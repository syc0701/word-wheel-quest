/**
 * Pure geometry helpers for the word wheel — no DOM / no React.
 * Hit-testing uses distance from cursor to node center (not element collisions).
 */

/** Place letter nodes evenly on a ring inside the wheel bounds. */
export function buildWheelNodes(count, wheelSize, nodeRadius) {
  const ringRadius = wheelSize / 2 - nodeRadius - 8;
  const center = wheelSize / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      index: i,
      x: center + ringRadius * Math.cos(angle),
      y: center + ringRadius * Math.sin(angle),
    };
  });
}

/** Return the closest node within hitRadius pixels of (x, y), or null. */
export function findNodeAtPoint(nodes, x, y, hitRadius) {
  let best = null;
  let bestDist = hitRadius;
  for (const node of nodes) {
    const d = Math.hypot(node.x - x, node.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = node;
    }
  }
  return best;
}

/** Linear interpolation between two points. t=0 → a, t=1 → b. */
export function lerpPoint(ax, ay, bx, by, t) {
  return {
    x: ax + (bx - ax) * t,
    y: ay + (by - ay) * t,
  };
}

/**
 * Append or backtrack on a selection path (pure array logic).
 * Returns the same array reference when nothing changed.
 */
export function updateSelectionPath(path, index) {
  if (path.length === 0) return [index];
  const last = path[path.length - 1];
  if (last === index) return path;
  if (path.length >= 2 && path[path.length - 2] === index) {
    return path.slice(0, -1);
  }
  return [...path, index];
}
