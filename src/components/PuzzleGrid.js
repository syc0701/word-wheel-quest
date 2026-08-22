import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { RevealCell, WordRevealBurst } from '../effect';
import { formatCellWordNumberLabel } from '../lib/gridReveal';
import { GRID_CREAM, GRID_TRANSITION_MS } from '../lib/gridTheme';

const GAP = 4;
/** Stops a short word from rendering as a few giant cells on a large screen. */
const MAX_CELL = 84;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GridCell({
  size,
  letter,
  letterFontSize,
  wordNumberLabel,
  isRevealed,
  isHintRevealed,
  isSelected,
  onPress,
}) {
  const selectedProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selectedProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: GRID_TRANSITION_MS,
      easing: Easing.inOut(Easing.quad),
    });
  }, [isSelected, selectedProgress]);

  const cellStyle = useAnimatedStyle(() => {
    const bg = isHintRevealed
      ? interpolateColor(
          selectedProgress.value,
          [0, 1],
          [GRID_CREAM.hintBg, GRID_CREAM.selectedBg]
        )
      : isRevealed
        ? interpolateColor(
            selectedProgress.value,
            [0, 1],
            [GRID_CREAM.revealedBg, GRID_CREAM.selectedBg]
          )
        : interpolateColor(
            selectedProgress.value,
            [0, 1],
            [GRID_CREAM.cellBg, GRID_CREAM.selectedBg]
          );

    const border = interpolateColor(
      selectedProgress.value,
      [0, 1],
      [
        isHintRevealed ? GRID_CREAM.hintBorder : GRID_CREAM.cellBorder,
        GRID_CREAM.selectedBorder,
      ]
    );

    const borderWidth =
      GRID_CREAM.cellBorderWidth +
      selectedProgress.value * (GRID_CREAM.selectedBorderWidth - GRID_CREAM.cellBorderWidth);

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
    };
  }, [isHintRevealed, isRevealed]);

  const textStyle = useAnimatedStyle(() => {
    const idle = isHintRevealed ? GRID_CREAM.hintText : GRID_CREAM.cellText;
    return {
      color: interpolateColor(selectedProgress.value, [0, 1], [idle, GRID_CREAM.selectedText]),
    };
  }, [isHintRevealed]);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.cell,
        size > 0 && { width: size, height: size },
        cellStyle,
      ]}
    >
      {wordNumberLabel ? (
        <View style={[styles.numberBadge, wordNumberLabel.length > 2 && styles.numberBadgeWide]}>
          <Text style={[styles.numberText, wordNumberLabel.length > 2 && styles.numberTextCompact]}>
            {wordNumberLabel}
          </Text>
        </View>
      ) : null}
      {isRevealed ? (
        <Animated.Text style={[styles.letter, { fontSize: letterFontSize }, textStyle]}>
          {letter}
        </Animated.Text>
      ) : null}
    </AnimatedPressable>
  );
}

