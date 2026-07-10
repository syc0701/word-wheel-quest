import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RevealCell, WordRevealBurst } from '../effect';
import { WW } from '../constants/theme';

const GAP = 4;

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
  onCellPress,
}) {
  const [gridWidth, setGridWidth] = useState(0);
  const cellSize =
    gridWidth > 0 ? (gridWidth - GAP * (gridSize - 1)) / gridSize : 0;

  const celebrating = celebratingCellKeys instanceof Set ? celebratingCellKeys : new Set();

  const burstOrigins = useMemo(() => {
    if (!cellSize || celebrating.size === 0) return [];
    return [...celebrating].map((key) => {
      const [row, col] = key.split(',').map(Number);
      return {
        key,
        x: col * (cellSize + GAP) + cellSize / 2,
        y: row * (cellSize + GAP) + cellSize / 2,
      };
    });
  }, [celebratingCellKeys, cellSize, celebrating.size]);

  const orderIndex = useMemo(() => {
    const map = new Map();
    celebrateOrder.forEach((key, i) => map.set(key, i));
    return map;
  }, [celebrateOrder]);

  const cells = [];
  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const letter = displayGrid[row]?.[col] || '';
      const cellKey = `${row},${col}`;
      const isPuzzleCell = puzzleCells.has(cellKey);
      const isRevealed = Boolean(letter);
      const isHintRevealed = isRevealed && hintOnlyCells.has(cellKey);
      const isSelected = selectedWordCells.has(cellKey);
      const wordNumber = cellWordNumbers.get(cellKey);
      const isCelebrating = celebrating.has(cellKey);

      if (!isPuzzleCell) {
        cells.push(
          <View
            key={cellKey}
            style={[
              styles.cell,
              styles.cellInactive,
              cellSize > 0 && { width: cellSize, height: cellSize },
            ]}
          />
        );
        continue;
      }

      if (isCelebrating && cellSize > 0) {
        cells.push(
          <RevealCell
            key={cellKey}
            size={cellSize}
            letter={letter}
            wordNumber={wordNumber}
            isHint={isHintRevealed}
            isSelected={isSelected}
            celebrate
            mode={celebrateMode}
            pulseKey={revealBurstId}
            celebrateDelay={(orderIndex.get(cellKey) ?? 0) * 55}
            onPress={() => onCellPress(row, col)}
          />
        );
        continue;
      }

      cells.push(
        <Pressable
          key={cellKey}
          onPress={() => onCellPress(row, col)}
          style={[
            styles.cell,
            cellSize > 0 && { width: cellSize, height: cellSize },
            isRevealed
              ? isHintRevealed
                ? styles.cellHint
                : styles.cellFound
              : styles.cellHidden,
            isSelected && styles.cellSelected,
          ]}
        >
          {wordNumber != null && (
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{wordNumber}</Text>
            </View>
          )}
          {isRevealed ? (
            <Text style={[styles.letter, isHintRevealed && styles.letterHint]}>{letter}</Text>
          ) : null}
        </Pressable>
      );
    }
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
          gridWidth > 0 && { width: gridWidth, height: gridWidth },
        ]}
      >
        {cells}
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    position: 'relative',
    overflow: 'visible',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  cellInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  cellHidden: {
    backgroundColor: WW.gridHidden,
    borderWidth: 2,
    borderColor: WW.borderStrong,
  },
  cellFound: {
    backgroundColor: WW.successSoft,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  cellHint: {
    backgroundColor: WW.hintSoft,
    borderWidth: 2,
    borderColor: '#fcd34d',
  },
  cellSelected: {
    borderColor: WW.accent,
  },
  letter: {
    fontSize: 16,
    fontWeight: '700',
    color: WW.successText,
  },
  letterHint: {
    color: WW.hintText,
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
  numberText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#064e3b',
  },
});
