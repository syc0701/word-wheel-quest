import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated as RnAnimated, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Lightbulb, Play } from 'lucide-react-native';
import { RevealCell, WordRevealBurst } from '../effect';
import { formatCellWordNumberLabel } from '../lib/gridReveal';
import { GRID_CREAM, GRID_TRANSITION_MS } from '../lib/gridTheme';

const GAP = 4;
/** Room for corner number badges that sit half outside the board. */
const BOARD_INSET = 12;
/** Soft cap so tiny boards on tablets don't become huge tiles. */
const MAX_CELL = 96;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AdHintBadge({ onPress, busy = false }) {
  const hintScale = useRef(new RnAnimated.Value(0.35)).current;
  const [clicked, setClicked] = useState(false);
  const wasBusy = useRef(false);

  useEffect(() => {
    hintScale.setValue(0.35);
    RnAnimated.sequence([
      RnAnimated.spring(hintScale, {
        toValue: 1.38,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }),
      RnAnimated.spring(hintScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hintScale]);

  useEffect(() => {
    if (wasBusy.current && !busy) setClicked(false);
    wasBusy.current = busy;
  }, [busy]);

  const showPressed = clicked || busy;

  return (
    <RnAnimated.View
      pointerEvents="box-none"
      style={[styles.adHintBtn, { transform: [{ scale: hintScale }] }]}
    >
      <Pressable
        style={[styles.adHintHit, showPressed && styles.adHintHitPressed]}
        onPress={() => {
          setClicked(true);
          Promise.resolve(onPress?.()).then((ok) => {
            if (ok === false) setClicked(false);
          });
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ selected: showPressed }}
        accessibilityLabel="Watch an ad to show this letter"
      >
        <Lightbulb color={showPressed ? '#FDE68A' : '#fff'} size={12} strokeWidth={2.4} />
        <Play color={showPressed ? '#FDE68A' : '#fff'} size={8} fill={showPressed ? '#FDE68A' : '#fff'} style={styles.adHintPlay} />
      </Pressable>
    </RnAnimated.View>
  );
}

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
  const numberFontSize =
    size > 0 ? Math.max(13, Math.min(18, Math.round(size * 0.38))) : 15;
  const numberBox = Math.max(
    16,
    Math.round(numberFontSize * (wordNumberLabel && wordNumberLabel.length > 2 ? 1.55 : 1.2))
  );

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
    <View
      collapsable={false}
      style={[styles.cellHost, size > 0 && { width: size, height: size }]}
    >
      <AnimatedPressable
        onPress={onPress}
        style={[styles.cell, StyleSheet.absoluteFill, cellStyle]}
      >
      {wordNumberLabel ? (
        <View
          pointerEvents="none"
          style={[
            styles.numberAnchor,
            {
              width: numberBox,
              height: numberBox,
              top: -numberBox / 2,
              left: -numberBox / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.numberText,
              { fontSize: numberFontSize, lineHeight: numberFontSize + 1 },
              wordNumberLabel.length > 2 && styles.numberTextCompact,
            ]}
          >
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
    </View>
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
  fitWidth = false,
  onCellPress,
  adHintCells = null,
  adHintBusy = false,
  onAdHintPress = null,
  onBoardMetrics = null,
  boardHostRef = null,
}) {
  const [gridWidth, setGridWidth] = useState(0);
  const [gridHostHeight, setGridHostHeight] = useState(0);
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

  // Prefer the real flex host size so the board fills leftover space between
  // header and clue without shrinking the wheel (estimated maxBoardSize often
  // under-counts and leaves large empty margins).
  const heightBudget =
    gridHostHeight > 0 ? gridHostHeight : maxBoardSize > 0 ? maxBoardSize : 0;
  const cellFromWidth =
    gridWidth > 0
      ? Math.floor((gridWidth - BOARD_INSET * 2 - GAP * (colCount - 1)) / colCount)
      : 0;
  const cellFromHeight = fitWidth
    ? cellFromWidth
    : heightBudget > 0
      ? Math.floor((heightBudget - BOARD_INSET * 2 - GAP * (rowCount - 1)) / rowCount)
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
      style={[styles.gridWrap, fitWidth && styles.gridWrapFitWidth]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && width !== gridWidth) setGridWidth(width);
        if (height > 0 && height !== gridHostHeight) setGridHostHeight(height);
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
        {cellSize > 0 && adHintCells
          ? [...adHintCells].map((cellKey) => {
              const [row, col] = cellKey.split(',').map(Number);
              if (
                !Number.isFinite(row)
                || !Number.isFinite(col)
                || row < bounds.minRow
                || row > bounds.maxRow
                || col < bounds.minCol
                || col > bounds.maxCol
              ) {
                return null;
              }
              return (
                <View
                  key={`ad-hint-${cellKey}`}
                  pointerEvents="box-none"
                  style={[
                    styles.adHintOverlay,
                    {
                      left: (col - bounds.minCol) * (cellSize + GAP) + cellSize - 20,
                      top: (row - bounds.minRow) * (cellSize + GAP) - 8,
                    },
                  ]}
                >
                  <AdHintBadge busy={adHintBusy} onPress={() => onAdHintPress?.(row, col)} />
                </View>
              );
            })
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    width: '100%',
    alignItems: 'center',
    // Take leftover space between header and clue; board sizes to this host.
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
    minHeight: 160,
    overflow: 'visible',
  },
  gridWrapFitWidth: {
    flexGrow: 0,
    minHeight: 0,
    marginTop: 12,
    paddingVertical: 8,
  },
  grid: {
    position: 'relative',
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  cellHost: {
    overflow: 'visible',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    position: 'relative',
    overflow: 'visible',
  },
  cellInactive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  letter: {
    fontSize: 17,
    fontWeight: '900',
  },
  numberAnchor: {
    position: 'absolute',
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: GRID_CREAM.badgeBg,
    borderWidth: 1,
    borderColor: GRID_CREAM.badgeBorder,
  },
  numberText: {
    fontSize: 15,
    fontWeight: '800',
    color: GRID_CREAM.badgeText,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  numberTextCompact: {
    fontSize: 12,
    letterSpacing: -0.3,
  },
  adHintOverlay: {
    position: 'absolute',
    zIndex: 30,
    elevation: 30,
    width: 28,
    height: 28,
    overflow: 'visible',
  },
  adHintBtn: {
    width: 28,
    height: 28,
  },
  adHintHit: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C2410C',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adHintHitPressed: {
    backgroundColor: '#9A3412',
    borderColor: '#FDE68A',
    transform: [{ scale: 0.88 }],
  },
  adHintPlay: {
    position: 'absolute',
    right: 2,
    bottom: 2,
  },
});
