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
import { useAppearance } from '../context/AppearanceContext';
import {
  buildWheelNodes,
  findNodeAtPoint,
  updateSelectionPath,
} from '../lib/wheelGeometry';
import ShipHelm from './ShipHelm';
import WheelLetter from './WheelLetter';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const LINE_CORE = 6;
const LINE_MID = 11;
const LINE_GLOW = 20;
const ROLLBACK_MS = 200;
/** Shuffle: spiral implode into center, then spiral explode to new seats (~1.55s). */
const SHUFFLE_IMPLODE_MS = 720;
const SHUFFLE_EXPLODE_MS = 830;
const SHUFFLE_IMPLODE_EASING = Easing.inOut(Easing.cubic);
const SHUFFLE_EXPLODE_EASING = Easing.out(Easing.cubic);

/** Draw one segment with soft glow → mid → core (amber lock on teal). */
function WheelSegment({ x1, y1, x2, y2, active = false, line, lineDark, lineSoft }) {
  const glowOpacity = active ? 0.5 : 0.35;
  return (
    <>
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={lineSoft || line}
        strokeWidth={LINE_GLOW}
        strokeLinecap="round"
        opacity={glowOpacity}
      />
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={line}
        strokeWidth={LINE_MID}
        strokeLinecap="round"
        opacity={0.85}
      />
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={lineDark}
        strokeWidth={LINE_CORE}
        strokeLinecap="round"
      />
    </>
  );
}

/** Live line from last selected node to current finger while dragging. */
function DraggingLine({ x1, y1, fingerX, fingerY, visible, line, lineDark, lineSoft }) {
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
        stroke={lineSoft || line}
        strokeWidth={LINE_GLOW}
        strokeLinecap="round"
        opacity={0.45}
      />
      <AnimatedLine
        animatedProps={animatedProps}
        x1={x1}
        y1={y1}
        x2={x1}
        y2={y1}
        stroke={line}
        strokeWidth={LINE_MID}
        strokeLinecap="round"
        opacity={0.85}
      />
      <AnimatedLine
        animatedProps={animatedProps}
        x1={x1}
        y1={y1}
        x2={x1}
        y2={y1}
        stroke={lineDark}
        strokeWidth={LINE_CORE}
        strokeLinecap="round"
      />
    </>
  );
}

/** Last segment whose endpoint animates during ROLLBACK (rubber-band retract). */
function RetractingSegment({ x1, y1, x2, y2, progress, line, lineDark, lineSoft }) {
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
        stroke={lineSoft || line}
        strokeWidth={LINE_GLOW}
        strokeLinecap="round"
        opacity={0.45}
      />
      <AnimatedLine
        animatedProps={animatedProps}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={line}
        strokeWidth={LINE_MID}
        strokeLinecap="round"
        opacity={0.85}
      />
      <AnimatedLine
        animatedProps={animatedProps}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={lineDark}
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
  onShuffle,
  shuffleSignal = 0,
  wheelSize = 280,
}) {
  const { ww } = useAppearance();
  const line = ww.wheelLine;
  const lineDark = ww.wheelLineDark;
  const lineSoft = ww.wheelLineSoft;
  const nodeRadius = Math.max(18, Math.round(wheelSize * 0.085));
  const hitRadius = nodeRadius * 1.35;
  const center = wheelSize / 2;

  const nodes = useMemo(
    () => buildWheelNodes(tiles.length, wheelSize, nodeRadius),
    [tiles.length, wheelSize, nodeRadius]
  );

  const [displayIndices, setDisplayIndices] = useState([]);
  const [phase, setPhase] = useState('idle');
  const pathRef = useRef([]);
  const phaseRef = useRef('idle');
  const rollbackAbortRef = useRef(false);
  const shufflingRef = useRef(false);
  const onShuffleRef = useRef(onShuffle);
  const segmentProgress = useSharedValue(1);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const fingerVisible = useSharedValue(0);
  /** 0 = on ring, 1 = collapsed at center. */
  const shuffleProgress = useSharedValue(0);

  onShuffleRef.current = onShuffle;

  const setPhaseBoth = useCallback((nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const tilesIdentity = useMemo(
    () =>
      [...tiles]
        .map((tile) => tile.id)
        .sort()
        .join('|'),
    [tiles]
  );

  // Snap clear if the puzzle (tile set) changes mid-animation.
  useEffect(() => {
    shuffleProgress.value = 0;
    shufflingRef.current = false;
    if (phaseRef.current === 'shuffling') {
      setPhaseBoth('idle');
    }
  }, [tilesIdentity, setPhaseBoth, shuffleProgress]);

  const finishShuffle = useCallback(() => {
    shufflingRef.current = false;
    setPhaseBoth('idle');
  }, [setPhaseBoth]);

  const explodeAfterShuffle = useCallback(() => {
    shuffleProgress.value = withTiming(
      0,
      { duration: SHUFFLE_EXPLODE_MS, easing: SHUFFLE_EXPLODE_EASING },
      (finished) => {
        if (finished) runOnJS(finishShuffle)();
      }
    );
  }, [shuffleProgress, finishShuffle]);

  const applyShuffleAtCenter = useCallback(() => {
    onShuffleRef.current?.();
    // Let React commit new tile seats while letters are still hidden at center.
    setTimeout(() => {
      explodeAfterShuffle();
    }, 16);
  }, [explodeAfterShuffle]);

  useEffect(() => {
    if (!shuffleSignal) return undefined;
    if (shufflingRef.current) return undefined;
    if (!onShuffleRef.current) return undefined;

    shufflingRef.current = true;
    rollbackAbortRef.current = true;
    setPhaseBoth('shuffling');
    pathRef.current = [];
    setDisplayIndices([]);
    fingerVisible.value = 0;
    onSelectionChange([]);

    shuffleProgress.value = withTiming(
      1,
      { duration: SHUFFLE_IMPLODE_MS, easing: SHUFFLE_IMPLODE_EASING },
      (finished) => {
        if (!finished) return;
        runOnJS(applyShuffleAtCenter)();
      }
    );

    return undefined;
  }, [
    shuffleSignal,
    applyShuffleAtCenter,
    setPhaseBoth,
    onSelectionChange,
    shuffleProgress,
    fingerVisible,
  ]);

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
      if (phaseRef.current === 'shuffling' || shufflingRef.current) return;
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
                  line={line}
                  lineDark={lineDark}
                  lineSoft={lineSoft}
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
                line={line}
                lineDark={lineDark}
                lineSoft={lineSoft}
              />
            ) : null}

            {isRollingBack && retractFrom && retractTo ? (
              <RetractingSegment
                x1={retractFrom.x}
                y1={retractFrom.y}
                x2={retractTo.x}
                y2={retractTo.y}
                progress={segmentProgress}
                line={line}
                lineDark={lineDark}
                lineSoft={lineSoft}
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
                centerX={center}
                centerY={center}
                shuffleProgress={shuffleProgress}
              />
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
}
