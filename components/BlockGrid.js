import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { ArrowLeft, Trophy } from 'lucide-react-native';
import { COLORS, SCREENS } from '../constants/theme';

const GRID_SIZE = 6;
const { width: SCREEN_W } = Dimensions.get('window');
const GRID_PADDING = 20;
const CELL_SIZE = Math.floor((SCREEN_W - GRID_PADDING * 2) / GRID_SIZE);

// Exit coordinate — target block's top-left must reach here to win
const EXIT = { row: 2, col: 4 };

// ─── Mock puzzle layout (6×6, playable immediately) ─────────────────────────
const INITIAL_BLOCKS = [
  { id: 'v1', row: 0, col: 0, length: 3, alignment: 'vertical', isTarget: false },
  { id: 'h1', row: 0, col: 1, length: 2, alignment: 'horizontal', isTarget: false },
  { id: 'v2', row: 0, col: 3, length: 2, alignment: 'vertical', isTarget: false },
  { id: 'target', row: 2, col: 1, length: 2, alignment: 'horizontal', isTarget: true },
  { id: 'v3', row: 0, col: 4, length: 3, alignment: 'vertical', isTarget: false },
  { id: 'h2', row: 3, col: 2, length: 2, alignment: 'horizontal', isTarget: false },
  { id: 'v4', row: 4, col: 0, length: 2, alignment: 'vertical', isTarget: false },
  { id: 'h3', row: 4, col: 1, length: 3, alignment: 'horizontal', isTarget: false },
  { id: 'h4', row: 5, col: 3, length: 2, alignment: 'horizontal', isTarget: false },
];

/** Return every grid cell occupied by a block. */
function getOccupiedCells(block) {
  const cells = [];
  for (let i = 0; i < block.length; i += 1) {
    if (block.alignment === 'horizontal') {
      cells.push({ row: block.row, col: block.col + i });
    } else {
      cells.push({ row: block.row + i, col: block.col });
    }
  }
  return cells;
}

/** Strict boundary + overlap collision check for a candidate position. */
function canPlace(block, row, col, allBlocks, ignoreId) {
  const candidate = { ...block, row, col };
  const cells = getOccupiedCells(candidate);

  for (const cell of cells) {
    if (cell.row < 0 || cell.col < 0 || cell.row >= GRID_SIZE || cell.col >= GRID_SIZE) {
      return false;
    }
  }

  const occupied = new Set(cells.map((c) => `${c.row},${c.col}`));

  for (const other of allBlocks) {
    if (other.id === ignoreId) continue;
    for (const c of getOccupiedCells(other)) {
      if (occupied.has(`${c.row},${c.col}`)) return false;
    }
  }

  return true;
}

/** Maximum legal row/col along the block's slide axis. */
function getMoveLimits(block, allBlocks) {
  let minRow = block.row;
  let maxRow = block.row;
  let minCol = block.col;
  let maxCol = block.col;

  if (block.alignment === 'vertical') {
    while (canPlace(block, minRow - 1, block.col, allBlocks, block.id)) minRow -= 1;
    while (canPlace(block, maxRow + 1, block.col, allBlocks, block.id)) maxRow += 1;
  } else {
    while (canPlace(block, block.row, minCol - 1, allBlocks, block.id)) minCol -= 1;
    while (canPlace(block, block.row, maxCol + 1, allBlocks, block.id)) maxCol += 1;
  }

  return { minRow, maxRow, minCol, maxCol };
}

function checkVictory(blocks) {
  const target = blocks.find((b) => b.isTarget);
  return target && target.row === EXIT.row && target.col === EXIT.col;
}

