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
/** Shuffle: spiral implode into center, then spiral explode to new seats (~1.55s). */
const SHUFFLE_IMPLODE_MS = 720;
const SHUFFLE_EXPLODE_MS = 830;
const SHUFFLE_IMPLODE_EASING = Easing.inOut(Easing.cubic);
const SHUFFLE_EXPLODE_EASING = Easing.out(Easing.cubic);
/** If a drag never receives end/finalize (ScrollView steal), snap-clear. */
const DRAG_WATCHDOG_MS = 2800;

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
  const shufflingRef = useRef(false);
  const dragWatchdogRef = useRef(null);
  const submittedRef = useRef(false);
  const onShuffleRef = useRef(onShuffle);
  const onDragEndRef = useRef(onDragEnd);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const tilesRef = useRef(tiles);
  const nodesRef = useRef(nodes);
  const hitRadiusRef = useRef(hitRadius);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const fingerVisible = useSharedValue(0);
  /** 0 = on ring, 1 = collapsed at center. */
  const shuffleProgress = useSharedValue(0);

  onShuffleRef.current = onShuffle;
  onDragEndRef.current = onDragEnd;
  onSelectionChangeRef.current = onSelectionChange;
  tilesRef.current = tiles;
  nodesRef.current = nodes;
  hitRadiusRef.current = hitRadius;

  const setPhaseBoth = useCallback((nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const clearDragWatchdog = useCallback(() => {
    if (dragWatchdogRef.current) {
      clearTimeout(dragWatchdogRef.current);
      dragWatchdogRef.current = null;
    }
  }, []);

  const clearWheelSelection = useCallback(() => {
    clearDragWatchdog();
    pathRef.current = [];
    setDisplayIndices([]);
    fingerVisible.value = 0;
    setPhaseBoth('idle');
    onSelectionChangeRef.current([]);
  }, [setPhaseBoth, fingerVisible, clearDragWatchdog]);

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

  useEffect(
    () => () => {
      clearDragWatchdog();
    },
    [clearDragWatchdog]
  );

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
    setTimeout(() => {
      explodeAfterShuffle();
    }, 16);
  }, [explodeAfterShuffle]);

  useEffect(() => {
    if (!shuffleSignal) return undefined;
    if (shufflingRef.current) return undefined;
    if (!onShuffleRef.current) return undefined;

    shufflingRef.current = true;
    clearDragWatchdog();
    setPhaseBoth('shuffling');
    pathRef.current = [];
    setDisplayIndices([]);
    fingerVisible.value = 0;
    onSelectionChangeRef.current([]);

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
    shuffleProgress,
    fingerVisible,
    clearDragWatchdog,
  ]);

  /** Local path only — never push to parent mid-drag (parent re-renders freeze the gesture). */
  const syncPathLocal = useCallback((nextPath) => {
    pathRef.current = nextPath;
    setDisplayIndices(nextPath);
  }, []);

  useEffect(() => {
    // Parent cleared selection — drop a stuck drag line.
    if (selectedIndices.length === 0 && pathRef.current.length > 0 && phaseRef.current !== 'dragging') {
      clearWheelSelection();
      return;
    }
    if (phaseRef.current !== 'idle') return;
    setDisplayIndices(selectedIndices);
    pathRef.current = selectedIndices;
  }, [selectedIndices, clearWheelSelection]);

  const finishDrag = useCallback(
    (shouldSubmit) => {
      if (phaseRef.current !== 'dragging') return;
      const word = pathRef.current.map((i) => tilesRef.current[i]?.letter || '').join('');
      // Always snap-clear first — never leave a frozen orange line while parent updates.
      clearWheelSelection();
      onSelectionChangeRef.current([]);
      if (shouldSubmit && !submittedRef.current) {
        submittedRef.current = true;
        // Defer submit so clear paints before PlayScreen heavy updates.
        requestAnimationFrame(() => {
          onDragEndRef.current?.(word);
        });
      }
    },
    [clearWheelSelection]
  );

  const startPathAt = useCallback(
    (x, y) => {
      if (phaseRef.current === 'shuffling' || shufflingRef.current) return;
      submittedRef.current = false;
      // Ensure parent isn't holding a stale selection overlay.
      onSelectionChangeRef.current([]);
      setPhaseBoth('dragging');
      fingerX.value = x;
      fingerY.value = y;
      fingerVisible.value = 1;
      const hit = findNodeAtPoint(nodesRef.current, x, y, hitRadiusRef.current);
      syncPathLocal(hit ? [hit.index] : []);

      clearDragWatchdog();
      dragWatchdogRef.current = setTimeout(() => {
        dragWatchdogRef.current = null;
        if (phaseRef.current === 'dragging') {
          // Gesture end was lost — submit whatever is selected, then free the UI.
          finishDrag(true);
        }
      }, DRAG_WATCHDOG_MS);
    },
    [syncPathLocal, setPhaseBoth, fingerX, fingerY, fingerVisible, clearDragWatchdog, finishDrag]
  );

  const handleTouchMove = useCallback(
    (x, y) => {
      if (phaseRef.current !== 'dragging') return;
      const hit = findNodeAtPoint(nodesRef.current, x, y, hitRadiusRef.current);
      if (!hit) return;
      const next = updateSelectionPath(pathRef.current, hit.index);
      if (next !== pathRef.current) syncPathLocal(next);
    },
    [syncPathLocal]
  );

  const handleTouchEnd = useCallback(() => {
    finishDrag(true);
  }, [finishDrag]);

  const startPathAtRef = useRef(startPathAt);
  const handleTouchMoveRef = useRef(handleTouchMove);
  const handleTouchEndRef = useRef(handleTouchEnd);
  startPathAtRef.current = startPathAt;
  handleTouchMoveRef.current = handleTouchMove;
  handleTouchEndRef.current = handleTouchEnd;

  const onBeginJS = useCallback((x, y) => {
    startPathAtRef.current(x, y);
  }, []);
  const onUpdateJS = useCallback((x, y) => {
    handleTouchMoveRef.current(x, y);
  }, []);
  const onEndJS = useCallback(() => {
    handleTouchEndRef.current();
  }, []);
  const onFinalizeJS = useCallback(() => {
    if (phaseRef.current === 'dragging') {
      handleTouchEndRef.current();
    }
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .maxPointers(1)
        .shouldCancelWhenOutside(false)
        .onBegin((e) => {
          fingerX.value = e.x;
          fingerY.value = e.y;
          fingerVisible.value = 1;
          runOnJS(onBeginJS)(e.x, e.y);
        })
        .onUpdate((e) => {
          fingerX.value = e.x;
          fingerY.value = e.y;
          runOnJS(onUpdateJS)(e.x, e.y);
        })
        .onEnd(() => {
          fingerVisible.value = 0;
          runOnJS(onEndJS)();
        })
        .onFinalize(() => {
          fingerVisible.value = 0;
          runOnJS(onFinalizeJS)();
        }),
    [onBeginJS, onUpdateJS, onEndJS, onFinalizeJS, fingerX, fingerY, fingerVisible]
  );

  const isDragging = phase === 'dragging';
  const dragFrom =
    displayIndices.length >= 1 ? nodes[displayIndices[displayIndices.length - 1]] : null;
  const staticSegmentCount = Math.max(0, displayIndices.length - 1);

  return (
    <View style={{ width: wheelSize, height: wheelSize, alignSelf: 'center' }}>
      <GestureDetector gesture={panGesture}>
        <View style={{ width: wheelSize, height: wheelSize }} collapsable={false}>
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
