import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WW } from '../constants/theme';
import {
  buildWheelNodes,
  findNodeAtPoint,
  updateSelectionPath,
} from '../lib/wheelGeometry';
import ShipHelm from './ShipHelm';
import WheelLetter from './WheelLetter';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const LINE_CORE = 7;
const LINE_GLOW = 18;
const ROLLBACK_MS = 200;

/** Draw one segment with glow + core stroke. */
function WheelSegment({ x1, y1, x2, y2, active = false }) {
  const glowOpacity = active ? 0.55 : 0.4;
  return (
    <>
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={WW.wheelLine}
        strokeWidth={LINE_GLOW}
        strokeLinecap="round"
        opacity={glowOpacity}
      />
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={WW.wheelLineDark}
        strokeWidth={LINE_CORE}
        strokeLinecap="round"
      />
    </>
  );
}

/** Live line from last selected node to current finger while dragging. */
function DraggingLine({ x1, y1, fingerX, fingerY, visible }) {
  const animatedProps = useAnimatedProps(() => ({
    x2: fingerX.value,
    y2: fingerY.value,
    opacity: visible.value,
  }));

  return (
    <>
      <AnimatedLine
        animatedProps={animatedProps}
        x1={x1}
        y1={y1}
        x2={x1}
        y2={y1}
        stroke={WW.wheelLine}
        strokeWidth={LINE_GLOW}
        strokeLinecap="round"
        opacity={0.5}
      />
      <AnimatedLine
        animatedProps={animatedProps}
        x1={x1}
        y1={y1}
        x2={x1}
        y2={y1}
        stroke={WW.wheelLineDark}
        strokeWidth={LINE_CORE}
        strokeLinecap="round"
      />
    </>
  );
}