function DraggableBlock({ block, allBlocks, onMove, cellSize }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const bounceX = useSharedValue(0);
  const bounceY = useSharedValue(0);
  const startRow = useSharedValue(block.row);
  const startCol = useSharedValue(block.col);
  const limits = useMemo(() => getMoveLimits(block, allBlocks), [block, allBlocks]);

  // Reset pixel offset once the grid state commits a new row/col
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [block.row, block.col, translateX, translateY]);

  const blockW =
    block.alignment === 'horizontal' ? block.length * cellSize : cellSize;
  const blockH =
    block.alignment === 'vertical' ? block.length * cellSize : cellSize;

  const triggerBounce = useCallback(
    (axis) => {
      const bump = 5;
      if (axis === 'x') {
        bounceX.value = withSequence(
          withTiming(bump, { duration: 60 }),
          withSpring(0, { damping: 8, stiffness: 420 })
        );
      } else {
        bounceY.value = withSequence(
          withTiming(bump, { duration: 60 }),
          withSpring(0, { damping: 8, stiffness: 420 })
        );
      }
    },
    [bounceX, bounceY]
  );

  const commitPosition = useCallback(
    (newRow, newCol) => {
      onMove(block.id, newRow, newCol);
    },
    [block.id, onMove]
  );

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startRow.value = block.row;
      startCol.value = block.col;
      translateX.value = 0;
      translateY.value = 0;
    })
    .onUpdate((e) => {
      if (block.alignment === 'horizontal') {
        const rawCol = startCol.value + e.translationX / cellSize;
        const clamped = Math.max(limits.minCol, Math.min(limits.maxCol, rawCol));
        translateX.value = (clamped - startCol.value) * cellSize;

        // Tiny bounce cue when finger tries to push past a collision/boundary
        if (rawCol < limits.minCol - 0.05 || rawCol > limits.maxCol + 0.05) {
          runOnJS(triggerBounce)('x');
        }
      } else {
        const rawRow = startRow.value + e.translationY / cellSize;
        const clamped = Math.max(limits.minRow, Math.min(limits.maxRow, rawRow));
        translateY.value = (clamped - startRow.value) * cellSize;

        if (rawRow < limits.minRow - 0.05 || rawRow > limits.maxRow + 0.05) {
          runOnJS(triggerBounce)('y');
        }
      }
    })
    .onEnd((e) => {
      let finalRow = startRow.value;
      let finalCol = startCol.value;

      if (block.alignment === 'horizontal') {
        // Inertia: project finger velocity into grid cells, then clamp to legal range
        const projected = startCol.value + (e.translationX + e.velocityX * 0.08) / cellSize;
        finalCol = Math.round(Math.max(limits.minCol, Math.min(limits.maxCol, projected)));
        translateX.value = withSpring((finalCol - startCol.value) * cellSize, {
          damping: 18,
          stiffness: 220,
          velocity: e.velocityX,
        });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      } else {
        const projected = startRow.value + (e.translationY + e.velocityY * 0.08) / cellSize;
        finalRow = Math.round(Math.max(limits.minRow, Math.min(limits.maxRow, projected)));
        translateY.value = withSpring((finalRow - startRow.value) * cellSize, {
          damping: 18,
          stiffness: 220,
          velocity: e.velocityY,
        });
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }

      runOnJS(commitPosition)(finalRow, finalCol);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + bounceX.value },
      { translateY: translateY.value + bounceY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.block,
          {
            left: block.col * cellSize,
            top: block.row * cellSize,
            width: blockW - 4,
            height: blockH - 4,
            backgroundColor: block.isTarget ? '#ef4444' : COLORS.primary,
          },
          animStyle,
        ]}
      >
        {block.isTarget && <Text style={styles.targetLabel}>EXIT →</Text>}
      </Animated.View>
    </GestureDetector>
  );
}

function VictoryOverlay({ onHome, onReplay }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.victoryOverlay}>
      <View style={styles.victoryCard}>
        <Trophy color={COLORS.particle} size={56} />
        <Text style={styles.victoryTitle}>Puzzle Solved!</Text>
        <Text style={styles.victorySub}>The target block reached the exit.</Text>
        <Pressable style={styles.victoryBtn} onPress={onReplay}>
          <Text style={styles.victoryBtnText}>Play Again</Text>
        </Pressable>
        <Pressable style={styles.victoryBtnSecondary} onPress={onHome}>
          <Text style={styles.victoryBtnSecondaryText}>Main Menu</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function BlockGrid({ navigate }) {
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [won, setWon] = useState(false);

  const handleMove = useCallback((id, row, col) => {
    setBlocks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, row, col } : b));
      if (checkVictory(next)) {
        setWon(true);
      }
      return next;
    });
  }, []);

  const replay = () => {
    setBlocks(INITIAL_BLOCKS.map((b) => ({ ...b })));
    setWon(false);
  };

  const gridPx = CELL_SIZE * GRID_SIZE;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => navigate(SCREENS.HOME)}>
          <ArrowLeft color={COLORS.text} size={22} />
        </Pressable>
        <Text style={styles.title}>Block Jam</Text>
      </View>

      <Text style={styles.instructions}>Slide the red block to the glowing exit on the right.</Text>

      <View style={[styles.gridWrap, { width: gridPx, height: gridPx }]}>
        {/* Grid cells */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const row = Math.floor(i / GRID_SIZE);
          const col = i % GRID_SIZE;
          const isExit = row === EXIT.row && (col === EXIT.col || col === EXIT.col + 1);
          return (
            <View
              key={`cell-${row}-${col}`}
              style={[
                styles.cell,
                {
                  left: col * CELL_SIZE,
                  top: row * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                },
                isExit && styles.exitCell,
              ]}
            />
          );
        })}

        {/* Exit marker */}
        <View
          style={[
            styles.exitMarker,
            {
              left: EXIT.col * CELL_SIZE,
              top: EXIT.row * CELL_SIZE,
              width: CELL_SIZE * 2,
              height: CELL_SIZE,
            },
          ]}
        >
          <Text style={styles.exitText}>EXIT</Text>
        </View>

        {blocks.map((block) => (
          <DraggableBlock
            key={block.id}
            block={block}
            allBlocks={blocks}
            onMove={handleMove}
            cellSize={CELL_SIZE}
          />
        ))}
      </View>

      {won && (
        <VictoryOverlay onHome={() => navigate(SCREENS.HOME)} onReplay={replay} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: 52,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  instructions: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  gridWrap: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
    overflow: 'hidden',
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: COLORS.surfaceLight,
  },
  exitCell: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  exitMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    borderRadius: 6,
    zIndex: 0,
  },
  exitText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  block: {
    position: 'absolute',
    margin: 2,
    borderRadius: 10,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  targetLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  victoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 14, 23, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  victoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_W - 48,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  victoryTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 16,
  },
  victorySub: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  victoryBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  victoryBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
  victoryBtnSecondary: {
    marginTop: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  victoryBtnSecondaryText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
});
