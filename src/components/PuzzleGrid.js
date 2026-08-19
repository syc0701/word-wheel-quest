import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RevealCell, WordRevealBurst } from '../effect';
import { formatCellWordNumberLabel } from '../lib/gridReveal';
import { useAppearance } from '../context/AppearanceContext';

const GAP = 4;
/** Stops a short word from rendering as a few giant cells on a large screen. */
const MAX_CELL = 84;

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
}) {
  const { ww } = useAppearance();
  const [gridWidth, setGridWidth] = useState(0);

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
      <Pressable
        key={cellKey}
        onPress={() => onCellPress(row, col)}
        style={[
          styles.cell,
          cellSize > 0 && { width: cellSize, height: cellSize },
          isRevealed
            ? isHintRevealed
              ? { backgroundColor: ww.hintSoft, borderWidth: 2, borderColor: '#fcd34d' }
              : {
                  backgroundColor: ww.successSoft,
                  borderWidth: 2,
                  borderColor: ww.gridRevealedBorder || '#bbf7d0',
                }
            : {
                backgroundColor: ww.gridHidden,
                borderWidth: 2,
                borderColor: ww.gridBorder || ww.borderStrong,
              },
          isSelected && {
            borderWidth: 3.5,
            borderColor: ww.wheelLine || '#f59e0b',
          },
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
          <Text
            style={[
              styles.letter,
              {
                fontSize: letterFontSize,
                color: isHintRevealed ? ww.hintText : ww.successText,
              },
            ]}
          >
            {letter}
          </Text>
        ) : null}
      </Pressable>
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
    minWidth: 14,
    minHeight: 14,
    paddingHorizontal: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeWide: {
    minWidth: 22,
    paddingHorizontal: 3,
  },
  numberText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#064e3b',
  },
  numberTextCompact: {
    fontSize: 8,
    letterSpacing: -0.2,
  },
});
