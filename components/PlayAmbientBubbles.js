import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/** Keep bubbles in the lower play area — below the grid. */
const GRID_FLOOR_Y = SCREEN_H * 0.52;

function makeBubbles(count = 8) {
  return Array.from({ length: count }, (_, i) => {
    const size = 10 + ((i * 11) % 16);
    const startY = SCREEN_H * (0.68 + ((i * 13) % 26) / 100);
    // Short rise only — fade before reaching the grid.
    const travel = Math.min(startY - GRID_FLOOR_Y + size, 90 + (i % 4) * 18);
    return {
      id: i,
      size,
      left: ((i * 97 + 31) % 100) / 100 * (SCREEN_W - size),
      startY,
      travel: Math.max(48, travel),
      duration: 10000 + (i % 5) * 2000,
      delay: (i % 6) * 900,
      drift: ((i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 5)),
      opacity: 0.1 + (i % 4) * 0.04,
    };
  });
}

function FloatingBubble({ size, left, startY, travel, duration, delay, drift, opacity }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [progress, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.1, 0.7, 1], [0, opacity, opacity * 0.75, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -travel]) },
      { translateX: interpolate(progress.value, [0, 0.35, 0.7, 1], [0, drift, -drift * 0.4, drift * 0.6]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.9, 1.02, 0.92]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left,
          top: startY,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function PlayAmbientBubbles() {
  const bubbles = useMemo(() => makeBubbles(8), []);

  return (
    <View style={styles.layer} pointerEvents="none">
      {bubbles.map((bubble) => (
        <FloatingBubble key={bubble.id} {...bubble} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
    elevation: 0,
  },
  bubble: {
    position: 'absolute',
    zIndex: 0,
    elevation: 0,
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
  },
});
