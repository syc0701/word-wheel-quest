import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { WW } from '../constants/theme';

function buildNodes(count, wheelSize, nodeRadius) {
  const ringRadius = wheelSize / 2 - nodeRadius - 8;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      index: i,
      x: wheelSize / 2 + ringRadius * Math.cos(angle),
      y: wheelSize / 2 + ringRadius * Math.sin(angle),
    };
  });
}

function nodeAtPoint(nodes, x, y, hitRadius) {
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

export default function LetterWheel({
  tiles = [],
  selectedIndices,
  onSelectionChange,
  onDragEnd,
  wheelSize = 280,
}) {
  const nodeRadius = Math.max(18, Math.round(wheelSize * 0.085));
  const hitRadius = nodeRadius * 1.35;

  const nodes = useMemo(
    () => buildNodes(tiles.length, wheelSize, nodeRadius),
    [tiles.length, wheelSize, nodeRadius]
  );

  const appendIndex = useCallback(
    (index) => {
      onSelectionChange((prev) => {
        if (prev.length === 0) return [index];
        const last = prev[prev.length - 1];
        if (last === index) return prev;
        if (prev.length >= 2 && prev[prev.length - 2] === index) {
          return prev.slice(0, -1);
        }
        return [...prev, index];
      });
    },
    [onSelectionChange]
  );

  const handleTouchMove = useCallback(
    (x, y) => {
      const hit = nodeAtPoint(nodes, x, y, hitRadius);
      if (hit) appendIndex(hit.index);
    },
    [nodes, hitRadius, appendIndex]
  );

  const startPathAt = useCallback(
    (x, y) => {
      const hit = nodeAtPoint(nodes, x, y, hitRadius);
      if (!hit) {
        onSelectionChange([]);
        return;
      }
      onSelectionChange([hit.index]);
    },
    [nodes, hitRadius, onSelectionChange]
  );

  const handleTouchEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      runOnJS(startPathAt)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(handleTouchMove)(e.x, e.y);
    })
    .onEnd(() => {
      runOnJS(handleTouchEnd)();
    });

  const linePoints = selectedIndices
    .map((idx) => nodes[idx])
    .filter(Boolean)
    .map((n) => `${n.x},${n.y}`)
    .join(' ');

  return (
    <View style={{ width: wheelSize, height: wheelSize, alignSelf: 'center' }}>
      <GestureDetector gesture={panGesture}>
        <View style={{ width: wheelSize, height: wheelSize }}>
          <Svg width={wheelSize} height={wheelSize} style={StyleSheet.absoluteFill}>
            {linePoints.length > 0 && (
              <Polyline
                points={linePoints}
                fill="none"
                stroke={WW.accent}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>

          <View
            style={[
              styles.ring,
              {
                left: nodeRadius,
                top: nodeRadius,
                width: wheelSize - nodeRadius * 2,
                height: wheelSize - nodeRadius * 2,
                borderRadius: (wheelSize - nodeRadius * 2) / 2,
              },
            ]}
          />

          {tiles.map((tile, index) => {
            const node = nodes[index];
            if (!node) return null;
            const isSelected = selectedIndices.includes(index);
            return (
              <View
                key={tile.id}
                style={[
                  styles.letterNode,
                  {
                    width: nodeRadius * 2,
                    height: nodeRadius * 2,
                    borderRadius: nodeRadius,
                    left: node.x - nodeRadius,
                    top: node.y - nodeRadius,
                  },
                  isSelected && styles.letterSelected,
                ]}
              >
                <Text style={[styles.letterText, isSelected && styles.letterTextSelected]}>{tile.letter}</Text>
              </View>
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: WW.accentRing,
    backgroundColor: WW.accentSoft,
  },
  letterNode: {
    position: 'absolute',
    backgroundColor: WW.surface,
    borderWidth: 1,
    borderColor: WW.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterSelected: {
    borderWidth: 2,
    borderColor: WW.accent,
    backgroundColor: WW.accentSoft,
  },
  letterText: {
    fontSize: 20,
    fontWeight: '700',
    color: WW.textOnSurface,
  },
  letterTextSelected: {
    color: WW.accentDark,
  },
});