/** Last segment whose endpoint animates during ROLLBACK (rubber-band retract). */
function RetractingSegment({ x1, y1, x2, y2, progress }) {
  const animatedProps = useAnimatedProps(() => {
    // progress 1 = full segment (x1→x2), progress 0 = collapsed at start node (x1)
    const t = progress.value;
    return {
      x2: x1 + (x2 - x1) * t,
      y2: y1 + (y2 - y1) * t,
    };
  });

  return (
    <>
      <AnimatedLine
        animatedProps={animatedProps}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={WW.wheelLine}
        strokeWidth={LINE_GLOW}
        strokeLinecap="round"
        opacity={0.55}
      />
      <AnimatedLine
        animatedProps={animatedProps}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={WW.wheelLineDark}
        strokeWidth={LINE_CORE}
        strokeLinecap="round"
      />
    </>
  );
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
    () => buildWheelNodes(tiles.length, wheelSize, nodeRadius),
    [tiles.length, wheelSize, nodeRadius]
  );

  const [displayIndices, setDisplayIndices] = useState([]);
  const [phase, setPhase] = useState('idle');
  const pathRef = useRef([]);
  const phaseRef = useRef('idle');
  const rollbackAbortRef = useRef(false);
  const segmentProgress = useSharedValue(1);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const fingerVisible = useSharedValue(0);

  const setPhaseBoth = useCallback((nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const syncPath = useCallback(
    (nextPath) => {
      pathRef.current = nextPath;
      setDisplayIndices(nextPath);
      onSelectionChange(nextPath);
    },
    [onSelectionChange]
  );

  useEffect(() => {
    if (selectedIndices.length === 0 && pathRef.current.length > 0 && phaseRef.current === 'rollback') {
      rollbackAbortRef.current = true;
      setPhaseBoth('idle');
      pathRef.current = [];
      setDisplayIndices([]);
      fingerVisible.value = 0;
      return;
    }
    if (phaseRef.current !== 'idle') return;
    setDisplayIndices(selectedIndices);
    pathRef.current = selectedIndices;
  }, [selectedIndices, setPhaseBoth, fingerVisible]);

  const tryAppendIndex = useCallback(
    (index) => {
      const next = updateSelectionPath(pathRef.current, index);
      if (next !== pathRef.current) syncPath(next);
    },
    [syncPath]
  );

  const handleTouchMove = useCallback(
    (x, y) => {
      if (phaseRef.current !== 'dragging') return;
      const hit = findNodeAtPoint(nodes, x, y, hitRadius);
      if (hit) tryAppendIndex(hit.index);
    },
    [nodes, hitRadius, tryAppendIndex]
  );

  const startPathAt = useCallback(
    (x, y) => {
      if (phaseRef.current === 'rollback') {
        rollbackAbortRef.current = true;
      }
      setPhaseBoth('dragging');
      segmentProgress.value = 1;
      fingerX.value = x;
      fingerY.value = y;
      fingerVisible.value = 1;
      const hit = findNodeAtPoint(nodes, x, y, hitRadius);
      syncPath(hit ? [hit.index] : []);
    },
    [nodes, hitRadius, syncPath, segmentProgress, setPhaseBoth, fingerX, fingerY, fingerVisible]
  );

  const finishRollback = useCallback(() => {
    setPhaseBoth('idle');
    pathRef.current = [];
    setDisplayIndices([]);
    fingerVisible.value = 0;
    onSelectionChange([]);
  }, [onSelectionChange, setPhaseBoth, fingerVisible]);

  const afterSegmentRetractedRef = useRef(null);

  const runRollbackStep = useCallback(() => {
    if (rollbackAbortRef.current) {
      finishRollback();
      return;
    }

    const current = pathRef.current;
    if (current.length <= 1) {
      finishRollback();
      return;
    }

    segmentProgress.value = 1;
    segmentProgress.value = withTiming(
      0,
      { duration: ROLLBACK_MS, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (!finished) return;
        runOnJS(afterSegmentRetractedRef.current)();
      }
    );
  }, [segmentProgress, finishRollback]);

  const afterSegmentRetracted = useCallback(() => {
    if (rollbackAbortRef.current) {
      finishRollback();
      return;
    }

    const next = pathRef.current.slice(0, -1);
    pathRef.current = next;
    setDisplayIndices(next);
    onSelectionChange(next);

    if (next.length === 0) {
      setPhaseBoth('idle');
      return;
    }

    if (next.length === 1) {
      pathRef.current = [];
      setDisplayIndices([]);
      onSelectionChange([]);
      setPhaseBoth('idle');
      return;
    }

    runRollbackStep();
  }, [onSelectionChange, finishRollback, runRollbackStep, setPhaseBoth]);

  afterSegmentRetractedRef.current = afterSegmentRetracted;

  const beginRollback = useCallback(() => {
    setPhaseBoth('rollback');
    rollbackAbortRef.current = false;
    fingerVisible.value = 0;
    const word = pathRef.current.map((i) => tiles[i]?.letter || '').join('');
    onDragEnd?.(word);

    const chain = [...pathRef.current];
    if (chain.length === 0) {
      setPhaseBoth('idle');
      return;
    }
    if (chain.length === 1) {
      pathRef.current = [];
      setDisplayIndices([]);
      onSelectionChange([]);
      setPhaseBoth('idle');
      return;
    }

    runRollbackStep();
  }, [onDragEnd, onSelectionChange, runRollbackStep, setPhaseBoth, tiles, fingerVisible]);

  const handleTouchEnd = useCallback(() => {
    if (phaseRef.current !== 'dragging') return;
    beginRollback();
  }, [beginRollback]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          fingerX.value = e.x;
          fingerY.value = e.y;
          fingerVisible.value = 1;
          runOnJS(startPathAt)(e.x, e.y);
        })
        .onUpdate((e) => {
          fingerX.value = e.x;
          fingerY.value = e.y;
          runOnJS(handleTouchMove)(e.x, e.y);
        })
        .onEnd(() => {
          fingerVisible.value = 0;
          runOnJS(handleTouchEnd)();
        })
        .onFinalize(() => {
          fingerVisible.value = 0;
          runOnJS(handleTouchEnd)();
        }),
    [startPathAt, handleTouchMove, handleTouchEnd, fingerX, fingerY, fingerVisible]
  );

  const isRollingBack = phase === 'rollback';
  const isDragging = phase === 'dragging';
  const retractFrom =
    displayIndices.length >= 2 ? nodes[displayIndices[displayIndices.length - 2]] : null;
  const retractTo =
    displayIndices.length >= 1 ? nodes[displayIndices[displayIndices.length - 1]] : null;
  const dragFrom =
    displayIndices.length >= 1 ? nodes[displayIndices[displayIndices.length - 1]] : null;

  const staticSegmentCount =
    isRollingBack && displayIndices.length >= 2
      ? displayIndices.length - 2
      : Math.max(0, displayIndices.length - 1);

  return (
    <View style={{ width: wheelSize, height: wheelSize, alignSelf: 'center' }}>
      <GestureDetector gesture={panGesture}>
        <View style={{ width: wheelSize, height: wheelSize }}>
          {/* Helm sits under selection lines + letters */}
          <ShipHelm size={wheelSize} inset={nodeRadius + 6} />

          <Svg
            width={wheelSize}
            height={wheelSize}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {Array.from({ length: staticSegmentCount }, (_, i) => {
              const a = nodes[displayIndices[i]];
              const b = nodes[displayIndices[i + 1]];
              if (!a || !b) return null;
              const isActive =
                isDragging && i === staticSegmentCount - 1 && displayIndices.length > 1;
              return (
                <WheelSegment
                  key={`seg-${displayIndices[i]}-${displayIndices[i + 1]}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  active={isActive}
                />
              );
            })}

            {isDragging && dragFrom ? (
              <DraggingLine
                x1={dragFrom.x}
                y1={dragFrom.y}
                fingerX={fingerX}
                fingerY={fingerY}
                visible={fingerVisible}
              />
            ) : null}

            {isRollingBack && retractFrom && retractTo ? (
              <RetractingSegment
                x1={retractFrom.x}
                y1={retractFrom.y}
                x2={retractTo.x}
                y2={retractTo.y}
                progress={segmentProgress}
              />
            ) : null}
          </Svg>

          {tiles.map((tile, index) => {
            const node = nodes[index];
            if (!node) return null;
            return (
              <WheelLetter
                key={tile.id}
                letter={tile.letter}
                x={node.x}
                y={node.y}
                radius={nodeRadius}
                selected={displayIndices.includes(index)}
              />
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
}