export default function PuzzleGrid({
  gridSize,
  displayGrid,
  puzzleCells,
  cellWordNumbers,
  selectedWordCells,
  hintOnlyCells,
  celebratingCellKeys,
  celebrateOrder = [],
  celebrateMode = 'new',
  revealBurstId = 0,
  maxBoardSize = 0,
  onCellPress,
  onBoardMetrics = null,
  boardHostRef = null,
}) {
  const [gridWidth, setGridWidth] = useState(0);
  const boardRef = useRef(null);

  // Words rarely span the whole gridSize x gridSize board, so rendering every
  // row and column strands the puzzle in a corner surrounded by blank cells.
  // Cropping to the used cells lets the puzzle centre and use the space.
  const bounds = useMemo(() => {
    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;
    puzzleCells?.forEach((key) => {
      const [row, col] = key.split(',').map(Number);
      if (row < minRow) minRow = row;
      if (row > maxRow) maxRow = row;
      if (col < minCol) minCol = col;
      if (col > maxCol) maxCol = col;
    });
    if (!Number.isFinite(minRow)) {
      return { minRow: 0, maxRow: gridSize - 1, minCol: 0, maxCol: gridSize - 1 };
    }
    return { minRow, maxRow, minCol, maxCol };
  }, [puzzleCells, gridSize]);

  const rowCount = Math.max(1, bounds.maxRow - bounds.minRow + 1);
  const colCount = Math.max(1, bounds.maxCol - bounds.minCol + 1);

  // Fit both axes: sizing on width alone overflows the screen on short/landscape
  // viewports, which is what pushed the letter wheel out of view.
  const cellFromWidth =
    gridWidth > 0 ? Math.floor((gridWidth - GAP * (colCount - 1)) / colCount) : 0;
  const cellFromHeight =
    maxBoardSize > 0
      ? Math.floor((maxBoardSize - GAP * (rowCount - 1)) / rowCount)
      : cellFromWidth;
  const cellSize = Math.max(0, Math.min(cellFromWidth, cellFromHeight, MAX_CELL));

  const boardWidth = cellSize > 0 ? cellSize * colCount + GAP * (colCount - 1) : 0;
  const boardHeight = cellSize > 0 ? cellSize * rowCount + GAP * (rowCount - 1) : 0;
  // Cells shrink on small viewports, so the glyph has to follow or it clips.
  const letterFontSize = cellSize > 0 ? Math.max(11, Math.round(cellSize * 0.42)) : 17;

  const setBoardRef = (node) => {
    boardRef.current = node;
    if (typeof boardHostRef === 'function') boardHostRef(node);
    else if (boardHostRef) boardHostRef.current = node;
  };

  const reportBoardMetrics = () => {
    if (!onBoardMetrics || !boardRef.current || cellSize <= 0) return;
    boardRef.current.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        onBoardMetrics({
          x,
          y,
          width,
          height,
          cellSize,
          gap: GAP,
          minRow: bounds.minRow,
          minCol: bounds.minCol,
        });
      }
    });
  };

  const celebrating = celebratingCellKeys instanceof Set ? celebratingCellKeys : new Set();

  const burstOrigins = useMemo(() => {
    if (!cellSize || celebrating.size === 0) return [];
    return [...celebrating].map((key) => {
      const [row, col] = key.split(',').map(Number);
      return {
        key,
        x: (col - bounds.minCol) * (cellSize + GAP) + cellSize / 2,
        y: (row - bounds.minRow) * (cellSize + GAP) + cellSize / 2,
      };
    });
  }, [celebratingCellKeys, cellSize, celebrating.size, bounds]);

  const orderIndex = useMemo(() => {
    const map = new Map();
    celebrateOrder.forEach((key, i) => map.set(key, i));
    return map;
  }, [celebrateOrder]);

  const renderCell = (row, col) => {
    const letter = displayGrid[row]?.[col] || '';
    const cellKey = `${row},${col}`;
    const isPuzzleCell = puzzleCells.has(cellKey);
    const isRevealed = Boolean(letter);
    const isHintRevealed = isRevealed && hintOnlyCells.has(cellKey);
    const isSelected = selectedWordCells.has(cellKey);
    const wordNumber = cellWordNumbers.get(cellKey);
    const wordNumberLabel = formatCellWordNumberLabel(wordNumber);
    const isCelebrating = celebrating.has(cellKey);

    if (!isPuzzleCell) {
      return (
        <View
          key={cellKey}
          style={[
            styles.cell,
            styles.cellInactive,
            cellSize > 0 && { width: cellSize, height: cellSize },
          ]}
        />
      );
    }

    if (isCelebrating && cellSize > 0) {
      return (
        <RevealCell
          key={cellKey}
          size={cellSize}
          letter={letter}
          wordNumber={wordNumberLabel}
          isHint={isHintRevealed}
          isSelected={isSelected}
          celebrate
          mode={celebrateMode}
          pulseKey={revealBurstId}
          celebrateDelay={(orderIndex.get(cellKey) ?? 0) * 55}
          onPress={() => onCellPress(row, col)}
        />
      );
    }

    return (
      <GridCell
        key={cellKey}
        size={cellSize}
        letter={letter}
        letterFontSize={letterFontSize}
        wordNumberLabel={wordNumberLabel}
        isRevealed={isRevealed}
        isHintRevealed={isHintRevealed}
        isSelected={isSelected}
        onPress={() => onCellPress(row, col)}
      />
    );
  };

  const rows = [];
  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    const rowCells = [];
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      rowCells.push(renderCell(row, col));
    }
    rows.push(
      <View
        key={`row-${row}`}
        style={[styles.row, row > bounds.minRow && { marginTop: GAP }]}
      >
        {rowCells}
      </View>
    );
  }

  return (
    <View
      style={styles.gridWrap}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0 && width !== gridWidth) {
          setGridWidth(width);
        }
      }}
    >
      <View
        ref={setBoardRef}
        collapsable={false}
        onLayout={reportBoardMetrics}
        style={[
          styles.grid,
          boardWidth > 0 && { width: boardWidth, height: boardHeight },
        ]}
      >
        {rows}
        {celebrateMode === 'new' ? (
          <WordRevealBurst origins={burstOrigins} burstId={revealBurstId} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    width: '100%',
    alignItems: 'center',
    // Centre in the leftover space without collapsing when the screen is short.
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
  },
  grid: {
    position: 'relative',
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  cellInactive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  letter: {
    fontSize: 17,
    fontWeight: '900',
  },
  numberBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    minWidth: 18,
    minHeight: 18,
    paddingHorizontal: 3,
    borderRadius: 5,
    backgroundColor: GRID_CREAM.badgeBg,
    borderWidth: 1,
    borderColor: GRID_CREAM.badgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeWide: {
    minWidth: 26,
    paddingHorizontal: 4,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '800',
    color: GRID_CREAM.badgeText,
  },
  numberTextCompact: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
});
